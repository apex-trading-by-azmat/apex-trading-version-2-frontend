import Link from "next/link";
import { Globe, ArrowRight } from "lucide-react";

export function ExtensionCTA() {
  return (
    <div className="rounded-xl bg-card border border-border p-5">
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-lg bg-primary/8 border border-primary/15 shrink-0">
          <Globe className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">Link Chrome Extension</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Automatic pair sync requires the Apex extension. It detects OTC vs Regular market and notifies the engine.
          </p>
          <Link
            href="/dashboard/help"
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-hover transition-colors"
          >
            Setup instructions
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
