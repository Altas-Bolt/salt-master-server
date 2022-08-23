import { FlagEnum, TablesEnum } from "../../global.enum";
import { ISoftwaresTable } from "../../bolt/database/db.interface";
import supabase from "../../bolt/database/init";

export const getSoftwaresForMinion = async (minionId: string) => {
  const { data: softwares, error: errorInFindingSoftwares } = await supabase
    .from<ISoftwaresTable>(TablesEnum.SOFTWARES)
    .select()
    .eq("minion_id", minionId.trim());

  if (errorInFindingSoftwares || !softwares) {
    return Promise.reject(errorInFindingSoftwares || "Softwares not found");
  }

  const softwaresMap: Record<string, { id: string; flag: FlagEnum }> = {};

  softwares.forEach((software) => {
    softwaresMap[software.name] = {
      id: software.id,
      flag: software.flag,
    };
  });

  return { id: minionId.trim(), softwares: softwaresMap };
};
