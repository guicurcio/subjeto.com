// app/build/route.ts
import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import * as fs from "fs/promises";
import * as path from "path";

import { copyFolderRecursive } from "@/utils/copyFolderRecursive";
import { runCommand } from "@/utils/runCommand";
import { storeBuild, StaticFile } from "@/utils/store";

export async function POST(req: Request) {
  try {
    // 1) Parse user data. For example:
    // { userFiles: { "app/page.tsx": "... code ..."} }
    const { userFiles } = await req.json() as {
      userFiles: Record<string, string>;
    };

    // 2) Create a unique build ID + temp folder
    const buildId = nanoid();
    const buildFolder = path.join("/tmp", `build-${buildId}`);
    await fs.mkdir(buildFolder, { recursive: true });

    // 3) Copy pre-bundled template
    const templateFolder = path.join(process.cwd(), "templates/next-tailwind-shadcn");
    await copyFolderRecursive(templateFolder, buildFolder);

    // 4) Overwrite user files in the newly copied build
    for (const [relativePath, content] of Object.entries(userFiles)) {
      const fullDest = path.join(buildFolder, relativePath);
      // Ensure parent directory exists
      await fs.mkdir(path.dirname(fullDest), { recursive: true });
      await fs.writeFile(fullDest, content, "utf-8");
    }

    // 5) (Optional) If dependencies didn’t change, we can skip `bun install`.
    //    Otherwise, do the install:
    await runCommand("bun install", buildFolder);

    // 6) Build + Export
    // Usually, `build` => `next build`, but we define scripts in the template's package.json
    await runCommand("npx cross-env NODE_ENV=production bun run build", buildFolder);
    // Then export static HTML

    // 7) Read the `/out` folder into memory
    const outDir = path.join(buildFolder, "out");
    const filesMap: Record<string, StaticFile> = {};
    await collectExportedFiles(outDir, filesMap);

    // 8) Store the result
    storeBuild(buildId, filesMap);

    // 9) Return buildId
    return NextResponse.json({ buildId });
  } catch (error: any) {
    console.error("Build error:", error);
    return new NextResponse(error.toString(), { status: 500 });
  }
}

/** Recursively read all files in the `out` folder. */
async function collectExportedFiles(
  dir: string,
  filesMap: Record<string, StaticFile>,
  currentPath = ""
) {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.join(currentPath, entry.name); // e.g. "index.html", "assets/style.css"

    if (entry.isDirectory()) {
      await collectExportedFiles(fullPath, filesMap, relPath);
    } else if (entry.isFile()) {
      const content = await fs.readFile(fullPath, "utf-8");
      const contentType = guessContentType(entry.name);
      filesMap[relPath] = { content, contentType };
    }
  }
}

/** Very basic content-type inference. */
function guessContentType(filename: string): string {
  if (filename.endsWith(".html")) return "text/html";
  if (filename.endsWith(".css")) return "text/css";
  if (filename.endsWith(".js")) return "application/javascript";
  if (filename.endsWith(".json")) return "application/json";
  if (filename.endsWith(".png")) return "image/png";
  if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) return "image/jpeg";
  return "text/plain";
}
