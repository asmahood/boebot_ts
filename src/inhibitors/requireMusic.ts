import { Inhibitor, InhibitorOptions, KlasaMessage, Command, InhibitorStore } from "klasa";
import BoebotClient from "../lib/Client";
import { ConfigurationSchema } from "../types/configuration";

export default class extends Inhibitor {
	public constructor(client: BoebotClient, store: InhibitorStore, file: string, core: boolean, options?: InhibitorOptions) {
		super(client, store, file, core, { spamProtection: false });
	}

	public async run(msg: KlasaMessage, cmd: Command) {
		if (cmd.category === "Music" && (msg.guild.configs as ConfigurationSchema).music.musicTC) {
			if (msg.channel.id !== (msg.guild.configs as ConfigurationSchema).music.musicTC) {
				return [
					`❌ | ${msg.author}, please head over to `,
					`${msg.guild.channels.get((msg.guild.configs as ConfigurationSchema).music.musicTC)} and use this command.`
				].join("");
			}
		}

		if (cmd.requireMusic !== true) return undefined;

		if (msg.channel.type !== "text") throw `❌ | ${msg.author}, this command can only be executed inside a server.`;

		if (!msg.member.voiceChannel) throw `❌ | ${msg.author}, you are not connected to a voice channel.`;
		if (!msg.guild.me.voiceChannel) throw `❌ | ${msg.author}, I am not connected to a voice channel.`;
		if (msg.member.voiceChannel.id !== msg.guild.me.voiceChannel.id) throw `❌ | ${msg.author}, you must be in the same voice channel as me.`;

		return undefined;
	}
}
