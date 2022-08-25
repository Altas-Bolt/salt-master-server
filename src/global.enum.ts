export enum TablesEnum {
  SCAN = "scan",
  MINION = "minion",
  SOFTWARES = "softwares",
  SCAN_MINION_SOFTWARES = "scan-minion-softwares",
  USER = "user",
  SOFTWARE_NOTIFICATIONS = "software-notifications",
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

export enum SoftwareNotificationTypesEnum {
  "BLACKLISTED" = "blacklisted_software_found",
  "NEW" = "new_software_found",
}

export enum SoftwareNotificationResolutionsEnum {
  "BLACKLISTED" = "blacklisted",
  "WHITELISTED" = "whitelisted",
  "BLACKLISTED_AND_UNINSTALLED" = "blacklisted and uninstalled",
  "BLACKLISTED_AND_NOTIFIED" = "blacklisted and notified",
}
