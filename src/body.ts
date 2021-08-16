import { FetchEvent, NextResponse, RetHandler, TObject } from "./types";

function isType(headers: Headers, cType: string) {
  const type = headers.get("content-type");
  return type === cType || type?.startsWith(cType);
}
export async function parseBody(
  parse: (s: string | FormData) => TObject,
  evt: FetchEvent,
  next: NextResponse
): Promise<RetHandler> {
  evt.body = {};
  const request = evt.request;
  if (request.body && request.bodyUsed === false) {
    const headers = request.headers;
    if (isType(headers, "application/json")) {
      try {
        evt.body = await request.json();
      } catch (err) {
        return next(err);
      }
    } else if (isType(headers, "application/x-www-form-urlencoded")) {
      try {
        const body = await request.text();
        evt.body = parse(body);
      } catch (err) {
        return next(err);
      }
    } else if (isType(headers, "text/plain")) {
      try {
        const body = await request.text();
        try {
          evt.body = JSON.parse(body);
        } catch (_e) {
          evt.body = { _raw: body };
        }
      } catch (err) {
        return next(err);
      }
    } else if (isType(headers, "multipart/form-data")) {
      try {
        const formData = await request.formData();
        evt.body = parse(formData);
      } catch (err) {
        return next(err);
      }
    }
  }
  return next();
}
