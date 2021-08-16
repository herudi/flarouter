# Flarouter
[![npm version](https://img.shields.io/badge/npm-1.0.6-blue.svg)](https://npmjs.org/package/flarouter) 
[![License](https://img.shields.io/:license-mit-blue.svg)](http://badges.mit-license.org)
[![download-url](https://img.shields.io/npm/dm/flarouter.svg)](https://npmjs.org/package/flarouter)

Router middleware for [cloudflare workers](https://developers.cloudflare.com/workers).
> make sure [wrangler](https://developers.cloudflare.com/workers/cli-wrangler) is installed and type webpack.

## Features

- Simple.
- Middleware support.
- Area Router support.
- Includes body parser (jsonBody, urlencodedBody, rawBody, multipartBody).
- Return directly on handlers.

## Install
```bash
npm i flarouter
```

## Usage
```js
import { createRouter } from "flarouter";

const handleEvent = createRouter({
  "GET/foo": (evt, next) => {
    return "bar";
  },
  "GET/foo/:name": (evt, next) => {
    const { name } = evt.params;
    return { my_name: name };
  },
  "GET/res": (evt, next) => {
    return new Response("res");
  }
});

addEventListener("fetch", (evt) => {
  evt.respondWith(handleEvent(evt));
});
```

## Run Dev
```bash
wrangler dev
```
## Publish
```bash
wrangler publish
```

Go to http://127.0.0.1:8787/foo

## Middleware
```js
...

// cors example
const cors = (evt, next) => {
  const { response } = evt;
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Headers", "*");
  response.headers.set("Access-Control-Allow-Methods", "*");
  return next();
}
const foobar = (evt, next) => {
  // evt.locals help for declare middleware variable.
  evt.locals.foo = "bar";
  return next();
}
const options = {
  wares: [cors, foobar]
}
const handleEvent = createRouter(options, {
  "GET/hello": (evt) => {
    return evt.locals;
    // => { foo: "bar" }
  }
});
...
```
## Multi Handler (middleware in handler)
```js
...
const handleEvent = createRouter({
  "GET/foo": [
    // example auth
    (evt, next) => {
      const token = evt.request.headers.get("x-api-key") || "";
      if (token === "123") return next();
      throw new Error("Token not provided");
    },
    (evt, next) => {
      return "Success";
    },
  ]
});
...
```
## Params
```js
...
const handleEvent = createRouter({
  "GET/hello/:name": (evt, next) => {
    const { name } = evt.params;
    return "hello " + name;
  },
  // exact all
  "GET/*": (evt, next) => {
    const { wild } = evt.params;
    return wild;
  }
});
...
```
## Query
Example: http://127.0.0.1:8787/hello?name=john
```js
...
const handleEvent = createRouter({
  "GET/hello": (evt, next) => {
    const { name } = evt.query;
    if (!name) throw new Error("query name is required !");
    return "hello " + name;
  }
});
...
```
## Body
support (json, urlencoded, multipart, text);
```js
...
const handleEvent = createRouter({
  "POST/hello": (evt, next) => {
    const { name } = evt.body;
    if (!name) throw new Error("field name is required !");
    evt.response.status = 201;
    return "Created " + name;
  }
});
...
```
## Multi Router
```js
...
// item router
const itemRouter = {
  "GET/item": _ => "item",
  "GET/item/:id": ({ params }) => "item " + params.id,
}
// brand router
const brandRouter = {
  "GET/brand": _ => "brand",
  "GET/brand/:id": ({ params }) => "brand " + params.id,
}
const handleEvent = createRouter(itemRouter, brandRouter);
...
```
## Area Router
```js
import { createRouter, area } from "flarouter";

// Api Area
const itemRouter = { "GET/item": _ => "item" };
const brandRouter = { "GET/brand": _ => "brand" };
const apiArea = area({
  prefix: "/api/v1",
  router: [itemRouter, brandRouter],
  // wares: [foo, bar]
});

// Frontend Area
const homeRouter = { "GET/home": _ => "home" };
const aboutRouter = { "GET/about": _ => "about" };
const frontendArea = area({
  prefix: "/",
  router: [homeRouter, aboutRouter],
  // wares: [foo, bar]
});

// handle event
const handleEvent = createRouter(apiArea, frontendArea);
...
```
## Response
```js
...
// response status default 200
evt.response.status;

// response headers default new Headers()
evt.response.headers;
...
```
## Handle Error
```js
...
const options = {
  // handle error
  onError: (err) => ({ status: err.status, message: err.message }),
  // handle 404
  on404: (evt) => ({ status: 404, message: "not found" })
}

const handleEvent = createRouter(options, ...moreRouter);
...
```

## List

- [x] Router
- [x] Middleware
- [x] Area
- [x] Body Parser
- [ ] Unit Test

## License

[MIT](LICENSE)
