import { FlagEnum } from "../../global.enum";
import { IMinionInfoForScan, IScanInfo } from "../bolt.interface";

export const scanInfoGroupByUser = (scanInfo: IScanInfo[]) => {
  const minionIdToSoftwares: Record<string, IMinionInfoForScan> = {};

  scanInfo.forEach((scanEntry) => {
    if (minionIdToSoftwares[scanEntry.minion_id]) {
      minionIdToSoftwares[scanEntry.minion_id].softwareCount.total++;

      if (scanEntry.software.flag === FlagEnum.BLACKLISTED) {
        minionIdToSoftwares[scanEntry.minion_id].softwareCount.blacklisted++;
      } else if (scanEntry.software.flag === FlagEnum.WHITELISTED) {
        minionIdToSoftwares[scanEntry.minion_id].softwareCount.whitelisted++;
      } else if (scanEntry.software.flag === FlagEnum.UNDECIDED) {
        minionIdToSoftwares[scanEntry.minion_id].softwareCount.undecided++;
      }

      minionIdToSoftwares[scanEntry.minion_id].softwares.push(
        scanEntry.software
      );
    } else {
      const softwareCount: IMinionInfoForScan["softwareCount"] = {
        total: 1,
        blacklisted: 0,
        whitelisted: 0,
        undecided: 0,
      };

      if (scanEntry.software.flag === FlagEnum.BLACKLISTED) {
        softwareCount.blacklisted++;
      } else if (scanEntry.software.flag === FlagEnum.WHITELISTED) {
        softwareCount.whitelisted++;
      } else if (scanEntry.software.flag === FlagEnum.UNDECIDED) {
        softwareCount.undecided++;
      }

      const softwares: IMinionInfoForScan["softwares"] = [scanEntry.software];

      minionIdToSoftwares[scanEntry.minion_id] = {
        user: {
          email: scanEntry.minion.user.email || undefined,
        },
        minion: {
          id: scanEntry.minion_id,
          saltId: scanEntry.minion.saltId,
        },
        os: scanEntry.minion.os,
        softwareCount,
        softwares,
      };
    }
  });

  return Object.keys(minionIdToSoftwares).map((minionId) => ({
    minion_id: minionId,
    ...minionIdToSoftwares[minionId],
  }));
};
