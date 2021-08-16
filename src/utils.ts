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
  if (!query) return {};
  if (typeof query === "string") {
    const data = new URLSearchParams(query);
    return myParse(Array.from(data.entries()));
  }
  return myParse(Array.from(query.entries()));
}

export function findRoute(method: string, pathname: string, route: TObject) {
  pathname = unescape(pathname);
  let fns = [],
    params: TObject = {},
    i = 0,
    obj: TObject,
    match: any;
  let arr = route[method] || [];
  if (route["ANY"]) arr = arr.concat(route["ANY"]);
  const len = arr.length;
  while (i < len) {
    obj = arr[i];
    if (obj.rgx.test(pathname)) {
      match = obj.rgx.exec(pathname);
      fns = obj.fns;
      if (match.groups) {
        params = match.groups;
      }
      if (obj.wild && typeof match[1] === "string") {
        params["wild"] = match[1].split("/");
        params["wild"].shift();
      }
      break;
    }
    i++;
  }
  return { params, fns };
}
export function createRegex(str: string) {
  let wild = false;
  let strict = /\*|\./;
  str = str
    .replace(/\/$/, "")
    .replace(/:(\w+)(\?)?(\.)?/g, "$2(?<$1>[^/]+)$2$3");
  if (strict.test(str)) {
    str = str
      .replace(/(\/?)\*/g, (_, p) => {
        wild = true;
        return `(${p}.*)?`;
      })
      .replace(/\.(?=[\w(])/, "\\.");
  }
  const rgx = new RegExp(`^${str}/*$`);
  return { rgx, wild };
}
