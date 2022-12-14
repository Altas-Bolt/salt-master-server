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
import {
  BlacklistedTypeSoftwareNotificationResolutionsEnum,
  FlagEnum,
  MinionIdentityEnum,
  NewTypeSoftwareNotificationResolutionsEnum,
  OSEnum,
  TablesEnum,
} from "../global.enum";
import {
  IMinionTable,
  IUserTable,
  IScanMinionSoftwaresTable,
  IScanTable,
  ISoftwaresTable,
  ISoftwareNotifications,
} from "./database/db.interface";
import { ChangePasswordDTO, TGetSoftwaresQuery } from "./dto";
import { IScanInfo } from "./bolt.interface";
import { getTotalSoftwareCount } from "./utils/getTotalSoftwareCount";
import { scanInfoGroupByUser } from "./utils/scanInfoGroupBy";
import { flatObj } from "./utils/flatObj";
import { TRequestBody, TRequestQuery } from "../utils.types";
import { getOrThrowQuery } from "./utils/getOrThrowQuery";
import { resolveNotification as resolveNotificationHelper } from "./utils/softwareNotification.utils";
import { groupBySoftware } from "./utils/groupBySoftware";

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
  req: Request<
    ParamsDictionary,
    any,
    {
      os: keyof OSEnum;
      ip: string;
    }
  >,
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
  req: Request<{ id: string }, any, { email: string }>,
  res: Response
) => {
  try {
    const { data: userData, error: userError } = await supabaseClient
      .from<IUserTable>("user")
      .update({ minionId: req.params.id })
      .eq("email", req.body.email);

    if (!userData || userError) {
      throw new APIError(
        userError?.message ||
          `Could not add user ${req.body.email} to minion with id ${req.params.id}`,
        ErrorCodes.BAD_REQUEST
      );
    }

    const { data: minionData, error: minionError } = await supabaseClient
      .from<IMinionTable>(TablesEnum.MINION)
      .update({ userId: userData[0].id })
      .eq("id", req.params.id);

    if (minionError || !minionData)
      throw new APIError(
        minionError?.message ||
          `Could not add user ${req.body.email} to minion with id ${req.params.id}`,
        ErrorCodes.BAD_REQUEST
      );
    return res.status(200).json({
      status: 200,
      data: minionData[0],
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

const getMinionBySaltId = async (
  req: Request<{ saltId: string }>,
  res: Response
) => {
  try {
    const { data, error } = await supabaseClient
      .from<IMinionTable>(TablesEnum.MINION)
      .select()
      .eq("saltId", req.params.saltId);

    if (error || !data)
      throw new APIError(
        error?.message ||
          `Could not find minion with salt id ${req.params.saltId}`,
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

// ---- Scans ----
const getAllScans = async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseClient
      .from<IScanTable>(TablesEnum.SCAN)
      .select()
      .order("ran_at", { ascending: false });

    if (error || !data)
      throw new APIError(
        error?.message || `Could not find scans in DB`,
        ErrorCodes.NOT_FOUND
      );

    return res.status(200).json({
      status: 200,
      data: data,
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

const getLatestScan = async (
  req: TRequestQuery<{ limit: string }>,
  res: Response
) => {
  try {
    const limit = parseInt(req.query.limit);

    const { data, error } = await supabaseClient
      .from<IScanTable>(TablesEnum.SCAN)
      .select()
      .order("ran_at", { ascending: false })
      .limit(limit);

    if (error || !data)
      throw new APIError(
        error?.message || `Could not find scans in DB`,
        ErrorCodes.NOT_FOUND
      );

    return res.status(200).json({
      status: 200,
      data: limit > 1 ? data : data[0],
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

const getScanInfo = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseClient
      .from<IScanMinionSoftwaresTable>(TablesEnum.SCAN_MINION_SOFTWARES)
      .select(
        `id, flag, minion_id, software:software_id (id, name, flag), minion:minion_id (id, saltId, os, ip, user:userId (id, email, role) )`
      )
      .eq("scan_id", req.body.scanId.trim());

    if (error || !data)
      throw new APIError(
        error?.message ||
          `Could not find entries in 'scan-minion-software' table for scan_id = ${req.body.scanId}`,
        ErrorCodes.NOT_FOUND
      );

    console.log({ body: req.body, data });

    const result: Record<string, any> = {};

    result.count = getTotalSoftwareCount(data as unknown as IScanInfo[]);
    result.data =
      req.body.groupBy === "employee"
        ? scanInfoGroupByUser(data as unknown as IScanInfo[]).map((obj) =>
            flatObj(obj)
          )
        : req.body.groupBy === "software_name"
        ? Object.values(groupBySoftware(data as unknown as IScanInfo[]))
        : data.map((obj) => flatObj(obj));

    return res.status(200).json({
      status: 200,
      data: result,
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

// -- Softwares --
const getAllSoftwares = async (
  req: TRequestBody<TGetSoftwaresQuery>,
  res: Response
) => {
  try {
    let minionIds: string[] = [];

    if (
      req.body.minions &&
      req.body.minions.length > 0 &&
      req.body.minionIdentity
    ) {
      minionIds =
        req.body.minionIdentity === MinionIdentityEnum.SALT_ID
          ? (
              await getOrThrowQuery<IMinionTable>(
                supabaseClient
                  .from<IMinionTable>(TablesEnum.MINION)
                  .select("id")
                  .in("saltId", req.body.minions)
              )
            ).map((obj) => obj.id)
          : req.body.minions;
    } else if (!req.body.minions || req.body.minions.length === 0) {
      minionIds = (
        await getOrThrowQuery<IMinionTable>(
          supabaseClient.from<IMinionTable>(TablesEnum.MINION).select("id")
        )
      ).map((obj) => obj.id);
    } else {
      throw new APIError(
        `'minionIdentity' is required if minions is provided`,
        ErrorCodes.NOT_FOUND
      );
    }

    const { data, error } = await (req.body.flag === "all"
      ? supabaseClient
          .from<ISoftwaresTable>(TablesEnum.SOFTWARES)
          .select()
          .in("minion_id", minionIds)
      : supabaseClient
          .from<ISoftwaresTable>(TablesEnum.SOFTWARES)
          .select()
          .in("minion_id", minionIds)
          .eq("flag", req.body.flag));

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

const getApplicationListForSaltId = async (
  req: TRequestQuery<{ saltId: string }>,
  res: Response
) => {
  try {
    const { data: latestScan, error: errorInGettingLatestScan } =
      await supabaseClient
        .from<IScanTable>(TablesEnum.SCAN)
        .select()
        .order("created_at", { ascending: false })
        .limit(1);

    if (errorInGettingLatestScan || !latestScan)
      throw new APIError(
        errorInGettingLatestScan?.message || `Could not find latest scan in DB`,
        ErrorCodes.NOT_FOUND
      );

    console.log({ latestScan });

    const saltId = req.query.saltId.trim();

    const { data: minionId, error: errorInGettingMinionId } =
      await supabaseClient
        .from<IMinionTable>(TablesEnum.MINION)
        .select()
        .eq("saltId", saltId);

    if (errorInGettingMinionId || !minionId)
      throw new APIError(
        errorInGettingMinionId?.message ||
          `Could not find minion for given id DB`,
        ErrorCodes.NOT_FOUND
      );

    console.log({ minionId });

    const { data, error } = await supabaseClient
      .from<IScanMinionSoftwaresTable>(TablesEnum.SCAN_MINION_SOFTWARES)
      .select(
        `id, flag, minion_id, software:software_id (id, name, flag), minion:minion_id (id, saltId, os, ip, user:userId (id, email, role) )`
      )
      .eq("scan_id", latestScan[0].id)
      .eq("minion_id", minionId[0].id);

    if (error || !data)
      throw new APIError(
        error?.message || `Could not find entries in DB`,
        ErrorCodes.NOT_FOUND
      );

    const result: Record<string, any> = {};

    result.count = getTotalSoftwareCount(data as unknown as IScanInfo[]);
    result.data = data.map((obj) => flatObj(obj));

    return res.status(200).json({
      status: 200,
      data: result,
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

const getSoftwareNotifications = async (
  req: TRequestQuery<{ resolved: string }>,
  res: Response
) => {
  try {
    const resolved = req.query.resolved === "true" ? true : false;
    const { data: latestScans, error: errorInFindingLatestScan } =
      await supabaseClient
        .from<IScanTable>(TablesEnum.SCAN)
        .select()
        .order("created_at", { ascending: false })
        .limit(1);

    if (errorInFindingLatestScan || !latestScans)
      throw new APIError(
        errorInFindingLatestScan?.message || `Could not find latest scan`,
        ErrorCodes.NOT_FOUND
      );

    const latestScan = latestScans[0];

    const { data, error } = await supabaseClient
      .from<ISoftwareNotifications>(TablesEnum.SOFTWARE_NOTIFICATIONS)
      .select(
        `id, created_at, type, scan_id, minion:minion_id ( id, os, ip, user:userId ( id, email ) ), resolved_by, resolved, resolution_description, software:software_id ( id, name , flag )`
      )
      .eq("resolved", resolved)
      .eq("scan_id", latestScan.id);

    if (error || !data)
      throw new APIError(
        error?.message || `Could not find software notifications in DB`,
        ErrorCodes.NOT_FOUND
      );

    return res.status(200).json({
      status: 200,
      data: data.map((obj) => flatObj(obj)),
    });
  } catch (error: any) {
    console.error(error);
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

const resolveNotification = async (
  req: TRequestBody<{
    id: string;
    resolvedBy: string;
    terminalState: FlagEnum.BLACKLISTED | FlagEnum.WHITELISTED;
    resolution:
      | NewTypeSoftwareNotificationResolutionsEnum
      | BlacklistedTypeSoftwareNotificationResolutionsEnum;
  }>,
  res: Response
) => {
  try {
    const { id, resolvedBy, terminalState, resolution } = req.body;
    console.log("1");

    const data = await resolveNotificationHelper(
      id,
      resolvedBy,
      terminalState,
      resolution
    );
    console.log("2");

    return res.status(200).json({
      status: 200,
      data: data,
    });
  } catch (error: any) {
    console.error("Das", error);
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
  getMinionBySaltId,
  loginUser,
  getUnassignedMinions,
  changePassword,
  getAllScans,
  getScanInfo,
  getLatestScan,
  getAllSoftwares,
  getApplicationListForSaltId,
  getSoftwareNotifications,
  resolveNotification,
};
