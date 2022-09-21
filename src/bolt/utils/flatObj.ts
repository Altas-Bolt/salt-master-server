const isArray = (obj: object): obj is any[] => Array.isArray(obj);

export const flatObj = (obj: Record<string, any>, prefix?: string) => {
  let flattedObj: Record<string, any> = {};
  Object.keys(obj).forEach((key) => {
    if (typeof obj[key] === "object" && obj[key]) {
      if (isArray(obj[key])) {
        console.log(key, obj[key]);
        flattedObj = {
          ...flattedObj,
          [prefix ? `${prefix}_${key}` : key]: obj[key].map((val: any) =>
            flatObj(val)
          ),
        };
      } else {
        flattedObj = { ...flattedObj, ...flatObj(obj[key], key) };
      }
    } else {
      flattedObj = {
        ...flattedObj,
        [prefix ? `${prefix}_${key}` : key]: obj[key],
      };
    }
  });

  return flattedObj;
};
