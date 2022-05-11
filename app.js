import express from "express";
import "dotenv/config";
import { VerifyDiscordRequest, getBotGuildIDs, getBotGuilds } from "./util.js";
import {
  TEST_COMMAND,
  LEADERBOARD_COMMAND,
  guildsHaveCommands,
} from "./commands.js";
import { handleInteractions } from "./websocket.js";

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

app.listen(PORT, async () => {
  console.log("Listening on Port: ", PORT);

  let guilds = await getBotGuilds(); // for database

  await guildsHaveCommands(
    process.env.WORDLE_APP_ID,
    await getBotGuildIDs(guilds),
    [TEST_COMMAND, LEADERBOARD_COMMAND]
  );
});
