import { Request, Response } from "express";
import APIError, { ErrorCodes } from "./utils/error";
import User from "./database/models/User.model";
import { ParamsDictionary } from "express-serve-static-core";
import supabaseClient from "./database/init";
import Minion from "./database/models/Minion.model";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import config from "../config";
import { uuid } from "uuidv4";
import { TablesEnum } from "../global.enum";
import { IMinionTable, IUserTable } from "./database/db.interface";
import { ChangePasswordDTO } from "./dto";

// ------ User -------
const createUser = async (
  req: Request<ParamsDictionary, any, IUserTable>,
  res: Response
) => {
  try {
    const validatedBody = User.validate({ ...req.body, id: uuid() });

    if (validatedBody.error)
      throw new APIError(
        validatedBody.error.details[0].message,
        ErrorCodes.BAD_REQUEST
      );

    const token = jwt.sign(
      {
        id: validatedBody.value.id,
        iat: new Date().getTime(),
        eat: new Date().getTime() + 10 * 365 * 24 * 60 * 60 * 1000,
      },
      config.JWT_SECRET!
    );

    const hashedPassword = await bcrypt.hash(validatedBody.value.password, 10);

    const { data, error } = await supabaseClient
      .from<IUserTable>(TablesEnum.USER)
      .upsert(
        {
          ...validatedBody.value,
          role: "USER",
          accessToken: token,
          password: hashedPassword,
        },
        { onConflict: "email" }
      )
      .select("id, email, accessToken, role, minionId");

    if (error || !data)
      throw new APIError(
        error?.message ||
          `Could not create user with email ${validatedBody.value.email}`,
        ErrorCodes.BAD_REQUEST
      );

    return res.status(201).json({
      status: 201,
      data: data[0],
    });
  } catch (error: any) {
    if (error instanceof APIError) {
      return res.status(error.statusCode).json({
        status: error.statusCode,
        message: error.errorMessage,
      });
    } else {
      return res.status(500).json({
        status: 500,
        message: error.message ?? "Something went wrong",
      });
    }
  }
};

const loginUser = async (
  req: Request<ParamsDictionary, any, Pick<IUserTable, "email" | "password">>,
  res: Response
) => {
  try {
    if (!req.body.email || !req.body.password)
      throw new APIError("Missing Required Fields", ErrorCodes.BAD_REQUEST);

    const { data, error } = await supabaseClient
      .from<IUserTable>(TablesEnum.USER)
      .select("id, email, password")
      .eq("email", req.body.email);

    if (!data?.length || error)
      throw new APIError(
        error?.message || `Could not find user with email ${req.body.email}`,
        ErrorCodes.BAD_REQUEST
      );

    const isValidPassword = await bcrypt.compare(
      req.body.password,
      data[0].password
    );

    if (!isValidPassword)
      throw new APIError("Invalid Credentials", ErrorCodes.UNAUTHORISED);

    const token = jwt.sign(
      {
        id: data[0].id,
        iat: new Date().getTime(),
        eat: new Date().getTime() + 10 * 365 * 24 * 60 * 60 * 1000,
      },
      config.JWT_SECRET!
    );

    const { data: updatedData, error: err } = await supabaseClient
      .from<IUserTable>(TablesEnum.USER)
      .update({
        accessToken: token,
      })
      .eq("email", req.body.email)
      .select("id, email, accessToken, role, minionId");

    if (!updatedData || err)
      throw new APIError(
        err?.message || `Something went wrong`,
        ErrorCodes.INTERNAL_SERVER_ERROR
      );

    return res.status(200).json({
      status: 200,
      data: updatedData[0],
    });
  } catch (error: any) {
    if (error instanceof APIError) {
      return res.status(error.statusCode).json({
        status: error.statusCode,
        message: error.errorMessage,
      });
    } else {
      return res.status(500).json({
        status: 500,
        message: error.message ?? "Something went wrong",
      });
    }
  }
};

