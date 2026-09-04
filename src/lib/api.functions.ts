import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type PublicProfile = {
  id: string;
  email: string;
  display_name: string;
  balance: number;
  total_earnings: number;
  referral_code: string;
  role: "admin" | "user";
};

export type LinkRow = {
  id: string;
  alias: string;
  destination: string;
  title: string | null;
  is_active: boolean;
  clicks: number;
  earnings: number;
  created_at: string;
};

export type ClickRow = {
  id: string;
  country_code: string;
  device: string | null;
  referrer: string | null;
  earned: number;
  created_at: string;
};

export type WithdrawalRow = {
  id: string;
  user_id: string;
  user_email?: string;
  amount: number;
  method: string;
  account_details: string;
  status: string;
  created_at: string;
};

const aliasRegex = /^[a-zA-Z0-9-_]{3,32}$/;

/* ---------------------------------- auth ---------------------------------- */

export const signUp = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        email: z.string().email(),
        password: z.string().min(6),
        display_name: z.string().max(60).optional(),
        ref: z.string().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<PublicProfile> => {
    const { collections } = await import("./db.server");
    const { hashPassword, createSessionCookie, randomReferralCode } = await import(
      "./auth.server"
    );
    const { users } = await collections();
    const email = data.email.toLowerCase().trim();
    if (await users.findOne({ email })) throw new Error("This email is already registered.");

    const referrer = data.ref ? await users.findOne({ referral_code: data.ref }) : null;
    const isFirstUser = (await users.countDocuments()) === 0;
    const doc = {
      email,
      password_hash: await hashPassword(data.password),
      display_name: data.display_name?.trim() || email.split("@")[0]!,
      balance: 0,
      total_earnings: 0,
      referral_code: randomReferralCode(),
      referred_by: referrer ? String(referrer._id) : null,
      role: isFirstUser ? ("admin" as const) : ("user" as const),
      created_at: new Date(),
    };
    const res = await users.insertOne(doc as never);
    await createSessionCookie(String(res.insertedId));
    return {
      id: String(res.insertedId),
      email: doc.email,
      display_name: doc.display_name,
      balance: 0,
      total_earnings: 0,
      referral_code: doc.referral_code,
      role: doc.role,
    };
  });

export const signIn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ email: z.string().email(), password: z.string().min(1) }).parse(input),
  )
  .handler(async ({ data }): Promise<PublicProfile> => {
    const { collections } = await import("./db.server");
    const { verifyPassword, createSessionCookie } = await import("./auth.server");
    const { users } = await collections();
    const user = await users.findOne({ email: data.email.toLowerCase().trim() });
    if (!user || !(await verifyPassword(data.password, user.password_hash))) {
      throw new Error("Wrong email or password.");
    }
    await createSessionCookie(String(user._id));
    return {
      id: String(user._id),
      email: user.email,
      display_name: user.display_name,
      balance: user.balance,
      total_earnings: user.total_earnings,
      referral_code: user.referral_code,
      role: user.role,
    };
  });

export const signOut = createServerFn({ method: "POST" }).handler(async () => {
  const { clearSessionCookie } = await import("./auth.server");
  clearSessionCookie();
  return { ok: true };
});

export const getMe = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicProfile | null> => {
    const { currentUserId } = await import("./auth.server");
    const id = await currentUserId();
    if (!id) return null;
    const { collections } = await import("./db.server");
    const { ObjectId } = await import("mongodb");
    const { users } = await collections();
    const user = await users.findOne({ _id: new ObjectId(id) });
    if (!user) return null;
    return {
      id: String(user._id),
      email: user.email,
      display_name: user.display_name,
      balance: user.balance,
      total_earnings: user.total_earnings,
      referral_code: user.referral_code,
      role: user.role,
    };
  },
);

export const updateProfile = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ display_name: z.string().min(1).max(60) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { requireUserId } = await import("./auth.server");
    const { collections } = await import("./db.server");
    const { ObjectId } = await import("mongodb");
    const id = await requireUserId();
    const { users } = await collections();
    await users.updateOne(
      { _id: new ObjectId(id) },
      { $set: { display_name: data.display_name.trim() } },
    );
    return { ok: true };
  });

/* --------------------------------- public --------------------------------- */

export const listRates = createServerFn({ method: "GET" }).handler(async () => {
  const { collections } = await import("./db.server");
  const { rates } = await collections();
  const docs = await rates.find({}).sort({ cpm: -1 }).toArray();
  return docs.map((r) => ({
    id: String(r._id),
    country_code: r.country_code,
    country_name: r.country_name,
    cpm: r.cpm,
  }));
});

