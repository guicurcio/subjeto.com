// utils/runCommand.ts
import { exec } from "child_process";

export function runCommand(command: string, cwd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(command, { cwd }, (error, stdout, stderr) => {
      if (error) {
        reject(stderr || stdout);
      } else {
        resolve(stdout || stderr);
      }
    });
  });
}
