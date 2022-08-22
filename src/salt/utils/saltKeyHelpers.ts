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

const acceptMinionKey = async (minionId: string) => {
  try {
    await runCmd(
      `echo ${process.env.PASSWORD} | sudo -S salt-key -a ${minionId}`
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
    await runCmd(`echo ${process.env.PASSWORD} | sudo -S salt-key -A`);

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
      `echo ${process.env.PASSWORD} | sudo -S salt-key -r ${minionId}`
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
  getSaltMinionKeys,
  acceptMinionKey,
  acceptAllMinionKeys,
  rejectMinionKey,
  rejectAllMinionKeys,
};
