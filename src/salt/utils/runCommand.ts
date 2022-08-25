import { exec } from "child_process";
import { promisify } from "util";

const runCmd = async (cmd: string) => {
  try {
    const promisifiedExec = promisify(exec);
    const { stdout } = await promisifiedExec(cmd, {
      cwd: "/srv/salt/",
    });

    return stdout;
  } catch (error) {
    console.log("[runCmd]", error);
    return error.stdout;
  }
};

export { runCmd };
