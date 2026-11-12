"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Globe,
  ArrowRight,
  Download,
  FileArchive,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Laptop,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ExtensionCTA() {
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleCopyChromeUrl = () => {
    navigator.clipboard.writeText("chrome://extensions");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const steps = [
    {
      num: "01",
      title: "Download & Extract Zip",
      desc: "Download the extension zip package using the button above and extract it to a permanent folder (e.g. Downloads/apex-trading-extension).",
    },
    {
      num: "02",
      title: "Open Extensions in Google Chrome",
      desc: "Open Google Chrome and navigate to the extensions management screen by entering this URL in your browser address bar:",
      action: "copy",
    },
    {
      num: "03",
      title: "Enable Developer Mode",
      desc: "Look at the top-right corner of the Chrome Extensions page and turn ON the toggle switch labeled 'Developer mode'.",
    },
    {
      num: "04",
      title: "Click 'Load Unpacked'",
      desc: "In the top-left toolbar, click the 'Load unpacked' button, then select your extracted apex-trading-extension folder.",
    },
    {
      num: "05",
      title: "Pin & Start Monitoring",
      desc: "Pin the Apex icon to your Chrome toolbar. Open your broker tab (Pocket Option, Quotex, etc.) — the extension will automatically detect the active pair and OTC status.",
    },
  ];

  return (
    <>
      <div className="rounded-xl bg-card border border-border p-5 hover:border-primary/40 transition-colors">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20 shrink-0 text-primary">
            <Globe className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">Link Chrome Extension</p>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-secondary text-muted-foreground border border-border">
                v1.0.0
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Automatic pair sync requires the Apex extension. It detects OTC vs Regular market and notifies the engine.
            </p>

            <div className="mt-3.5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-hover transition-colors cursor-pointer"
              >
                Setup instructions
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <span className="text-border">|</span>

              <a
                href="/downloads/apex-trading-extension.zip"
                download="apex-trading-extension.zip"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                title="Direct download zip file"
              >
                <Download className="w-3 h-3 text-primary" />
                <span>Download .zip</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Shadcn Dialog Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-xl max-h-[88vh] overflow-y-auto p-5 sm:p-6 bg-card border-border text-foreground">
          <DialogHeader className="gap-1.5 pb-2 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                <Globe className="w-4 h-4" />
              </div>
              <DialogTitle className="text-base font-semibold text-foreground">
                Apex Chrome Extension Setup
              </DialogTitle>
              <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-primary/10 text-primary border border-primary/20">
                Manifest V3
              </span>
            </div>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Connect your broker charting tab (Pocket Option, Quotex, etc.) with Apex Signal Trading for automated OTC/Regular asset detection.
            </DialogDescription>
          </DialogHeader>

          {/* Direct Download Card */}
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/15 border border-primary/30 text-primary shrink-0">
                <FileArchive className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  apex-trading-extension.zip
                  <span className="text-[10px] font-mono text-muted-foreground">v1.0.0</span>
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Official extension archive · Size: ~286 KB · Manifest V3
                </p>
              </div>
            </div>

            <a
              href="/downloads/apex-trading-extension.zip"
              download="apex-trading-extension.zip"
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold text-xs transition-all shadow-md shadow-primary/20 cursor-pointer shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Extension (.zip)</span>
            </a>
          </div>

          {/* Installation Steps */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">
                Installation Steps
              </p>
              <span className="text-[11px] text-muted-foreground">5 quick steps</span>
            </div>

            <div className="space-y-2.5">
              {steps.map((step) => (
                <div
                  key={step.num}
                  className="p-3 rounded-lg bg-secondary/50 border border-border/80 flex items-start gap-3 text-xs"
                >
                  <span className="font-mono font-bold text-xs text-primary px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20 shrink-0 mt-0.5">
                    {step.num}
                  </span>
                  <div className="flex-1 space-y-1">
                    <p className="font-semibold text-foreground">{step.title}</p>
                    <p className="text-muted-foreground text-[11px] leading-relaxed">{step.desc}</p>

                    {step.action === "copy" && (
                      <div className="mt-2 flex items-center gap-2">
                        <code className="px-2 py-1 rounded bg-background border border-border font-mono text-[11px] text-foreground select-all">
                          chrome://extensions
                        </code>
                        <button
                          type="button"
                          onClick={handleCopyChromeUrl}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded border border-border hover:bg-background text-[11px] font-semibold text-foreground transition-colors cursor-pointer"
                        >
                          {copied ? (
                            <>
                              <Check className="w-3 h-3 text-up" />
                              <span className="text-up">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-muted-foreground" />
                              <span>Copy URL</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Regulatory & Safety Notice */}
          <div className="p-3 rounded-lg bg-secondary/30 border border-border/60 flex items-start gap-2.5 text-[11px] text-muted-foreground leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div>
              <strong className="text-foreground">Non-Custodial & Safe:</strong> The Apex extension only reads the active chart ticker name and OTC mode to sync telemetry with your decision engine. It never accesses broker account passwords, funds, or trade execution.
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-2 border-t border-border flex items-center justify-between gap-3">
            <Link
              href="/dashboard/help"
              onClick={() => setIsOpen(false)}
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
            >
              <span>View full documentation</span>
              <ExternalLink className="w-3 h-3" />
            </Link>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3.5 py-1.5 rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
