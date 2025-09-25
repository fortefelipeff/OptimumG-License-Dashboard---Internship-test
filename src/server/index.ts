import http from "http";

import { createApp } from "./app";

const PORT = Number(process.env.PORT ?? 4000);

export function startServer(port = PORT) {
  const app = createApp();
  const server = http.createServer(app);

  return server.listen(port, () => {
    console.log(`License server listening on http://localhost:${port}`);
  });
}

if (require.main === module) {
  startServer();
}
