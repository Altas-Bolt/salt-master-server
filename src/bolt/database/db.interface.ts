import {
  FlagEnum,
  OSEnum,
  SoftwareNotificationTypesEnum,
  UserRolesKeys,
} from "../../global.enum";

export interface IUserTable {
  id: string;
  email: string;
  password: string;
  accessToken?: string;
  role: UserRolesKeys;
  minionId?: string;
}

export interface IScanTable {
  id: string;
  created_at: Date;
  ran_at: Date;
  ran_by: string;
  metadata: Record<string, any>;
  blacklisted_softwares_count: number;
  whitelisted_softwares_count: number;
  undecided_softwares_count: number;
}

export interface IMinionTable {
  id: string;
  os: OSEnum;
  ip: string;
  userId: string | null;
  createdBy: string;
  saltId: string;
}

export interface ISoftwaresTable {
  id: string;
  created_at: Date;
  name: string;
  flag: FlagEnum;
  minion_id: string;
  metadata: Record<string, any>;
}

export interface IScanMinionSoftwaresTable {
  id: string;
  created_at: Date;
  scan_id: string;
  minion_id: string;
  software_id: string;
  ran_at: Date;
  flag: FlagEnum;
}

export interface ISoftwareNotifications {
  id: string;
  created_at: Date;
  type: SoftwareNotificationTypesEnum;
  scan_id: string;
  minion_id: string;
  resolved_by: string;
  resolved: boolean;
  resolution_description: string;
  software_id: string;
}
