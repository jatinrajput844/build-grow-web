import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of service — Rootx Shortner" },
      {
        name: "description",
        content:
          "The rules for using Rootx Shortner: allowed content, traffic quality, payouts and account termination.",
      },
      { property: "og:title", content: "Terms of service — Rootx Shortner" },
      {
        property: "og:description",
        content: "Rules for links, traffic quality and payouts on Rootx Shortner.",
      },
    ],
  }),
  component: TermsPage,
});

const sections = [
  {
    title: "1. Your account",
    body: "You must give a valid email address and keep your login details safe. One person may hold one publisher account. We may suspend accounts that break these rules.",
  },
  {
    title: "2. Allowed links",
    body: "You may not shorten links to adult content, malware, phishing, pirated files, hate speech or anything illegal in your country. We remove such links without notice.",
  },
  {
    title: "3. Traffic quality",
    body: "Only real human visitors count. Bots, proxies, auto-refresh scripts, incentivised clicks and pop-under traffic are not paid and can lead to account closure and forfeited balance.",
  },
  {
    title: "4. Earnings and payouts",
    body: "Earnings are calculated per 1000 valid visitors using the published country rates. Withdrawals can be requested once your balance reaches the minimum shown on your dashboard and are reviewed within 72 hours.",
  },
  {
    title: "5. Referrals",
    body: "You earn a share of the earnings of people who join through your referral link, for as long as their account stays active and in good standing.",
  },
  {
    title: "6. Changes",
    body: "Rates, minimum withdrawal amounts and these terms may change. Continued use of the service after a change means you accept it.",
  },
];

function TermsPage() {
  return (
    <SiteLayout>
      <section className="bg-soft-gradient py-14">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h1 className="text-3xl font-bold md:text-4xl">Terms of service</h1>
          <p className="mt-3 text-muted-foreground">
            Please read these rules before you start sharing links.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl space-y-6 px-4 py-12">
        {sections.map((s) => (
          <article key={s.title}>
            <h2 className="text-lg font-semibold">{s.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
          </article>
        ))}
      </section>
    </SiteLayout>
  );
}
