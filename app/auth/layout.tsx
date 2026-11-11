import Link from "next/link";
import { Cpu, ShieldCheck } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between p-4 sm:p-6">
      {/* Top Header */}
      <div className="flex items-center justify-between max-w-6xl w-full mx-auto py-2">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
            <Cpu className="w-4 h-4 text-primary" />
          </div>
          <div>
            <span className="text-xs font-semibold tracking-[0.18em] text-primary uppercase block leading-none">Apex</span>
            <span className="text-sm font-semibold text-foreground leading-none">Signal Trading</span>
          </div>
        </Link>

        <Link
          href="/"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Return to Portal
        </Link>
      </div>

      {/* Main Center Box */}
      <div className="flex-1 flex items-center justify-center py-8">
        <div className="w-full max-w-2xl">
          {children}
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-6xl w-full mx-auto py-3 text-center text-xs text-subtle">
        Apex Signal Trading · AI-Powered Market Intelligence · Informational Signals Only
      </div>
    </div>
  );
}

