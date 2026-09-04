import { MongoClient, type Collection, type Db, type ObjectId } from "mongodb";

export type UserDoc = {
  _id: ObjectId;
  email: string;
  password_hash: string;
  display_name: string;
  balance: number;
  total_earnings: number;
  referral_code: string;
  referred_by: string | null;
  role: "admin" | "user";
  created_at: Date;
};

export type LinkDoc = {
  _id: ObjectId;
  user_id: string;
  alias: string;
  destination: string;
  title: string | null;
  is_active: boolean;
  clicks: number;
  earnings: number;
  created_at: Date;
};

export type ClickDoc = {
  _id: ObjectId;
  link_id: string;
  user_id: string | null;
  country_code: string;
  referrer: string | null;
  device: string | null;
  earned: number;
  created_at: Date;
};

export type WithdrawalDoc = {
  _id: ObjectId;
  user_id: string;
  amount: number;
  method: string;
  account_details: string;
  status: "pending" | "paid" | "rejected";
  created_at: Date;
  processed_at: Date | null;
};

export type RateDoc = {
  _id: ObjectId;
  country_code: string;
  country_name: string;
  cpm: number;
};

export type AnnouncementDoc = {
  _id: ObjectId;
  title: string;
  body: string;
  is_active: boolean;
  created_at: Date;
};

export type SettingDoc = { _id: string; value: string };

type GlobalWithMongo = typeof globalThis & {
  __rootxMongo?: Promise<Db>;
};

const DEFAULT_RATES: Array<Omit<RateDoc, "_id">> = [
  { country_code: "US", country_name: "United States", cpm: 12 },
  { country_code: "GB", country_name: "United Kingdom", cpm: 10.5 },
  { country_code: "CA", country_name: "Canada", cpm: 9 },
  { country_code: "AU", country_name: "Australia", cpm: 8.5 },
  { country_code: "DE", country_name: "Germany", cpm: 8 },
  { country_code: "FR", country_name: "France", cpm: 7.5 },
  { country_code: "IT", country_name: "Italy", cpm: 6 },
  { country_code: "AE", country_name: "United Arab Emirates", cpm: 5.5 },
  { country_code: "SA", country_name: "Saudi Arabia", cpm: 5 },
  { country_code: "BR", country_name: "Brazil", cpm: 3.5 },
  { country_code: "IN", country_name: "India", cpm: 3.2 },
  { country_code: "ID", country_name: "Indonesia", cpm: 2.4 },
  { country_code: "PK", country_name: "Pakistan", cpm: 2.6 },
  { country_code: "BD", country_name: "Bangladesh", cpm: 2.2 },
  { country_code: "NG", country_name: "Nigeria", cpm: 1.8 },
  { country_code: "XX", country_name: "Rest of the world", cpm: 1.5 },
];

const DEFAULT_SETTINGS: SettingDoc[] = [
  { _id: "site_name", value: "Rootx Shortner" },
  { _id: "min_withdrawal", value: "5" },
  { _id: "referral_percent", value: "20" },
  { _id: "ad_wait_seconds", value: "8" },
  { _id: "support_email", value: "support@rootx.link" },
];

async function connect(): Promise<Db> {
  const uri = process.env["MONGODB_URI"];
  if (!uri) {
    throw new Error(
      "MONGODB_URI is missing. Add your MongoDB connection string to the .env file.",
    );
  }
  const client = new MongoClient(uri, { maxPoolSize: 5 });
  await client.connect();
  const db = client.db(process.env["MONGODB_DB"] || "rootx_shortener");

  await Promise.all([
    db.collection("users").createIndex({ email: 1 }, { unique: true }),
    db.collection("users").createIndex({ referral_code: 1 }, { unique: true }),
    db.collection("links").createIndex({ alias: 1 }, { unique: true }),
    db.collection("links").createIndex({ user_id: 1 }),
    db.collection("clicks").createIndex({ link_id: 1 }),
    db.collection("clicks").createIndex({ user_id: 1, created_at: -1 }),
    db.collection("payout_rates").createIndex({ country_code: 1 }, { unique: true }),
    db.collection("withdrawals").createIndex({ user_id: 1, created_at: -1 }),
  ]);

  if ((await db.collection("payout_rates").countDocuments()) === 0) {
    await db.collection("payout_rates").insertMany(DEFAULT_RATES as never[]);
  }
  if ((await db.collection("site_settings").countDocuments()) === 0) {
    await db.collection("site_settings").insertMany(DEFAULT_SETTINGS as never[]);
  }
  if ((await db.collection("announcements").countDocuments()) === 0) {
    await db.collection("announcements").insertOne({
      title: "Welcome to Rootx Shortner",
      body: "Shorten your links, share them anywhere and earn for every visitor. Minimum withdrawal is $5.",
      is_active: true,
      created_at: new Date(),
    } as never);
  }

  return db;
}

export function getDb(): Promise<Db> {
  const g = globalThis as GlobalWithMongo;
  if (!g.__rootxMongo) {
    g.__rootxMongo = connect().catch((err: unknown) => {
      delete g.__rootxMongo;
      throw err;
    });
  }
  return g.__rootxMongo;
}

export async function collections() {
  const db = await getDb();
  return {
    db,
    users: db.collection("users") as unknown as Collection<UserDoc>,
    links: db.collection("links") as unknown as Collection<LinkDoc>,
    clicks: db.collection("clicks") as unknown as Collection<ClickDoc>,
    withdrawals: db.collection("withdrawals") as unknown as Collection<WithdrawalDoc>,
    rates: db.collection("payout_rates") as unknown as Collection<RateDoc>,
    announcements: db.collection("announcements") as unknown as Collection<AnnouncementDoc>,
    settings: db.collection("site_settings") as unknown as Collection<SettingDoc>,
  };
}
