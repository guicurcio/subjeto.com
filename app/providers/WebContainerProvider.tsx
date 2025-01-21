"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  PropsWithChildren,
  useRef,
} from "react";
import { WebContainer, WebContainerProcess } from "@webcontainer/api";

/**
 * Keep a global reference so we never boot more than one container.
 */
let globalWebContainer: WebContainer | null = null;

/** Tracks if dependencies have been installed once already. */
let installedDependencies = false;

/**
 * Minimal Next.js 13 project with a basic "app/" directory for demonstration.
 */
const defaultFiles = {
  "package.json": {
    file: {
      contents: `{
  "name": "subjeto-webcontainer-nextjs",
  "version": "0.1.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "latest",
    "react": "latest",
    "react-dom": "latest"
  },
  "devDependencies": {
    "tailwindcss": "latest",
    "postcss": "latest",
    "autoprefixer": "latest"
  }
}
`,
    },
  },
  "next.config.js": {
    file: {
      contents: `/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  experimental: {
    appDir: true
  }
};
`,
    },
  },
  "postcss.config.js": {
    file: {
      contents: `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`,
    },
  },
  "tailwind.config.js": {
    file: {
      contents: `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
`,
    },
  },
  // Minimal "app" directory for Next.js 13
  app: {
    directory: {
      "layout.tsx": {
        file: {
          contents: `import "./globals.css";
export const metadata = {
  title: "Hello from defaultFiles"
};
export default function RootLayout({ children }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
`,
        },
      },
      "page.tsx": {
        file: {
          contents: `export default function Page() {
  return (
    <div style={{textAlign: 'center', marginTop: '3rem'}}>
      <h1>Hello from the default "app/page.tsx" in WebContainer!</h1>
      <p>If you see this, Next.js 13 + Tailwind is working.</p>
    </div>
  );
}
`,
        },
      },
      "globals.css": {
        file: {
          contents: `@tailwind base;
@tailwind components;
@tailwind utilities;
`,
        },
      },
    },
  },
};

type WebContainerContextValue = {
  webContainerInstance: WebContainer | null;
  writeFile: (filePath: string, content: string) => Promise<void>;
  runCommand: (
    cmd: string,
    args?: string[]
  ) => Promise<{ process: WebContainerProcess; output: string[] }>;
  previewUrl: string | null;
  serverIsStarting: boolean;
  startPreviewServer: () => Promise<void>;
  /** True if container is in the process of booting or re-booting. */
  containerBooting: boolean;
  /** True if dependencies are being installed. */
  installingDeps: boolean;
  /** Reboot the container (in case user wants a fresh environment). */
  rebootWebContainer: () => Promise<void>;
};

const WebContainerCtx = createContext<WebContainerContextValue | null>(null);

export function useWebContainer() {
  const ctx = useContext(WebContainerCtx);
  if (!ctx) {
    throw new Error("useWebContainer must be used inside WebContainerProvider");
  }
  return ctx;
}

