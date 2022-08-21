import { TablesEnum } from "../../global.enum";
import supabase from "../../bolt/database/init";
import { AddNewScanMinionSoftwareEntryDTO } from "../dto";
import { IScanMinionSoftwaresTable } from "../../bolt/database/db.interface";

export const bulkInsertInScanMinionSoftwares = async (
  values: AddNewScanMinionSoftwareEntryDTO[]
): Promise<string[]> => {
  const { data, error } = await supabase
    .from<IScanMinionSoftwaresTable>(TablesEnum.SCAN_MINION_SOFTWARES)
    .insert(values);

  if (error) {
    return Promise.reject(error);
  }

  return data.map((entry) => entry.id);
};
