import { FlagEnum, MinionIdentityEnum } from "../global.enum";

export type ChangePasswordDTO = {
  oldPassword: string;
  newPassword: string;
};

export type TGetSoftwaresQuery = {
  minions: string[];
  minionIdentity?: MinionIdentityEnum;
  flag: FlagEnum | "all";
};
