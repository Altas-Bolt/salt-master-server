import { TablesEnum } from "../../global.enum";
import supabase from "../../bolt/database/init";
import { CreateNewSoftwareNotification } from "../dto";
import { ISoftwareNotifications } from "../../bolt/database/db.interface";

export const bulkInsertSoftwareNotifications = async (
  values: CreateNewSoftwareNotification[]
): Promise<string[]> => {
  const { data, error } = await supabase
    .from<ISoftwareNotifications>(TablesEnum.SOFTWARE_NOTIFICATIONS)
    .insert(values);

  if (error) {
    return Promise.reject(error);
  }

  if (data) {
    return data.map((entry) => entry.id);
  } else {
    return [];
  }
};
