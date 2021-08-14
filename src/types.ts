export type TObject = { [k: string]: any };
export type HttpResponse = {
  status: number;
  headers: Headers;
  send: (body: Promise<BodyInit | TObject> | BodyInit | TObject) => RetHandler;
  [k: string]: any;
};
export type FetchEvent = {
  readonly request: Request;
  respondWith: (r: Response | Promise<Response>) => void;
  waitUntil: (p: Promise<any>) => void;
  passThroughOnException: () => void;
  params: TObject;
  query: TObject;
  body: TObject;
  response: HttpResponse;
  parsedUrl: URL;
  [k: string]: any;
};
export type RetHandler =
  | Promise<string | TObject | Response>
  | Response
  | string
  | TObject;
export type NextResponse = (err?: any) => RetHandler;
export type HandleEvent = (event: FetchEvent) => RetHandler;
export type Handler = (evt: FetchEvent, next: NextResponse) => RetHandler;
export type EHandler = (
  err: any,
  evt: FetchEvent,
  next: NextResponse
) => RetHandler;
export type Options = {
  onError?: EHandler;
  on404?: Handler;
  wares?: Handler | Handler[];
};
