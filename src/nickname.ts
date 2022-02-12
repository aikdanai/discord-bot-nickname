import { CMD } from 'commands'
import {
  CacheType,
  CommandInteraction,
  GuildMember,
  Interaction,
} from 'discord.js'
import EventEmitter from 'events'
import { BaseHandler } from 'types'

export class Nicknamer {
  public emitter: EventEmitter
  public pending: boolean
  public member: GuildMember

  constructor(m: GuildMember) {
    this.pending = false
    this.emitter = new EventEmitter()
    this.member = m
    this.emitter.on('changeNickname', async (newNickname: string) => {
      this.pending = true
      this.member.nickname = newNickname
      await this.member.setNickname(newNickname)
      this.pending = false
    })
  }
}

export class NicknameHandler implements BaseHandler {
  private _nicknamer: {
    [gid: string]: {
      [id: string]: Nicknamer
    }
  } = {}

  constructor() {
    setInterval(this.runningNickname, 100)
    console.log('Nickname Task Registered')
  }

  public handleCommand = async (interaction: CommandInteraction<CacheType>) => {
    if (interaction.commandName === CMD.ANIMATE_NICKNAME) {
      return this.handleAnimateCommand(interaction)
    } else {
      return this.handleStopAnimateCommand(interaction)
    }
  }

  private runningNickname = () => {
    for (let gid in this._nicknamer) {
      for (let id in this._nicknamer[gid]) {
        const nicknamer = this._nicknamer[gid][id]
        if (nicknamer.pending) continue
        let mem = nicknamer.member
        let nickname = mem.nickname || mem.user?.username
        const prefix = '› ឵឵'
        nickname = nickname.replace(prefix, '').replace(' ', ' ឵឵')
        const tail = nickname?.substring(0, nickname.length - 1) || ''
        const head = nickname?.substring(nickname.length - 1) || ''
        const newNickname = prefix + head + tail
        if (!newNickname) continue
        try {
          console.log(id, ':', nickname, '->', newNickname)
          nicknamer.emitter.emit('changeNickname', newNickname)
        } catch (err) {
          console.error(err)
        }
      }
    }
  }

  private handleAnimateCommand = async (
    interaction: CommandInteraction<CacheType>
  ) => {
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

  private add = (mem: GuildMember) => {
    if (!this._nicknamer[mem.guild.id]) this._nicknamer[mem.guild.id] = {}
    const n = new Nicknamer(mem)
    this._nicknamer[mem.guild.id][mem.id] = n
  }

  private handleStopAnimateCommand = async (
    interaction: CommandInteraction<CacheType>
  ) => {
    const mem = interaction.member
    if (!(mem instanceof GuildMember)) {
      return interaction.reply('Who are you?')
    }
    this.remove(mem as GuildMember)
    return interaction.reply('Stopped.')
  }

  private remove = (mem: GuildMember) => {
    if (!this._nicknamer[mem.guild.id]) return
    delete this._nicknamer[mem.guild.id][mem.id]
  }
}
