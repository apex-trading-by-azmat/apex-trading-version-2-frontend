import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { faqItems, supportArticles } from "@/lib/mock-data";
import { HelpCircle, BookOpen, Globe, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export default function HelpPage() {
  return (
    <AppShell
      title="Help & Support"
      description="System documentation, browser extension installation, and operational trading guidelines."
    >
      <div className="space-y-5">
        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          {/* Documentation Cards */}
          <div className="space-y-4">
            {supportArticles.map((article) => (
              <Card
                key={article.title}
                className={cn(
                  "border-border bg-card shadow-sm hover:border-primary/40 transition-colors"
                )}
              >
                <CardHeader className="pb-3 border-b border-border">
                  <CardTitle className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary" />
                    {article.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-3">
                  <p className="text-xs text-muted-foreground leading-relaxed">{article.body}</p>
                </CardContent>
              </Card>
            ))}

            <div className="p-4 rounded-xl bg-secondary border border-border flex items-start gap-3 shadow-sm">
              <ShieldAlert className="w-5 h-5 text-warning shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Regulatory Safety Standard:</strong>{" "}
                The Apex Signal Trading platform generates strictly informational indicators. We never execute automated
                trades, collect broker account passwords, or link trading account funds.
              </div>
            </div>
          </div>

          {/* FAQ */}
          <Card className={cn("border-border bg-card shadow-sm")}>
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-primary" />
                Frequently Asked Questions
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Operational rules & signal decision clarity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-3">
              {faqItems.map((item) => (
                <div
                  key={item.question}
                  className={cn(
                    "rounded-lg border border-border bg-secondary p-3 text-xs transition-colors hover:border-primary/40"
                  )}
                >
                  <p className="font-semibold text-foreground">{item.question}</p>
                  <p className="mt-1.5 text-muted-foreground leading-relaxed">{item.answer}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
