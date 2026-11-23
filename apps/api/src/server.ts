import "./config/env.js";
import { app } from "./app.js";
import { prisma } from "./lib/prisma.js";

const port = Number(process.env.PORT ?? process.env.API_PORT ?? 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be a valid TCP port.");
}
if (
  !process.env.SESSION_SECRET
  || process.env.SESSION_SECRET.length < 32
  || process.env.SESSION_SECRET.includes("replace-with-a-random-secret")
) {
  throw new Error("Set SESSION_SECRET to a random value of at least 32 characters.");
}

let server: ReturnType<typeof app.listen> | undefined;

if (!process.env.VERCEL) {
  server = app.listen(port, "0.0.0.0", () => {
    console.log(`Lost And Found API listening on http://localhost:${port}`);
  });
}

async function shutdown(): Promise<void> {
  if (server) {
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  } else {
    await prisma.$disconnect();
    process.exit(0);
  }
}

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());

export default app;