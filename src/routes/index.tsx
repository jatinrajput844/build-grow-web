import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  BarChart3,
  Check,
  Copy,
  DollarSign,
  Globe2,
  Link2,
  Megaphone,
  Rocket,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createLink, getAnnouncement, listRates } from "@/lib/api.functions";
import { useAuth } from "@/hooks/useAuth";
import { normalizeUrl, shortUrl } from "@/lib/shortener";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Rootx Shortner — Shorten links, share and earn per view" },
      {
        name: "description",
        content:
          "Create short links in one click, track every visitor by country and device, and earn money for each 1000 views with Rootx Shortner.",
      },
      { property: "og:title", content: "Rootx Shortner — Shorten links and earn per view" },
      {
        property: "og:description",
        content: "Free URL shortener with click analytics and per-country payout rates.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [alias, setAlias] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: rates } = useQuery({
    queryKey: ["top-rates"],
    queryFn: async () => (await listRates()).slice(0, 5),
  });

  const { data: announcement } = useQuery({
    queryKey: ["announcement"],
    queryFn: () => getAnnouncement(),
  });

  const create = async () => {
    const destination = normalizeUrl(url);
    if (!destination) {
      toast.error("Please enter a valid URL");
      return;
    }
    if (!user) {
      toast.info("Create a free account to save your links and earn");
      void navigate({ to: "/auth" });
      return;
    }
    const custom = alias.trim().toLowerCase();
    if (custom && !/^[a-z0-9-]{3,32}$/.test(custom)) {
      toast.error("Custom alias: 3-32 letters, numbers or dashes");
      return;
    }
    setBusy(true);
    try {
      const created = await createLink({
        data: { destination, ...(custom ? { alias: custom } : {}) },
      });
      setResult(shortUrl(created.alias));
      setUrl("");
      setAlias("");
    } catch (err) {
      setBusy(false);
      toast.error(err instanceof Error ? err.message : "Could not create the link");
      return;
    }
    setBusy(false);
    toast.success("Short link created");
  };

  const copy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <SiteLayout>
      <section className="bg-soft-gradient">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center md:py-24">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-4 py-1.5 text-xs font-semibold text-primary">
            <Zap className="size-3.5" /> Highest paying URL shortener
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold tracking-tight md:text-6xl">
            Shorten your links and <span className="text-hero-gradient">get paid</span> for every
            visitor
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
            Rootx Shortner pays you for the traffic you already have. Shrink any link, share it
            anywhere, and watch real-time clicks and earnings in your dashboard.
          </p>

          <Card className="mx-auto mt-10 max-w-3xl shadow-float">
            <CardContent className="p-5">
              <div className="flex flex-col gap-3 md:flex-row">
                <Input
                  placeholder="Paste your long link here..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && void create()}
                  className="h-12 md:flex-1"
                />
                <Input
                  placeholder="custom alias (optional)"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  className="h-12 md:w-52"
                />
                <Button size="lg" className="h-12" disabled={busy} onClick={() => void create()}>
                  <Link2 className="size-4" /> {busy ? "Creating..." : "Shorten"}
                </Button>
              </div>
              {result && (
                <div className="mt-4 flex flex-col items-center gap-3 rounded-lg border border-border bg-primary-soft px-4 py-3 md:flex-row md:justify-between">
                  <code className="text-sm font-semibold text-primary">{result}</code>
                  <Button size="sm" variant="outline" onClick={() => void copy()}>
                    {copied ? <Check className="size-4" /> : <Copy className="size-4" />} Copy
                  </Button>
                </div>
              )}
              <p className="mt-3 text-xs text-muted-foreground">
                Free forever. No credit card. Minimum withdrawal only $5.
              </p>
            </CardContent>
          </Card>

          {announcement && (
            <div className="mx-auto mt-8 flex max-w-3xl items-start gap-3 rounded-xl border border-border bg-card p-4 text-left">
              <Megaphone className="mt-0.5 size-5 shrink-0 text-primary" />
              <div>
                <p className="font-semibold">{announcement.title}</p>
                <p className="text-sm text-muted-foreground">{announcement.body}</p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-3xl font-bold">Why publishers choose Rootx</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            {
              icon: DollarSign,
              title: "High CPM payouts",
              text: "Country-based rates up to $12 per 1000 views, credited to your balance instantly.",
            },
            {
              icon: BarChart3,
              title: "Real-time analytics",
              text: "Track clicks, countries, devices and referrers for every single link you create.",
            },
            {
              icon: ShieldCheck,
              title: "Fast, safe payouts",
              text: "Request a withdrawal from $5 through your preferred payment method.",
            },
          ].map((f) => (
            <Card key={f.title} className="shadow-card">
              <CardContent className="p-6">
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <f.icon className="size-5" />
                </span>
                <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-end">
            <div>
              <h2 className="text-3xl font-bold">Top payout rates</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Earnings are calculated per 1000 views based on visitor country.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link to="/rates">
                <Globe2 className="size-4" /> See all countries
              </Link>
            </Button>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {rates?.map((r) => (
              <div
                key={r.country_code}
                className="rounded-xl border border-border bg-background p-4 text-center"
              >
                <p className="text-xs font-semibold text-muted-foreground">{r.country_name}</p>
                <p className="mt-2 text-2xl font-extrabold text-primary">
                  ${Number(r.cpm).toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">per 1000 views</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-3xl font-bold">How it works</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            { step: "1", title: "Create an account", text: "Sign up free with email or Google." },
            { step: "2", title: "Shorten your link", text: "Paste any URL and get a short link." },
            { step: "3", title: "Share and earn", text: "Get paid for every visitor who opens it." },
          ].map((s) => (
            <div key={s.step} className="rounded-xl border border-border bg-card p-6">
              <span className="flex size-9 items-center justify-center rounded-full bg-hero-gradient text-sm font-bold text-primary-foreground">
                {s.step}
              </span>
              <h3 className="mt-4 font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 rounded-2xl bg-hero-gradient p-8 text-center text-primary-foreground md:p-12">
          <h3 className="text-2xl font-bold md:text-3xl">Ready to monetize your traffic?</h3>
          <p className="mx-auto mt-3 max-w-xl text-sm opacity-90">
            Join Rootx Shortner today and turn every share into earnings.
          </p>
          <Button asChild size="lg" variant="secondary" className="mt-6">
            <Link to={user ? "/dashboard" : "/auth"}>
              <Rocket className="size-4" /> {user ? "Open dashboard" : "Start earning now"}
            </Link>
          </Button>
        </div>
      </section>
    </SiteLayout>
  );
}
