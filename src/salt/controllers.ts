import { Request, Response } from "express";
import { parseLinuxScanOp } from "./utils/parseLinuxScan";
import { runCmd } from "./utils/runCommand";
import { createNewScan } from "./utils/createNewScan";
import { FlagEnum, OSEnum } from "../global.enum";
import { getSoftwaresForMinion } from "./utils/getSoftwaresForMinion";
import { AddNewScanMinionSoftwareEntryDTO } from "./dto";
import { addNewSoftware } from "./utils/addNewSoftware";
import { bulkInsertInScanMinionSoftwares } from "./utils/bulkInsertInScanMinionSoftwares";

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

    const minionIdToSoftwareNameMap = parseLinuxScanOp(output.trim());

    const insertValues: AddNewScanMinionSoftwareEntryDTO[] = [];

    for (const saltId in minionIdToSoftwareNameMap) {
      const minionSoftwareMap = await getSoftwaresForMinion(saltId.trim());
      if (!minionSoftwareMap) {
        console.log("Minion not found in DB");
        continue;
      }

      for (const softwareName of minionIdToSoftwareNameMap[saltId]) {
        let softwareId: string | null = null;
        if (minionSoftwareMap.softwares[softwareName]) {
          softwareId = minionSoftwareMap.softwares[softwareName].id;
        } else {
          const [{ id }, ..._] = await addNewSoftware({
            name: softwareName.trim(),
            flag: FlagEnum.UNDECIDED,
            minionId: minionSoftwareMap.id.trim(),
          });

          softwareId = id;
        }

        insertValues.push({
          minion_id: minionSoftwareMap.id.trim(),
          scan_id: newScan.id,
          software_id: softwareId,
          ran_at: ranAt,
        });
      }
    }

    const result = await bulkInsertInScanMinionSoftwares(insertValues);

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
