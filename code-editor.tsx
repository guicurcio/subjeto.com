// @ts-nocheck
// File: CodeEditor.tsx
"use client";

import { useState, useCallback, useEffect } from "react";
import { useAuthenticationStatus, useNhostClient } from "@nhost/react";
import {
  X,
  ChevronUp,
  ChevronDown,
  Eye,
  Info,
  RefreshCw,
  MessageSquare,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { FileExplorer } from "./components/file-explorer";
import { Console } from "./components/Console";
import { Preview } from "./components/Preview";
import { InfoModal } from "./components/InfoModal";
import { MessageBox } from "./components/message-box";
import { MonacoEditor } from "./components/monaco/MonacoEditor";

import { useWebContainer } from "./app/providers/WebContainerProvider";
import type { Tab, File, FileNode } from "./types/editor";

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

function generateId(): string {
  return (Date.now() + Math.random()).toString(36);
}

/** Recursively builds a FileNode tree from the WebContainer filesystem. */
async function buildFileTree(
  container: ReturnType<typeof useWebContainer>["webContainerInstance"],
  path: string
): Promise<FileNode[]> {
  if (!container) return [];
  try {
    const entries = await container.fs.readdir(path, { withFileTypes: true });
    const result: FileNode[] = [];

    for (const entry of entries) {
      const fullPath = path.endsWith("/")
        ? path + entry.name
        : path + "/" + entry.name;
      if (entry.isDirectory()) {
        const children = await buildFileTree(container, fullPath);
        result.push({
          id: fullPath,
          name: entry.name,
          type: "folder",
          children,
        });
      } else if (entry.isFile()) {
        let content = "";
        try {
          content = await container.fs.readFile(fullPath, "utf-8");
        } catch (readErr) {
          console.warn("Failed to read file contents for", fullPath, readErr);
        }
        result.push({
          id: fullPath,
          name: entry.name,
          type: "file",
          content,
        });
      }
    }
    return result;
  } catch (err) {
    console.error("Failed to read directory at path:", path, err);
    return [];
  }
}

/** Decide the Monaco language from file name. */
function inferLanguage(fileName: string): string {
  if (fileName.endsWith(".ts") || fileName.endsWith(".tsx"))
    return "typescript";
  if (fileName.endsWith(".js") || fileName.endsWith(".jsx"))
    return "javascript";
  if (fileName.endsWith(".json")) return "json";
  if (fileName.endsWith(".graphql")) return "graphql";
  if (fileName.endsWith(".md")) return "markdown";
  if (fileName.endsWith(".sql")) return "sql";
  return "javascript";
}

export default function CodeEditor() {
  const nhost = useNhostClient();
  const { isAuthenticated } = useAuthenticationStatus();

  const [authLoading, setAuthLoading] = useState(false);
  const handleGithubSignIn = async () => {
    try {
      setAuthLoading(true);
      await nhost.auth.signIn({ provider: "github" });
    } catch (error) {
      console.error("GitHub sign-in error:", error);
      setAuthLoading(false);
    }
  };
  const handleSignOut = async () => {
    try {
      setAuthLoading(true);
      await nhost.auth.signOut();
      setAuthLoading(false);
    } catch (error) {
      console.error("Sign out error:", error);
      setAuthLoading(false);
    }
  };

  const {
    webContainerInstance,
    containerBooting,
    installingDeps,
    writeFile,
    runCommand,
    previewUrl,
    serverIsStarting,
    startPreviewServer,
    rebootWebContainer,
  } = useWebContainer();

  const [tabs, setTabs] = useState<Tab[]>([
    {
      id: "1",
      title: "README.md",
      type: "code",
      content: `# My App

This is a sample React application.

## Getting Started

To run this app:

1. Clone the repository
2. Run \`npm install\`
3. Run \`npm start\`

Enjoy coding!
`,
    },
  ]);
  const [activeTab, setActiveTab] = useState<string | null>(
    tabs[0]?.id || null
  );

  const [activeBottomTab, setActiveBottomTab] = useState<string>("console");
  const [isBottomPanelMinimized, setIsBottomPanelMinimized] = useState(false);

  const [explorerFiles, setExplorerFiles] = useState<FileNode[]>([]);
  const [isFileTreeLoading, setIsFileTreeLoading] = useState(false);

  useEffect(() => {
    if (!webContainerInstance) return;
    (async () => {
      setIsFileTreeLoading(true);
      const tree = await buildFileTree(webContainerInstance, "/");
      setExplorerFiles(tree);
      setIsFileTreeLoading(false);
    })();
  }, [webContainerInstance, installingDeps]);

  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  const [isChatOpen, setIsChatOpen] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isInputVisible, setIsInputVisible] = useState(true);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === "/") {
        event.preventDefault();
        setIsChatOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, []);

  const handleChatSubmit = useCallback(
    (payload: {
      message: string;
      attachments: File[];
      mentionedFileIds: string[];
      slashCommandsUsed: string[];
    }) => {
      setMessages((prev) => [...prev, { role: "user", text: payload.message }]);

      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: "Hello from AI!" },
        ]);
      }, 1000);

      console.log("User submitted chat =>", payload);
    },
    []
  );

  const closeTab = (tabId: string) => {
    const newTabs = tabs.filter((tab) => tab.id !== tabId);
    setTabs(newTabs);
    if (activeTab === tabId) {
      setActiveTab(newTabs[newTabs.length - 1]?.id || null);
    }
  };

  const handleSave = async (file: File) => {
    const activeTabData = tabs.find((tab) => tab.id === activeTab);
    if (activeTabData) {
      file.content = activeTabData.content;
      file.type = activeTabData.type;
      console.log("Saving file to editor state:", file);

      const containerPath = file.name.startsWith("/")
        ? file.name
        : `/src/${file.name}`;
      await writeFile(containerPath, file.content);
    }
  };

  const handleLoad = async (file: File) => {
    const newTab: Tab = {
      id: generateId(),
      title: file.name,
      type: file.type,
      content: file.content,
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTab(newTab.id);
  };

  function getFileType(fileName: string): string {
    if (fileName.endsWith(".json")) return "json";
    if (fileName.endsWith(".graphql")) return "graphql";
    if (fileName.endsWith(".md")) return "markdown";
    if (fileName.endsWith(".sql")) return "sql";
    return "code";
  }

  const handleFileSelect = (file: FileNode) => {
    if (file.type === "file") {
      const existingTab = tabs.find((t) => t.title === file.name);
      if (existingTab) {
        setActiveTab(existingTab.id);
      } else {
        const newTab: Tab = {
          id: generateId(),
          title: file.name,
          type: getFileType(file.name),
          content: file.content || "",
        };
        setTabs((prev) => [...prev, newTab]);
        setActiveTab(newTab.id);
      }
    }
  };

  const handlePreview = async () => {
    await startPreviewServer();
    setShowPreviewModal(true);
    console.log("Preview =>", previewUrl || "(not started yet)");
  };

  const activeTabData = tabs.find((tab) => tab.id === activeTab);

  const handleTabContentChange = (tabId: string, newCode: string) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === tabId ? { ...t, content: newCode } : t))
    );
  };

  return (
    <div className="h-screen w-full bg-zinc-900 text-zinc-100 flex flex-col">
      {/* NAVBAR / HEADER */}
      <nav className="flex items-center justify-between px-6 py-2 text-zinc-100 border-b border-zinc-800">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-1.5 text-zinc-100 hover:bg-zinc-800"
            onClick={() => {
              rebootWebContainer();
              setExplorerFiles([]);
            }}
          >
            <RefreshCw className="h-4 w-4" />
            <span className="text-sm">Reload Env</span>
          </Button>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsInfoModalOpen(true)}
          >
            <Info className="h-4 w-4" />
          </Button>

          {/* Toggle Chat Drawer */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsChatOpen((prev) => !prev)}
            className="text-zinc-100 hover:bg-zinc-800"
          >
            <MessageSquare className="h-4 w-4" />
          </Button>

          {/* Avatar / SignIn */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className="h-8 w-8 cursor-pointer">
                  <AvatarImage
                    src="/placeholder.svg?height=32&width=32"
                    alt="User"
                  />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              {isAuthenticated && (
                <TooltipContent>
                  <p className="mb-2">You are signed in!</p>
                  <Button variant="outline" onClick={handleSignOut}>
                    Sign Out
                  </Button>
                </TooltipContent>
              )}
              {!isAuthenticated && (
                <TooltipContent>
                  <p>Guest</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </nav>

      {/* Info Modal */}
      <InfoModal isOpen={isInfoModalOpen} onOpenChange={setIsInfoModalOpen} />

      {/* Main layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* FILE EXPLORER */}
        <div className="w-64 border-r border-zinc-800 overflow-auto">
          {containerBooting ? (
            <div className="p-4 text-sm text-zinc-400">
              <p>Booting container...</p>
            </div>
          ) : installingDeps ? (
            <div className="p-4 text-sm text-zinc-400">
              <p>Installing dependencies...</p>
            </div>
          ) : (
            <FileExplorer
              files={explorerFiles}
              onFileSelect={handleFileSelect}
              loading={isFileTreeLoading}
            />
          )}
        </div>

        {/* EDITOR TABS */}
        <div className="flex-1 flex flex-col">
          <Tabs
            value={activeTab || ""}
            onValueChange={(value) => setActiveTab(value)}
          >
            <div className="flex items-center justify-between bg-zinc-800 p-1 rounded-t-md">
              <TabsList className="w-full justify-start bg-zinc-800">
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-zinc-400 hover:text-zinc-100 data-[state=active]:text-zinc-100 data-[state=active]:bg-zinc-700 rounded-md transition-colors"
                  >
                    {tab.title}
                    <span
                      className="inline-flex items-center justify-center h-4 w-4 p-0 hover:bg-zinc-600 rounded-full cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        closeTab(tab.id);
                      }}
                      aria-label="Close tab"
                    >
                      <X className="h-3 w-3" />
                      <span className="sr-only">Close tab</span>
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {activeTabData && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handlePreview}
                        className="ml-2"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Preview (starts dev server if needed)</p>
                      {serverIsStarting && <p> - Starting...</p>}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>

            <div className="flex-1 overflow-auto p-4 bg-zinc-900 h-[calc(100vh-48px-264px-200px)]">
              {activeTabData ? (
                <TabsContent value={activeTabData.id} className="h-full w-full">
                  <div className="h-full">
                    <MonacoEditor
                      fileName={activeTabData.title}
                      language={inferLanguage(activeTabData.title)}
                      content={activeTabData.content}
                      onContentChange={(newCode) =>
                        handleTabContentChange(activeTabData.id, newCode)
                      }
                    />
                  </div>
                </TabsContent>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-zinc-500">No active tab</p>
                </div>
              )}
            </div>
          </Tabs>
        </div>
      </div>

      {/* BOTTOM PANEL (Console) */}
      <div
        className={`border-t border-zinc-800 transition-all duration-300 ease-in-out ${
          isBottomPanelMinimized ? "h-10" : "h-[calc(264px+200px)]"
        }`}
      >
        <Tabs
          value={activeBottomTab}
          onValueChange={(value) => {
            setActiveBottomTab(value);
            if (isBottomPanelMinimized) {
              setIsBottomPanelMinimized(false);
            }
          }}
          className="w-full"
        >
          <div className="flex items-center justify-between bg-zinc-800 px-2 h-10">
            <TabsList className="w-full justify-start bg-zinc-800 border-b border-zinc-700">
              <TabsTrigger
                value="console"
                className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-100 data-[state=active]:text-zinc-100 data-[state=active]:bg-zinc-900 rounded-t-md transition-colors"
              >
                Console
              </TabsTrigger>
            </TabsList>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsBottomPanelMinimized(!isBottomPanelMinimized)}
              className="ml-2 text-zinc-400 hover:text-zinc-100"
              aria-label="Toggle bottom panel"
            >
              {isBottomPanelMinimized ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              isBottomPanelMinimized ? "h-0" : "h-[calc(100%-2.5rem+200px)]"
            }`}
          >
            <TabsContent value="console" className="h-full">
              <Console />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* RIGHT-SIDE CHAT DRAWER */}
      <div
        className={
          "fixed top-0 right-0 h-full w-full md:w-[600px] bg-zinc-900 border-l border-zinc-800 shadow-xl transition-transform transform flex flex-col " +
          (isChatOpen ? "translate-x-0" : "translate-x-full")
        }
        style={{ zIndex: 9999 }}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <h2 className="text-sm text-zinc-200 font-medium">Subjeto AI</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsChatOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Chat area */}
        <div className="flex-1 overflow-auto">
          <MessageBox
            isInputVisible={isInputVisible}
            toggleInputVisibility={() => {}}
            onSubmit={handleChatSubmit}
            availableFiles={[]}
            slashCommands={undefined}
            messages={messages}
          />
        </div>
      </div>

      {/* Preview Modal */}
      {showPreviewModal && (
        <Preview
          onClose={() => {
            setShowPreviewModal(false);
          }}
        />
      )}
    </div>
  );
}
