export const navigationItems = [
  { title: "Dashboard", href: "/dashboard" },
  { title: "Live Signals", href: "/dashboard/live-signals" },
  { title: "Signal History", href: "/dashboard/signal-history" },
  { title: "Strategies", href: "/dashboard/strategies" },
  { title: "License", href: "/dashboard/license" },
  { title: "Settings", href: "/dashboard/settings" },
  { title: "Help & Support", href: "/dashboard/help" },
  { title: "Admin", href: "/dashboard/admin" },
];

export const statsCards = [
  { label: "Monitoring", value: "Online", trend: "+2.1%", accent: "success" },
  { label: "Signals today", value: "14", trend: "+4", accent: "success" },
  { label: "Wait rate", value: "18%", trend: "-2.6%", accent: "neutral" },
  { label: "License", value: "30d", trend: "12d left", accent: "warning" },
];

export const signalFeed = [
  { id: 1, pair: "BTC/USD", direction: "UP", time: "18:42:10 UTC", score: "82/100", expiry: "60s" },
  { id: 2, pair: "ETH/USD", direction: "WAIT", time: "18:41:25 UTC", score: "64/100", expiry: "60s" },
  { id: 3, pair: "XAU/USD", direction: "DOWN", time: "18:40:46 UTC", score: "71/100", expiry: "60s" },
  { id: 4, pair: "EUR/USD", direction: "UP", time: "18:39:08 UTC", score: "77/100", expiry: "60s" },
];

export const marketData = [
  { label: "Selected pair", value: "BTC/USD", badge: "Live", status: "healthy" },
  { label: "Market type", value: "Regular", badge: "OTC", status: "warn" },
  { label: "Data freshness", value: "2.4s", badge: "Fresh", status: "healthy" },
  { label: "Connection", value: "Stable", badge: "Online", status: "healthy" },
];

export const recentSignals = [
  { asset: "BTC/USD", market: "Regular", direction: "UP", score: "82", result: "Win", entry: "67,420", exit: "67,780" },
  { asset: "XAU/USD", market: "OTC", direction: "DOWN", score: "74", result: "Win", entry: "2,369.4", exit: "2,362.8" },
  { asset: "EUR/USD", market: "Regular", direction: "WAIT", score: "58", result: "Pending", entry: "1.0931", exit: "1.0942" },
  { asset: "ETH/USD", market: "Regular", direction: "UP", score: "79", result: "Win", entry: "3,540.4", exit: "3,571.8" },
  { asset: "GBP/USD", market: "OTC", direction: "DOWN", score: "71", result: "Win", entry: "1.2831", exit: "1.2812" },
];

export const strategyPerformance = [
  { name: "EMA Trend + RSI", winRate: "67%", contribution: "+18 pts", progress: "72%" },
  { name: "Support & Resistance", winRate: "61%", contribution: "+12 pts", progress: "64%" },
  { name: "Bollinger Breakout", winRate: "58%", contribution: "+10 pts", progress: "59%" },
  { name: "MACD Momentum", winRate: "64%", contribution: "+15 pts", progress: "70%" },
  { name: "Stochastic Reversal", winRate: "55%", contribution: "+9 pts", progress: "52%" },
  { name: "Candlestick PA", winRate: "60%", contribution: "+11 pts", progress: "57%" },
];

export const overviewCards = [
  { title: "Total signals", value: "1,468", note: "Across all monitored assets" },
  { title: "Win rate", value: "61.4%", note: "Based on verified expiry data" },
  { title: "Average score", value: "76.2", note: "Weighted strategy confidence" },
  { title: "Maximum streak", value: "8", note: "Consecutive wins recorded" },
];

