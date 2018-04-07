import { Guild, Collection, Snowflake } from "discord.js";
import BoebotClient from "../Client";
import MusicManager from "./MusicManager";

export default class MusicInterface<K, V> extends Collection<string, MusicManager> {
	public constructor(client: BoebotClient) {
		super();

		Object.defineProperty(this, "client", { value: client });
	}

	public create(guild: Guild): MusicManager {
		if (!(guild instanceof Guild)) throw "The parameter 'Guild' must be a guild instance.";
		const manager = new MusicManager(guild);
		super.set(guild.id, manager);
		return manager;
	}
}
