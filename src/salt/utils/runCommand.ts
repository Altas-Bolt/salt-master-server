import { exec } from "child_process";
import { promisify } from "util";

const runCmd = async (cmd: string) => {
  try {
    const promisifiedExec = promisify(exec);
    const { stdout } = await promisifiedExec(cmd);

    return stdout;
  } catch (error) {
    return error.stdout;
  }
};

export { runCmd };