export const getSettings = createServerFn({ method: "GET" }).handler(async () => {
  const { collections } = await import("./db.server");
  const { settings } = await collections();
  const docs = await settings.find({}).toArray();
  return Object.fromEntries(docs.map((s) => [s._id, s.value])) as Record<string, string>;
});

export const getAnnouncement = createServerFn({ method: "GET" }).handler(async () => {
  const { collections } = await import("./db.server");
  const { announcements } = await collections();
  const doc = await announcements.find({ is_active: true }).sort({ created_at: -1 }).limit(1).next();
  return doc ? { title: doc.title, body: doc.body } : null;
});

export const getSiteStats = createServerFn({ method: "GET" }).handler(async () => {
  const { collections } = await import("./db.server");
  const { users, links, clicks } = await collections();
  const [userCount, linkCount, clickCount] = await Promise.all([
    users.countDocuments(),
    links.countDocuments(),
    clicks.countDocuments(),
  ]);
  return { users: userCount, links: linkCount, clicks: clickCount };
});

/* ---------------------------------- links --------------------------------- */

export const createLink = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        destination: z.string().url(),
        alias: z.string().optional(),
        title: z.string().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { requireUserId } = await import("./auth.server");
    const { collections } = await import("./db.server");
    const userId = await requireUserId();
    const { links } = await collections();

    const alias = (data.alias ?? "").trim() || randomAliasServer();
    if (!aliasRegex.test(alias)) throw new Error("Custom name: 3-32 letters, numbers or dashes.");
    if (await links.findOne({ alias })) throw new Error("That custom name is already taken.");

    await links.insertOne({
      user_id: userId,
      alias,
      destination: data.destination,
      title: data.title?.trim() || null,
      is_active: true,
      clicks: 0,
      earnings: 0,
      created_at: new Date(),
    } as never);
    return { alias };
  });

export const createLinksBulk = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ destinations: z.array(z.string().url()).min(1).max(100) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { requireUserId } = await import("./auth.server");
    const { collections } = await import("./db.server");
    const userId = await requireUserId();
    const { links } = await collections();
    const docs = data.destinations.map((destination) => ({
      user_id: userId,
      alias: randomAliasServer(),
      destination,
      title: null,
      is_active: true,
      clicks: 0,
      earnings: 0,
      created_at: new Date(),
    }));
    await links.insertMany(docs as never[]);
    return { created: docs.length };
  });

export const listMyLinks = createServerFn({ method: "GET" }).handler(
  async (): Promise<LinkRow[]> => {
    const { requireUserId } = await import("./auth.server");
    const { collections } = await import("./db.server");
    const userId = await requireUserId();
    const { links } = await collections();
    const docs = await links.find({ user_id: userId }).sort({ created_at: -1 }).toArray();
    return docs.map((l) => ({
      id: String(l._id),
      alias: l.alias,
      destination: l.destination,
      title: l.title,
      is_active: l.is_active,
      clicks: l.clicks,
      earnings: l.earnings,
      created_at: l.created_at.toISOString(),
    }));
  },
);

export const setLinkActive = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ id: z.string(), is_active: z.boolean() }).parse(input),
  )
  .handler(async ({ data }) => {
    const { requireUserId } = await import("./auth.server");
    const { collections } = await import("./db.server");
    const { ObjectId } = await import("mongodb");
    const userId = await requireUserId();
    const { links } = await collections();
    await links.updateOne(
      { _id: new ObjectId(data.id), user_id: userId },
      { $set: { is_active: data.is_active } },
    );
    return { ok: true };
  });

export const deleteLink = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const { requireUserId } = await import("./auth.server");
    const { collections } = await import("./db.server");
    const { ObjectId } = await import("mongodb");
    const userId = await requireUserId();
    const { links, clicks } = await collections();
    await links.deleteOne({ _id: new ObjectId(data.id), user_id: userId });
    await clicks.deleteMany({ link_id: data.id });
    return { ok: true };
  });

export const listMyClicks = createServerFn({ method: "GET" }).handler(
  async (): Promise<ClickRow[]> => {
    const { requireUserId } = await import("./auth.server");
    const { collections } = await import("./db.server");
    const userId = await requireUserId();
    const { clicks } = await collections();
    const docs = await clicks.find({ user_id: userId }).sort({ created_at: -1 }).limit(500).toArray();
    return docs.map((c) => ({
      id: String(c._id),
      country_code: c.country_code,
      device: c.device,
      referrer: c.referrer,
      earned: c.earned,
      created_at: c.created_at.toISOString(),
    }));
  },
);

/* -------------------------------- redirect -------------------------------- */

