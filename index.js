import "dotenv/config";

import { ws, initWebSocket, handleOPCode, handleEvents } from "./websocket.js";

import { updateOneDB } from "./mongodb.js";

await initWebSocket();

ws.on("message", async (data) => {
  // Parse
  let payload = JSON.parse(data);
  const { t, s, op, d } = payload;
  console.log(t, s, op, 2);
  if (op == 0) {
    await updateOneDB("misc", { type: "state" }, { $set: { seq: s } });
  }

  // Manage OP codes
  handleOPCode(t, s, op, d);

  //  Manage Events
  handleEvents(t, s, op, d);
});
