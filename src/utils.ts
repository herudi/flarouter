import { TObject } from "./types";

function needPatch(data: TObject | TObject[], keys: number[], value: string) {
  if (keys.length === 0) {
    return value;
  }
  let key = keys.shift() as number;
  if (!key) {
    data = data || [];
    if (Array.isArray(data)) {
      key = data.length;
    }
  }
  const index = +key;
  if (!isNaN(index)) {
    data = data || [];
    key = index;
  }
  data = (data || {}) as TObject;
  const val = needPatch(data[key] as TObject, keys, value);
  data[key] = val;
  return data;
}

export function myParse(arr: any[]) {
  const obj = arr.reduce((red: any, [field, value]: any) => {
    if (red.hasOwnProperty(field)) {
      if (Array.isArray(red[field])) {
        red[field] = [...red[field], value];
      } else {
        red[field] = [red[field], value];
      }
    } else {
      let [_, prefix, keys] = field.match(/^([^\[]+)((?:\[[^\]]*\])*)/);
      if (keys) {
        keys = Array.from(
          keys.matchAll(/\[([^\]]*)\]/g),
          (m: Array<number>) => m[1]
        );
        value = needPatch(red[prefix], keys, value);
      }
      red[prefix] = value;
    }
    return red;
  }, {});
  return obj;
}

export function parseQuery(query: FormData | string) {
  if (query === null) return {};
  if (typeof query === "string") {
    const data = new URLSearchParams("?" + query);
    return myParse(Array.from(data.entries()));
  }
  return myParse(Array.from(query.entries()));
}

export function findRoute(method: string, pathname: string, route: TObject) {
  let fns = [],
    params: TObject = {},
    i = 0,
    obj: TObject,
    matches: any[],
    j = 0;
  let arr = route[method] || [];
  if (route["ANY"]) arr = arr.concat(route["ANY"]);
  const len = arr.length;
  while (i < len) {
    obj = arr[i];
    if (obj.rgx.test(pathname)) {
      fns = obj.fns;
      if (obj.arr) {
        matches = obj.rgx.exec(pathname);
        matches.shift();
        while (j < obj.arr.length) {
          const str = matches[j];
          params[obj.arr[j]] = str ? unescape(str) : null;
          j++;
        }
        if (params["wild"]) {
          params["wild"] = params["wild"].split("/");
        }
      }
      break;
    }
    i++;
  }
  return { params, fns };
}
export function createRegex(str: string) {
  let noop = "",
    ptt = "/([^/]+?)",
    last = str[str.length - 1];
  if (last === "*") noop = "(.*)";
  else if (last === "?") ptt = "(?:/([^/]+?))?";
  const m = str.match(/\:([a-z_-]+)/g);
  let arr = m ? m.map((e) => e.substring(1)) : [];
  if (noop) arr.push("wild");
  const rgx = new RegExp(`^${str.replace(/\/:[a-z_-]+/g, ptt)}/${noop}?$`, "i");
  return { arr, rgx };
}
