import supabase from "../../bolt/database/init";
import { TablesEnum } from "../../global.enum";
import { IScanTable } from "../../bolt/database/db.interface";

export const updateScan = async (
  id: string,
  updateData: Partial<IScanTable>
): Promise<IScanTable> => {
  const { data, error } = await supabase
    .from<IScanTable>(TablesEnum.SCAN)
    .update(updateData)
    .eq("id", id.trim());

  if (error || !data) {
    return Promise.reject(error || "Failed to create new scan");
  }

  return data[0];
};
