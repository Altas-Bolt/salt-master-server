import {
  FlagEnum,
  OSEnum,
  SoftwareNotificationTypesEnum,
} from "../global.enum";

export type CreateNewScanDTO = {
  os: OSEnum;
  ranBy: string;
  ranAt: Date;
};

export type AddNewScanMinionSoftwareEntryDTO = {
  scan_id: string;
  minion_id: string;
  software_id: string;
  ran_at: Date;
  flag: FlagEnum;
};

export type AddNewSoftwareDTO = {
  name: string;
  flag: FlagEnum;
  minionId: string;
};

export type CreateNewSoftwareNotification = {
  type: SoftwareNotificationTypesEnum;
  scanId: string;
  minionId: string;
  softwareId: string;
};
