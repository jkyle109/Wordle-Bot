import { verifyKey } from "discord-interactions";
import fetch from "node-fetch";

export function VerifyDiscordRequest(clientKey) {
  return function (req, res, buf, encoding) {
    const signature = req.get("X-Signature-Ed25519");
    const timestamp = req.get("X-Signature-Timestamp");

    const isValidRequest = verifyKey(buf, signature, timestamp, clientKey);
    if (!isValidRequest) {
      res.status(401).send("Bad request signature");
      throw new Error("Bad request signature");
    }
  };
}

export const OperationCode = {
  DISPATCH: 0,
  HEARTBEAT: 1,
  IDENTIFY: 2,
  PRESENCE_UPDATE: 3,
  VOICE_STATE_UPDATE: 4,
  RESUME: 6,
  RECONNECT: 7,
  REQUEST_GUILD_MEMBER: 8,
  INVALID_SESSION: 9,
  HELLO: 10,
  HEARTBEAT_ACK: 11,
};

export const capitalize = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const DiscordRequest = async (endpoint, options) => {
  // append endpoint to root API URL
  const url = "https://discord.com/api/v9/" + endpoint;
  // Stringify payloads
  if (options.body) options.body = JSON.stringify(options.body);
  // Use node-fetch to make requests
  const res = await fetch(url, {
    headers: {
      Authorization: `Bot ${process.env.WORDLE_TOKEN}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    ...options,
  });
  // throw API errors
  if (!res.ok) {
    const data = await res.json();
    console.log(res.status);
    throw new Error(JSON.stringify(data));
  }
  // return original response
  return res;
};

export const getRandom = (min, max) => {
  return Math.random() * (max - min) + min;
};

const scaleValue = (value, from, to) => {
  let scale = (to[1] - to[0]) / (from[1] - from[0]);
  let capped = Math.min(from[1], Math.max(from[0], value)) - from[0];
  return (capped * scale + to[0]).toFixed(2);
};

export const parseWordle = (string) => {
  let lines = string.split("\n");
  let wordleNumber;
  let hardMode;
  let totalGuesses;
  let wordleScore = 0;
  let scale = [0, 0.7, 1, 1];
  // check if line ne matches a wordle header
  let line0 = lines[0].match(/(Wordle) [0-9]+ \d\/\d\*?/g);
  // console.log(line0);
  if (line0 && line0.length == 1) {
    // check if the wordle number is valid
    let temp = line0[0].split(" ");
    wordleNumber = temp[1];
    hardMode = temp[2].slice(-1) == "*" ? true : false;
    scale[3] = hardMode ? 1.05 : scale[3];
    totalGuesses = temp[2][0];
    // console.log(wordleNumber, totalGuesses, hardMode);
  } else {
    return null;
  }

  if (lines[1] != "") {
    return null;
  }
  try {
    for (let i = 2; i < 2 + Number(totalGuesses); i++) {
      let black = lines[i].match(/⬛/g)?.length || 0;
      let yellow = lines[i].match(/🟨/g)?.length || 0;
      let green = lines[i].match(/🟩/g)?.length || 0;
      wordleScore += black * scale[0] + yellow * scale[1] + green * scale[2];

      // console.log(black, yellow, green);
    }
  } catch (err) {
    // console.log(err);
    return null;
  }

  wordleScore = (wordleScore + (6 - totalGuesses) * 5) * 2 * scale[3];
  wordleScore = scaleValue(
    wordleScore,
    [0, 60 * scale[3]],
    [0, 10 * [scale[3]]]
  );
  return {
    score: parseFloat(wordleScore),
    guess_count: parseInt(totalGuesses),
    hardmode: hardMode,
    number: parseInt(wordleNumber),
  };
};

// let test = `Wordle 321 4/6*

// ⬛⬛🟨⬛⬛
// 🟨⬛🟨⬛⬛
// ⬛🟩🟨🟨⬛
// 🟩🟩🟩🟩🟩`;

// console.log(parseWordle(test));

export const getBotGuilds = async () => {
  return DiscordRequest(`/users/@me/guilds`, {
    method: "GET",
  }).then((res) => res.json());
};

export const getBotGuildIDs = async (guilds = null) => {
  if (!guilds) {
    guilds = await getBotGuilds();
    console.log("opps");
  }
  let guildIDs = [];
  console.log();
  for (let guild of guilds) {
    guildIDs.push(guild.id);
  }
  return guildIDs;
};
