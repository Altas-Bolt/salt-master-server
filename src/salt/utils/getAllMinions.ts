import { IMinionTable } from "../../bolt/database/db.interface";
import supabase from "../../bolt/database/init";
import { OSEnum, TablesEnum } from "../../global.enum";

export const getAllMinions = async (os: OSEnum) => {
  const { data: minions, error } = await supabase
    .from<IMinionTable>(TablesEnum.MINION)
    .select()
    .eq("os", os.trim())
    .not("userId", "is", null);

  if (error || !minions) {
    return Promise.reject(error || "No minions found in the DB");
  }

  return minions;
};
