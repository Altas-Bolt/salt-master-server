import { Request, Response } from "express";

const linuxScan = async (_req: Request, res: Response) => {
  try {
    return res.status(200).json({
      status: 200,
      message: "Success",
      data: null,
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
