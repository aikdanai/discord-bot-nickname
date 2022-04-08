import { CacheType, CommandInteraction } from 'discord.js'

export class PingHandler {
  public ping = async (interaction: CommandInteraction<CacheType>) => {
    return interaction.reply('Pong')
  }
}
