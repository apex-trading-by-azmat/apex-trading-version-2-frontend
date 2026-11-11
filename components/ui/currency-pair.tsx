"use client";

import React from "react";
import ReactCountryFlag from "react-country-flag";
import { cn } from "@/lib/utils";
import { Coins } from "lucide-react";

export interface CurrencyInfo {
  code: string;
  countryCode: string;
  name: string;
  symbol: string;
}

export const CURRENCY_MAP: Record<string, CurrencyInfo> = {
  EUR: { code: "EUR", countryCode: "EU", name: "Euro", symbol: "€" },
  USD: { code: "USD", countryCode: "US", name: "US Dollar", symbol: "$" },
  GBP: { code: "GBP", countryCode: "GB", name: "British Pound", symbol: "£" },
  JPY: { code: "JPY", countryCode: "JP", name: "Japanese Yen", symbol: "¥" },
  AUD: { code: "AUD", countryCode: "AU", name: "Australian Dollar", symbol: "A$" },
  CAD: { code: "CAD", countryCode: "CA", name: "Canadian Dollar", symbol: "C$" },
  CHF: { code: "CHF", countryCode: "CH", name: "Swiss Franc", symbol: "CHF" },
  NZD: { code: "NZD", countryCode: "NZ", name: "New Zealand Dollar", symbol: "NZ$" },
  SGD: { code: "SGD", countryCode: "SG", name: "Singapore Dollar", symbol: "S$" },
  HKD: { code: "HKD", countryCode: "HK", name: "Hong Kong Dollar", symbol: "HK$" },
  CNY: { code: "CNY", countryCode: "CN", name: "Chinese Yuan", symbol: "¥" },
  INR: { code: "INR", countryCode: "IN", name: "Indian Rupee", symbol: "₹" },
  PKR: { code: "PKR", countryCode: "PK", name: "Pakistani Rupee", symbol: "₨" },
  AED: { code: "AED", countryCode: "AE", name: "UAE Dirham", symbol: "د.إ" },
  SAR: { code: "SAR", countryCode: "SA", name: "Saudi Riyal", symbol: "﷼" },
};

export function parsePair(pairString: string) {
  const clean = pairString.replace(/\s+/g, "").toUpperCase();
  const parts = clean.split("/");
  if (parts.length === 2) {
    return { base: parts[0], quote: parts[1] };
  }
  if (clean.length === 6) {
    return { base: clean.slice(0, 3), quote: clean.slice(3, 6) };
  }
  return { base: clean, quote: "USD" };
}

interface DualFlagIconProps {
  base: string;
  quote: string;
  size?: "hero" | "xl" | "lg" | "md" | "sm";
  className?: string;
}

