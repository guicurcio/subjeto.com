// app/preview/[buildId]/[...path]/route.ts

import { NextRequest } from "next/server";
import { getBuild, StaticFile } from "@/utils/store";
import { join } from "path";

/**
 * Catch-all route that serves files from the exported Next.js site in memory.
 * e.g. GET /preview/abc123 -> returns /index.html
 *      GET /preview/abc123/blog -> returns /blog/index.html
 *      GET /preview/abc123/blog/index.html -> returns /blog/index.html
 */

export async function GET(
  req: NextRequest,
  {
    params,
  }: {
    params: { buildId: string; path?: string[] };
  }
) {
  const { buildId, path: pathSegments = [] } = params;
  const files = getBuild(buildId);

  if (!files) {
    return new Response("Build not found", { status: 404 });
  }

  // Reconstruct a relative path. If none given, we want "index.html"
  let relPath = pathSegments.join("/");
  if (!relPath) relPath = "index.html";

  // Some Next.js exported routes rely on trailing slash => "blog" => "blog/index.html"
  let fileEntry: StaticFile | undefined = files[relPath];
  if (!fileEntry) {
    // Maybe user requested "blog" but actual file is "blog/index.html"
    const altPath = join(relPath, "index.html");
    fileEntry = files[altPath];
  }

  if (!fileEntry) {
    return new Response("File not found", { status: 404 });
  }

  return new Response(fileEntry.content, {
    headers: { "Content-Type": fileEntry.contentType },
  });
}