export const resolveAlias = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ alias: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const { collections } = await import("./db.server");
    const { links, settings } = await collections();
    const link = await links.findOne({ alias: data.alias });
    const waitDoc = await settings.findOne({ _id: "ad_wait_seconds" });
    if (!link || !link.is_active) return null;
    return {
      id: String(link._id),
      destination: link.destination,
      title: link.title,
      wait: Number(waitDoc?.value ?? 8),
    };
  });

export const recordClick = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        link_id: z.string(),
        country_code: z.string().max(4).default("XX"),
        device: z.string().max(20).optional(),
        referrer: z.string().max(400).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { collections } = await import("./db.server");
    const { ObjectId } = await import("mongodb");
    const { links, clicks, rates, users } = await collections();
    const link = await links.findOne({ _id: new ObjectId(data.link_id) });
    if (!link) return { earned: 0 };

    const code = data.country_code.toUpperCase();
    const rate = (await rates.findOne({ country_code: code })) ?? (await rates.findOne({ country_code: "XX" }));
    const earned = Number(((rate?.cpm ?? 1.5) / 1000).toFixed(6));

    await clicks.insertOne({
      link_id: String(link._id),
      user_id: link.user_id,
      country_code: code,
      device: data.device ?? null,
      referrer: data.referrer ?? null,
      earned,
      created_at: new Date(),
    } as never);
    await links.updateOne({ _id: link._id }, { $inc: { clicks: 1, earnings: earned } });
    if (link.user_id) {
      await users.updateOne(
        { _id: new ObjectId(link.user_id) },
        { $inc: { balance: earned, total_earnings: earned } },
      );
      const owner = await users.findOne({ _id: new ObjectId(link.user_id) });
      const percentDoc = await (await collections()).settings.findOne({ _id: "referral_percent" });
      const percent = Number(percentDoc?.value ?? 20);
      if (owner?.referred_by && percent > 0) {
        const bonus = Number(((earned * percent) / 100).toFixed(6));
        await users.updateOne(
          { _id: new ObjectId(owner.referred_by) },
          { $inc: { balance: bonus, total_earnings: bonus } },
        );
      }
    }
    return { earned };
  });

/* ------------------------------- withdrawals ------------------------------- */

export const requestWithdrawal = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        amount: z.number().positive(),
        method: z.string().min(1),
        account_details: z.string().min(3),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { requireUserId } = await import("./auth.server");
    const { collections } = await import("./db.server");
    const { ObjectId } = await import("mongodb");
    const userId = await requireUserId();
    const { users, withdrawals, settings } = await collections();
    const user = await users.findOne({ _id: new ObjectId(userId) });
    if (!user) throw new Error("Account not found.");
    const minDoc = await settings.findOne({ _id: "min_withdrawal" });
    const min = Number(minDoc?.value ?? 5);
    if (data.amount < min) throw new Error(`Minimum withdrawal is $${min.toFixed(2)}.`);
    if (data.amount > user.balance) throw new Error("Amount is more than your balance.");

    await users.updateOne({ _id: user._id }, { $inc: { balance: -data.amount } });
    await withdrawals.insertOne({
      user_id: userId,
      amount: data.amount,
      method: data.method,
      account_details: data.account_details.trim(),
      status: "pending",
      created_at: new Date(),
      processed_at: null,
    } as never);
    return { ok: true };
  });

export const listMyWithdrawals = createServerFn({ method: "GET" }).handler(
  async (): Promise<WithdrawalRow[]> => {
    const { requireUserId } = await import("./auth.server");
    const { collections } = await import("./db.server");
    const userId = await requireUserId();
    const { withdrawals } = await collections();
    const docs = await withdrawals.find({ user_id: userId }).sort({ created_at: -1 }).toArray();
    return docs.map(mapWithdrawal);
  },
);

export const getReferralStats = createServerFn({ method: "GET" }).handler(async () => {
  const { requireUserId } = await import("./auth.server");
  const { collections } = await import("./db.server");
  const userId = await requireUserId();
  const { users } = await collections();
  const referred = await users.find({ referred_by: userId }).sort({ created_at: -1 }).toArray();
  return referred.map((u) => ({
    id: String(u._id),
    display_name: u.display_name,
    joined: u.created_at.toISOString(),
    total_earnings: u.total_earnings,
  }));
});

/* ---------------------------------- admin --------------------------------- */

async function requireAdmin() {
  const { requireUserId } = await import("./auth.server");
  const { collections } = await import("./db.server");
  const { ObjectId } = await import("mongodb");
  const id = await requireUserId();
  const { users } = await collections();
  const user = await users.findOne({ _id: new ObjectId(id) });
  if (!user || user.role !== "admin") throw new Error("Admins only.");
  return id;
}

