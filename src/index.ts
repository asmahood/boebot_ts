import BoebotClient from "./lib/Client";
import { KlasaClient } from "klasa";

const { token }: { token: string } = require("../settings.json");

const client: BoebotClient = new BoebotClient();

client.login(token);
