import { PostgrestResponse } from "@supabase/postgrest-js";
import { Request, Response } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import { FlagEnum, OSEnum, TablesEnum } from "../global.enum";
import { AddNewScanMinionSoftwareEntryDTO } from "./dto";
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
import { IMinionTable } from "bolt/database/db.interface";
import supabaseClient from "../bolt/database/init";

const linuxScan = async (
  req: TRequestBody<{ saltIds?: string[]; ranBy?: string }>,
  res: Response
) => {
  try {
    const reqBodySaltIds = req.body.saltIds;
    const saltIds: string =
      reqBodySaltIds && reqBodySaltIds.length > 0
        ? reqBodySaltIds.join(",")
        : "*";
    const cmd = "node /etc/bolt/getApps.js";

    const output = await runCmd(
      `echo ${
        process.env.PASSWORD || ""
      } | sudo -S salt '${saltIds}' cmd.run '${cmd}'`
    );

    const ranAt = new Date();

    const newScan = await createNewScan({
      os: OSEnum.LINUX,
      ranBy: req.body.ranBy || "SCHEDULED",
      ranAt,
    });

    const minionsInDb = await getAllMinions(OSEnum.LINUX);
    const minionIdToSoftwareNameMap = parseLinuxScanOp(output.trim());

    const insertValues: AddNewScanMinionSoftwareEntryDTO[] = [];
    const absentMinions: string[] = [];

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

    const result = await bulkInsertInScanMinionSoftwares(insertValues);

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
  linuxScan,
  getSaltMinionKeysController,
  acceptMinionKeysController,
  rejectMinionKeysController,
  runCommand,
};
