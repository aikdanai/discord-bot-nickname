import { CacheType, CommandInteraction } from 'discord.js'

export interface BaseHandler {
  handleCommand(interaction: CommandInteraction<CacheType>): Promise<void>
}
