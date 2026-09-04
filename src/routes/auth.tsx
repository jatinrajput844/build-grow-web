import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Link2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Login or sign up — Rootx Shortner" },
      {
        name: "description",
        content:
          "Log in to your Rootx Shortner account or create a free publisher account to start earning from your links.",
      },
      { property: "og:title", content: "Login or sign up — Rootx Shortner" },
      {
        property: "og:description",
        content: "Access your Rootx Shortner dashboard, links and earnings.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) void navigate({ to: "/dashboard" });
  }, [user, loading, navigate]);

  const signIn = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back!");
    void navigate({ to: "/dashboard" });
  };

  const signUp = async () => {
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { display_name: name || email.split("@")[0] },
      },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Account created! You can start shortening links now.");
    void navigate({ to: "/dashboard" });
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) return toast.error("Google sign-in failed");
    if (result.redirected) return;
    void navigate({ to: "/dashboard" });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-soft-gradient px-4 py-12">
      <Link to="/" className="mb-8 flex items-center gap-2 text-lg font-bold">
        <span className="flex size-9 items-center justify-center rounded-xl bg-hero-gradient text-primary-foreground">
          <Link2 className="size-5" />
        </span>
        Rootx <span className="text-primary">Shortner</span>
      </Link>

      <Card className="w-full max-w-md shadow-float">
        <CardHeader>
          <CardTitle>Publisher account</CardTitle>
          <CardDescription>Log in or create a free account to start earning.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full" onClick={() => void google()}>
            Continue with Google
          </Button>
          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or use email{" "}
            <span className="h-px flex-1 bg-border" />
          </div>

          <Tabs defaultValue="login">
            <TabsList className="w-full">
              <TabsTrigger value="login" className="flex-1">
                Login
              </TabsTrigger>
              <TabsTrigger value="signup" className="flex-1">
                Sign up
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button className="w-full" disabled={busy} onClick={() => void signIn()}>
                <Mail className="size-4" /> {busy ? "Please wait..." : "Log in"}
              </Button>
            </TabsContent>

            <TabsContent value="signup" className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="signup-name">Display name</Label>
                <Input id="signup-name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button className="w-full" disabled={busy} onClick={() => void signUp()}>
                {busy ? "Creating account..." : "Create free account"}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
