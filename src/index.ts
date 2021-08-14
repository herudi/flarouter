import {
  EHandler,
  FetchEvent,
  HandleEvent,
  Handler,
  NextResponse,
  TObject,
  Options,
  TBody,
} from "./types";
import { createRegex, findRoute, parseQuery } from "./utils";
import { parseBody } from "./body";

type Router = Record<string, Handler | Handler[] | string>;

type Area = {
  prefix?: string;
  wares?: Handler | Handler[];
  router: Router | Router[];
};

const toArray = (val: any) => (Array.isArray(val) ? val : [val]);

function router(router: Router): HandleEvent;
function router(...routers: Array<Router>): HandleEvent;
function router(
  options: Options | Router,
  ...routers: Array<Router>
): HandleEvent {
  let opts = options,
    args = routers;
  if (!opts) throw TypeError("First argument required");
  if (typeof opts !== "object") throw TypeError("First argument must object");
  let j = 0,
    route: TObject = {},
    arg: any,
    wares: any[] = [];
  let onError: EHandler = (err) =>
    new Response(err.message || "Something went wrong", {
      status: err.status || 500,
    });
  let on404: Handler = (evt) =>
    new Response(`Route ${new URL(evt.request.url).pathname} not found`, {
      status: 404,
    });
  if (opts.onError || opts.wares || opts.on404) {
    if (opts.onError) {
      onError = (err, evt, next) => {
        let status = err.status || err.statusCode || err.code || 500;
        if (typeof status !== "number") status = 500;
        evt.response.status = status;
        let ret: any;
        try {
          ret = (opts.onError as EHandler)(err, evt, next);
        } catch (error) {
          return new Response(error.message || "Something went wrong", {
            status,
          });
        }
        if (typeof ret.then === "function") {
          return handlePromise(ret, evt, next);
        }
        return evt.response.send(ret);
      };
    }
    if (opts.on404) {
      on404 = (evt, next) => {
        evt.response.status = 404;
        return (opts.on404 as Handler)(evt, next);
      };
    }
    if (opts.wares) {
      wares = toArray(opts.wares);
    }
  } else {
    args = args.concat([opts as Router]);
  }
  const len = args.length;
  while (j < len) {
    arg = args[j];
    let prefix = arg["__prefix"] || "";
    let _wares = arg["__wares"] || [];
    if (prefix === "/") prefix = "";
    for (const k in arg) {
      if (k !== "__prefix" && k !== "__wares") {
        const fn = arg[k];
        const idx = k.indexOf("/");
        let path = k.substring(idx);
        if (prefix !== "" && path === "/") path = "";
        const { arr, rgx } = createRegex(prefix + path);
        const method = k.substring(0, idx);
        const fns = _wares.concat(toArray(fn));
        route[method] = route[method] || [];
        route[method].push({ arr, rgx, fns });
      }
    }
    j++;
  }
  return (evt) => {
    let i = 0;
    const request = evt.request;
    const url = new URL(request.url);
    const pathname = url.pathname;
    const method = request.method;
    let { params, fns } = findRoute(method, pathname, route);
    evt.locals = {};
    evt.params = params;
    evt.parsedUrl = url;
    evt.query = parseQuery(url.search.substring(1));
    evt.response = {
      status: 200,
      headers: new Headers(),
      send(body) {
        return send(body, {
          status: this.status,
          headers: this.headers,
        });
      },
    };
    fns = wares.concat(fns, [on404]);
    const next: NextResponse = (err = void 0) => {
      if (err) return onError(err, evt, next);
      let ret;
      try {
        ret = fns[i++](evt, next);
      } catch (e) {
        return next(e);
      }
      if (typeof ret.then === "function") {
        return handlePromise(ret, evt, next);
      }
      return evt.response.send(ret);
    };
    return parseBody(parseQuery, evt, next);
  };
}

const res = (a: TBody, b: ResponseInit) => new Response(a, b);
const isJson = (body: BodyInit) =>
  !(
    body instanceof Uint8Array ||
    body instanceof ReadableStream ||
    body instanceof FormData ||
    body instanceof Blob
  );
function send(body: TObject | TBody, opts: ResponseInit) {
  if (typeof body === "object") {
    if (body instanceof Response) {
      return body;
    }
    if (isJson(body as BodyInit)) {
      body = JSON.stringify(body);
      (opts.headers as Headers).set(
        "Content-Type",
        "application/json; charset=utf-8"
      );
    }
  }
  return res(body as TBody, opts);
}
async function handlePromise(
  body: Promise<BodyInit | TObject>,
  evt: FetchEvent,
  next: NextResponse
) {
  try {
    const ret = await body;
    return evt.response.send(ret);
  } catch (err) {
    return next(err);
  }
}

function area(opts: Area): Router {
  let __wares = [],
    __prefix = opts.prefix || "";
  if (opts.wares) __wares = toArray(opts.wares);
  if (__prefix === "/") __prefix = "";
  const routes = toArray(opts.router);
  let i = 0,
    len = routes.length,
    route = {};
  while (i < len) Object.assign(route, routes[i++]);
  return { __prefix, __wares, ...route };
}

const createRouter = router;
export {
  Options,
  NextResponse,
  HandleEvent,
  FetchEvent,
  Handler,
  Router,
  createRouter,
  area,
};