export function WebContainerProvider({ children }: PropsWithChildren<{}>) {
  const [webContainerInstance, setWebContainerInstance] =
    useState<WebContainer | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [serverIsStarting, setServerIsStarting] = useState(false);

  const [containerBooting, setContainerBooting] = useState(true);
  const [installingDeps, setInstallingDeps] = useState(false);

  const unsubscribesRef = useRef<(() => void)[]>([]);
  const autoStartedRef = useRef(false);

  useEffect(() => {
    bootWebContainer();
    return () => {
      unsubscribesRef.current.forEach((fn) => fn());
      unsubscribesRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function bootWebContainer() {
    setContainerBooting(true);
    try {
      if (globalWebContainer) {
        console.log("Reusing existing WebContainer instance");
        setWebContainerInstance(globalWebContainer);
        setContainerBooting(false);
        return;
      }

      console.log("Booting new WebContainer instance...");
      const wc = await WebContainer.boot();
      console.log("Mounting default files (Next.js app)...");
      await wc.mount(defaultFiles);

      if (!installedDependencies) {
        console.log("Installing dependencies (npm install)...");
        setInstallingDeps(true);
        const installResult = await runCommandInContainer(wc, "npm", ["install"]);
        console.log("Install output => ", installResult.output.join(""));
        installedDependencies = true;
        setInstallingDeps(false);
      } else {
        console.log("Dependencies already installed. Skipping npm install.");
      }

      globalWebContainer = wc;
      setWebContainerInstance(wc);
    } catch (err) {
      console.error("Error booting WebContainer:", err);
    } finally {
      setContainerBooting(false);
    }
  }

  async function runCommandInContainer(
    container: WebContainer,
    cmd: string,
    args: string[]
  ) {
    const process = await container.spawn(cmd, args);
    const output: string[] = [];
    const writable = new WritableStream({
      write(data) {
        output.push(data);
        console.log("[WebContainer]", data);
      },
    });
    process.output.pipeTo(writable);

    const exitCode = await process.exit;
    return { process, output, exitCode };
  }

  async function rebootWebContainer() {
    // Force a new container
    globalWebContainer = null;
    setWebContainerInstance(null);
    setPreviewUrl(null);
    autoStartedRef.current = false;
    bootWebContainer();
  }

  async function writeFile(filePath: string, content: string) {
    if (!webContainerInstance) {
      console.warn("No WebContainer instance yet, cannot write file.");
      return;
    }
    try {
      await webContainerInstance.fs.writeFile(filePath, content, "utf-8");
      console.log(`Wrote file to container: ${filePath}`);
    } catch (err) {
      console.error("Error writing file:", err);
    }
  }

  async function runCommand(cmd: string, args: string[] = []) {
    if (!webContainerInstance) {
      throw new Error("WebContainer not ready");
    }
    const process = await webContainerInstance.spawn(cmd, args);
    const output: string[] = [];
    const writable = new WritableStream({
      write(data) {
        console.log("[WebContainer]", data);
        output.push(data);
      },
    });
    process.output.pipeTo(writable);
    return { process, output };
  }

  async function startPreviewServer() {
    if (!webContainerInstance) {
      console.warn("WebContainer not available yet.");
      return;
    }
    if (previewUrl) {
      console.log("Preview server is already running at", previewUrl);
      return;
    }
    if (serverIsStarting) {
      console.log("Server is already starting...");
      return;
    }
    setServerIsStarting(true);

    try {
      const unsubServerReady = webContainerInstance.on("server-ready", (port, url) => {
        console.log(`(server-ready) => port: ${port}, url: ${url}`);
        setPreviewUrl(url);
        setServerIsStarting(false);
        unsubServerReady();
      });
      unsubscribesRef.current.push(unsubServerReady);

      const unsubPort = webContainerInstance.on(
        "port",
        (portNumber, status, url) => {
          console.log(`(port) => port: ${portNumber}, status: ${status}, url: ${url}`);
          if (portNumber === 3000 && status === "open") {
            setPreviewUrl(url);
            setServerIsStarting(false);
            unsubPort();
          }
        }
      );
      unsubscribesRef.current.push(unsubPort);

      console.log("Running npm run dev...");
      await runCommand("npm", ["run", "dev"]);
    } catch (err) {
      console.error("Preview error:", err);
      setServerIsStarting(false);
    }
  }

  useEffect(() => {
    // Auto-start dev server once container is ready
    if (
      webContainerInstance &&
      !previewUrl &&
      !serverIsStarting &&
      !autoStartedRef.current
    ) {
      autoStartedRef.current = true;
      startPreviewServer();
    }
  }, [webContainerInstance, previewUrl, serverIsStarting]);

  const value = useMemo<WebContainerContextValue>(
    () => ({
      webContainerInstance,
      writeFile,
      runCommand,
      previewUrl,
      serverIsStarting,
      startPreviewServer,
      containerBooting,
      installingDeps,
      rebootWebContainer,
    }),
    [
      webContainerInstance,
      previewUrl,
      serverIsStarting,
      containerBooting,
      installingDeps,
    ]
  );

  return (
    <WebContainerCtx.Provider value={value}>
      {children}
    </WebContainerCtx.Provider>
  );
}
