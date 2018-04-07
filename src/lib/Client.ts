import { Client as KlasaClient, PermissionLevels, KlasaMessage } from "klasa";
import MusicInterface from "./music/MusicInterface";
import MusicManager from "./music/MusicManager";
import { ConfigurationSchema } from "../types/configuration";

const permissionLevels: PermissionLevels = new PermissionLevels()
	.add(0, () => true)
	.add(2, (client, msg) => {
		if (!msg.guild || !(msg.guild.configs as ConfigurationSchema).mod.modRole) return false;
		const modRole = msg.guild.roles.get((msg.guild.configs as ConfigurationSchema).mod.modRole);
		return modRole && msg.member.roles.has(modRole.id);
	})
	.add(3, (client, msg) => {
		if (!msg.guild || !(msg.guild.configs as ConfigurationSchema).mod.adminRole) return false;
		const adminRole = msg.guild.roles.get((msg.guild.configs as ConfigurationSchema).mod.adminRole);
		return adminRole && msg.member.roles.has(adminRole.id);
	})
	.add(6, (client, msg) => msg.guild && msg.member.permissions.has("MANAGE_GUILD"))
	.add(7, (client, msg) => msg.guild && msg.member === msg.guild.owner)
	.add(9, (client, msg) => msg.author === client.owner, { break: true })
	.add(10, (client, msg) => msg.author === client.owner);

/**
 * The magic Boebot Client.
 */
export default class BoebotClient extends KlasaClient {
	public queue: MusicInterface<string, MusicManager>;

	public constructor() {
		super({
			prefix: "b!",
			cmdEditing: true,
			providers: { default: "rethinkdb" },
			fetchAllMembers: true,
			disabledEvents: [
				"TYPING_START",
				"RELATIONSHIP_ADD",
				"RELATIONSHIP_REMOVE",
				"CHANNEL_PINS_UPDATE",
				"PRESENCE_UPDATE",
				"USER_UPDATE",
				"USER_NOTE_UPDATE"
			]
		});

		this.permissionLevels = permissionLevels;

		this.queue = new MusicInterface(this);
	}

	/**
	 * Validates that the schema keys exists. If not, it creates the keys.
	 * @returns {Promise<null>}
	 */
	public async validate(): Promise<null> {
		const { schema } = this.gateways.guilds;

		if (!schema.has("mod")) {
			await schema.add("mod", {
				modlog: { type: "TextChannel" },
				muterole: { type: "Role" },
				modRole: { type: "Role" },
				adminRole: { type: "Role" }
			});
		}

		if (!schema.has("music")) {
			await schema.add("music", {
				musicTC: { type: "TextChannel" }
			});
		}

		return null;
	}
}
