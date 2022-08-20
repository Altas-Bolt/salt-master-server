import { exec } from "child_process";

const runScan = (cmd: string) =>
  new Promise<{ code: number | null; stdout: string; stderr: string }>(
    (resolve) => {
      const cp = exec(cmd);
    }
  );

export { runScan };
