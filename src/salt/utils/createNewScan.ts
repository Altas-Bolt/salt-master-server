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

  if (error || !newScan) {
    return Promise.reject(error || "Failed to create new scan");
  }

  return newScan[0];
};
