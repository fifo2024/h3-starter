import {
    H3,
    serve,
    basicAuth,
    onRequest,
    onResponse,
    onError,
    defineHandler,
    html,
    HTTPError,
    defineWebSocketHandler,
} from "h3";
import { plugin as ws } from "crossws/server";

const app = new H3();

app.get("/", (event) => "⚡️ Fifo2024!");

app.on("GET", "/hello", () => "Hello world!");

// [GET] /hello/Bob => "Hello, Bob!"
app.get("/hello/:name", (event) => {
    return `Hello, ${event.context.params.name}!`;
});

// app.get("/hello/*", (event) => `Hello!`);

app.use((event) => {
    console.log(17, event.context.matchedRoute?.meta); // { auth: true }
});

app.get("/", (event) => "Hi!", { meta: { auth: true } });

app.use(
    "/blog/**",
    (event, next) => {
        console.log("blog / ** [alert] get request on /blog paths!");
    },
    {
        method: "GET",
        // match: (event) => event.req.method === "POST",
    }
);

app.get("/blog/*", (event) => "Hi Blog!", { meta: { auth: true } });

app.use(async (event, next) => {
    const rawBody = await next();
    // [intercept response]
    console.log("rawBody", rawBody);
    return rawBody;
});

// app.use(() => "Middleware 1")
//     .use(() => "Middleware 2")
//     .get("/h3", "Hello");

app.get(
    "/secret",
    (event) => {
        /* ... */
        console.log("/secret", event);
        return "/secret";
    },
    {
        middleware: [basicAuth({ password: "test" })],
    }
);

app.use(
    onRequest((event) => {
        console.log(`[${event.req.method}] ${event.url.pathname}`);
    })
);

app.use(
    onResponse((response, event) => {
        console.log(`[${event.req.method}] ${event.url.pathname} ~>`, "body");
    })
);

app.use(
    onError((error, event) => {
        console.log(
            `[${event.req.method}] ${event.url.pathname} !! ${error.message}`
        );
    })
);

app.get(
    "/admin/**",
    defineHandler({
        meta: { tag: "admin" },
        handler: (event) => "Hi!",
    })
);

app.get("/html", (event) => html(event, "<h1>hello world</h1>"));

app.get(
    "/html-header",
    (event) =>
        new Response(html(event, "<h1>hello world</h1>"), {
            headers: { "x-powered-by": "H3" },
        })
);

app.get("/error", (event) => {
    // Using message and details
    throw new HTTPError("Invalid user input", { status: 400 });

    // Using HTTPError.status(code)
    throw HTTPError.status(400, "Bad Request");

    // Using single pbject
    throw new HTTPError({
        status: 400,
        statusText: "Bad Request",
        message: "Invalid user input",
        data: { field: "email" },
        body: { date: new Date().toJSON() },
        headers: {},
    });
});

app.get("/res", (event) => {
    event.res.status = 200;
    event.res.statusText = "OK";
    event.res.headers.set("x-test", "works");

    return "OK";
});

app.get("/ws", defineWebSocketHandler({ message: console.log }));

serve(app, {
    port: 3000,
    plugins: [ws({ resolve: async (req) => (await app.fetch(req)).crossws })],
});

// const response = await app.request("/");
// console.log(await response.text());
