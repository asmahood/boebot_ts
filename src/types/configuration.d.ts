import { Configuration } from "klasa";
import { Snowflake } from "discord.js";

type ModSchema = {
	modRole: Snowflake;
	adminRole: Snowflake;
	modlog: Snowflake;
}

type MusicSchema = {
	musicTC: Snowflake;
}

export class ConfigurationSchema extends Configuration {
	public mod: ModSchema;
	public music: MusicSchema;
	public prefix: string
}
