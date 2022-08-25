export enum TablesEnum {
  SCAN = "scan",
  MINION = "minion",
  SOFTWARES = "softwares",
  SCAN_MINION_SOFTWARES = "scan-minion-softwares",
  USER = "user",
}

export enum OSEnum {
  LINUX = "linux",
  WINDOWS = "windows",
}

export enum FlagEnum {
  BLACKLISTED = "blacklisted",
  WHITELISTED = "whitelisted",
  UNDECIDED = "undecided",
}

export enum UserRoles {
  USER = "USER",
  ADMIN = "ADMIN",
}

export type UserRolesKeys = keyof typeof UserRoles;

export enum MinionIdentityEnum {
  ID = "id",
  SALT_ID = "salt_id",
}
