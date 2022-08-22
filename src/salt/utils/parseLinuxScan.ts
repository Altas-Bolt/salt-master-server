const parseLinuxScanOp = (str: string) => {
  const lines = str.split("\n");
  const result: Record<string, string[]> = {};
  let currentMinionId: string | null = null;

  for (const line of lines) {
    if (/^[\w\d]+/g.test(line)) {
      currentMinionId = line.trim().slice(0, -1);
      result[currentMinionId] = [];
    }

    if (/^[\s]+/g.test(line) && currentMinionId) {
      result[currentMinionId].push(line.trim());
    }
  }

  return result;
};

export { parseLinuxScanOp };
