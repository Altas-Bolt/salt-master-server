import { PostgrestResponse } from "@supabase/postgrest-js";
import { Request, Response } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import {
  FlagEnum,
  OSEnum,
  SoftwareNotificationTypesEnum,
  TablesEnum,
} from "../global.enum";
import {
  AddNewScanMinionSoftwareEntryDTO,
  CreateNewSoftwareNotification,
} from "./dto";
import { addNewSoftware } from "./utils/addNewSoftware";
import { bulkInsertInScanMinionSoftwares } from "./utils/bulkInsertInScanMinionSoftwares";
import { createNewScan } from "./utils/createNewScan";
import { getSoftwaresForMinion } from "./utils/getSoftwaresForMinion";
import { parseLinuxScanOp } from "./utils/parseLinuxScan";
import { runCmd } from "./utils/runCommand";
import {
  acceptAllMinionKeys,
  acceptMinionKey,
  getSaltMinionKeys,
  rejectAllMinionKeys,
  rejectMinionKey,
  runSaltConfigManagement,
} from "./utils/saltKeyHelpers";
import { getAllMinions } from "./utils/getAllMinions";
import { TRequestBody } from "../utils.types";
import {
  IMinionTable,
  ISoftwareNotifications,
} from "../bolt/database/db.interface";
import supabaseClient from "../bolt/database/init";
import { updateScan } from "./utils/updateScan";
import { bulkInsertSoftwareNotifications } from "./utils/bulkInsertSoftwareNotifications";
import { uninstall } from "../bolt/utils/saltSoftware";

