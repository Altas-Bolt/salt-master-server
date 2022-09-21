import { FlagEnum } from "../../global.enum";
import { IScanInfo, ISoftwareCount } from "../bolt.interface";

export const getTotalSoftwareCount = (scanInfo: IScanInfo[]) => {
  const softwareCount: ISoftwareCount = {
    total: 0,
    blacklisted: 0,
    whitelisted: 0,
    undecided: 0,
  };

  scanInfo.forEach((scanEntry) => {
    softwareCount.total++;

    if (scanEntry.software.flag === FlagEnum.BLACKLISTED) {
      softwareCount.blacklisted++;
    } else if (scanEntry.software.flag === FlagEnum.WHITELISTED) {
      softwareCount.whitelisted++;
    } else if (scanEntry.software.flag === FlagEnum.UNDECIDED) {
      softwareCount.undecided++;
    }
  });

  return softwareCount;
};