export const strategyCards = [
  {
    name: "EMA Trend + RSI Pullback",
    description: "EMA 9 and EMA 21 with RSI 14 confirmation for directional pullback setups.",
    status: "Enabled",
    score: "81",
    lastAnalysis: "2 min ago",
    contribution: "+18 pts",
  },
  {
    name: "Support & Resistance Reversal",
    description: "Rejection zones, pin bars, and engulfing behavior identify structural reversals.",
    status: "Enabled",
    score: "74",
    lastAnalysis: "3 min ago",
    contribution: "+12 pts",
  },
  {
    name: "Bollinger Bands Breakout",
    description: "Volatility squeeze and momentum breakouts tracked with 20-period bands.",
    status: "Enabled",
    score: "68",
    lastAnalysis: "4 min ago",
    contribution: "+10 pts",
  },
  {
    name: "MACD Momentum Confirmation",
    description: "Momentum crossover and trend confirmation using MACD 12, 26, 9.",
    status: "Enabled",
    score: "79",
    lastAnalysis: "2 min ago",
    contribution: "+15 pts",
  },
  {
    name: "Stochastic Reversal",
    description: "Fast stochastic crossovers and reversal confirmation for temporary exhaustion events.",
    status: "Enabled",
    score: "63",
    lastAnalysis: "5 min ago",
    contribution: "+9 pts",
  },
  {
    name: "Candlestick Price Action",
    description: "Engulfing patterns, rejection candles, and structural context for clean entries.",
    status: "Enabled",
    score: "71",
    lastAnalysis: "6 min ago",
    contribution: "+11 pts",
  },
];

export const historyRows = [
  { asset: "BTC/USD", market: "Regular", direction: "UP", time: "2026-11-11 18:42:10", expiry: "60s", score: "82", entry: "67,420", exit: "67,780", outcome: "Win" },
  { asset: "XAU/USD", market: "OTC", direction: "DOWN", time: "2026-11-11 18:38:14", expiry: "60s", score: "74", entry: "2,369.4", exit: "2,362.8", outcome: "Win" },
  { asset: "EUR/USD", market: "Regular", direction: "WAIT", time: "2026-11-11 18:35:49", expiry: "60s", score: "58", entry: "1.0931", exit: "1.0942", outcome: "Pending" },
  { asset: "ETH/USD", market: "Regular", direction: "UP", time: "2026-11-11 18:31:26", expiry: "60s", score: "79", entry: "3,540.4", exit: "3,571.8", outcome: "Win" },
  { asset: "NASDAQ", market: "Regular", direction: "DOWN", time: "2026-11-11 18:28:44", expiry: "60s", score: "71", entry: "18,421", exit: "18,372", outcome: "Win" },
  { asset: "BTC/USD", market: "OTC", direction: "UP", time: "2026-11-11 18:25:02", expiry: "60s", score: "76", entry: "67,095", exit: "67,420", outcome: "Win" },
];

export const supportArticles = [
  { title: "Getting started", body: "Connect the browser extension, verify your paired asset, and begin monitoring the current market session." },
  { title: "Monitoring instructions", body: "Keep a single active chart open to ensure correct market synchronization and valid pair state." },
  { title: "FAQ", body: "Signals are informational only and not automatic trade execution; WAIT is used when market evidence is incomplete." },
];

export const faqItems = [
  { question: "Does this app place trades automatically?", answer: "No. Apex Signal Trading generates informational signals only and never executes orders on behalf of users." },
  { question: "What does WAIT mean?", answer: "WAIT indicates insufficient or invalid evidence. The system avoids forcing a directional signal." },
  { question: "What is the role of the browser extension?", answer: "The extension monitors the active chart, detects the selected pair, and synchronizes it with the backend." },
  { question: "Are OTC and regular markets treated separately?", answer: "Yes. Each market type is handled as a separate classification for signal evaluation and history." },
];

export const licenseDetails = {
  status: "Active",
  plan: "30-day signal access",
  activated: "2026-10-20",
  expires: "2026-11-19",
  payment: "Verified via Easypaisa",
  renewal: "Auto-renewal disabled, manual extension available",
};

export const adminStats = [
  { label: "Users", value: "2,430" },
  { label: "Active licenses", value: "1,118" },
  { label: "Payments pending", value: "27" },
  { label: "Market sync errors", value: "3" },
];

export const settingsSections = [
  { title: "Account", description: "Profile, email preferences, and account security status." },
  { title: "Monitoring", description: "Pair sync configuration, market categories, and session rules." },
  { title: "Notifications", description: "Signal alerts, expiry reminders, and system notices." },
  { title: "Extension", description: "Connection health, heartbeat checks, and recovery behavior." },
];
