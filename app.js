import express from "express";
import "dotenv/config";
import { VerifyDiscordRequest, getBotGuildIDs, getBotGuilds } from "./util.js";
import {
  TEST_COMMAND,
  LEADERBOARD_COMMAND,
  guildsHaveCommands,
} from "./commands.js";
import {
  ws,
  initWebSocket,
  handleOPCode,
  handleEvents,
  handleInteractions,
} from "./websocket.js";

import { updateOneDB } from "./mongodb.js";

const PORT = 3000 || process.env.PORT;

// Create Express App
const app = express();

// Use custom method to verify Requests
app.use(
  // express.static("public"),
  express.json({ verify: VerifyDiscordRequest(process.env.WORDLE_PUBLIC_KEY) })
);

// app.get("/", () => {
//   console.log("hi");
// });

app.post("/interactions", handleInteractions);

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

app.listen(PORT, async () => {
  console.log("Listening on Port: ", PORT);

  let guilds = await getBotGuilds(); // for database

  await guildsHaveCommands(
    process.env.WORDLE_APP_ID,
    await getBotGuildIDs(guilds),
    [TEST_COMMAND, LEADERBOARD_COMMAND]
  );
});
