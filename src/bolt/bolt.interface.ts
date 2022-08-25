import { FlagEnum, OSEnum, UserRolesKeys } from "../global.enum";

export interface IScanInfo {
  id: string;
  flag: FlagEnum;
  minion_id: string;
  software: {
    id: string;
    name: string;
    flag: FlagEnum;
  };
  minion: {
    id: string;
    saltId: string;
    os: OSEnum;
    user: {
      id: string;
      email: string;
      role: UserRolesKeys;
    };
  };
}

export interface ISoftwareCount {
  total: number;
  blacklisted: number;
  whitelisted: number;
  undecided: number;
}

export interface IMinionInfoForScan {
  user: {
    email: string | undefined;
  };
  minion: {
    id: string;
    saltId: string;
  };
  softwareCount: ISoftwareCount;
  softwares: {
    id: string;
    name: string;
    flag: FlagEnum;
  }[];
  os: OSEnum;
}
