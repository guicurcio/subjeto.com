"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  ChangeEvent,
  KeyboardEvent,
} from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Paperclip, Calendar, Globe, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { DragDropZone } from "./drag-drop-zone";


interface ChatMessage {
  /** "user" or "assistant" */
  role: "user" | "assistant";
  /** The text content of the message */
  text: string;
  /** (Optional) a timestamp (ISO string or number) */
  timestamp?: string | number;
}

interface MessageBoxProps {
  /** A list of conversation messages to display. */
  messages: ChatMessage[];
  /** Whether the input area is currently visible (not collapsed). */
  isInputVisible: boolean;
  /** Called to toggle any input collapse (though we might not use it). */
  toggleInputVisibility: () => void;
  /** Called when the user submits text. */
  onSubmit: (payload: {
    message: string;
    attachments: File[];
    mentionedFileIds: string[];
    slashCommandsUsed: string[];
  }) => void;
  /** Array of file info for @ mentions (optional). */
  availableFiles?: { id: string; name: string }[];
  /** Optional slash commands for slash-detection. */
  slashCommands?: { command: string; description: string }[];
}

/* -------------------------------------------------------------------------- */
/*                         Slash + Mentions Utilities                         */
/* -------------------------------------------------------------------------- */

/** Matches text like @[FileName](FileID) */
function parseMentionedFileIds(text: string): string[] {
  const regex = /\@\[(.*?)\]\((.*?)\)/g;
  const results: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const fileId = match[2];
    results.push(fileId);
  }
  return results;
}

function parseUsedSlashCommands(text: string): string[] {
  const used: string[] = [];
  const tokens = text.split(/\s+/);
  tokens.forEach((token) => {
    if (token.startsWith("/")) {
      used.push(token.substring(1));
    }
  });
  return used;
}

/* Default slash commands */
const DEFAULT_SLASH_COMMANDS = [
  { command: "explain", description: "Explain what the code does" },
  { command: "refactor", description: "Refactor the code to be cleaner" },
  { command: "lint", description: "Run a linter on the code" },
  { command: "optimize", description: "Optimize performance" },
  { command: "translate", description: "Translate code to another language" },
];

/**
 * Groups consecutive messages by role (user or assistant).
 * e.g. If you have [user, user, assistant, user],
 * you'll get 3 groups:
 *   - user => [first, second msg]
 *   - assistant => [third msg]
 *   - user => [fourth msg]
 */
function groupMessagesByRole(messages: ChatMessage[]) {
  const groups: Array<{
    role: "user" | "assistant";
    items: ChatMessage[];
  }> = [];

  messages.forEach((msg) => {
    const lastGroup = groups[groups.length - 1];
    if (!lastGroup || lastGroup.role !== msg.role) {
      groups.push({ role: msg.role, items: [msg] });
    } else {
      lastGroup.items.push(msg);
    }
  });

  return groups;
}

/**
 * Single bubble for a message.
 * Note: we keep it simple, but we could add a "Copy" button for code, etc.
 */
function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div
      className={cn(
        "my-1 px-3 py-2 rounded-md max-w-xs break-words",
        isUser
          ? "bg-green-600 text-white rounded-tr-none"
          : "bg-zinc-800 text-zinc-100 rounded-tl-none"
      )}
    >
      {message.text}
    </div>
  );
}

/**
 * Renders a group of consecutive messages from the same role,
 * plus an avatar (optional) and timestamp(s).
 */
