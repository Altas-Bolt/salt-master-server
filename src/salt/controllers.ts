import { Request, Response } from "express";
import { parseLinuxScanOp } from "./utils/parseLinuxScan";
import { runCmd } from "./utils/runCommand";

const linuxScan = async (_req: Request, res: Response) => {
  try {
    const output = await runCmd(
      `echo ${process.env.PASSWORD || ""} | sudo -S salt '*' cmd.run 'ls -a'`
    );

    const result = parseLinuxScanOp(output.trim());

    return res.status(200).json({
      status: 200,
      message: "Scan successfull",
      data: result,
    });
  } catch (error) {
    console.error("[salt:linuxScan]", error);
    return res.status(400).json({
      status: 400,
      message: "Error occured on scan",
      data: null,
    });
  }
};

export { linuxScan };
