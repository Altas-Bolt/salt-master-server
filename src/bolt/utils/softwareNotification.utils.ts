import { ISoftwareNotifications } from "bolt/database/db.interface";
import {
  BlacklistedTypeSoftwareNotificationResolutionsEnum,
  FlagEnum,
  NewTypeSoftwareNotificationResolutionsEnum,
  OSEnum,
  SoftwareNotificationTypesEnum,
  TablesEnum,
} from "../../global.enum";
import supabase from "../database/init";
import { logoff, uninstall } from "./saltSoftware";
import { markSoftwareToTerminalState } from "./softwares.utils";

type TSoftwareInfo = {
  id: string;
  name: string;
  minion: {
    os: OSEnum;
    saltId: string;
  };
};

const resolutionForTypeNew = async (
  softwareInfo: TSoftwareInfo,
  terminalState: FlagEnum.BLACKLISTED | FlagEnum.WHITELISTED,
  resolution: NewTypeSoftwareNotificationResolutionsEnum
) => {
  await markSoftwareToTerminalState(softwareInfo.id, terminalState);

  // const softwareId = softwareInfo.id;
  const saltId = softwareInfo.minion.saltId;
  const os = softwareInfo.minion.os;
  const softwareName = softwareInfo.name;

  if (
    resolution ===
    NewTypeSoftwareNotificationResolutionsEnum.BLACKLISTED_AND_UNINSTALLED
  ) {
    await uninstall(saltId, os, softwareName);
  } else if (
    resolution ===
    NewTypeSoftwareNotificationResolutionsEnum.BLACKLISTED_AND_NOTIFIED
  ) {
    // notify
  } else if (
    resolution ===
    NewTypeSoftwareNotificationResolutionsEnum.BLACKLISTED_AND_LOGOFFED
  ) {
    await logoff(saltId, os);
  }
};

const resolutionForTypeBlacklisted = async (
  softwareInfo: TSoftwareInfo,
  resolution: BlacklistedTypeSoftwareNotificationResolutionsEnum
) => {
  // const softwareId = softwareInfo.id;
  const saltId = softwareInfo.minion.saltId;
  const os = softwareInfo.minion.os;
  // const softwareName = softwareInfo.name;

  if (
    resolution === BlacklistedTypeSoftwareNotificationResolutionsEnum.LOGOFFED
  ) {
    await logoff(saltId, os);
  } else if (
    resolution === BlacklistedTypeSoftwareNotificationResolutionsEnum.NOTIFIED
  ) {
    // notify
  }
};

export const resolveNotification = async (
  id: string,
  resolvedBy: string,
  terminalState: FlagEnum.BLACKLISTED | FlagEnum.WHITELISTED,
  resolution:
    | NewTypeSoftwareNotificationResolutionsEnum
    | BlacklistedTypeSoftwareNotificationResolutionsEnum
) => {
  const { data: notifications, error: errorInFindingNotification } =
    await supabase
      .from<ISoftwareNotifications>(TablesEnum.SOFTWARE_NOTIFICATIONS)
      .select(
        "id, resolved, type, software:(id, name), minion:minion_id( id, os, saltId )"
      )
      .eq("id", id.trim());

  if (
    errorInFindingNotification ||
    !notifications ||
    notifications.length === 0
  ) {
    return Promise.reject(
      errorInFindingNotification?.message || "Could not find notification"
    );
  }

  const notification = notifications[0] as any;
  if (notification.resolved) {
    return Promise.reject("Notification already resolved");
  }

  if (notification.type === SoftwareNotificationTypesEnum.NEW) {
    await resolutionForTypeNew(
      {
        id: notification.software.id,
        name: notification.software.name,
        minion: {
          saltId: notification.minion.saltId,
          os: notification.minion.os,
        },
      },
      terminalState,
      resolution as NewTypeSoftwareNotificationResolutionsEnum
    );
  } else if (notification.type === SoftwareNotificationTypesEnum.BLACKLISTED) {
    await resolutionForTypeBlacklisted(
      {
        id: notification.software.id,
        name: notification.software.name,
        minion: {
          saltId: notification.minion.saltId,
          os: notification.minion.os,
        },
      },
      resolution as BlacklistedTypeSoftwareNotificationResolutionsEnum
    );
  }

  const { data, error } = await supabase
    .from<ISoftwareNotifications>(TablesEnum.SOFTWARE_NOTIFICATIONS)
    .update({
      resolved_by: resolvedBy,
      resolved: true,
      resolution_description: resolution,
    })
    .eq("id", id.trim())
    .eq("resolved", false);

  if (error || !data || data.length === 0) {
    return Promise.reject("Failed to update notification");
  }

  return data[0];
};
