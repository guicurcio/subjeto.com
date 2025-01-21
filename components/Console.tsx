"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  X,
  Filter,
  Trash2,
  Copy,
  CheckCircle2,
  Maximize2,
  Minus,
  PauseCircle,
  PlayCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ==============================================
// If you don't have the official type packages,
// you can declare them locally to avoid TS errors.
// Remove these if you install them via npm (recommended).
// ==============================================
declare module "react-window" {
  export * from "react-window/dist/index";
  export const FixedSizeList: any;
  export const VariableSizeList: any;
}
declare module "lodash.debounce" {
  const debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait?: number
  ) => T;
  export default debounce;
}
// ==============================================

import {
  VariableSizeList as List,
  ListOnItemsRenderedProps,
  ListChildComponentProps,
} from "react-window";
import AnsiToHtml from "ansi-to-html";
import debounce from "lodash.debounce";

/** 
 * Types and Interfaces
 */
type LogType = "log" | "error" | "warn" | "info";

interface LogEntry {
  id: string;        // unique ID for each log
  type: LogType;
  message: string;
  timestamp: Date;
}

const MAX_LOGS = 1000;

function generateId(): string {
  return (Date.now() + Math.random()).toString(36);
}

const ansiParser = new AnsiToHtml({
  fg: "#ddd",
  bg: "#1c1c1c",
  newline: true,
  escapeXML: true,
  stream: false,
});

function reviveDates(key: string, value: any): any {
  if (key === "timestamp") {
    return new Date(value);
  }
  return value;
}


const OuterContainer = React.forwardRef<HTMLDivElement, React.HTMLProps<HTMLDivElement>>(
  function OuterContainer(props, ref) {
    return (
      <div
        ref={ref}
        {...props}
        style={{ ...(props.style || {}), paddingBottom: "80px" }}
      />
    );
  }
);

