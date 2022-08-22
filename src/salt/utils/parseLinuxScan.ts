const parseLinuxScanOp = (str: string) => {
  const lines = str.split("\n");
  const result: Record<string, string[]> = {};
  let currentMinionId: string | null = null;
  let error: string | null = null;

  for (const line of lines) {
    if (/^[\w\d]+/g.test(line)) {
      error = null;
      currentMinionId = line.trim().slice(0, -1);
      result[currentMinionId] = [];
    } else if (error) {
      continue;
    } else {
      if (/^[\w\d]+/g.test(line)) {
        error = null;
        currentMinionId = line.trim().slice(0, -1);
        result[currentMinionId] = [];
      } else if (/^[\s]+/g.test(line) && currentMinionId) {
        if (line.trim().startsWith("Minion did not return. [No response]")) {
          error = currentMinionId;
          delete result[currentMinionId];
        } else {
          result[currentMinionId]?.push(line.trim());
        }
      }
    }
  }

  return result;
};

export { parseLinuxScanOp };
