import { TablesEnum } from "../../global.enum";
import supabase from "../../bolt/database/init";
import { AddNewSoftwareDTO } from "../dto";
import { ISoftwaresTable } from "src/bolt/database/db.interface";

export const addNewSoftware = async (data: AddNewSoftwareDTO) => {
  const { data: newSoftware, error } = await supabase
    .from<ISoftwaresTable>(TablesEnum.SOFTWARES)
    .insert([
      {
        name: data.name.trim(),
        minion_id: data.minionId.trim(),
        flag: data.flag,
        metadata: {},
      },
    ]);

  if (error || !newSoftware) {
    return Promise.reject(error || "Failed to add new software");
  }

  return newSoftware;
};
