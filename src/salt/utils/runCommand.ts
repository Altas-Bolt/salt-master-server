import { exec } from "child_process";
import { promisify } from "util";

const runCmd = async (cmd: string) => {
  const promisifiedExec = promisify(exec);
  const { stdout, stderr } = await promisifiedExec(cmd);

  if (stderr) return stderr;
  return stdout;
};

export { runCmd };