export const adminOverview = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const { collections } = await import("./db.server");
  const { users, links, clicks, withdrawals } = await collections();
  const [userCount, linkCount, clickCount, pending] = await Promise.all([
    users.countDocuments(),
    links.countDocuments(),
    clicks.countDocuments(),
    withdrawals.countDocuments({ status: "pending" }),
  ]);
  const paidAgg = await withdrawals
    .aggregate([{ $match: { status: "paid" } }, { $group: { _id: null, total: { $sum: "$amount" } } }])
    .toArray();
  return {
    users: userCount,
    links: linkCount,
    clicks: clickCount,
    pending,
    paid: Number(paidAgg[0]?.["total"] ?? 0),
  };
});

export const adminListUsers = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const { collections } = await import("./db.server");
  const { users } = await collections();
  const docs = await users.find({}).sort({ created_at: -1 }).limit(200).toArray();
  return docs.map((u) => ({
    id: String(u._id),
    email: u.email,
    display_name: u.display_name,
    balance: u.balance,
    total_earnings: u.total_earnings,
    role: u.role,
    created_at: u.created_at.toISOString(),
  }));
});

export const adminSetRole = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ id: z.string(), role: z.enum(["admin", "user"]) }).parse(input),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const { collections } = await import("./db.server");
    const { ObjectId } = await import("mongodb");
    const { users } = await collections();
    await users.updateOne({ _id: new ObjectId(data.id) }, { $set: { role: data.role } });
    return { ok: true };
  });

export const adminListWithdrawals = createServerFn({ method: "GET" }).handler(
  async (): Promise<WithdrawalRow[]> => {
    await requireAdmin();
    const { collections } = await import("./db.server");
    const { ObjectId } = await import("mongodb");
    const { withdrawals, users } = await collections();
    const docs = await withdrawals.find({}).sort({ created_at: -1 }).limit(200).toArray();
    const owners = await users
      .find({ _id: { $in: docs.map((d) => new ObjectId(d.user_id)) } })
      .toArray();
    const byId = new Map(owners.map((o) => [String(o._id), o.email]));
    return docs.map((d) => ({ ...mapWithdrawal(d), user_email: byId.get(d.user_id) ?? "—" }));
  },
);

export const adminUpdateWithdrawal = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ id: z.string(), status: z.enum(["paid", "rejected", "pending"]) }).parse(input),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const { collections } = await import("./db.server");
    const { ObjectId } = await import("mongodb");
    const { withdrawals, users } = await collections();
    const doc = await withdrawals.findOne({ _id: new ObjectId(data.id) });
    if (!doc) throw new Error("Withdrawal not found.");
    if (data.status === "rejected" && doc.status === "pending") {
      await users.updateOne({ _id: new ObjectId(doc.user_id) }, { $inc: { balance: doc.amount } });
    }
    await withdrawals.updateOne(
      { _id: doc._id },
      { $set: { status: data.status, processed_at: new Date() } },
    );
    return { ok: true };
  });

export const adminSaveRate = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        country_code: z.string().min(2).max(4),
        country_name: z.string().min(2),
        cpm: z.number().min(0),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const { collections } = await import("./db.server");
    const { rates } = await collections();
    await rates.updateOne(
      { country_code: data.country_code.toUpperCase() },
      { $set: { country_name: data.country_name, cpm: data.cpm } },
      { upsert: true },
    );
    return { ok: true };
  });

export const adminSaveSetting = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ key: z.string().min(1), value: z.string() }).parse(input),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const { collections } = await import("./db.server");
    const { settings } = await collections();
    await settings.updateOne({ _id: data.key }, { $set: { value: data.value } }, { upsert: true });
    return { ok: true };
  });

export const adminSaveAnnouncement = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ title: z.string().min(2), body: z.string().min(2) }).parse(input),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const { collections } = await import("./db.server");
    const { announcements } = await collections();
    await announcements.updateMany({}, { $set: { is_active: false } });
    await announcements.insertOne({
      title: data.title,
      body: data.body,
      is_active: true,
      created_at: new Date(),
    } as never);
    return { ok: true };
  });

/* --------------------------------- helpers -------------------------------- */

function mapWithdrawal(d: {
  _id: unknown;
  user_id: string;
  amount: number;
  method: string;
  account_details: string;
  status: string;
  created_at: Date;
}): WithdrawalRow {
  return {
    id: String(d._id),
    user_id: d.user_id,
    amount: d.amount,
    method: d.method,
    account_details: d.account_details,
    status: d.status,
    created_at: d.created_at.toISOString(),
  };
}

function randomAliasServer(length = 6) {
  const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let out = "";
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return out;
}
