import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Code2, Link2, Share2, Zap } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/tools")({
  head: () => ({
    meta: [
      { title: "Publisher tools — Rootx Shortner" },
      {
        name: "description",
        content:
          "Quick link tool, developer API details and a full-page script to turn every outgoing link into an earning link.",
      },
      { property: "og:title", content: "Publisher tools — Rootx Shortner" },
      {
        property: "og:description",
        content: "Quick link tool, API endpoint and full-page script for Rootx Shortner.",
      },
    ],
  }),
  component: ToolsPage,
});

function ToolsPage() {
  const [token, setToken] = useState("YOUR_API_TOKEN");

  return (
    <SiteLayout>
      <section className="bg-soft-gradient py-14">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h1 className="text-3xl font-bold md:text-4xl">Publisher tools</h1>
          <p className="mt-3 text-muted-foreground">
            Everything you need to turn your traffic into revenue.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-4 py-12 md:grid-cols-2">
        {[
          {
            icon: Link2,
            title: "Quick link",
            text: "Shorten any URL straight from the homepage — no account needed to try it.",
          },
          {
            icon: Zap,
            title: "Mass shrinker",
            text: "Paste many links at once in your dashboard and shorten them in one go.",
          },
          {
            icon: Share2,
            title: "Referral program",
            text: "Invite friends and earn a share of everything they make, for life.",
          },
          {
            icon: Code2,
            title: "Developer API",
            text: "Create short links programmatically from your own site or app.",
          },
        ].map((t) => (
          <Card key={t.title}>
            <CardHeader>
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <t.icon className="size-5" />
              </span>
              <CardTitle className="mt-3">{t.title}</CardTitle>
              <CardDescription>{t.text}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-16">
        <Card className="shadow-float">
          <CardHeader>
            <CardTitle>Developer API</CardTitle>
            <CardDescription>
              Paste your token below and copy the ready-made request.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="token">Your API token</Label>
              <Input id="token" value={token} onChange={(e) => setToken(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="snippet">Request</Label>
              <Textarea
                id="snippet"
                readOnly
                rows={4}
                className="font-mono text-xs"
                value={`POST /api/public/shorten\ncontent-type: application/json\n\n{ "token": "${token}", "url": "https://example.com/page" }`}
              />
            </div>
          </CardContent>
        </Card>
      </section>
    </SiteLayout>
  );
}
