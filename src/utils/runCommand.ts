import { spawn } from "child_process";

const run = (cmd: string) =>
  new Promise<{ code: number | null; stdout: string; stderr: string }>(
    (resolve) => {
      const cp = spawn("sh");
      cp.stdin.write(`${cmd}\n`);

      let stdout = Buffer.from("");
      let stderr = Buffer.from("");

      cp.stdout.on("data", (data: Buffer) => {
        console.log(data.toString());
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
