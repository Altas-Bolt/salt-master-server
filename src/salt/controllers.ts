import { Request, Response } from "express";
import { parseLinuxScanOp } from "./utils/parseLinuxScan";
import { runCmd } from "./utils/runCommand";
import { createNewScan } from "./utils/createNewScan";
import { FlagEnum, OSEnum } from "../global.enum";
import { getSoftwaresForMinion } from "./utils/getSoftwaresForMinion";
import { AddNewScanMinionSoftwareEntryDTO } from "./dto";
import { addNewSoftware } from "./utils/addNewSoftware";
import { bulkInsertInScanMinionSoftwares } from "./utils/bulkInsertInScanMinionSoftwares";
import { getAllMinions } from "./utils/getAllMinions";

const linuxScan = async (req: Request, res: Response) => {
  try {
    const output = await runCmd(
      `echo ${
        process.env.PASSWORD || ""
      } | sudo -S salt 'red-hat-minion' cmd.run 'ls /usr/share'`
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

export { linuxScan, runCommand };
