import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BarChart3, Copy, Link2, Trash2, Users, Wallet } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createLink,
  createLinksBulk,
  deleteLink as deleteLinkFn,
  getReferralStats,
  getSettings,
  listMyClicks,
  listMyLinks,
  listMyWithdrawals,
  requestWithdrawal as requestWithdrawalFn,
  setLinkActive,
} from "@/lib/api.functions";
import { useAuth } from "@/hooks/useAuth";
import { money, money2, normalizeUrl, shortUrl } from "@/lib/shortener";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Your dashboard — Rootx Shortner" },
      {
        name: "description",
        content:
          "Manage your short links, follow your visitor statistics, request withdrawals and track referral earnings.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Your dashboard — Rootx Shortner" },
      {
        property: "og:description",
        content: "Links, statistics, withdrawals and referrals in one place.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const links = useQuery({
    queryKey: ["my-links", user?.id],
    enabled: Boolean(user),
    queryFn: () => listMyLinks(),
  });

  const clicks = useQuery({
    queryKey: ["my-clicks", user?.id],
    enabled: Boolean(user),
    queryFn: () => listMyClicks(),
  });

  const withdrawals = useQuery({
    queryKey: ["my-withdrawals", user?.id],
    enabled: Boolean(user),
    queryFn: () => listMyWithdrawals(),
  });

  const referrals = useQuery({
    queryKey: ["my-referrals", user?.id],
    enabled: Boolean(user),
    queryFn: () => getReferralStats(),
  });

  const settings = useQuery({
    queryKey: ["settings"],
    queryFn: () => getSettings(),
  });

  const [destination, setDestination] = useState("");
  const [alias, setAlias] = useState("");
  const [title, setTitle] = useState("");
  const [bulk, setBulk] = useState("");
  const [busy, setBusy] = useState(false);

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("paypal");
  const [account, setAccount] = useState("");

  const minWithdrawal = Number(settings.data?.["min_withdrawal"] ?? 5);
  const referralPercent = Number(settings.data?.["referral_percent"] ?? 20);

  const submitLink = async () => {
    const url = normalizeUrl(destination);
    if (!url) {
      toast.error("Enter a valid link, e.g. example.com/page");
      return;
    }
    setBusy(true);
    try {
      await createLink({
        data: {
          destination: url,
          ...(alias.trim() ? { alias: alias.trim() } : {}),
          ...(title.trim() ? { title: title.trim() } : {}),
        },
      });
      setDestination("");
      setAlias("");
      setTitle("");
      toast.success("Short link created");
      void qc.invalidateQueries({ queryKey: ["my-links", user?.id] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create the link");
    } finally {
      setBusy(false);
    }
  };

  const createBulk = async () => {
    const rows = bulk
      .split("\n")
      .map((r) => normalizeUrl(r))
      .filter((r): r is string => Boolean(r));
    if (!rows.length) {
      toast.error("Add one link per line");
      return;
    }
    setBusy(true);
    try {
      await createLinksBulk({ data: { destinations: rows } });
      setBulk("");
      toast.success(`${rows.length} links created`);
      void qc.invalidateQueries({ queryKey: ["my-links", user?.id] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create the links");
    } finally {
      setBusy(false);
    }
  };

  const toggleLink = async (id: string, value: boolean) => {
    await setLinkActive({ data: { id, is_active: value } });
    void qc.invalidateQueries({ queryKey: ["my-links", user?.id] });
  };

  const removeLink = async (id: string) => {
    await deleteLinkFn({ data: { id } });
    toast.success("Link deleted");
    void qc.invalidateQueries({ queryKey: ["my-links", user?.id] });
  };

  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    toast.success("Copied");
  };

  const requestWithdrawal = async () => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value < minWithdrawal) {
      toast.error(`Minimum withdrawal is ${money2(minWithdrawal)}`);
      return;
    }
    if (!account.trim()) {
      toast.error("Add your payment details");
      return;
    }
    try {
      await requestWithdrawalFn({
        data: { amount: value, method, account_details: account.trim() },
      });
      setAmount("");
      setAccount("");
      toast.success("Withdrawal requested");
      void qc.invalidateQueries({ queryKey: ["my-withdrawals", user?.id] });
      void refreshProfile();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not request the withdrawal");
    }
  };

  const totalClicks = links.data?.reduce((s, l) => s + Number(l.clicks), 0) ?? 0;
  const referralLink =
    typeof window === "undefined"
      ? ""
      : `${window.location.origin}/auth?ref=${profile?.referral_code ?? ""}`;

  const byCountry = new Map<string, number>();
  for (const c of clicks.data ?? [])
    byCountry.set(c.country_code, (byCountry.get(c.country_code) ?? 0) + 1);

  if (!user) return null;

  return (
    <SiteLayout>
      <section className="bg-soft-gradient py-10">
        <div className="mx-auto max-w-6xl px-4">
          <h1 className="text-2xl font-bold md:text-3xl">
            Hi {profile?.display_name ?? "there"} 👋
          </h1>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Balance", value: money2(profile?.balance), icon: Wallet },
              { label: "Total earnings", value: money2(profile?.total_earnings), icon: BarChart3 },
              { label: "Total visits", value: String(totalClicks), icon: Users },
              { label: "Links", value: String(links.data?.length ?? 0), icon: Link2 },
            ].map((s) => (
              <Card key={s.label}>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <s.icon className="size-4" /> {s.label}
                  </CardDescription>
                  <CardTitle className="text-2xl">{s.value}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <Tabs defaultValue="links">
          <TabsList className="flex-wrap">
            <TabsTrigger value="links">My links</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
            <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
            <TabsTrigger value="referrals">Referrals</TabsTrigger>
          </TabsList>

          <TabsContent value="links" className="mt-6 space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>New short link</CardTitle>
                  <CardDescription>Paste a destination and share the short one.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="dest">Destination link</Label>
                    <Input
                      id="dest"
                      placeholder="https://example.com/page"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="alias">Custom name (optional)</Label>
                      <Input
                        id="alias"
                        value={alias}
                        onChange={(e) => setAlias(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ""))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="title">Note (optional)</Label>
                      <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>
                  </div>
                  <Button className="w-full" disabled={busy} onClick={() => void submitLink()}>
                    Create short link
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Mass shrinker</CardTitle>
                  <CardDescription>One link per line, shortened in one go.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    rows={6}
                    value={bulk}
                    placeholder={"https://example.com/one\nhttps://example.com/two"}
                    onChange={(e) => setBulk(e.target.value)}
                  />
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={busy}
                    onClick={() => void createBulk()}
                  >
                    Shorten all
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Your links</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Short link</TableHead>
                      <TableHead>Destination</TableHead>
                      <TableHead className="text-right">Visits</TableHead>
                      <TableHead className="text-right">Earned</TableHead>
                      <TableHead className="text-right">Active</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {links.data?.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell className="font-medium">
                          <button
                            className="flex items-center gap-2 text-primary"
                            onClick={() => void copy(shortUrl(l.alias))}
                          >
                            /{l.alias} <Copy className="size-3.5" />
                          </button>
                        </TableCell>
                        <TableCell className="max-w-[220px] truncate text-muted-foreground">
                          {l.destination}
                        </TableCell>
                        <TableCell className="text-right">{l.clicks}</TableCell>
                        <TableCell className="text-right">{money(l.earnings)}</TableCell>
                        <TableCell className="text-right">
                          <Switch
                            checked={l.is_active}
                            onCheckedChange={(v) => void toggleLink(l.id, v)}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => void removeLink(l.id)}
                            aria-label="Delete link"
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!links.data?.length && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No links yet — create your first one above.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="mt-6 grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Visits by country</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Country</TableHead>
                      <TableHead className="text-right">Visits</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...byCountry.entries()]
                      .sort((a, b) => b[1] - a[1])
                      .map(([code, count]) => (
                        <TableRow key={code}>
                          <TableCell>{code}</TableCell>
                          <TableCell className="text-right">{count}</TableCell>
                        </TableRow>
                      ))}
                    {!byCountry.size && (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center text-muted-foreground">
                          No visits recorded yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Latest visits</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>When</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>Device</TableHead>
                      <TableHead className="text-right">Earned</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clicks.data?.slice(0, 25).map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>{new Date(c.created_at).toLocaleString()}</TableCell>
                        <TableCell>{c.country_code}</TableCell>
                        <TableCell>{c.device ?? "—"}</TableCell>
                        <TableCell className="text-right">{money(c.earned)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="withdrawals" className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
            <Card>
              <CardHeader>
                <CardTitle>Request a payout</CardTitle>
                <CardDescription>Minimum {money2(minWithdrawal)}.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Method</Label>
                  <Select value={method} onValueChange={setMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paypal">PayPal</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="bank">Bank transfer</SelectItem>
                      <SelectItem value="crypto">Crypto (USDT)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="account">Payment details</Label>
                  <Input
                    id="account"
                    placeholder="email, UPI id or wallet address"
                    value={account}
                    onChange={(e) => setAccount(e.target.value)}
                  />
                </div>
                <Button className="w-full" onClick={() => void requestWithdrawal()}>
                  Request withdrawal
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your requests</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {withdrawals.data?.map((w) => (
                      <TableRow key={w.id}>
                        <TableCell>{new Date(w.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>{money2(w.amount)}</TableCell>
                        <TableCell className="capitalize">{w.method}</TableCell>
                        <TableCell className="text-right capitalize">{w.status}</TableCell>
                      </TableRow>
                    ))}
                    {!withdrawals.data?.length && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          No withdrawal requests yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="referrals" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Invite and earn</CardTitle>
                <CardDescription>
                  Earn {referralPercent}% of what your invited members make.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Label htmlFor="ref">Your referral link</Label>
                <div className="flex gap-2">
                  <Input id="ref" readOnly value={referralLink} />
                  <Button variant="outline" onClick={() => void copy(referralLink)}>
                    <Copy className="size-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your referral code is <strong>{profile?.referral_code ?? "—"}</strong>.
                </p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Their earnings</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {referrals.data?.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{r.display_name}</TableCell>
                        <TableCell>{new Date(r.joined).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">{money2(r.total_earnings)}</TableCell>
                      </TableRow>
                    ))}
                    {!referrals.data?.length && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          No one has joined with your link yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </SiteLayout>
  );
}