export function DualFlagIcon({
  base,
  quote,
  size = "md",
  className,
}: DualFlagIconProps) {
  const baseInfo = CURRENCY_MAP[base];
  const quoteInfo = CURRENCY_MAP[quote];

  const config = {
    hero: {
      flagW: "42px",
      flagH: "31px",
      containerH: "h-12",
      overlap: "-ml-3.5",
      rounded: "rounded-lg",
      border: "border-2 border-background",
      ring: "ring-1 ring-border",
      shadow: "shadow-xl shadow-black/50",
    },
    xl: {
      flagW: "34px",
      flagH: "25px",
      containerH: "h-10",
      overlap: "-ml-3",
      rounded: "rounded-md",
      border: "border-2 border-card",
      ring: "ring-1 ring-border",
      shadow: "shadow-lg shadow-black/40",
    },
    lg: {
      flagW: "28px",
      flagH: "21px",
      containerH: "h-8",
      overlap: "-ml-2.5",
      rounded: "rounded-md",
      border: "border-2 border-card",
      ring: "ring-1 ring-border",
      shadow: "shadow-md shadow-black/30",
    },
    md: {
      flagW: "22px",
      flagH: "16px",
      containerH: "h-6",
      overlap: "-ml-2",
      rounded: "rounded",
      border: "border border-card",
      ring: "ring-1 ring-border/80",
      shadow: "shadow-sm",
    },
    sm: {
      flagW: "18px",
      flagH: "13px",
      containerH: "h-5",
      overlap: "-ml-1.5",
      rounded: "rounded-sm",
      border: "border border-card",
      ring: "ring-1 ring-border/60",
      shadow: "shadow-none",
    },
  }[size];

  return (
    <div className={cn("inline-flex items-center shrink-0", config.containerH, className)}>
      {/* Base Currency Flag */}
      <div
        className={cn(
          "overflow-hidden flex items-center justify-center bg-secondary z-10 transition-transform hover:scale-110 shrink-0",
          config.rounded,
          config.border,
          config.ring,
          config.shadow
        )}
        style={{ width: config.flagW, height: config.flagH }}
        title={`${baseInfo?.name || base} (${base})`}
      >
        {baseInfo?.countryCode ? (
          <ReactCountryFlag
            countryCode={baseInfo.countryCode}
            svg
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
            aria-label={baseInfo.name}
          />
        ) : (
          <Coins className="w-4 h-4 text-warning" />
        )}
      </div>

      {/* Quote Currency Flag (Overlapped) */}
      <div
        className={cn(
          "overflow-hidden flex items-center justify-center bg-secondary z-0 transition-transform hover:scale-110 shrink-0",
          config.overlap,
          config.rounded,
          config.border,
          config.ring,
          config.shadow
        )}
        style={{ width: config.flagW, height: config.flagH }}
        title={`${quoteInfo?.name || quote} (${quote})`}
      >
        {quoteInfo?.countryCode ? (
          <ReactCountryFlag
            countryCode={quoteInfo.countryCode}
            svg
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
            aria-label={quoteInfo.name}
          />
        ) : (
          <Coins className="w-4 h-4 text-primary" />
        )}
      </div>
    </div>
  );
}

interface CurrencyPairDisplayProps {
  pair: string;
  market?: "OTC" | "Regular" | string;
  size?: "hero" | "xl" | "lg" | "md" | "sm";
  showNames?: boolean;
  showMarket?: boolean;
  className?: string;
}

export function CurrencyPairDisplay({
  pair,
  market,
  size = "md",
  showNames = false,
  showMarket = false,
  className,
}: CurrencyPairDisplayProps) {
  const { base, quote } = parsePair(pair);
  const baseInfo = CURRENCY_MAP[base];
  const quoteInfo = CURRENCY_MAP[quote];

  const isHero = size === "hero";
  const isXl = size === "xl";
  const isLg = size === "lg";
  const isSm = size === "sm";

  return (
    <div className={cn("inline-flex items-center gap-3", className)}>
      <DualFlagIcon base={base} quote={quote} size={size} />

      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "font-mono font-bold tracking-tight text-foreground",
              isHero && "text-2xl sm:text-4xl tracking-tight leading-none",
              isXl && "text-xl sm:text-2xl tracking-tight leading-tight",
              isLg && "text-lg sm:text-xl",
              size === "md" && "text-sm sm:text-base",
              isSm && "text-xs font-semibold"
            )}
          >
            {base}/{quote}
          </span>

          {showMarket && market && (
            <span
              className={cn(
                "font-mono uppercase font-bold rounded border tracking-wider",
                isHero
                  ? "text-xs px-2.5 py-1"
                  : isXl || isLg
                  ? "text-[11px] px-2 py-0.5"
                  : "text-[10px] px-1.5 py-0.5",
                market === "OTC"
                  ? "bg-purple-950/80 text-purple-300 border-purple-800/80 shadow-[0_0_10px_rgba(168,85,247,0.15)]"
                  : "bg-blue-950/80 text-blue-300 border-blue-800/80 shadow-[0_0_10px_rgba(59,130,246,0.15)]"
              )}
            >
              {market} Market
            </span>
          )}
        </div>

        {showNames && (
          <span
            className={cn(
              "text-muted-foreground font-sans font-medium",
              isHero ? "text-xs sm:text-sm mt-1" : isXl ? "text-xs mt-0.5" : "text-[11px]"
            )}
          >
            {baseInfo?.name || base} ({baseInfo?.symbol || ""}) / {quoteInfo?.name || quote} ({quoteInfo?.symbol || ""})
          </span>
        )}
      </div>
    </div>
  );
}
