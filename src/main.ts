import { Client, Intents } from 'discord.js'
import { onShutdown } from 'node-graceful-shutdown'
import { BaseHandler } from 'types'

import { CMD, registerCommands } from './commands'
import { TOKEN } from './env'
import { NicknameHandler } from './nickname'

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

const nicknameHandler = new NicknameHandler()

const handlers: { [cmd: string]: BaseHandler } = {
  [CMD.ANIMATE_NICKNAME]: nicknameHandler,
}

client.once('ready', async () => {
  console.log('Client Ready')
  client.guilds.cache.forEach(registerCommands)
})

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return
  const { commandName } = interaction
  if (commandName === CMD.PING) {
    await interaction.reply('Pong!')
  } else if (handlers[commandName]) {
    await handlers[commandName].handleCommand(interaction)
  } else {
    interaction.reply('Not implemented yet ;)')
  }
})

client.on('guildCreate', async (guild) => {
  await registerCommands(guild)
  await guild.systemChannel?.send('Hello sheeple! 🐑 🐑 🐑')
})

client.login(TOKEN)

onShutdown('discord', async () => {
  console.log('Quitting...')
  client.destroy()
  console.log('Quitted')
})