const changePassword = async (
  req: Request<ParamsDictionary, any, ChangePasswordDTO>,
  res: Response
) => {
  try {
    const user = (req as any).user as IUserTable;

    const { data: userData, error: userError } = await supabaseClient
      .from<IUserTable>(TablesEnum.USER)
      .select("password")
      .eq("id", user.id);

    if (!userData?.length || userError)
      throw new APIError(
        userError?.message || "Could not find user",
        ErrorCodes.NOT_FOUND
      );

    const isValidPassword = await bcrypt.compare(
      req.body.oldPassword,
      userData[0].password
    );

    if (!isValidPassword)
      throw new APIError("Invalid Credentials", ErrorCodes.UNAUTHORISED);

    const newHashedPassword = await bcrypt.hash(req.body.newPassword, 10);

    const token = jwt.sign(
      {
        id: user.id,
        iat: new Date().getTime(),
        eat: new Date().getTime() + 10 * 365 * 24 * 60 * 60 * 1000,
      },
      config.JWT_SECRET!
    );

    const { data, error } = await supabaseClient
      .from<IUserTable>(TablesEnum.USER)
      .update({
        password: newHashedPassword,
        accessToken: token,
      })
      .eq("id", user.id)
      .select("id, email, accessToken, role, minionId");

    if (!data?.length || error)
      throw new APIError(
        error?.message || `Could not update password`,
        ErrorCodes.BAD_REQUEST
      );

    return res.status(200).json({
      status: 200,
      data: data[0],
    });
  } catch (error: any) {
    if (error instanceof APIError) {
      return res.status(error.statusCode).json({
        status: error.statusCode,
        message: error.errorMessage,
      });
    } else {
      return res.status(500).json({
        status: 500,
        message: error.message ?? "Something went wrong",
      });
    }
  }
};

const getUserById = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { data, error } = await supabaseClient
      .from<IUserTable>(TablesEnum.USER)
      .select("id, email, accessToken, role, minionId")
      .eq("id", req.params.id);

    if (!data || error)
      throw new APIError(
        error?.message || `Could not find user with id ${req.params.id}`,
        ErrorCodes.NOT_FOUND
      );

    return res.status(200).json({
      status: 200,
      data: data[0],
    });
  } catch (error: any) {
    if (error instanceof APIError) {
      return res.status(error.statusCode).json({
        status: error.statusCode,
        message: error.errorMessage,
      });
    } else {
      return res.status(500).json({
        status: 500,
        message: error.message ?? "Something went wrong",
      });
    }
  }
};

const getAllUsers = async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseClient
      .from<IUserTable>(TablesEnum.USER)
      .select("id, email, accessToken, role, minionId")
      .eq("role", "USER");

    if (!data || error)
      throw new APIError(
        error?.message || "Could not find users",
        ErrorCodes.NOT_FOUND
      );

    return res.status(200).json({
      status: 200,
      data,
    });
  } catch (error: any) {
    if (error instanceof APIError) {
      return res.status(error.statusCode).json({
        status: error.statusCode,
        message: error.errorMessage,
      });
    } else {
      return res.status(500).json({
        status: 500,
        message: error.message ?? "Something went wrong",
      });
    }
  }
};

const getAllAdmins = async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseClient
      .from<IUserTable>(TablesEnum.USER)
      .select("id, email, accessToken, role, minionId")
      .eq("role", "Admin");

    if (!data || error)
      throw new APIError(
        error?.message || "Could not find users",
        ErrorCodes.NOT_FOUND
      );

    return res.status(200).json({
      status: 200,
      data,
    });
  } catch (error: any) {
    if (error instanceof APIError) {
      return res.status(error.statusCode).json({
        status: error.statusCode,
        message: error.errorMessage,
      });
    } else {
      return res.status(500).json({
        status: 500,
        message: error.message ?? "Something went wrong",
      });
    }
  }
};

