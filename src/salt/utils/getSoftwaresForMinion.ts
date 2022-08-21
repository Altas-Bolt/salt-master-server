import { FlagEnum, TablesEnum } from "../../global.enum";
import {
  IMinionTable,
  ISoftwaresTable,
} from "../../bolt/database/db.interface";
import supabase from "../../bolt/database/init";

export const getSoftwaresForMinion = async (minionId: string) => {
  const { data: minions, error: errorInFindingMinion } = await supabase
    .from<IMinionTable>(TablesEnum.MINION)
    .select("id")
    .eq("saltId", minionId.trim());

  if (errorInFindingMinion) {
    return Promise.reject(errorInFindingMinion);
  }

  if (!minions || minions.length < 0) {
    return null;
  }

  const minion = minions[0];

  const { data: softwares, error: errorInFindingSoftwares } = await supabase
    .from<ISoftwaresTable>(TablesEnum.SOFTWARES)
    .select()
    .eq("minion_id", minion.id);

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

  return softwaresMap;
};
