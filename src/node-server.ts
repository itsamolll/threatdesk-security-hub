import { createServer, type IncomingMessage } from "node:http";

async function start() {
  // Dynamically import the built fetch-handler module (Cloudflare Workers style)
  const serverModule = await import("./server.js");
  const handler = serverModule.default as {
    fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
  };

  const server = createServer(async (req, res) => {
    try {
      const host = req.headers.host ?? "localhost";
      const url = new URL(req.url ?? "/", `http://${host}`);

      // Stream the request body for non-GET/HEAD methods
      const body =
        req.method !== "GET" && req.method !== "HEAD"
          ? await readBody(req)
          : undefined;

      const request = new Request(url, {
        method: req.method,
        headers: req.headers as HeadersInit,
        body,
        // Required so Node.js doesn't try to follow redirects internally
        redirect: "manual",
      });

      const response = await handler.fetch(request, {}, {});

      // Forward status and headers
      const headers: Record<string, string | string[]> = {};
      response.headers.forEach((value, key) => {
        const existing = headers[key];
        if (existing !== undefined) {
          headers[key] = Array.isArray(existing)
            ? [...existing, value]
            : [existing, value];
        } else {
          headers[key] = value;
        }
      });

      res.writeHead(response.status, headers);

      if (response.body) {
        const reader = response.body.getReader();
        const pump = async () => {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(value);
          }
        };
        await pump();
      }

      res.end();
    } catch (error) {
      console.error("Unhandled server error:", error);
      if (!res.headersSent) {
        res.writeHead(500, { "content-type": "text/plain" });
      }
      res.end("Internal Server Error");
    }
  });

  const port = process.env.PORT ?? 3000;

  server.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log("Shutting down server...");
    server.close(() => {
      console.log("Server closed.");
      process.exit(0);
    });
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

function readBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
