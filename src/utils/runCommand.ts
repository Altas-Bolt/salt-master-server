import { spawn } from "child_process";

const run = (cmd: string, args: string[]) =>
  new Promise<{ code: number | null; stdout: string; stderr: string }>(
    (resolve) => {
      const cp = spawn(cmd, [...args]);

      let stdout = Buffer.from("");
      let stderr = Buffer.from("");

      cp.stdout.on("data", (data: Buffer) => {
        stdout = Buffer.concat([stdout, data]);
      });

      cp.stderr.on("data", (data: Buffer) => {
        stderr = Buffer.concat([stderr, data]);
      });

      cp.on("exit", (code) => {
        resolve({
          code,
          stdout: stdout.toString(),
          stderr: stderr.toString(),
        });
      });
    }
  );

export { run };
