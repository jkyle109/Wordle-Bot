import { getAllDB, getWordleNumber } from "./mongodb.js";

// TODO: move api call out of this section. pass them in instead
export const leaderboardMessage = async (type, guild_id, start, message) => {
  const data = await getAllDB(
    type == "daily" ? "daily-leaderboard" : "overall-leaderboard",
    { guild_id: guild_id },
    {},
    type == "daily" ? { guess_score: -1 } : { avg_guess_score: -1 }
  );

  if (data.length == 0)
    return startLeaderboardMessage(
      type == "daily"
        ? "Daily leaderboard is empty"
        : "Overall leaderboard is empty"
    );

  let total = data.length;
  let stop = total - start + 1 > 10 ? start + 9 : total;
  let left = start - 10;
  let right = stop < total ? stop + 1 : 0;

  message.embeds = makeLeaderboardEmbed(
    type,
    data.slice(start - 1, stop),
    message,
    start,
    stop,
    total,
    await getWordleNumber()
  );
  message.components = makeMessageButtons(type, left, right);
  return message;
};

export const wordleScoreMessage = (wordle, message, color = 8008342) => {
  const new_message = {
    content: `<@${message.author.id}>`,
    // message_reference: { message_id: message_reference },
    embeds: [
      {
        author: {
          name: `Your day ${wordle.number} score: ${wordle.score}`,
        },
        color: color,
      },
    ],
  };
  new_message.components = makeMessageButtons();
  return new_message;
};

export const startLeaderboardMessage = (content = "", color = 8008342) => {
  const message = {};
  message.content = content;
  message.embeds = [];
  message.components = makeMessageButtons();
  return message;
};

const makeLeaderboardEmbed = (
  type,
  data,
  message,
  start,
  stop,
  total,
  wordle_number,
  color = 8008342
) => {
  let users = "";
  let guesses = "";
  let scores = "";

  for (const [i, entry] of data.entries()) {
    users += `\n${i + start}) <@${entry.user_id}>`;
    if (type == "daily") {
      guesses += `\n${entry.guess_count}`;
      scores += `\n${entry.guess_score}${entry.hardmode ? "*" : ""}`;
    } else {
      guesses += `\n${entry.complete_count}`;
      scores += `\n${entry.avg_guess_score}`;
    }
  }
  // Gonna just hardcode the old embed keys from the variables cause I don't think it's going to change much
  return [
    {
      content: message?.embeds[0] ? message.embeds[0].content : "",
      author: message?.embeds[0] ? message.embeds[0].author : "",
      title:
        type == "daily"
          ? `Daily Leaderboard - ${wordle_number}`
          : `Overall Leaderboard`,
      color: color,
      fields: [
        {
          name: "User",
          value: users,
          inline: true,
        },
        {
          name: type == "daily" ? "Guesses" : "Wordle Count",
          value: guesses,
          inline: true,
        },
        {
          name: type == "daily" ? "Score" : "Avg. Score",
          value: scores,
          inline: true,
        },
      ],
      footer: {
        text: `${
          type == "daily" ? "* Hardmode\n" : ""
        }Showing ranks ${start}-${stop} of ${total}`,
      },
    },
  ];
};

const makeMessageButtons = (type = "", left = 0, right = 0) => {
  const overall = {
    type: 2,
    label: "Overall Leaderboard",
    style: 1,
    custom_id: "overall-leaderboard",
  };
  const daily = {
    type: 2,
    label: "Daily Leaderboard",
    style: 1,
    custom_id: "daily-leaderboard",
  };

  const l = {
    type: 2,
    emoji: {
      id: null,
      name: "◀️",
    },
    style: 2,
    custom_id: `left_${type}_${left}`,
    disabled: left <= 0,
  };

  const r = {
    type: 2,
    emoji: {
      id: null,
      name: "▶️",
    },
    style: 2,
    custom_id: `right_${type}_${right}`,
    disabled: right <= 0,
  };
  return [
    {
      type: 1,
      components:
        type == "daily"
          ? [l, r, overall]
          : type == "overall"
          ? [l, r, daily]
          : [daily, overall],
    },
  ];
};
