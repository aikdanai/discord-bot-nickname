import { CacheType, CommandInteraction } from 'discord.js'

export type CommandHandler = (
  interaction: CommandInteraction<CacheType>
) => Promise<void>
