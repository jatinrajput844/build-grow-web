import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BarChart3, Link2, Users, Wallet } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { money2 } from "@/lib/shortener";
import {
  adminListUsers,
  adminListWithdrawals,
  adminOverview,
  adminSaveAnnouncement,
  adminSaveRate,
  adminSaveSetting,
  adminSetRole,
  adminUpdateWithdrawal,
  getSettings,
  listRates,
} from "@/lib/api.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin panel — Rootx Shortner" },
      {
        name: "description",
        content: "Manage members, payout rates, withdrawals and site settings for Rootx Shortner.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Admin panel — Rootx Shortner" },
      { property: "og:description", content: "Internal management area." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { isAdmin, loading, user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth" });
    if (!loading && user && !isAdmin) void navigate({ to: "/dashboard" });
  }, [loading, user, isAdmin, navigate]);

  const overview = useQuery({
    queryKey: ["admin-overview"],
    enabled: isAdmin,
    queryFn: () => adminOverview(),
  });
  const users = useQuery({
    queryKey: ["admin-users"],
    enabled: isAdmin,
    queryFn: () => adminListUsers(),
  });
  const payouts = useQuery({
    queryKey: ["admin-withdrawals"],
    enabled: isAdmin,
    queryFn: () => adminListWithdrawals(),
  });
  const rates = useQuery({ queryKey: ["payout_rates"], enabled: isAdmin, queryFn: () => listRates() });
  const settings = useQuery({ queryKey: ["settings"], enabled: isAdmin, queryFn: () => getSettings() });

  const [code, setCode] = useState("");
  const [country, setCountry] = useState("");
  const [cpm, setCpm] = useState("");
  const [annTitle, setAnnTitle] = useState("");
  const [annBody, setAnnBody] = useState("");
  const [minW, setMinW] = useState("");
  const [refPct, setRefPct] = useState("");
  const [wait, setWait] = useState("");

  useEffect(() => {
    if (!settings.data) return;
    setMinW(settings.data["min_withdrawal"] ?? "5");
    setRefPct(settings.data["referral_percent"] ?? "20");
    setWait(settings.data["ad_wait_seconds"] ?? "8");
  }, [settings.data]);

  if (!isAdmin) return null;

  const run = async (fn: () => Promise<unknown>, message: string, keys: string[]) => {
    try {
      await fn();
      toast.success(message);
      for (const key of keys) void qc.invalidateQueries({ queryKey: [key] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  return (
    <SiteLayout>
      <section className="bg-soft-gradient py-10">
        <div className="mx-auto max-w-6xl px-4">
          <h1 className="text-2xl font-bold md:text-3xl">Admin panel</h1>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Members", value: String(overview.data?.users ?? 0), icon: Users },
              { label: "Links", value: String(overview.data?.links ?? 0), icon: Link2 },
              { label: "Visits", value: String(overview.data?.clicks ?? 0), icon: BarChart3 },
              { label: "Paid out", value: money2(overview.data?.paid), icon: Wallet },
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
        <Tabs defaultValue="withdrawals">
          <TabsList className="flex-wrap">
            <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="rates">Payout rates</TabsTrigger>
            <TabsTrigger value="site">Site</TabsTrigger>
          </TabsList>

          <TabsContent value="withdrawals" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Withdrawal requests</CardTitle>
                <CardDescription>
                  {overview.data?.pending ?? 0} request(s) waiting for a decision.
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Member</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payouts.data?.map((w) => (
                      <TableRow key={w.id}>
                        <TableCell>{new Date(w.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>{w.user_email}</TableCell>
                        <TableCell>{money2(w.amount)}</TableCell>
                        <TableCell className="capitalize">{w.method}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {w.account_details}
                        </TableCell>
                        <TableCell className="space-x-2 text-right">
                          {w.status === "pending" ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() =>
                                  void run(
                                    () =>
                                      adminUpdateWithdrawal({
                                        data: { id: w.id, status: "paid" },
                                      }),
                                    "Marked as paid",
                                    ["admin-withdrawals", "admin-overview"],
                                  )
                                }
                              >
                                Paid
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  void run(
                                    () =>
                                      adminUpdateWithdrawal({
                                        data: { id: w.id, status: "rejected" },
                                      }),
                                    "Rejected and refunded",
                                    ["admin-withdrawals", "admin-overview"],
                                  )
                                }
                              >
                                Reject
                              </Button>
                            </>
                          ) : (
                            <span className="capitalize text-muted-foreground">{w.status}</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {!payouts.data?.length && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No withdrawal requests yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="members" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Members</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead className="text-right">Earned</TableHead>
                      <TableHead className="text-right">Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.data?.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>{u.display_name}</TableCell>
                        <TableCell className="text-right">{money2(u.balance)}</TableCell>
                        <TableCell className="text-right">{money2(u.total_earnings)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              void run(
                                () =>
                                  adminSetRole({
                                    data: {
                                      id: u.id,
                                      role: u.role === "admin" ? "user" : "admin",
                                    },
                                  }),
                                "Role updated",
                                ["admin-users"],
                              )
                            }
                          >
                            {u.role === "admin" ? "Admin" : "Member"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rates" className="mt-6 grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Add or update a country rate</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="code">Country code</Label>
                  <Input
                    id="code"
                    placeholder="US"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="country">Country name</Label>
                  <Input
                    id="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cpm">Per 1000 visits ($)</Label>
                  <Input id="cpm" value={cpm} onChange={(e) => setCpm(e.target.value)} />
                </div>
                <Button
                  className="w-full"
                  onClick={() =>
                    void run(
                      () =>
                        adminSaveRate({
                          data: {
                            country_code: code.trim(),
                            country_name: country.trim(),
                            cpm: Number(cpm),
                          },
                        }),
                      "Rate saved",
                      ["payout_rates"],
                    )
                  }
                >
                  Save rate
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current rates</CardTitle>
              </CardHeader>
              <CardContent className="max-h-[420px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Country</TableHead>
                      <TableHead className="text-right">CPM</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rates.data?.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>
                          {r.country_name} ({r.country_code})
                        </TableCell>
                        <TableCell className="text-right">${r.cpm.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="site" className="mt-6 grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Site settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="minw">Minimum withdrawal ($)</Label>
                  <Input id="minw" value={minW} onChange={(e) => setMinW(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="refp">Referral percent (%)</Label>
                  <Input id="refp" value={refPct} onChange={(e) => setRefPct(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="wait">Countdown seconds</Label>
                  <Input id="wait" value={wait} onChange={(e) => setWait(e.target.value)} />
                </div>
                <Button
                  className="w-full"
                  onClick={() =>
                    void run(
                      async () => {
                        await adminSaveSetting({ data: { key: "min_withdrawal", value: minW } });
                        await adminSaveSetting({ data: { key: "referral_percent", value: refPct } });
                        await adminSaveSetting({ data: { key: "ad_wait_seconds", value: wait } });
                      },
                      "Settings saved",
                      ["settings"],
                    )
                  }
                >
                  Save settings
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Announcement</CardTitle>
                <CardDescription>Shown on the homepage to every visitor.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="atitle">Title</Label>
                  <Input
                    id="atitle"
                    value={annTitle}
                    onChange={(e) => setAnnTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="abody">Message</Label>
                  <Textarea
                    id="abody"
                    rows={4}
                    value={annBody}
                    onChange={(e) => setAnnBody(e.target.value)}
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={() =>
                    void run(
                      () => adminSaveAnnouncement({ data: { title: annTitle, body: annBody } }),
                      "Announcement published",
                      ["announcement"],
                    )
                  }
                >
                  Publish announcement
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </SiteLayout>
  );
}
