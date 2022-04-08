import { CacheType, CommandInteraction } from 'discord.js'

export class PingHandler {
  public handlePing = async (interaction: CommandInteraction<CacheType>) => {
    return interaction.reply('Pong')
  }
}
