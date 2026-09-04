import { Link } from "@tanstack/react-router";
import { Link2 } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 font-semibold text-foreground">
          <span className="flex size-7 items-center justify-center rounded-lg bg-hero-gradient text-primary-foreground">
            <Link2 className="size-4" />
          </span>
          Rootx Shortner
        </div>
        <div className="flex flex-wrap gap-4">
          <Link to="/rates" className="hover:text-primary">
            Payout rates
          </Link>
          <Link to="/tools" className="hover:text-primary">
            Tools
          </Link>
          <Link to="/contact" className="hover:text-primary">
            Contact
          </Link>
          <Link to="/terms" className="hover:text-primary">
            Terms
          </Link>
        </div>
        <p>© {new Date().getFullYear()} Rootx Shortner. All rights reserved.</p>
      </div>
    </footer>
  );
}
