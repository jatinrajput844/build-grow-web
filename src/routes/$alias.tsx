import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Link2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { detectCountry, deviceType } from "@/lib/shortener";

export const Route = createFileRoute("/$alias")({
  head: () => ({
    meta: [
      { title: "Redirecting… — Rootx Shortner" },
      {
        name: "description",
        content: "Please wait while Rootx Shortner takes you to your destination.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Redirecting… — Rootx Shortner" },
      { property: "og:description", content: "Taking you to your destination." },
    ],
  }),
  component: AliasPage,
});

type State = "loading" | "counting" | "missing";

function AliasPage() {
  const { alias } = Route.useParams();
  const [state, setState] = useState<State>("loading");
  const [seconds, setSeconds] = useState(8);
  const [destination, setDestination] = useState<string | null>(null);
  const recorded = useRef(false);

  useEffect(() => {
    let active = true;

    const run = async () => {
      const [{ data: link }, { data: settings }] = await Promise.all([
        supabase
          .from("links")
          .select("id,destination,is_active")
          .eq("alias", alias)
          .maybeSingle(),
        supabase.from("site_settings").select("key,value").eq("key", "ad_wait_seconds"),
      ]);

      if (!active) return;
      if (!link || !link.is_active) {
        setState("missing");
        return;
      }

      const wait = Number(settings?.[0]?.value ?? 8);
      setSeconds(Number.isFinite(wait) && wait > 0 ? wait : 8);
      setDestination(link.destination);
      setState("counting");

      if (!recorded.current) {
        recorded.current = true;
        const country = await detectCountry();
        await supabase.from("clicks").insert({
          link_id: link.id,
          country_code: country,
          referrer: document.referrer || null,
          device: deviceType(),
        });
      }
    };

    void run();
    return () => {
      active = false;
    };
  }, [alias]);

  useEffect(() => {
    if (state !== "counting") return;
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [state, seconds]);

  if (state === "missing") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-soft-gradient px-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold">Link not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This short link doesn't exist, or it has been disabled by its owner.
          </p>
          <Button asChild className="mt-6">
            <Link to="/">Go to Rootx Shortner</Link>
          </Button>
        </div>
      </div>
    );
  }

  const ready = state === "counting" && seconds <= 0;

  return (
    <div className="flex min-h-screen flex-col bg-soft-gradient">
      <header className="border-b border-border bg-card/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-4xl items-center gap-2 px-4 font-bold">
          <span className="flex size-9 items-center justify-center rounded-xl bg-hero-gradient text-primary-foreground">
            <Link2 className="size-5" />
          </span>
          Rootx <span className="text-primary">Shortner</span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-6 px-4 py-12 text-center">
        <div className="flex items-center gap-2 rounded-full bg-primary-soft px-4 py-1.5 text-xs font-medium text-primary">
          <ShieldCheck className="size-4" /> Link checked and safe
        </div>

        <h1 className="text-2xl font-bold md:text-3xl">
          {ready ? "Your link is ready" : "Preparing your link…"}
        </h1>

        <div className="flex size-24 items-center justify-center rounded-full border-4 border-primary/25 text-3xl font-bold text-primary">
          {state === "loading" ? "…" : Math.max(seconds, 0)}
        </div>

        <p className="max-w-md text-sm text-muted-foreground">
          {ready
            ? "Tap the button below to continue to your destination."
            : "Please wait a few seconds. This short wait is what pays the person who shared this link."}
        </p>

        <div className="flex h-32 w-full max-w-xl items-center justify-center rounded-xl border border-dashed border-border bg-card text-xs text-muted-foreground">
          Advertisement space
        </div>

        <Button
          size="lg"
          disabled={!ready || !destination}
          onClick={() => {
            if (destination) window.location.href = destination;
          }}
        >
          {ready ? "Continue to destination" : `Please wait ${Math.max(seconds, 0)}s`}
        </Button>
      </main>
    </div>
  );
}
