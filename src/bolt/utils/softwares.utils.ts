import { ISoftwaresTable } from "../database/db.interface";
import { FlagEnum, TablesEnum } from "../../global.enum";
import supabase from "../database/init";

export const markSoftwareToTerminalState = async (
  softwareId: string,
  terminalState: FlagEnum.BLACKLISTED | FlagEnum.WHITELISTED
) => {
  const { data, error } = await supabase
    .from<ISoftwaresTable>(TablesEnum.SOFTWARES)
    .update({ flag: terminalState })
    .eq("id", softwareId.trim());

  console.log("f", error, data);

  if (error || !data || data.length === 0) {
    return Promise.reject(error || "Failed to update software flag");
  }

  return data[0];
};
