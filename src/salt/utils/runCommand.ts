import { exec } from "child_process";
import { promisify } from "util";

const runCmd = async (cmd: string) => {
  const promisifiedExec = promisify(exec);
  const { stdout } = await promisifiedExec(cmd);

  return stdout;
};

export { runCmd };
