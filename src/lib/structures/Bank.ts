import BoebotClient from "../Client";
import { BankData } from "../../types/rethinkdbprovider";
import { KlasaUser } from "klasa";

export default class Bank {
	public client: BoebotClient;
	private table: string;

	public constructor(client: BoebotClient) {
		Object.defineProperty(this, "client", { value: client });

		this.table = "bank";
		this.init();
	}

	private async init() {
		if (!(await this.provider.hasTable(this.table))) await this.provider.createTable(this.table);
	}

	public async changeBalance(user: KlasaUser, amount: number): Promise<void> {
		let row = await this.provider.get(this.table, user.id) as BankData;
		if (!row) row = await this.create(user) as BankData;
		await this.provider.update(this.table, user.id, { amount: row.amount + amount });
	}

	public async getBalance(user: KlasaUser) {
		const row = await this.provider.get(this.table, user.id) as BankData;
		return row ? row.amount : 0;
	}

	public async create(user: KlasaUser) {
		await this.provider.create(this.table, user.id, { amount: 0 });
		return this.provider.get(this.table, user.id);
	}

	public add(user: KlasaUser, amount: number) {
		return this.changeBalance(user, amount);
	}

	public remove(user: KlasaUser, amount: number) {
		return this.changeBalance(user, -amount);
	}

	public async set(user: KlasaUser, amount: number) {
		const row = await this.provider.get(this.table, user.id);
		if (!row) {
			await this.create(user);
			await this.changeBalance(user, amount);
		} else { await this.provider.update(this.table, user.id, { amount }); }
	}

	public async reset(user: KlasaUser, amount = 0) {
		const row = await this.provider.get(this.table, user.id);
		if (!row) await this.create(user);
		else await this.provider.update(this.table, user.id, { amount });
	}

	private get provider() {
		return this.client.providers.get("rethinkdb");
	}
}
