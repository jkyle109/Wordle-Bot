import { capitalize, DiscordRequest } from "./util.js";

export const guildsHaveCommands = async (appId, guildIDs, commands) => {
  guildIDs.forEach(async (guildId) => {
    await commands.forEach(async (command) => {
      await guildHasCommand(appId, guildId, command);
    });
  });
};

export const TEST_COMMAND = {
  name: "test",
  description: "Basic guild command",
  type: 1,
};

export const LEADERBOARD_COMMAND = {
  name: "leaderboard",
  description: "See the wordle leaderboards!",
  type: 1,
};

// Checks for a command
const guildHasCommand = async (appId, guildId, command) => {
  // API endpoint to get and post guild commands
  const endpoint = `applications/${appId}/guilds/${guildId}/commands`;

  try {
    const res = await DiscordRequest(endpoint, { method: "GET" });
    const data = await res.json();

    if (data) {
      const installedNames = data.map((c) => c["name"]);
      // This is just matching on the name, so it's not good for updates
      if (!installedNames.includes(command["name"])) {
        console.log(`Installing "${command["name"]}"`);
        InstallGuildCommand(appId, guildId, command);
      } else {
        console.log(
          `"${command.name}" command already installed on "${guildId}"`
        );
      }
    }
  } catch (err) {
    console.error(err);
  }
};

// Installs a command
const InstallGuildCommand = async (appId, guildId, command) => {
  // API endpoint to get and post guild commands
  const endpoint = `applications/${appId}/guilds/${guildId}/commands`;
  // install command
  try {
    await DiscordRequest(endpoint, { method: "POST", body: command });
  } catch (err) {
    console.error(err);
  }
};

// Uninstall all guild commands
