import { NextFunction, Request, Response } from "express";
import supabaseClient from "./database/init";
import jwt from "jsonwebtoken";
import config from "../config";
import { IUserTable } from "./database/db.interface";

export const auth = async (req: Request, res: Response, next: NextFunction) => {
  let token = req.headers["authorization"] as string;

  if (!token) {
    return res.status(401).json({
      message: "Unauthorized",
      status: 401,
    });
  }

  if (token) {
    if (!token.startsWith("Bearer ")) {
      return res.status(400).json({
        status: 400,
        message:
          "Invalid Auth Token Format: must be in format of Bearer [token]",
      });
    }

    token = token.replace("Bearer ", "");
  }

  const { id, eat } = jwt.verify(token, config.JWT_SECRET!) as Record<
    string,
    string | number
  >;

  if (new Date().getTime() > eat) {
    return res.status(400).json({
      status: 400,
      message: "Auth token has expired",
    });
  }

  const { data, error } = await supabaseClient
    .from<IUserTable>("user")
    .select("id, email, role, minionId")
    .eq("id", id as string);

  if (!data || error)
    return res.status(404).json({
      status: 404,
      message: error || `Could not find user`,
    });

  (req as any).user = data[0];

  return next();
};

export const admin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = (req as any).user as IUserTable;
  if (!user)
    return res.status(400).json({
      status: 400,
      message: "User not found",
    });

  if (user.role !== "ADMIN")
    return res.status(401).json({
      status: 401,
      message: "Unauthorised to perform this action",
    });

  return next();
};
