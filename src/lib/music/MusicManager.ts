import { promisify } from "util";
import * as ytdl from "ytdl-core";
import { User, Guild, VoiceChannel, StreamDispatcher, VoiceConnection } from "discord.js";
import BoebotClient from "../Client";

const getInfoAsync: Function = promisify(ytdl.getInfo);

interface IMetadata {
	url: string;
	title: string;
	requester: User;
	loudness: ytdl.videoInfo["loudness"];
	seconds: number;
	opus: boolean;
}

export default class MusicManager {
	public client: BoebotClient;
	public guild: Guild;
	public recentlyPlayed: string[];
	public queue: IMetadata[];
	public dispatcher: StreamDispatcher;
	public autoplay: boolean;
	public next: any;
	public status: string;

	public constructor(guild: Guild) {
		Object.defineProperty(this, "client", { value: guild.client });

		Object.defineProperty(this, "guild", { value: guild });

		this.recentlyPlayed = new Array(10);
		this.queue = [];
		this.dispatcher = null;
		this.autoplay = false;
		this.next = null;
		this.status = "idle";
	}

	public async add(user: User, url: string): Promise<IMetadata> {
		const song: ytdl.videoInfo = await getInfoAsync(url).catch((err: Error) => {
			this.client.emit("log", err, "error");
			throw `❌ | Something happened with YouTube URL: ${url}\n${"```"}${err}${"```"}`;
		});

		const metadata: IMetadata = {
			url: `https://youtu.be/${song.video_id}`,
			title: song.title,
			requester: user,
			loudness: song.loudness,
			seconds: parseInt(song.length_seconds),
			opus: Boolean(song.formats.find((format: ytdl.videoFormat) => format.type === 'audio/webm; codecs="opus"'))
		};

		this.queue.push(metadata);

		this.next = this.getLink(song.related_videos);

		return metadata;
	}

	public getLink(playlist: ytdl.videoInfo["related_videos"]) {
		for (const song of playlist) {
			if (!song.id || this.recentlyPlayed.includes(`https://youtu.be/${song.id}`)) continue;
			return `https://youtu.be/${song.id}`;
		}

		return null;
	}

	public join(channel: VoiceChannel): Promise<VoiceConnection> {
		return channel.join().catch((err: Error) => {
			if (String(err).includes("ECONNRESET")) throw "❌ | There was an issue connecting to the voice channel.";
			this.client.emit("log", err, "error");
			throw err;
		});
	}

	public async leave(): Promise<this> {
		if (!this.voiceChannel) throw "❌ | I am not in a voice channel.";
		this.dispatcher = null;
		this.status = "idle";

		await this.voiceChannel.leave();

		return this;
	}

	public async play(): Promise<StreamDispatcher> {
		if (!this.voiceChannel) throw "❌ | I am not in a voice channel.";
		else if (!this.connection) throw "❌ | I could not find a connection.";
		else if (this.queue.length === 0) throw "❌ | The queue is empty.";

		const song = this.queue[0];
		this.pushPlayed(song.url);

		const stream = ytdl(song.url, {
			filter: song.opus ?
				(format: ytdl.videoFormat) => format.type === `audio/webm; codecs="opus"` :	"audioonly"
		}).on("error", err => this.client.emit("log", err, "error"));

		this.dispatcher = this.connection.play(stream, { type: song.opus ? "webm/opus" : "unknown", passes: 5, volume: 0.3 });

		return this.dispatcher;
	}

	public pushPlayed(url: string): void {
		this.recentlyPlayed.push(url);
		this.recentlyPlayed.shift();
	}

	public pause(): this {
		this.dispatcher.pause();
		this.status = "paused";
		return this;
	}

	public resume(): this {
		this.dispatcher.resume();
		this.status = "playing";
		return this;
	}

	public skip(force = false): this {
		if (force && this.dispatcher) this.dispatcher.end();
		else this.queue.shift();
		return this;
	}

	public prune(): this {
		this.queue = [];
		return this;
	}

	public async destroy(): Promise<void> {
		if (this.voiceChannel) await this.voiceChannel.leave();

		this.recentlyPlayed = null;
		this.dispatcher = null;
		this.status = null;
		this.queue = null;
		this.autoplay = null;
		this.next = null;

		this.client.queue.delete(this.guild.id);
	}

	public get voiceChannel(): VoiceChannel {
		return this.guild.me.voiceChannel;
	}

	public get connection(): VoiceConnection {
		return this.voiceChannel ? this.voiceChannel.connection : null;
	}
}