function LogLineContainer({
  log,
  colorClass,
  copiedIndex,
  index,
  onCopy,
  onMeasure,
}: {
  log: LogEntry;
  colorClass: string;
  copiedIndex: number | null;
  index: number;
  onCopy: (index: number, message: string) => void;
  onMeasure: (id: string, height: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      const height = containerRef.current.getBoundingClientRect().height;
      onMeasure(log.id, height);
    }
  });

  const formatTimestamp = (date: Date) =>
    date.toLocaleTimeString([], {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      fractionalSecondDigits: 3,
    });

  const html = ansiParser.toHtml(log.message);

  return (
    <div
      ref={containerRef}
      className={`p-2 border-b border-zinc-800 hover:bg-zinc-800 group ${
        log.type === "error"
          ? "bg-red-900/10"
          : log.type === "warn"
          ? "bg-yellow-900/10"
          : log.type === "info"
          ? "bg-blue-900/10"
          : ""
      }`}
    >
      <div className="flex justify-between items-start">
        <div>
          <span className="text-xs text-zinc-400 mr-2">
            {formatTimestamp(log.timestamp)}
          </span>
          <span
            className={colorClass}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onCopy(index, log.message)}
              >
                {copiedIndex === index ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{copiedIndex === index ? "Copied!" : "Copy to clipboard"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}

export function Console() {
  const [logs, setLogs] = useState<LogEntry[]>(() => {
    try {
      const saved = localStorage.getItem("consoleLogs");
      if (saved) {
        return JSON.parse(saved, reviveDates) as LogEntry[];
      }
    } catch (e) {
      console.error("Error parsing saved logs:", e);
    }
    return [];
  });

  const [filter, setFilter] = useState<string>("");
  const [debouncedFilter, setDebouncedFilter] = useState<string>("");

  const [logTypeFilter, setLogTypeFilter] = useState<LogType[]>([
    "log",
    "error",
    "warn",
    "info",
  ]);

  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  const [autoScroll, setAutoScroll] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(isPaused);
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  const originalConsoleRef = useRef<Partial<typeof console>>({});

  // Override console once
  useEffect(() => {
    const originalConsole = { ...console };
    originalConsoleRef.current = originalConsole;

    const logTypes: LogType[] = ["log", "error", "warn", "info"];
    logTypes.forEach((type) => {
      console[type] = (...args: any[]) => {
        if (!isPausedRef.current) {
          addLog(type, args.join(" "));
        }
        originalConsole[type](...args);
      };
    });

    return () => {
      logTypes.forEach((type) => {
        console[type] = originalConsole[type];
      });
    };
  }, []);

  const addLog = (type: LogType, message: string) => {
    setLogs((prev) => {
      const entry: LogEntry = {
        id: generateId(),
        type,
        message,
        timestamp: new Date(),
      };
      const updated = [...prev, entry];
      if (updated.length > MAX_LOGS) {
        updated.splice(0, updated.length - MAX_LOGS);
      }
      return updated;
    });
  };

  useEffect(() => {
    localStorage.setItem("consoleLogs", JSON.stringify(logs));
  }, [logs]);

  const updateFilter = useCallback(
    debounce((val: string) => {
      setDebouncedFilter(val);
    }, 300),
    []
  );
  useEffect(() => {
    updateFilter(filter);
  }, [filter, updateFilter]);

  const filteredLogs = useMemo(() => {
    const lower = debouncedFilter.toLowerCase();
    return logs.filter((log) => {
      if (!logTypeFilter.includes(log.type)) return false;
      return log.message.toLowerCase().includes(lower);
    });
  }, [logs, debouncedFilter, logTypeFilter]);

  const clearConsole = () => {
    setLogs([]);
  };

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);
  const toggleMinimize = () => setIsMinimized(!isMinimized);

  const toggleLogTypeFilter = (type: LogType) => {
    setLogTypeFilter((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const copyToClipboard = (index: number, message: string) => {
    navigator.clipboard.writeText(message);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const rowHeightsRef = useRef<{ [id: string]: number }>({});
  const listRef = useRef<List>(null);

  // Update row height
  const measureRow = useCallback((id: string, newHeight: number) => {
    const oldHeight = rowHeightsRef.current[id];
    if (!oldHeight || Math.abs(oldHeight - newHeight) > 1) {
      rowHeightsRef.current[id] = newHeight;
      // Recalc layout
      requestAnimationFrame(() => {
        listRef.current?.resetAfterIndex(0, false);
      });
    }
  }, []);

  const getItemSize = useCallback(
    (index: number) => {
      const log = filteredLogs[index];
      return rowHeightsRef.current[log.id] || 30;
    },
    [filteredLogs]
  );

  // Scroll to the "start" of the last item so the bottom is not cut off
  const handleItemsRendered = useCallback(
    (props: ListOnItemsRenderedProps) => {
      if (!autoScroll) return;
      const { visibleStopIndex } = props;
      if (visibleStopIndex < filteredLogs.length - 1) {
        listRef.current?.scrollToItem(filteredLogs.length - 1, "start");
      }
    },
    [autoScroll, filteredLogs.length]
  );

  const listHeight = isMinimized ? 0 : 400;

  return (
    <div
      className={`bg-zinc-900 text-zinc-100 border-t border-zinc-700 transition-all duration-300 ease-in-out ${
        isMinimized ? "h-10" : "h-full"
      }`}
    >
      {/* Top bar */}
      <div className="flex justify-between items-center p-2 bg-zinc-800 border-b border-zinc-700">
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={toggleMinimize}>
                  {isMinimized ? (
                    <Maximize2 className="h-4 w-4" />
                  ) : (
                    <Minus className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isMinimized ? "Maximize" : "Minimize"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={clearConsole}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Clear console</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={toggleCollapse}>
                  {isCollapsed ? (
                    <Maximize2 className="h-4 w-4" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isCollapsed ? "Expand Toolbar" : "Collapse Toolbar"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Pause/resume */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsPaused(!isPaused)}
                >
                  {isPaused ? (
                    <PlayCircle className="h-4 w-4" />
                  ) : (
                    <PauseCircle className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isPaused ? "Resume logging" : "Pause logging"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Auto-scroll */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={autoScroll ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAutoScroll(!autoScroll)}
                >
                  {autoScroll ? "AutoScroll ON" : "AutoScroll OFF"}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle auto-scrolling to the newest log line.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="text-xs text-zinc-400">
          {logs.length} total logs | {filteredLogs.length} visible
        </div>
      </div>

      {/* Filter row */}
      {!isMinimized && !isCollapsed && (
        <div className="p-2 border-b border-zinc-700 flex items-center gap-2">
          <div className="relative flex-grow">
            <Filter className="absolute left-2 top-2.5 h-4 w-4 text-zinc-400" />
            <Input
              type="text"
              placeholder="Filter logs..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-8 bg-zinc-800 border-zinc-600 text-zinc-100 placeholder-zinc-400"
            />
          </div>
          {(["log", "error", "warn", "info"] as LogType[]).map((type) => (
            <TooltipProvider key={type}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={logTypeFilter.includes(type) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleLogTypeFilter(type)}
                    className={`text-xs ${
                      logTypeFilter.includes(type)
                        ? "bg-zinc-700 text-zinc-100"
                        : "bg-zinc-800 text-zinc-400"
                    } hover:bg-zinc-600 hover:text-zinc-100`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {logTypeFilter.includes(type)
                      ? `Hide ${type} logs`
                      : `Show ${type} logs`}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      )}

      {!isMinimized && (
        <div className="relative" style={{ height: listHeight }}>
          <List
            ref={listRef}
            height={listHeight}
            itemCount={filteredLogs.length}
            itemSize={getItemSize}
            width="100%"
            onItemsRendered={handleItemsRendered}
            itemKey={(index: number) => filteredLogs[index].id}
            /**
             * The big fix: we add bottom padding by customizing the outer element
             * so the last item isn't cut off. 
             */
            outerElementType={OuterContainer}
          >
            {({ index, style }: { index: number; style: React.CSSProperties }) => {
              const log = filteredLogs[index];
              let colorClass = "text-zinc-100";
              if (log.type === "error") colorClass = "text-red-400";
              else if (log.type === "warn") colorClass = "text-yellow-400";
              else if (log.type === "info") colorClass = "text-blue-400";

              return (
                <div style={style}>
                  <LogLineContainer
                    log={log}
                    colorClass={colorClass}
                    copiedIndex={copiedIndex}
                    index={index}
                    onCopy={copyToClipboard}
                    onMeasure={measureRow}
                  />
                </div>
              );
            }}
          </List>
        </div>
      )}
    </div>
  );
}
