import { OSEnum } from "../../global.enum";
import { runCmd } from "./runCommand";

export interface ISaltMinionKeysOutput {
  acceptedKeys: string[];
  rejectedKeys: string[];
  unacceptedKeys: string[];
  deniedKeys: string[];
}

const getSaltMinionKeys = async (): Promise<ISaltMinionKeysOutput> => {
  try {
    const response = await runCmd(
      `echo ${process.env.PASSWORD || ""} | sudo -S salt-key`
    );
    console.log(response);

    const lines = response.split("\n");

    const keys: ISaltMinionKeysOutput = {
      acceptedKeys: [],
      rejectedKeys: [],
      unacceptedKeys: [],
      deniedKeys: [],
    };

    let flag = "";

    for (const line of lines) {
      // if the line is a key, return the key
      if (line === "") continue;

      if (
        line === "Accepted Keys:" ||
        line === "Rejected Keys:" ||
        line === "Unaccepted Keys:" ||
        line === "Denied Keys:"
      ) {
        flag = line;
      } else if (flag === "Accepted Keys:") {
        keys.acceptedKeys.push(line);
      } else if (flag === "Rejected Keys:") {
        keys.rejectedKeys.push(line);
      } else if (flag === "Unaccepted Keys:") {
        keys.unacceptedKeys.push(line);
      } else if (flag === "Denied Keys:") {
        keys.deniedKeys.push(line);
      }
    }

    return keys;
  } catch (err: any) {
    console.log(`[getSaltKeys] message: ${err.message}, stack: ${err.stack}`);
    return Promise.reject(err.message);
  }
};

const runSaltConfigManagement = async (minionIds: string[], os: OSEnum) => {
  if (minionIds.length === 0) return;

  try {
    const minionListId = minionIds.join(",");
    console.log(
      "cmd run",
      `echo ${process.env.PASSWORD} | sudo -S salt -L "${minionListId}" state.apply linux-state`
    );
    console.log(
      "cmd run2",
      `echo ${process.env.PASSWORD} | sudo -S salt -L "${minionListId}" state.apply install-app`
    );

    if (os === OSEnum.LINUX) {
      // const output1 = await runCmd(
      //   `echo ${process.env.PASSWORD} | sudo -S salt -L "${minionListId}" state.apply linux-state`
      // );
      // console.log("output", output1);
      const output1 = await runCmd(
        `echo ${process.env.PASSWORD} | sudo -S salt -L "${minionListId}" state.apply copy-files-linux`
      );
      console.log("output", output1);

      const output2 = await runCmd(
        `echo ${process.env.PASSWORD} | sudo -S salt -L "${minionListId}" state.apply install-app`
      );
      console.log("output2", output2);
    } else {
      await runCmd(
        `echo ${process.env.PASSWORD} | sudo -S salt -L "${minionListId}" state.apply copy-files-win`
      );
      await runCmd(
        `echo ${process.env.PASSWORD} | sudo -S salt -L "${minionListId}" state.apply install-app-windows`
      );
    }

    return;
  } catch (err: any) {
    console.log(
      `[runSaltConfigManagement] message: ${err.message}, stack: ${err.stack}`
    );
    return Promise.reject(err.message);
  }
};

const acceptMinionKey = async (minionId: string) => {
  try {
    await runCmd(
      `echo ${process.env.PASSWORD} | echo Y | sudo -S salt-key -a ${minionId}`
    );
    return;
  } catch (err: any) {
    console.log(
      `[acceptMinionKey] message: ${err.message}, stack: ${err.stack}`
    );
    return Promise.reject(err.message);
  }
};

const acceptAllMinionKeys = async () => {
  try {
    await runCmd(`echo ${process.env.PASSWORD} | echo Y | sudo -S salt-key -A`);

    return;
  } catch (err: any) {
    console.log(
      `[acceptAllMinionKey] message: ${err.message}, stack: ${err.stack}`
    );
    return Promise.reject(err.message);
  }
};

const rejectMinionKey = async (minionId: string) => {
  try {
    await runCmd(
      `echo ${process.env.PASSWORD} | echo Y  | sudo -S salt-key -r ${minionId}`
    );

    return;
  } catch (err: any) {
    console.log(
      `[rejectMinionKey] message: ${err.message}, stack: ${err.stack}`
    );
    return Promise.reject(err.message);
  }
};

const rejectAllMinionKeys = async () => {
  try {
    await runCmd(`echo ${process.env.PASSWORD} | sudo -S salt-key -R`);
    return;
  } catch (err: any) {
    console.log(
      `[rejectAllMinionKeys] message: ${err.message}, stack: ${err.stack}`
    );
    return Promise.reject(err.message);
  }
};

export {
  runSaltConfigManagement,
  getSaltMinionKeys,
  acceptMinionKey,
  acceptAllMinionKeys,
  rejectMinionKey,
  rejectAllMinionKeys,
};
