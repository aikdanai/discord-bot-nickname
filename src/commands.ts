import { SlashCommandBuilder } from '@discordjs/builders'
import { REST } from '@discordjs/rest'
import { Routes } from 'discord-api-types/v9'
import { Guild } from 'discord.js'

import { CLIENT_ID, TOKEN } from './env'

export const CMD = {
  PING: 'ping',
  ANIMATE_NICKNAME: 'animatenick',
}

export const registerCommands = async (guild: Guild) => {
  const commands = [
    new SlashCommandBuilder()
      .setName(CMD.PING)
      .setDescription('Replies with pong'),
    new SlashCommandBuilder()
      .setName(CMD.ANIMATE_NICKNAME)
      .setDescription('Animate nickname with styles'),
  ].map((command) => command.toJSON())

  const rest = new REST({ version: '9' }).setToken(TOKEN)
  await rest.put(Routes.applicationGuildCommands(CLIENT_ID, guild.id), {
    body: commands,
  })

  console.log(
    'Successfully registered application commands on guild',
    guild.name
  )
}
