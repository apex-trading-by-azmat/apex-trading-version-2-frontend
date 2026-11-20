"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import assets from "@/assets/assets";
import { ShieldCheck, Zap, Activity } from "lucide-react";

const LOADING_PHASES = [
  {
    title: "Verifying Terminal Authorization",
    subtitle: "Authenticating 30-day algorithmic license...",
    progress: 25,
  },
  {
    title: "Establishing Quotex Telemetry",
    subtitle: "Connecting Chrome companion bridge & M1 stream...",
    progress: 55,
  },
  {
    title: "Syncing 6 Strategy Engines",
    subtitle: "Calibrating neural pattern consensus filters...",
    progress: 85,
  },
  {
    title: "Initializing Trading Terminal",
    subtitle: "Real-time telemetry ready for execution...",
    progress: 98,
  },
];

export function TerminalLoading() {
  const [phaseIndex, setPhaseIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPhaseIndex((prev) => (prev + 1) % LOADING_PHASES.length);
    }, 1200);
    return () => clearInterval(timer);
  }, []);

  const currentPhase = LOADING_PHASES[phaseIndex];

  return (
    <div className="fixed inset-0 z-50 bg-[#0b0e11] flex flex-col items-center justify-center p-4 sm:p-6 select-none overflow-hidden">
      {/* ── AMBIENT CYBER LIGHTING ── */}
      <div className="absolute w-[460px] h-[460px] rounded-full bg-primary/10 blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-emerald-500/5 blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-primary/5 blur-[100px] pointer-events-none" />

      {/* Cyber Grid Background Matrix */}
      <div className="absolute inset-0 bg-[radial-gradient(#20252e_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      {/* ── CENTRAL TERMINAL CARD ── */}
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-card/85 border border-primary/25 backdrop-blur-xl p-6 sm:p-8 shadow-2xl shadow-primary/10 flex flex-col items-center text-center space-y-6">
        {/* Brand Header */}
        <div className="flex items-center gap-2.5">
          <div className="relative w-7 h-7 rounded-lg bg-gradient-to-br from-primary/20 via-surface-2 to-surface-3 p-1 border border-primary/30 shadow-[0_0_12px_rgba(240,185,11,0.2)]">
            <Image
              src={assets.logo}
              alt="Apex Signal Trading"
              width={24}
              height={24}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <div className="text-left">
            <span className="font-display font-black text-sm text-foreground tracking-tight block leading-tight">
              Apex<span className="text-primary">Signal</span>
            </span>
            <span className="text-[9px] font-mono tracking-widest text-muted-foreground uppercase font-semibold">
              PRO TERMINAL v2.4
            </span>
          </div>
          <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            ONLINE
          </span>
        </div>

        {/* ── HOLOGRAPHIC DUAL ORBIT RADAR LOADER ── */}
        <div className="relative w-32 h-32 flex items-center justify-center my-2">
          {/* Ambient center glow */}
          <div className="absolute inset-4 rounded-full bg-primary/15 blur-xl animate-pulse" />

          {/* Outer Track */}
          <div className="absolute inset-0 rounded-full border border-border/80" />

          {/* Orbiting Ring 1 (Clockwise) */}
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary border-r-primary/40 animate-spin [animation-duration:2.5s]" />

          {/* Orbiting Ring 2 (Counter-Clockwise Dashed) */}
          <div className="absolute inset-3 rounded-full border border-dashed border-primary/30 border-b-primary animate-spin [animation-direction:reverse] [animation-duration:4s]" />

          {/* Third Micro Ring */}
          <div className="absolute inset-6 rounded-full border border-border/60" />

          {/* Satellite Orbit Dot */}
          <div className="absolute inset-0 animate-spin [animation-duration:2.5s]">
            <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_10px_#f0b90b] mx-auto -mt-1.5" />
          </div>

          {/* Center Brand Core */}
          <div className="relative z-10 w-14 h-14 rounded-2xl bg-card border border-primary/40 flex items-center justify-center p-2.5 shadow-[0_0_24px_rgba(240,185,11,0.25)]">
            <Image
              src={assets.logo}
              alt="Apex Logo Core"
              width={36}
              height={36}
              className="w-full h-full object-contain animate-pulse drop-shadow"
              priority
            />
          </div>
        </div>

        {/* ── DYNAMIC STATUS SEQUENCE ── */}
        <div className="space-y-1.5 w-full">
          <h2 className="text-base sm:text-lg font-extrabold text-foreground font-display tracking-tight transition-all duration-300">
            {currentPhase.title}
            <span className="text-primary inline-block animate-pulse ml-1">
              …
            </span>
          </h2>
          <p className="text-xs font-mono text-muted-foreground flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping shrink-0" />
            <span className="truncate max-w-xs">{currentPhase.subtitle}</span>
          </p>
        </div>

        {/* ── HIGH-TECH LINEAR TELEMETRY PROGRESS BAR ── */}
        <div className="w-full space-y-1.5">
          <div className="w-full h-1.5 rounded-full bg-secondary/80 overflow-hidden relative border border-border/60">
            <div
              className="h-full bg-gradient-to-r from-primary/80 to-primary transition-all duration-500 relative"
              style={{ width: `${currentPhase.progress}%` }}
            >
              {/* High-speed shimmer light beam */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-[shimmer_1.2s_infinite]" />
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground px-0.5">
            <span>CORE TELEMETRY</span>
            <span className="text-primary font-bold">
              {currentPhase.progress}%
            </span>
          </div>
        </div>

        {/* ── SECURITY & EXECUTION TELEMETRY STRIP ── */}
        <div className="w-full pt-1">
          <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-secondary/60 border border-border text-[10px] font-mono">
            <div className="flex flex-col items-center justify-center gap-0.5 border-r border-border/80">
              <span className="text-muted-foreground flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                SECURITY
              </span>
              <span className="font-bold text-foreground">256-BIT SSL</span>
            </div>
            <div className="flex flex-col items-center justify-center gap-0.5 border-r border-border/80">
              <span className="text-muted-foreground flex items-center gap-1">
                <Zap className="w-3 h-3 text-primary" />
                TIMEFRAME
              </span>
              <span className="font-bold text-foreground">M1 FIXED</span>
            </div>
            <div className="flex flex-col items-center justify-center gap-0.5">
              <span className="text-muted-foreground flex items-center gap-1">
                <Activity className="w-3 h-3 text-up" />
                RADAR
              </span>
              <span className="font-bold text-emerald-400">ACTIVE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
