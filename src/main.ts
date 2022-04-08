import { SlashCommandBuilder } from '@discordjs/builders'
import { REST } from '@discordjs/rest'
import { APIApplicationCommandOption, Routes } from 'discord-api-types/v9'
import { Client, Guild, Intents } from 'discord.js'
import _ from 'lodash'
import { onShutdown } from 'node-graceful-shutdown'

import { NicknameHandler } from './commands/nickname'
import { PingHandler } from './commands/ping'
import { SongHandler } from './commands/song'
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
    Intents.FLAGS.GUILD_VOICE_STATES,
  ],
})

type Command = {
  name: string
  description: string
  options?: Array<APIApplicationCommandOption>
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
  PLAY: {
    name: 'play',
    description: 'Plays some tune',
    options: [
      {
        name: 'query',
        type: 3,
        description: 'Search for the song you want to play',
        required: true,
      },
    ],
  },
  PAUSE: {
    name: 'pause',
    description: 'Pause the tune',
  },
  UNPAUSE: {
    name: 'unpause',
    description: 'Continue the tune',
  },
  STOP: {
    name: 'stop',
    description: 'Stop and kill the music',
  },
  SKIP: {
    name: 'skip',
    description: 'Skip current tune',
  },
  BACK: {
    name: 'back',
    description: 'Go back to previous tune',
  },
  CLEAR: {
    name: 'clear',
    description: 'Clear the queue',
  },
  QUEUE: {
    name: 'queue',
    description: 'Sees current queue',
  },
  VOLUME: {
    name: 'volume',
    description: 'Set volume (default 40)',
    options: [
      {
        name: 'level',
        type: 4,
        description: 'The volume 1 to 100 percent',
        required: true,
      },
    ],
  },
  REMOVE: {
    name: 'remove',
    description: 'Remove track from the queue (See /queue)',
    options: [
      {
        name: 'no',
        type: 4,
        description: 'No. of song in the queue to remove',
        required: true,
      },
    ],
  },
}

const registerCommands = async (guild: Guild) => {
  const commands = _.map(CMD)
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

const newGuildHandler = async (guildId: string): Promise<GuildHandler> => {
  const guild = await client.guilds.fetch(guildId)
  const pingHandler = new PingHandler()
  const nicknameHandler = new NicknameHandler()
  const songHandler = new SongHandler(client, guild)
  return {
    [CMD.PING.name]: pingHandler.ping,
    [CMD.ANIMATE_NICKNAME.name]: nicknameHandler.animate,
    [CMD.STOP_NICKNAME.name]: nicknameHandler.stopAnimate,
    [CMD.PLAY.name]: songHandler.play,
    [CMD.PAUSE.name]: songHandler.pause,
    [CMD.UNPAUSE.name]: songHandler.unpause,
    [CMD.STOP.name]: songHandler.stop,
    [CMD.SKIP.name]: songHandler.skip,
    [CMD.BACK.name]: songHandler.back,
    [CMD.CLEAR.name]: songHandler.clear,
    [CMD.QUEUE.name]: songHandler.queue,
    [CMD.VOLUME.name]: songHandler.volume,
    [CMD.REMOVE.name]: songHandler.remove,
  }
}

const guildHandlers: { [gid: string]: GuildHandler } = {}

client.once('ready', async () => {
  try {
    console.log('Client Ready')
    client.guilds.cache.forEach(async (guild) => {
      await registerCommands(guild)
      guildHandlers[guild.id] = await newGuildHandler(guild.id)
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
      guildHandlers[interaction.guildId] = await newGuildHandler(
        interaction.guildId
      )
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
    guildHandlers[guild.id] = await newGuildHandler(guild.id)
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
