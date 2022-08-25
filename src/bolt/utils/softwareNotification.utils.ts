import { ISoftwareNotifications } from "bolt/database/db.interface";
import {
  FlagEnum,
  SoftwareNotificationResolutionsEnum,
  TablesEnum,
} from "global.enum";
import supabase from "../database/init";
import { markSoftwareToTerminalState } from "./softwares.utils";

export const resolveNotification = async (
  id: string,
  resolvedBy: string,
  terminalState: FlagEnum.BLACKLISTED | FlagEnum.WHITELISTED,
  resolution: SoftwareNotificationResolutionsEnum
) => {
  const { data: notifications, error: errorInFindingNotification } =
    await supabase
      .from<ISoftwareNotifications>(TablesEnum.SOFTWARE_NOTIFICATIONS)
      .select()
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

  const notification = notifications[0];
  if (notification.resolved) {
    return Promise.reject("Notification already resolved");
  }

  await markSoftwareToTerminalState(notification.software_id, terminalState);

  if (
    resolution ===
    SoftwareNotificationResolutionsEnum.BLACKLISTED_AND_UNINSTALLED
  ) {
    // uninstall
  } else if (
    resolution === SoftwareNotificationResolutionsEnum.BLACKLISTED_AND_NOTIFIED
  ) {
    // notify
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
