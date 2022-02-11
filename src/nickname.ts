import { CacheType, CommandInteraction, GuildMember } from 'discord.js'
import { BaseHandler } from 'types'

export class NicknameHandler implements BaseHandler {
  private _nicknamer: { [gid: string]: { [id: string]: GuildMember } } = {}
  private _running: boolean = false

  constructor() {
    setInterval(this.runningNickname, 100)
    console.log('Nickname Task Registered')
  }

  public handleCommand = async (interaction: CommandInteraction<CacheType>) => {
    if (!interaction.guild?.me?.permissions.has('MANAGE_NICKNAMES')) {
      return interaction.reply("Sadly, I'm not allowed to manage nicknames.")
    }
    if (interaction.user.id === interaction.guild?.ownerId) {
      return interaction.reply(
        "I wouldn't dare change the almighty owner's nickname."
      )
    }
    const mem = interaction.member
    if (!(mem instanceof GuildMember)) {
      return interaction.reply('Who are you?')
    }
    this.add(mem as GuildMember)
    return interaction.reply('Nickname go brrrrrrrrr')
  }

  private runningNickname = async () => {
    if (this._running) return
    this._running = true
    for (let gid in this._nicknamer) {
      for (let id in this._nicknamer[gid]) {
        let mem = this._nicknamer[gid][id]
        let nickname = mem.nickname || mem.user?.username
        const prefix = '› ឵឵'
        nickname = nickname.replace(prefix, '').replace(' ', ' ឵឵')
        const tail = nickname?.substring(0, nickname.length - 1) || ''
        const head = nickname?.substring(nickname.length - 1) || ''
        const newNickname = prefix + head + tail
        if (!newNickname) continue
        try {
          mem.nickname = newNickname
          console.log(id, ':', nickname, '->', newNickname)
          await mem.setNickname(newNickname)
        } catch (err) {
          console.error(err)
        }
      }
    }
    this._running = false
  }

  private add = (mem: GuildMember) => {
    if (!this._nicknamer[mem.guild.id]) this._nicknamer[mem.guild.id] = {}
    this._nicknamer[mem.guild.id][mem.id] = mem
  }
}
