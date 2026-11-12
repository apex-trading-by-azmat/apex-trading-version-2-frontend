import Link from "next/link";
import Image from "next/image";
import assets from "@/assets/assets";
import { ArrowRight } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function ClientsideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      {/* Public Top Navbar */}
      <header className="sticky top-0 z-40 h-16 border-b border-border bg-background/90 backdrop-blur-md px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-secondary/80 border border-border flex items-center justify-center p-1 overflow-hidden shadow-sm">
              <Image
                src={assets.logo}
                alt="Apex Signal Trading Logo"
                width={32}
                height={32}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <div>
              <span className="text-xs font-semibold tracking-[0.18em] text-primary uppercase block leading-none">Apex</span>
              <span className="text-sm font-semibold text-foreground leading-none">Signal Trading</span>
            </div>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-6 text-xs text-muted-foreground">
            <Link href="#rules" className="hover:text-foreground transition-colors">30s Window</Link>
            <Link href="#strategies" className="hover:text-foreground transition-colors">6 Strategies</Link>
            <Link href="#features" className="hover:text-foreground transition-colors">Non-Custodial</Link>
            <Link href="#pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <Link href="#faq" className="hover:text-foreground transition-colors">FAQ</Link>
          </nav>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <ThemeToggle variant="pill" />
            <Link
              href="/auth/login"
              className="text-xs font-semibold text-muted-foreground hover:text-foreground px-2.5 py-1.5 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/auth/register"
              className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-lg shadow-primary/20"
            >
              Get 30-Day Pass ($25)
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        {children}
      </main>

      {/* Public Footer */}
      <footer className="border-t border-border bg-card py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-secondary/80 border border-border flex items-center justify-center p-0.5 overflow-hidden">
              <Image
                src={assets.logo}
                alt="Apex Signal Trading Logo"
                width={20}
                height={20}
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-foreground font-semibold">Apex Signal Trading</span>
            <span className="text-subtle">·</span>
            <span>AI-Powered Market Intelligence</span>
          </div>

          <div className="flex items-center gap-6 text-[11px] text-subtle">
            <span>60s Fixed Expiry</span>
            <span>Dual Market Categorization (OTC / Regular)</span>
            <span>Non-Custodial / Informational</span>
          </div>

          <p className="text-[11px] text-subtle">
            &copy; 2026 Apex Signal Trading. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
