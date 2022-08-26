import { OSEnum } from "../../global.enum";
import { runCmd } from "../../salt/utils/runCommand";

export const uninstall = async (
  saltId: string,
  os: OSEnum,
  softwareName: string
) => {
  const linuxCmd = `apt purge ${softwareName} -Y && apt clean -Y`;
  const windowsCmd = ``; // TODO

  const cmd = os === OSEnum.LINUX ? linuxCmd : windowsCmd;

  await runCmd(
    `echo ${
      process.env.PASSWORD || ""
    } | sudo -S salt '${saltId}' cmd.run '${cmd}'`
  );
};

export const logoff = async (saltId: string, os: OSEnum) => {
  const linuxCmd = `gnome-session-quit —-no-prompt`;
  const windowsCmd = ``; // TODO

  const cmd = os === OSEnum.LINUX ? linuxCmd : windowsCmd;

  await runCmd(
    `echo ${
      process.env.PASSWORD || ""
    } | sudo -S salt '${saltId}' cmd.run '${cmd}'`
  );
};
