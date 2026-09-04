import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Mail, MessageSquare } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact support — Rootx Shortner" },
      {
        name: "description",
        content:
          "Questions about payouts, your account or a short link? Send the Rootx Shortner team a message and we'll reply by email.",
      },
      { property: "og:title", content: "Contact support — Rootx Shortner" },
      {
        property: "og:description",
        content: "Reach the Rootx Shortner support team about payouts, accounts and links.",
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const send = () => {
    if (!email.trim() || !message.trim()) {
      toast.error("Please add your email and a message");
      return;
    }
    const subject = encodeURIComponent(`Rootx Shortner support — ${name || email}`);
    const body = encodeURIComponent(`${message}\n\nFrom: ${name} <${email}>`);
    window.location.href = `mailto:support@rootxshortner.com?subject=${subject}&body=${body}`;
  };

  return (
    <SiteLayout>
      <section className="bg-soft-gradient py-14">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h1 className="text-3xl font-bold md:text-4xl">Contact us</h1>
          <p className="mt-3 text-muted-foreground">
            We usually reply within one business day.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-4xl gap-6 px-4 py-12 md:grid-cols-[1fr_1.4fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <Mail className="size-5" />
              </span>
              <CardTitle className="mt-3 text-base">Email</CardTitle>
              <CardDescription>support@rootxshortner.com</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <MessageSquare className="size-5" />
              </span>
              <CardTitle className="mt-3 text-base">Payout questions</CardTitle>
              <CardDescription>
                Withdrawals are reviewed within 72 hours of the request.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Card className="shadow-float">
          <CardHeader>
            <CardTitle>Send a message</CardTitle>
            <CardDescription>Tell us what you need help with.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="c-name">Name</Label>
              <Input id="c-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-email">Email</Label>
              <Input
                id="c-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-message">Message</Label>
              <Textarea
                id="c-message"
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            <Button className="w-full" onClick={send}>
              Send message
            </Button>
          </CardContent>
        </Card>
      </section>
    </SiteLayout>
  );
}
