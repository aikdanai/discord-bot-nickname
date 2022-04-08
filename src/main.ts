import { SlashCommandBuilder } from '@discordjs/builders'
import { REST } from '@discordjs/rest'
import { Routes } from 'discord-api-types/v9'
import { Client, Guild, Intents } from 'discord.js'
import _ from 'lodash'
import { onShutdown } from 'node-graceful-shutdown'

import { NicknameHandler } from './commands/nickname'
import { PingHandler } from './commands/ping'
import { CLIENT_ID, TOKEN } from './env'
import { CommandHandler } from './types'

export const client = new Client({
  restTimeOffset: 50,
  restWsBridgeTimeout: 2000,
  restRequestTimeout: 5000,
  shardCount: 10,
  shards: 'auto',
  invalidRequestWarningInterval: 10,
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILD_MESSAGES,
  ],
})

type Command = {
  name: string
  description: string
}

const CMD: { [x: string]: Command } = {
  PING: {
    name: 'ping',
    description: 'Replies with pong',
  },
  ANIMATE_NICKNAME: {
    name: 'animatenick',
    description: 'Animate nickname with styles',
  },
  STOP_NICKNAME: {
    name: 'stopnick',
    description: 'Stop animate nickname',
  },
}

const registerCommands = async (guild: Guild) => {
  const commands = _.map(CMD, (command) =>
    new SlashCommandBuilder()
      .setName(command.name)
      .setDescription(command.description)
      .toJSON()
  )
  const rest = new REST({ version: '9' }).setToken(TOKEN)
  await rest.put(Routes.applicationGuildCommands(CLIENT_ID, guild.id), {
    body: commands,
  })

  console.log(
    'Successfully registered application commands on guild',
    guild.name
  )
}

type GuildHandler = {
  [cmd: string]: CommandHandler
}

const newGuildHandler = (guildId: string): GuildHandler => {
  const pingHandler = new PingHandler()
  const nicknameHandler = new NicknameHandler()
  return {
    [CMD.PING.name]: pingHandler.handlePing,
    [CMD.ANIMATE_NICKNAME.name]: nicknameHandler.handleAnimateCommand,
    [CMD.STOP_NICKNAME.name]: nicknameHandler.handleStopAnimateCommand,
  }
}

const guildHandlers: { [gid: string]: GuildHandler } = {}

client.once('ready', async () => {
  try {
    console.log('Client Ready')
    client.guilds.cache.forEach(async (guild) => {
      await registerCommands(guild)
      guildHandlers[guild.id] = newGuildHandler(guild.id)
    })
  } catch (err) {
    console.warn(err)
  }
})

client.on('interactionCreate', async (interaction) => {
  try {
    if (!interaction.isCommand()) return
    const { commandName } = interaction
    if (!interaction.guildId) return
    if (!guildHandlers[interaction.guildId]) {
      guildHandlers[interaction.guildId] = newGuildHandler(interaction.guildId)
    }
    const guildHandler = guildHandlers[interaction.guildId]
    if (guildHandler[commandName]) {
      await guildHandler[commandName](interaction)
    } else {
      await interaction.reply('Not implemented yet 🥺')
    }
  } catch (err) {
    console.warn(err)
  }
})

client.on('guildCreate', async (guild) => {
  try {
    await registerCommands(guild)
    guildHandlers[guild.id] = newGuildHandler(guild.id)
    await guild.systemChannel?.send('Hello sheeple! 🐑 🐑 🐑')
  } catch (err) {
    console.warn(err)
  }
})

client.login(TOKEN)

onShutdown('discord', async () => {
  console.log('Quitting...')
  client.destroy()
  console.log('Quitted')
})
