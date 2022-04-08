import { Player, QueryType, Queue, Track } from 'discord-player'
import 'discord-player/smoothVolume'
import {
  CacheType,
  Client,
  CommandInteraction,
  Guild,
  MessageEmbed,
} from 'discord.js'

export class SongHandler {
  private _player: Player
  private _queue: Queue
  private _guild: Guild
  private _client: Client

  constructor(client: Client, guild: Guild) {
    this._client = client
    this._player = new Player(client)
    this._guild = guild
    this._queue = new Queue(this._player, guild)
    this._player.on('trackStart', (queue: any, track) =>
      queue.metadata.channel.send(`🎶 | Now playing **${track.title}**!`)
    )
  }

  public play = async (interaction: CommandInteraction<CacheType>) => {
    if (!interaction.guild) {
      return interaction.reply('Ded')
    }
    const query = interaction.options.getString('query')
    if (!query) return
    this._queue = this._player.createQueue(interaction.guild, {
      metadata: {
        channel: interaction.channel,
      },
      initialVolume: 40,
    })
    try {
      const member = await interaction.guild.members.cache.get(
        interaction?.user.id
      )
      if (!member?.voice?.channel) {
        return interaction.reply('Connect to a voice channel first.')
      }
      if (!this._queue.connection)
        await this._queue.connect(member?.voice?.channel)
    } catch {
      this._queue.destroy()
      return interaction.reply({
        content: 'Could not join your voice channel!',
        ephemeral: true,
      })
    }
    const res = await this._player.search(query, {
      requestedBy: interaction.user,
      searchEngine: QueryType.AUTO,
    })
    res.playlist
      ? this._queue.addTracks(res.tracks)
      : this._queue.addTrack(res.tracks[0])
    if (!this._queue.playing) await this._queue.play()
    return interaction.reply(
      `Added ${
        res.playlist ? 'playlist' : res.tracks[0]?.title
      } to the queue 🎧`
    )
  }

  public pause = async (interaction: CommandInteraction<CacheType>) => {
    if (!this._beforeQueueInteraction(interaction)) return
    this._queue.setPaused(true)
    return interaction.reply(`⏸ Paused`)
  }

  public unpause = async (interaction: CommandInteraction<CacheType>) => {
    if (!this._beforeQueueInteraction(interaction)) return
    this._queue.setPaused(false)
    return interaction.reply(`▶️ Unpaused`)
  }

  public stop = async (interaction: CommandInteraction<CacheType>) => {
    if (!this._beforeQueueInteraction(interaction)) return
    this._queue.destroy()
    return interaction.reply(`💀 Gone`)
  }

  public skip = async (interaction: CommandInteraction<CacheType>) => {
    if (!this._beforeQueueInteraction(interaction)) return
    this._queue.skip()
    return interaction.reply(`⏭ Skipped`)
  }

  public back = async (interaction: CommandInteraction<CacheType>) => {
    if (!this._beforeQueueInteraction(interaction)) return
    this._queue.back()
    return interaction.reply(`⏮ Backed`)
  }

  public clear = async (interaction: CommandInteraction<CacheType>) => {
    if (!this._beforeQueueInteraction(interaction)) return
    this._queue.clear()
    return interaction.reply(`😶 Cleared`)
  }

  public queue = async (interaction: CommandInteraction<CacheType>) => {
    if (!this._beforeQueueInteraction(interaction)) return
    const embed = new MessageEmbed()
    const methods = ['', '🔁', '🔂']

    embed.setColor('RED')
    embed.setThumbnail(this._guild.iconURL({ size: 2048, dynamic: true }) || '')
    embed.setTitle(
      `Server queue - ${this._guild.name} ${methods[this._queue.repeatMode]}`
    )

    const tracks = this._queue.tracks.map(
      (track, i) =>
        `**${i + 1}** - ${track.title} | ${track.author} (requested by : ${
          track.requestedBy.username
        })`
    )

    const songs = this._queue.tracks.length
    const nextSongs =
      songs > 5
        ? `And **${songs - 5}** other song(s)...`
        : `In the playlist **${songs}** song(s)...`

    embed.setDescription(
      `Current ${this._queue.current.title}\n\n${tracks
        .slice(0, 5)
        .join('\n')}\n\n${nextSongs}`
    )

    embed.setTimestamp()
    return interaction.reply({
      embeds: [embed],
    })
  }

  public remove = async (interaction: CommandInteraction<CacheType>) => {
    if (!this._beforeQueueInteraction(interaction)) return
    let no = interaction.options.getInteger('no')
    if (!no) return
    const track = this._queue.remove(no - 1)
    if (!track) {
      return interaction.reply(`Song no.${no} not found`)
    }
    return interaction.reply(
      `Removed **${no}** - ${track.title} from the queue ❌`
    )
  }

  public volume = async (interaction: CommandInteraction<CacheType>) => {
    const maxVol = 100
    const vol = interaction.options.getInteger('level')
    if (!vol) return

    if (!vol)
      return interaction.reply(
        `The current volume is ${this._queue.volume} 🔊\n*To change the volume enter a valid number between **1** and **${maxVol}**.*`
      )

    if (this._queue.volume === vol)
      return interaction.reply(
        `The volume you want to change is already the current one... try again ? ❌`
      )

    if (vol < 0 || vol > maxVol)
      return interaction.reply(
        `The specified number is not valid. Enter a number between **1** and **${maxVol}** try again ? ❌`
      )

    const success = this._queue.setVolume(vol)

    return interaction.reply(
      success
        ? `The volume has been modified to **${vol}**/**${maxVol}**% 🔊`
        : `Something went wrong... try again ? ❌`
    )
  }

  private _beforeQueueInteraction = async (
    interaction: CommandInteraction<CacheType>
  ): Promise<void> => {
    if (!interaction.guild) {
      return interaction.reply({
        content: 'Seems like nothing is playing',
        ephemeral: true,
      })
    }
    const queue = this._player.getQueue(interaction.guild)
    if (!queue) {
      return interaction.reply({
        content: 'Seems like nothing is playing',
        ephemeral: true,
      })
    }
    if (!queue.tracks[0]) {
      return interaction.reply({
        content: 'No more song in the queue',
        ephemeral: true,
      })
    }
  }
}
