"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { X, RefreshCcw, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWebContainer } from "@/app/providers/WebContainerProvider";
import { useEventBus } from "@/app/providers/EventBusProvider";

interface PreviewProps {
  /** Called when the user clicks the "close" button to hide this modal. */
  onClose: () => void;
}

/**
 * Renders a modal overlay that displays a live preview of the Next.js dev server
 * running inside the WebContainer.
 */
export function Preview({ onClose }: PreviewProps) {
  const { previewUrl, serverIsStarting, startPreviewServer } = useWebContainer();
  const eventBus = useEventBus();

  // We'll force reloading the <iframe> by changing its `key`.
  const [iframeKey, setIframeKey] = useState(0);

  const forceReload = useCallback(() => {
    setIframeKey((prev) => prev + 1);
  }, []);

  // If you'd like to auto-start the dev server whenever this preview is shown:
  useEffect(() => {
    if (!previewUrl && !serverIsStarting) {
      startPreviewServer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for file changes, optionally reload the preview.
  useEffect(() => {
    const unsubscribe = eventBus.on("fileModified", () => {
      // Optionally, you could check the file extension or other logic before reloading.
      forceReload();
    });

    return () => {
      unsubscribe();
    };
  }, [eventBus, forceReload]);

  // Decide what to show in the <iframe>.
  const iframeSrc = useMemo(() => {
    if (!previewUrl || serverIsStarting) return "";
    return previewUrl;
  }, [previewUrl, serverIsStarting]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 w-3/4 h-3/4 rounded-lg shadow-lg flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-zinc-700">
          <h2 className="text-lg font-semibold text-zinc-100">Preview</h2>
          <div className="flex items-center gap-2">
            {/* Refresh Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={forceReload}
              title="Reload Preview"
            >
              <RefreshCcw className="h-4 w-4" />
            </Button>

            {/* Open in New Tab */}
            {previewUrl && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.open(previewUrl, "_blank")}
                title="Open in new tab"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}

            {/* Close Button */}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Body / Iframe Area */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
          {serverIsStarting ? (
            <p className="text-zinc-200">Starting server…</p>
          ) : !iframeSrc ? (
            <p className="text-zinc-400">No preview available yet.</p>
          ) : (
            <iframe
              key={iframeKey} // Changing this key triggers a re-mount (reload)
              src={iframeSrc}
              className="w-full h-full border-0"
              title="Live Preview"
            />
          )}
        </div>
      </div>
    </div>
  );
}
