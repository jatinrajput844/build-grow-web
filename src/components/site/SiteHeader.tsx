import { Link } from "@tanstack/react-router";
import { Link2, LogOut, Menu, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/rates", label: "Payout rates" },
  { to: "/tools", label: "Tools" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteHeader() {
  const { user, isAdmin, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="flex size-9 items-center justify-center rounded-xl bg-hero-gradient text-primary-foreground">
            <Link2 className="size-5" />
          </span>
          <span>
            Rootx <span className="text-primary">Shortner</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "bg-primary-soft text-primary" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              {isAdmin && (
                <Button asChild variant="ghost" size="sm">
                  <Link to="/admin">
                    <ShieldCheck className="size-4" /> Admin
                  </Link>
                </Button>
              )}
              <Button asChild size="sm">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
              <Button variant="outline" size="sm" onClick={() => void signOut()}>
                <LogOut className="size-4" />
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/auth">Login</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/auth">Sign up free</Link>
              </Button>
            </>
          )}
        </div>

        <Button
          variant="outline"
          size="icon"
          className="md:hidden"
          aria-label="Open menu"
          onClick={() => setOpen((v) => !v)}
        >
          <Menu className="size-5" />
        </Button>
      </div>

      {open && (
        <div className="border-t border-border bg-card px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary"
              >
                {item.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-2 text-sm font-medium text-primary"
                >
                  Dashboard
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setOpen(false)}
                    className="rounded-md px-3 py-2 text-sm font-medium text-primary"
                  >
                    Admin panel
                  </Link>
                )}
                <button
                  onClick={() => void signOut()}
                  className="rounded-md px-3 py-2 text-left text-sm font-medium text-destructive"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-primary"
              >
                Login / Sign up
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
