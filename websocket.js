import "dotenv/config";
import {
  getRandom,
  parseWordle,
  DiscordRequest,
  getBotGuildIDs,
  OperationCode,
} from "./util.js";
import {
  InteractionType,
  InteractionResponseType,
  InteractionResponseFlags,
  MessageComponentTypes,
  ButtonStyleTypes,
} from "discord-interactions";

import {
  getOneDB,
  updateOneDB,
  getWordleNumber,
  updateOverall,
} from "./mongodb.js";

import WebSocket from "ws";
import {
  wordleScoreMessage,
  leaderboardMessage,
  startLeaderboardMessage,
} from "./embeds.js ";

export const ws = new WebSocket(process.env.WORDLE_WS_GATEWAY);

export const connect = () => {
  let data = {
    op: 2,
    d: {
      token: process.env.WORDLE_TOKEN,
      intents: 513,
      properties: {
        $browser: "chrome",
        $device: "chrome",
      },
    },
  };
  ws.send(JSON.stringify(data));
};

export const resume = (seq, session_id) => {
  ws.send(
    JSON.stringify({
      op: 6,
      d: {
        token: process.env.WORDLE_TOKEN,
        session_id: session_id,
        seq: seq,
      },
    })
  );
};

export const initWebSocket = async () => {
  ws.on("open", async () => {
    // load previous seq and session_id
    let state = await getOneDB("misc", { type: "state" });
    let seq = state.seq;
    let session_id = state.session_id;
    if (!seq || !session_id) {
      console.log("connect on start");
      connect();
    } else {
      console.log("resume on start");
      resume(seq, session_id);
    }
  });
};

export const handleOPCode = async (event, seq, op, data) => {
  switch (op) {
    case OperationCode.DISPATCH:
      console.log("An event was dispatched.");
      break;

    case OperationCode.HEARTBEAT:
      console.log("Do you hear that?");
      break;

    case OperationCode.RECONNECT:
      console.log("Discord wants us to try to reconnect.");
      let state = await getOneDB("misc", { type: "state" });
      let seq = state.seq;
      let session_id = state.session_id;
      resume(seq, session_id);
      break;

    case OperationCode.INVALID_SESSION:
      // Session Failed so we need to reconnect
      console.log("Session Failed!");
      setTimeout(() => {
        connect();
      }, getRandom(1000, 5000));
      break;

    case OperationCode.HELLO:
      console.log("Hey <3");
      // data gives heartbeat interval to use
      if (data) {
        interval = heartbeat(data.heartbeat_interval);
      }
      break;

    case OperationCode.HEARTBEAT_ACK:
      console.log("BEEP ... BEEP ... BEEP");
      break;
  }
};

export const handleEvents = async (t, s, op, d) => {
  switch (t) {
    case "HELLO":
      console.log("event hello");
      break;
    case "READY":
      await updateOneDB(
        "misc",
        { type: "state" },
        { $set: { session_id: d.session_id } }
      );
      console.log("ready");
      break;
    case "RESUMED":
      console.log("resume");
      break;
    case "RECONNECT":
      console.log("reconnect");
      break;
    case "MESSAGE_CREATE":
      console.log(`${d.author.username}: ${d.content}`);

      if (d.content == "guilds") {
        console.log(await getBotGuildIDs());
      }

      let wordle = parseWordle(d.content);

      if (wordle && wordle.number == (await getWordleNumber())) {
        let date = new Date();
        date.setHours(27, 59, 0, 0);

        // Update daily
        let isExisting = await updateOneDB(
          "daily-leaderboard",
          { guild_id: d.guild_id, user_id: d.author.id },
          {
            $setOnInsert: {
              guild_id: d.guild_id,
              user_id: d.author.id,
              guess_count: wordle.guess_count,
              guess_score: wordle.score,
              hardmode: wordle.hardmode,
              expireAt: date,
            },
          },
          { upsert: true }
        ).then((res) => res.lastErrorObject.updatedExisting);
        console.log(isExisting);
        if (isExisting) {
          await DiscordRequest(`/channels/${d.channel_id}/messages`, {
            method: "POST",
            body: { content: "Already read wordle" },
          });
        } else {
          // Update Overall
          await updateOverall(d.author.id, d.guild_id, wordle);
          // Send Score
          await DiscordRequest(`/channels/${d.channel_id}/messages`, {
            method: "POST",
            body: wordleScoreMessage(wordle, d),
          });
        }
      }
      break;
  }
};

let interval = 0;
const heartbeat = (interval) => {
  return setInterval(() => {
    ws.send(JSON.stringify({ op: 1, d: null }));
    console.log("doing the ting", interval);
  }, interval);
};

export const handleInteractions = async (req, res) => {
  let { name, type, id, data, message, guild_id } = req.body;

  if (type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }

  if (type === InteractionType.APPLICATION_COMMAND) {
    if (name == "leaderboard") {
    }
    console.log("interaction name:", req.body);
    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: startLeaderboardMessage(),
    });
  }

  if (type === InteractionType.MESSAGE_COMPONENT) {
    // console.log(data);
    // Manage the data payload to send in the switch
    const custom_res = data.custom_id.split("_");

    switch (custom_res[0]) {
      case "daily-leaderboard":
        message = await leaderboardMessage("daily", guild_id, 1, message);
        break;
      case "overall-leaderboard":
        message = await leaderboardMessage("overall", guild_id, 1, message);
        break;
      case "left":
      case "right":
        message = await leaderboardMessage(
          custom_res[1],
          guild_id,
          parseInt(custom_res[2]),
          message
        );
        break;
    }
    return res.send({
      type: InteractionResponseType.UPDATE_MESSAGE,
      data: message,
    });
  }
};
