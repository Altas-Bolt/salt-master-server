import { CreateNewScanDTO } from "../dto";
import supabase from "../../bolt/database/init";
import { TablesEnum } from "../../global.enum";
import { IScanTable } from "src/bolt/database/db.interface";

export const createNewScan = async (
  data: CreateNewScanDTO
): Promise<IScanTable> => {
  const { data: newScan, error } = await supabase
    .from<IScanTable>(TablesEnum.SCAN)
    .insert([
      {
        ran_by: data.ranBy || "SCHEDULED",
        metadata: { os: data.os },
        ran_at: data.ranAt,
      },
    ]);

  if (error) {
    return Promise.reject(error);
  }

  return newScan[0];
};
