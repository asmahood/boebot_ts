import { KlasaGuild, KlasaUser, KlasaTextChannel, KlasaMessage } from "klasa";
import BoebotClient from "../Client";
import { ConfigurationSchema } from "../../types/configuration";
import { ModlogData } from "../../types/rethinkdbprovider";
import { MessageEmbed } from "discord.js";

export default class ModLog {
	public guild: KlasaGuild;
	public client: BoebotClient;
	public type: string;
	public user: {
		id: string;
		tag: string;
	};
	public moderator: {
		id: string;
		tag: string;
	};
	public reason: string;
	public case: number;

	public constructor(guild: KlasaGuild) {
		Object.defineProperty(this, "guild", { value: guild });

		Object.defineProperty(this, "client", { value: guild.client });

		this.type = null;
		this.user = null;
		this.moderator = null;
		this.reason = null;
	}

	public setType(type: string): this {
		this.type = type;

		return this;
	}

	public setUser(user: KlasaUser): this {
		this.user = {
			id: user.id,
			tag: user.tag
		};

		return this;
	}

	public setMod(user: KlasaUser): this {
		this.moderator = {
			id: user.id,
			tag: user.tag
		};

		return this;
	}

	public setReason(reason: string): this {
		this.reason = reason;

		return this;
	}

	public async send(): Promise<KlasaMessage | KlasaMessage[]> {
		const modlog: KlasaTextChannel = this.guild.channels.get((this.guild.configs as ConfigurationSchema).mod.modlog) as KlasaTextChannel;
		if (!modlog) throw "The modlog channel does not exist. Where did it go?";
		this.case = await this.getCase();
		return modlog.send({ embed: this.embed });
	}

	private async getCase(): Promise<number> {
		const row = await this.provider.get("modlogs", this.guild.id) as ModlogData;
		if (!row) {
			this.case = 1;
			return this.provider.create("modlogs", this.guild.id, { modlogs: [this.pack] }).then(() => 1);
		}
		this.case = row.modlogs.length + 1;
		row.modlogs.push(this.pack);
		await this.provider.replace("modlogs", this.guild.id, row);
		return row.modlogs.length;
	}

	private get pack() {
		return {
			type: this.type,
			user: this.user,
			moderator: this.moderator,
			reason: this.reason,
			case: this.case
		};
	}

	private static title(type: string): string {
		switch (type) {
			case "ban": return "Banned";
			case "unban": return "Unbanned";
			case "mute": return "Muted";
			case "unmute": return "Unmuted";
			case "kick": return "Kicked";
			case "warn": return "Warned";
			default: return "{{Unknown Action}}";
		}
	}

	private static color(type: string): number {
		switch (type) {
			case "ban": return 0xcc0000;
			case "unban": return 0x2d862d;
			case "kick": return 0xe65c00;
			case "mute":
			case "unmute": return 0x993366;
			case "warn": return 0xf2f20d;
			default: return 0xffffff;
		}
	}

	private get embed(): MessageEmbed {
		const embed = new this.client.methods.Embed()
			.setColor(ModLog.color(this.type))
			.setTitle(`User ${ModLog.title(this.type)}`)
			.setDescription([
				`**Member**: ${this.user.tag} | ${this.user.id}`,
				`**Moderator**: ${this.moderator.tag} | ${this.moderator.id}`,
				`**Reason**: ${this.reason || `No reason specified. Write '${(this.guild.configs as ConfigurationSchema).prefix}reason <case#>' to claim this log.`}`
			])
			.setFooter(`Case ${this.case}`, this.client.user.displayAvatarURL({ format: "jpg" }))
			.setTimestamp();
		return embed;
	}

	private get provider() {
		return this.client.providers.get("rethinkdb");
	}
}
