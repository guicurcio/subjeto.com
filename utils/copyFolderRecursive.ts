// utils/copyFolderRecursive.ts
import * as fs from "fs/promises";
import * as path from "path";

export async function copyFolderRecursive(src: string, dest: string) {
  // Create dest folder if doesn’t exist
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyFolderRecursive(srcPath, destPath);
    } else if (entry.isFile()) {
      await fs.copyFile(srcPath, destPath);
    }
  }
}
