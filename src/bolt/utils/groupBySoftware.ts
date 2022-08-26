import { IScanInfo } from "bolt/bolt.interface";

export const groupBySoftware = (data: IScanInfo[]) => {
  const result: Record<string, any> = {};

  data.forEach((item) => {
    const softwareName = item.software.name.trim();

    if (result[softwareName]) {
      result[softwareName].minions.push({
        minion_id: item.minion.id,
        minion_ip: item.minion.ip,
        minion_os: item.minion.os,
        minion_saltId: item.minion.saltId,
        user_id: item.minion.user.id,
        user_email: item.minion.user.email,
      });
    } else {
      result[softwareName] = {
        software_name: softwareName,
        software_id: item.id,
        software_flag: item.flag,
        minions: [
          {
            minion_id: item.minion.id,
            minion_ip: item.minion.ip,
            minion_os: item.minion.os,
            minion_saltId: item.minion.saltId,
            user_id: item.minion.user.id,
            user_email: item.minion.user.email,
          },
        ],
      };
    }
  });

  return result;
};
