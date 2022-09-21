import { OSEnum } from "../../global.enum";
import { runCmd } from "../../salt/utils/runCommand";

export const uninstall = async (
  saltId: string,
  os: OSEnum,
  softwareName: string
) => {
  const linuxCmd = `apt purge ${softwareName.trim()} -y && apt clean -y`;
  const windowsCmd = `wmic product where name='${softwareName.trim()}' uninstall`;

  const cmd = os === OSEnum.LINUX ? linuxCmd : windowsCmd;

  await runCmd(
    `echo ${
      process.env.PASSWORD || ""
    } | sudo -S salt '${saltId}' cmd.run '${cmd}' -t 60`
  );
};

export const logoff = async (saltId: string, os: OSEnum) => {
  const linuxCmd = `poweroff`;
  const windowsCmd = `shutdown -f`;

  const cmd = os === OSEnum.LINUX ? linuxCmd : windowsCmd;

  await runCmd(
    `echo ${
      process.env.PASSWORD || ""
    } | sudo -S salt '${saltId}' cmd.run '${cmd}' -t 60`
  );
};
