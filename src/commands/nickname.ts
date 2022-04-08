import { CacheType, CommandInteraction, GuildMember } from 'discord.js'
import EventEmitter from 'events'

export class Nicknamer {
  public emitter: EventEmitter
  public pending: boolean
  public member: GuildMember
  private _originNickname: string

  constructor(m: GuildMember) {
    this.pending = false
    this.emitter = new EventEmitter()
    this.member = m
    this._originNickname = m.nickname || m.displayName
    this.emitter.on('changeNickname', async (newNickname: string) => {
      this.pending = true
      this.member.nickname = newNickname
      await this.member.setNickname(newNickname)
      this.pending = false
    })
  }

  stop = async () => {
    this.pending = true
    this.member.nickname = this._originNickname
    await this.member.setNickname(this._originNickname)
    this.pending = false
  }
}

export class NicknameHandler {
  private _nicknamer: {
    [id: string]: Nicknamer
  } = {}

  constructor() {
    setInterval(this._runningNickname, 100)
    console.log('Nickname Task Registered')
  }

  public handleAnimateCommand = async (
    interaction: CommandInteraction<CacheType>
  ) => {
    if (!interaction.guild?.me?.permissions.has('MANAGE_NICKNAMES')) {
      return interaction.reply("Sadly, I'm not allowed to manage nicknames.")
    }
    if (interaction.user.id === interaction.guild?.ownerId) {
      return interaction.reply("I... can't... *dies*")
    }
    const mem = interaction.member
    if (!(mem instanceof GuildMember)) {
      return interaction.reply('Who are you?')
    }
    this._add(mem as GuildMember)
    return interaction.reply('Go!')
  }

  public handleStopAnimateCommand = async (
    interaction: CommandInteraction<CacheType>
  ) => {
    const mem = interaction.member
    if (!(mem instanceof GuildMember)) {
      return interaction.reply('Who are you?')
    }
    this._remove(mem as GuildMember)
    return interaction.reply('Stopped.')
  }

  private _add = (mem: GuildMember) => {
    this._nicknamer[mem.id] = new Nicknamer(mem)
  }

  private _remove = (mem: GuildMember) => {
    delete this._nicknamer[mem.id]
  }

  private _runningNickname = () => {
    for (let id in this._nicknamer) {
      const nicknamer = this._nicknamer[id]
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