// ---- Minion ----
const createMinion = async (
  req: Request<ParamsDictionary, any, IMinionTable>,
  res: Response
) => {
  try {
    const user = (req as any).user as IUserTable;

    const validatedBody = Minion.validate({
      ...req.body,
      id: uuid(),
      createdBy: user.id,
    });

    if (validatedBody.error)
      throw new APIError(
        validatedBody.error.details[0].message,
        ErrorCodes.BAD_REQUEST
      );

    const { data, error } = await supabaseClient
      .from<IMinionTable>(TablesEnum.MINION)
      .upsert(validatedBody.value, { onConflict: "id" });

    if (error || !data)
      throw new APIError(
        error?.message ||
          `Could not create minion with id ${validatedBody.value.id}`,
        ErrorCodes.BAD_REQUEST
      );

    return res.status(201).json({
      status: 201,
      data: data[0],
    });
  } catch (error: any) {
    if (error instanceof APIError) {
      return res.status(error.statusCode).json({
        status: error.statusCode,
        message: error.errorMessage,
      });
    } else {
      return res.status(500).json({
        status: 500,
        message: error.message ?? "Something went wrong",
      });
    }
  }
};

const addUserToMinion = async (
  req: Request<{ minionId: string }, any, { userId: string }>,
  res: Response
) => {
  try {
    const [{ data, error }, { data: userData, error: userError }] =
      await Promise.all([
        supabaseClient
          .from<IMinionTable>(TablesEnum.MINION)
          .update({ userId: req.body.userId })
          .eq("id", req.params.minionId),
        supabaseClient
          .from<IUserTable>("user")
          .update({ minionId: req.params.minionId })
          .eq("id", req.body.userId),
      ]);

    if (error || !data)
      throw new APIError(
        error?.message ||
          `Could not add user ${req.body.userId} to minion with id ${req.params.minionId}`,
        ErrorCodes.BAD_REQUEST
      );

    if (userError || !userData)
      throw new APIError(
        userError?.message ||
          `Could not add user ${req.body.userId} to minion with id ${req.params.minionId}`,
        ErrorCodes.BAD_REQUEST
      );

    return res.status(200).json({
      status: 200,
      data: data[0],
    });
  } catch (error: any) {
    if (error instanceof APIError) {
      return res.status(error.statusCode).json({
        status: error.statusCode,
        message: error.errorMessage,
      });
    } else {
      return res.status(500).json({
        status: 500,
        message: error.message ?? "Something went wrong",
      });
    }
  }
};

const getAllMinions = async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseClient
      .from<IMinionTable>(TablesEnum.MINION)
      .select();

    if (error || !data)
      throw new APIError(
        error?.message || `Could not find minions`,
        ErrorCodes.NOT_FOUND
      );

    return res.status(200).json({
      status: 200,
      data,
    });
  } catch (error: any) {
    if (error instanceof APIError) {
      return res.status(error.statusCode).json({
        status: error.statusCode,
        message: error.errorMessage,
      });
    } else {
      return res.status(500).json({
        status: 500,
        message: error.message ?? "Something went wrong",
      });
    }
  }
};

const getMinionById = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { data, error } = await supabaseClient
      .from<IMinionTable>(TablesEnum.MINION)
      .select()
      .eq("id", req.params.id);

    if (error || !data)
      throw new APIError(
        error?.message || `Could not find minion with id ${req.params.id}`,
        ErrorCodes.NOT_FOUND
      );

    return res.status(200).json({
      status: 200,
      data: data[0],
    });
  } catch (error: any) {
    if (error instanceof APIError) {
      return res.status(error.statusCode).json({
        status: error.statusCode,
        message: error.errorMessage,
      });
    } else {
      return res.status(500).json({
        status: 500,
        message: error.message ?? "Something went wrong",
      });
    }
  }
};

const getUnassignedMinions = async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseClient
      .from<IMinionTable>(TablesEnum.MINION)
      .select("id, saltId")
      .is("userId", null);

    if (error || !data) {
      throw new APIError(
        error?.message || "Failed to fetch unassigned minions",
        ErrorCodes.BAD_REQUEST
      );
    }

    return res.status(200).json({
      status: 200,
      data,
    });
  } catch (error: any) {
    if (error instanceof APIError) {
      return res.status(error.statusCode).json({
        status: error.statusCode,
        message: error.errorMessage,
      });
    } else {
      return res.status(500).json({
        status: 500,
        message: error.message ?? "Something went wrong",
      });
    }
  }
};

export {
  createUser,
  createMinion,
  getUserById,
  getAllUsers,
  getAllAdmins,
  addUserToMinion,
  getAllMinions,
  getMinionById,
  loginUser,
  getUnassignedMinions,
  changePassword,
};