const scan = async (
  req: TRequestBody<{ os: OSEnum; saltIds?: string[]; ranBy?: string }>,
  res: Response
) => {
  try {
    const reqBodySaltIds = req.body.saltIds;

    const saltIds: string =
      reqBodySaltIds && reqBodySaltIds.length > 0
        ? reqBodySaltIds.join(",")
        : "*";
    const cmd =
      req.body.os.trim() === OSEnum.LINUX
        ? "node /etc/bolt/getApps.js"
        : "./path/to/exe/file";
    const os = req.body.os;

    const output = await runCmd(
      `echo ${
        process.env.PASSWORD || ""
      } | sudo -S salt '${saltIds}' cmd.run '${cmd}'`
    );

    const ranAt = new Date();

    const newScan = await createNewScan({
      os,
      ranBy: req.body.ranBy || "SCHEDULED",
      ranAt,
    });

    const minionsInDb = await getAllMinions(os);
    const minionIdToSoftwareNameMap = parseLinuxScanOp(output.trim());

    const insertValues: AddNewScanMinionSoftwareEntryDTO[] = [];
    const absentMinions: string[] = [];
    const softwareCountInScan = {
      blacklisted: 0,
      whitelisted: 0,
      undecided: 0,
    };
    const createNotifications: CreateNewSoftwareNotification[] = [];

    for (const minion of minionsInDb) {
      const trackedSoftwaresName = minionIdToSoftwareNameMap[minion.saltId];
      if (!trackedSoftwaresName) {
        absentMinions.push(minion.id);
        continue;
      }

      const minionSoftwareMap = await getSoftwaresForMinion(minion.id);

      for (const softwareName of trackedSoftwaresName) {
        let softwareId: string | null = null;
        let flag: FlagEnum = FlagEnum.UNDECIDED;
        let softwareExists = true;

        if (minionSoftwareMap.softwares[softwareName]) {
          softwareId = minionSoftwareMap.softwares[softwareName].id;
          flag = minionSoftwareMap.softwares[softwareName].flag;
        } else {
          const [{ id, flag: newFlag }, ..._] = await addNewSoftware({
            name: softwareName.trim(),
            flag: FlagEnum.UNDECIDED,
            minionId: minionSoftwareMap.id.trim(),
          });

          softwareId = id;
          flag = newFlag;
          softwareExists = false;
        }

        if (flag === FlagEnum.WHITELISTED) {
          softwareCountInScan.whitelisted++;
        } else if (flag === FlagEnum.BLACKLISTED) {
          uninstall(minion.saltId, os, softwareName);
          createNotifications.push({
            software_id: softwareId,
            type: SoftwareNotificationTypesEnum.BLACKLISTED,
            scan_id: newScan.id,
            minion_id: minion.id,
          });
          softwareCountInScan.blacklisted++;
        } else {
          if (softwareExists) {
            const {
              data: existingNotification,
              error: errorInGettingExistingNotification,
            } = await supabaseClient
              .from<ISoftwareNotifications>(TablesEnum.SOFTWARE_NOTIFICATIONS)
              .select()
              .eq("id", softwareId);

            if (errorInGettingExistingNotification) {
              return Promise.reject(
                errorInGettingExistingNotification?.message ||
                  "Error in finding existing notification"
              );
            }

            if (!existingNotification || existingNotification.length === 0) {
              createNotifications.push({
                software_id: softwareId,
                type: SoftwareNotificationTypesEnum.NEW,
                scan_id: newScan.id,
                minion_id: minion.id,
              });
            }
          } else {
            createNotifications.push({
              software_id: softwareId,
              type: SoftwareNotificationTypesEnum.NEW,
              scan_id: newScan.id,
              minion_id: minion.id,
            });
          }
          softwareCountInScan.undecided++;
        }

        insertValues.push({
          minion_id: minionSoftwareMap.id.trim(),
          scan_id: newScan.id,
          software_id: softwareId,
          ran_at: ranAt,
          flag,
        });
      }
    }

    const [result] = await Promise.all([
      bulkInsertInScanMinionSoftwares(insertValues),
      updateScan(newScan.id, {
        blacklisted_softwares_count: softwareCountInScan.blacklisted,
        whitelisted_softwares_count: softwareCountInScan.whitelisted,
        undecided_softwares_count: softwareCountInScan.undecided,
      }),
      bulkInsertSoftwareNotifications(createNotifications),
    ]);

    return res.status(200).json({
      status: 200,
      message: "Scan successfull",
      data: {
        newEntries: result,
        absentMinions,
      },
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

const getSaltMinionKeysController = async (_req: Request, res: Response) => {
  try {
    const resp = await getSaltMinionKeys();

    return res.status(200).json({
      status: 200,
      data: resp,
    });
  } catch (error) {
    console.error("[salt:getSaltMinionKeys]", error);
    return res.status(400).json({
      status: 400,
      message: "Error fetching keys",
      data: null,
    });
  }
};

const acceptMinionKeysController = async (
  req: Request<ParamsDictionary, any, { keys: "all" | string[] }>,
  res: Response
) => {
  try {
    if (req.body.keys === "all") {
      await acceptAllMinionKeys();
    } else {
      const promiseArr: Array<Promise<void>> = req.body.keys.map((key) =>
        acceptMinionKey(key)
      );

      await Promise.all(promiseArr);
    }
    let minions: PostgrestResponse<IMinionTable>;
    if (req.body.keys !== "all") {
      minions = await supabaseClient
        .from<IMinionTable>(TablesEnum.MINION)
        .select()
        .in("saltId", req.body.keys);
    } else {
      minions = await supabaseClient
        .from<IMinionTable>(TablesEnum.MINION)
        .select();
    }

    console.log("minions", minions);
    console.log(
      "minions mapped",

      //@ts-ignore
      minions.data
        .filter((m: IMinionTable) => m.os === OSEnum.LINUX)
        .map((m: IMinionTable) => m.saltId)
    );

    console.log("pwd", process.env.PWD);

    await runSaltConfigManagement(
      //@ts-ignore
      minions.data
        .filter((m: IMinionTable) => m.os === OSEnum.LINUX)
        .map((m: IMinionTable) => m.saltId),
      OSEnum.LINUX
    );
    await runSaltConfigManagement(
      //@ts-ignore
      minions.data
        .filter((m: IMinionTable) => m.os === OSEnum.WINDOWS)
        .map((m: IMinionTable) => m.saltId),
      OSEnum.WINDOWS
    );

    return res.status(200).json({
      status: 200,
      message: "Keys accepted",
    });
  } catch (error) {
    console.error("[salt:acceptMinionKeysController]", error);
    return res.status(400).json({
      status: 400,
      message: "Error accepting keys",
      data: null,
    });
  }
};

const rejectMinionKeysController = async (
  req: Request<ParamsDictionary, any, { keys: "all" | string[] }>,
  res: Response
) => {
  try {
    if (req.body.keys === "all") {
      await rejectAllMinionKeys();
    } else {
      const promiseArr: Array<Promise<void>> = req.body.keys.map((key) =>
        rejectMinionKey(key)
      );

      await Promise.all(promiseArr);
    }

    return res.status(200).json({
      status: 200,
      message: "Keys rejected",
    });
  } catch (error) {
    console.error("[salt:rejectMinionKeysController]", error);
    return res.status(400).json({
      status: 400,
      message: "Error accepting keys",
    });
  }
};

const runCommand = async (req: Request, res: Response) => {
  try {
    const output = await runCmd(
      `echo ${process.env.PASSWORD || ""} | sudo -S salt '${
        req.body.saltIds ? req.body.saltIds.join(",") : "*"
      }' cmd.run '${req.body.cmd}'`
    );

    const result = parseLinuxScanOp(output);

    return res.status(200).json({
      status: 200,
      message: "Scan successfull",
      data: result,
    });
  } catch (error) {
    console.error("[salt:runCommand]", error);
    return res.status(400).json({
      status: 400,
      message: "Error occured on remote execution",
      data: null,
    });
  }
};

export {
  scan,
  getSaltMinionKeysController,
  acceptMinionKeysController,
  rejectMinionKeysController,
  runCommand,
};