function ChatGroup({
  role,
  items,
}: {
  role: "user" | "assistant";
  items: ChatMessage[];
}) {
  const isUser = role === "user";

  const lastItem = items[items.length - 1];
  const timestamp = lastItem.timestamp
    ? formatTimestamp(lastItem.timestamp)
    : null;

  return (
    <div
      className={cn(
        "flex w-full mb-4",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {/* If assistant, place avatar on left, else on right */}
      {!isUser && (
        <div className="mr-2">
          {/* Simple placeholder for assistant avatar */}
          <div className="w-8 h-8 flex items-center justify-center bg-zinc-600 rounded-full">
            <span className="text-white text-xs">AI</span>
          </div>
        </div>
      )}

      {/* Bubbles + possibly timestamp */}
      <div className="flex flex-col">
        {items.map((msg, idx) => (
          <ChatBubble key={idx} message={msg} />
        ))}
        {timestamp && (
          <span className="text-[0.7rem] text-zinc-500 mt-1">{timestamp}</span>
        )}
      </div>

      {isUser && (
        <div className="ml-2">
          {/* Simple placeholder for user avatar */}
          <div className="w-8 h-8 flex items-center justify-center bg-green-700 rounded-full">
            <span className="text-white text-xs">U</span>
          </div>
        </div>
      )}
    </div>
  );
}

/** Formats a timestamp for display (e.g., "12:34 PM" or similar) */
function formatTimestamp(ts: string | number): string {
  let date: Date;
  if (typeof ts === "string") {
    date = new Date(ts);
  } else {
    date = new Date(ts);
  }
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function MessageBox({
  messages,
  isInputVisible,
  toggleInputVisibility,
  onSubmit,
  availableFiles = [],
  slashCommands = DEFAULT_SLASH_COMMANDS,
}: MessageBoxProps) {
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);

  const [isMentionMode, setIsMentionMode] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");

  const [isSlashMode, setIsSlashMode] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setAttachments((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [message, attachments]
  );

  const handleMessageChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      const newVal = e.target.value;
      setMessage(newVal);

      const lastAt = newVal.lastIndexOf("@");
      if (lastAt === -1) {
        setIsMentionMode(false);
      } else {
        const afterAt = newVal.substring(lastAt + 1);
        if (/\s/.test(afterAt)) {
          setIsMentionMode(false);
        } else {
          setIsMentionMode(true);
          setMentionQuery(afterAt);
        }
      }

      const lastSlash = newVal.lastIndexOf("/");
      if (lastSlash === -1) {
        setIsSlashMode(false);
      } else {
        const afterSlash = newVal.substring(lastSlash + 1);
        if (/\s/.test(afterSlash)) {
          setIsSlashMode(false);
        } else {
          setIsSlashMode(true);
          setSlashQuery(afterSlash);
        }
      }
    },
    []
  );

  const filteredFiles = useMemo(() => {
    if (!mentionQuery.trim()) return [];
    return availableFiles.filter((f) =>
      f.name.toLowerCase().includes(mentionQuery.toLowerCase())
    );
  }, [mentionQuery, availableFiles]);

  const filteredSlashCommands = useMemo(() => {
    if (!slashQuery.trim()) return [];
    return slashCommands.filter((sc) =>
      sc.command.toLowerCase().startsWith(slashQuery.toLowerCase())
    );
  }, [slashQuery, slashCommands]);

  const handleFileMentionSelect = useCallback(
    (file: { id: string; name: string }) => {
      const lastAt = message.lastIndexOf("@");
      if (lastAt === -1) return;
      const replaced =
        message.substring(0, lastAt) + `@[${file.name}](${file.id}) `;
      setMessage(replaced);
      setIsMentionMode(false);
      setMentionQuery("");
      textareaRef.current?.focus();
    },
    [message]
  );

  const handleSlashCommandSelect = useCallback(
    (sc: { command: string; description: string }) => {
      const lastSlash = message.lastIndexOf("/");
      if (lastSlash === -1) return;
      const replaced = message.substring(0, lastSlash) + `/${sc.command} `;
      setMessage(replaced);
      setIsSlashMode(false);
      setSlashQuery("");
      textareaRef.current?.focus();
    },
    [message]
  );

  const handleSubmit = useCallback(() => {
    if (!message.trim() && attachments.length === 0) return;
    const mentionedFileIds = parseMentionedFileIds(message);
    const slashCommandsUsed = parseUsedSlashCommands(message);

    onSubmit({ message, attachments, mentionedFileIds, slashCommandsUsed });

    setMessage("");
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [message, attachments, onSubmit]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const adjustHeight = () => {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    };
    textarea.addEventListener("input", adjustHeight);
    return () => textarea.removeEventListener("input", adjustHeight);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const grouped = useMemo(() => groupMessagesByRole(messages), [messages]);

  return (
    <TooltipProvider>
      <div
        className="w-full h-full flex flex-col"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Chat messages area */}
        <div
          ref={scrollRef}
          className="relative flex-1 overflow-auto p-4 space-y-2 border-b border-zinc-800"
        >
          {grouped.map((group, idx) => (
            <ChatGroup key={idx} role={group.role} items={group.items} />
          ))}

          {/* 
            If dragging, show the enhanced drag-and-drop overlay
            with a clear indicator text.
          */}
          {isDragging && (
            <DragDropZone
              onFilesDrop={() => {}}
              overlayText="Drop your files here!"
            />
          )}
        </div>

        {/* Input area at bottom */}
        {isInputVisible && (
          <div className="p-4">
            {/* File attachments preview */}
            {attachments.length > 0 && (
              <div className="mb-2 text-xs text-zinc-400">
                <p className="text-sm font-semibold">Attachments:</p>
                {attachments.map((file, i) => (
                  <p key={i}>{file.name}</p>
                ))}
              </div>
            )}

            <div className="relative mb-2">
              <Textarea
                ref={textareaRef}
                placeholder="Type your message... Use @ for files, / for commands"
                value={message}
                onChange={handleMessageChange}
                onKeyDown={handleKeyDown}
                className="bg-zinc-800/50 border-zinc-700 focus:border-zinc-600 
                           text-zinc-300 placeholder:text-zinc-500 
                           resize-none w-full pr-10"
              />

              {/* Mention suggestions */}
              {isMentionMode && filteredFiles.length > 0 && (
                <div className="absolute left-0 bottom-0 translate-y-full bg-zinc-800 border border-zinc-700 text-zinc-200 mt-1 rounded-lg shadow-md w-full max-h-40 overflow-y-auto z-10">
                  {filteredFiles.map((file) => (
                    <div
                      key={file.id}
                      onClick={() => handleFileMentionSelect(file)}
                      className="px-3 py-2 cursor-pointer hover:bg-zinc-700"
                    >
                      {file.name}
                    </div>
                  ))}
                </div>
              )}

              {/* Slash suggestions */}
              {isSlashMode && filteredSlashCommands.length > 0 && (
                <div className="absolute left-0 bottom-0 translate-y-full bg-zinc-800 border border-zinc-700 text-zinc-200 mt-1 rounded-lg shadow-md w-full max-h-40 overflow-y-auto z-10">
                  {filteredSlashCommands.map((sc) => (
                    <div
                      key={sc.command}
                      onClick={() => handleSlashCommandSelect(sc)}
                      className="px-3 py-2 cursor-pointer hover:bg-zinc-700"
                    >
                      <span className="font-semibold">/{sc.command}</span> —{" "}
                      {sc.description}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Input actions (Attach, Calendar, Translate, etc.) */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => console.log("Attach clicked")}
                >
                  <Paperclip className="h-5 w-5 text-zinc-400" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => console.log("Schedule clicked")}
                >
                  <Calendar className="h-5 w-5 text-zinc-400" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => console.log("Translate clicked")}
                >
                  <Globe className="h-5 w-5 text-zinc-400" />
                </Button>
              </div>

              <Button
                variant="default"
                size="sm"
                onClick={handleSubmit}
                className={cn(
                  "flex items-center gap-1",
                  !message.trim() &&
                    attachments.length === 0 &&
                    "opacity-50 pointer-events-none"
                )}
              >
                <Send className="h-4 w-4" />
                Send
              </Button>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
