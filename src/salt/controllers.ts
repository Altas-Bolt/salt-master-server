import { Request, Response } from "express";
import { run as runCommand } from "../utils/runCommand";

const linuxScan = async (_req: Request, res: Response) => {
  try {
    const { code, stdout, stderr } = await runCommand("sudo", [
      "salt",
      "'*'",
      "cmd.run",
      "'ps aux'",
    ]);

    return res.status(200).json({
      status: 200,
      message: "Linux Scan",
      data: { code, stdout, stderr },
    });
  } catch (error) {
    console.error("[salt:linuxScan]", error);
    return res.status(400).json({
      status: 400,
      message: "Error occured while adding notification",
      data: null,
    });
  }
};

export { linuxScan };
