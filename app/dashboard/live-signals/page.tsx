"use client";

import { useState, useEffect, useRef } from "react";
import { AppShell } from "@/components/layout/app-shell";
import {
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Activity,
  ShieldCheck,
  Zap,
  RefreshCw,
  Info,
  Check,
  Lock,
  Unlock,
  AlertTriangle,
  Layers,
  Sliders,
  CheckCircle2,
  Volume2,
  VolumeX,
  Sparkles,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CurrencyPairDisplay,
  DualFlagIcon,
  CURRENCY_MAP,
  parsePair,
} from "@/components/ui/currency-pair";
import { soundEffects } from "@/lib/sound-effects";
import {
  TradeOutcomeModal,
  OutcomeType,
} from "@/components/dashboard/trade-outcome-modal";

type SignalMode = "UP" | "DOWN" | "WAIT";

interface TrackedPair {
  id: string;
  pair: string;
  base: string;
  quote: string;
  market: "OTC" | "Regular";
  rate: string;
  rateChange: string;
  candleTime: string;
  latency: string;
  defaultMode: SignalMode;
  modes: Record<
    SignalMode,
    {
      direction: SignalMode;
      score: number;
      agreement: string;
      opposingCount: number;
      headline: string;
      reason: string;
      actionTitle: string;
      strategies: Array<{
        id: number;
        name: string;
        status: SignalMode;
        score: number;
        weight: string;
        reason: string;
      }>;
    }
  >;
}

const MONITORED_PAIRS: TrackedPair[] = [
  {
    id: "EUR/USD",
    pair: "EUR/USD",
    base: "EUR",
    quote: "USD",
    market: "OTC",
    rate: "1.08420",
    rateChange: "+0.04%",
    candleTime: "18:42:00 UTC",
    latency: "112ms",
    defaultMode: "UP",
    modes: {
      UP: {
        direction: "UP",
        score: 84,
        agreement: "5 of 6",
        opposingCount: 0,
        headline: "BULLISH 60-SECOND SIGNAL DETECTED",
        reason:
          "Strong upward trend continuity confirmed across EMA 9/21 crossovers, MACD positive acceleration, and M1 bullish engulfing price action off 1.08420 dynamic support.",
        actionTitle: "CALL / HIGHER (BUY)",
        strategies: [
          {
            id: 1,
            name: "EMA Trend + RSI Pullback",
            status: "UP",
            score: 88,
            weight: "18%",
            reason: "EMA 9 cleanly above EMA 21; RSI 14 holding at 54 after healthy pullback.",
          },
          {
            id: 2,
            name: "Support & Resistance Reversal",
            status: "UP",
            score: 84,
            weight: "20%",
            reason: "Strong rejection pin-bar off 1.08420 dynamic support level.",
          },
          {
            id: 3,
            name: "Bollinger Bands Breakout",
            status: "UP",
            score: 79,
            weight: "16%",
            reason: "Upper band expansion following low-volatility squeeze cycle.",
          },
          {
            id: 4,
            name: "MACD Momentum Confirmation",
            status: "UP",
            score: 86,
            weight: "16%",
            reason: "MACD histogram expanding green above signal baseline.",
          },
          {
            id: 5,
            name: "Stochastic Reversal",
            status: "WAIT",
            score: 62,
            weight: "15%",
            reason: "%K and %D lines converging in mid-band (52); waiting for extreme.",
          },
          {
            id: 6,
            name: "Candlestick Price Action",
            status: "UP",
            score: 82,
            weight: "15%",
            reason: "Closed M1 candle formed valid bullish engulfing structure.",
          },
        ],
      },
      DOWN: {
        direction: "DOWN",
        score: 82,
        agreement: "5 of 6",
        opposingCount: 0,
        headline: "BEARISH REJECTION AT RANGE HIGH",
        reason:
          "Upper resistance rejection with bearish engulfing pattern and negative MACD divergence tick.",
        actionTitle: "PUT / LOWER (SELL)",
        strategies: [
          { id: 1, name: "EMA Trend + RSI Pullback", status: "DOWN", score: 85, weight: "18%", reason: "EMA cross below." },
          { id: 2, name: "Support & Resistance Reversal", status: "DOWN", score: 83, weight: "20%", reason: "Resistance rejected." },
          { id: 3, name: "Bollinger Bands Breakout", status: "DOWN", score: 79, weight: "16%", reason: "Lower band puncture." },
          { id: 4, name: "MACD Momentum Confirmation", status: "DOWN", score: 84, weight: "16%", reason: "Histogram red tick." },
          { id: 5, name: "Stochastic Reversal", status: "DOWN", score: 78, weight: "15%", reason: "Overbought flip." },
          { id: 6, name: "Candlestick Price Action", status: "WAIT", score: 62, weight: "15%", reason: "Pin awaiting follow-up." },
        ],
      },
      WAIT: {
        direction: "WAIT",
        score: 54,
        agreement: "2 of 6",
        opposingCount: 2,
        headline: "WAIT STATE — INSUFFICIENT CONSENSUS",
        reason: "Indicators in direct conflict. Weighted score below required 70 threshold.",
        actionTitle: "STANDBY / DO NOT ENTER",
        strategies: [
          { id: 1, name: "EMA Trend + RSI Pullback", status: "WAIT", score: 50, weight: "18%", reason: "Moving averages flat." },
          { id: 2, name: "Support & Resistance Reversal", status: "UP", score: 64, weight: "20%", reason: "Minor support test." },
          { id: 3, name: "Bollinger Bands Breakout", status: "WAIT", score: 48, weight: "16%", reason: "Inside squeeze band." },
          { id: 4, name: "MACD Momentum Confirmation", status: "DOWN", score: 56, weight: "16%", reason: "Negative tick." },
          { id: 5, name: "Stochastic Reversal", status: "WAIT", score: 52, weight: "15%", reason: "Neutral 50 band." },
          { id: 6, name: "Candlestick Price Action", status: "WAIT", score: 50, weight: "15%", reason: "Doji indecision." },
        ],
      },
    },
  },
  {
    id: "GBP/USD",
    pair: "GBP/USD",
    base: "GBP",
    quote: "USD",
    market: "OTC",
    rate: "1.28850",
    rateChange: "-0.06%",
    candleTime: "18:43:00 UTC",
    latency: "128ms",
    defaultMode: "DOWN",
    modes: {
      DOWN: {
        direction: "DOWN",
        score: 81,
        agreement: "5 of 6",
        opposingCount: 0,
        headline: "BEARISH 60-SECOND SIGNAL DETECTED",
        reason:
          "Sustained downward momentum confirmed by key level wick rejections, MACD bearish crossover, and RSI falling below 45.",
        actionTitle: "PUT / LOWER (SELL)",
        strategies: [
          { id: 1, name: "EMA Trend + RSI Pullback", status: "DOWN", score: 86, weight: "18%", reason: "EMA 9 crossed below EMA 21; RSI sloping downward at 42." },
          { id: 2, name: "Support & Resistance Reversal", status: "DOWN", score: 82, weight: "20%", reason: "Shooting-star wick rejection at 1.28850 resistance zone." },
          { id: 3, name: "Bollinger Bands Breakout", status: "DOWN", score: 78, weight: "16%", reason: "Lower band puncture with expanding standard deviation envelopes." },
          { id: 4, name: "MACD Momentum Confirmation", status: "DOWN", score: 83, weight: "16%", reason: "Histogram accelerating downward below zero baseline." },
          { id: 5, name: "Stochastic Reversal", status: "DOWN", score: 75, weight: "15%", reason: "%K crossing below %D from overbought 82 boundary." },
          { id: 6, name: "Candlestick Price Action", status: "WAIT", score: 60, weight: "15%", reason: "Small body candle; structural rejection pending next candle close." },
        ],
      },
      UP: {
        direction: "UP",
        score: 79,
        agreement: "4 of 6",
        opposingCount: 1,
        headline: "BULLISH COUNTER-PULLBACK",
        reason: "Double bottom bounce at 1.28700 with rapid RSI rebound.",
        actionTitle: "CALL / HIGHER (BUY)",
        strategies: [
          { id: 1, name: "EMA Trend + RSI Pullback", status: "UP", score: 82, weight: "18%", reason: "RSI recovery above 50." },
          { id: 2, name: "Support & Resistance Reversal", status: "UP", score: 86, weight: "20%", reason: "Double bottom pin." },
          { id: 3, name: "Bollinger Bands Breakout", status: "WAIT", score: 65, weight: "16%", reason: "Mid-band bounce." },
          { id: 4, name: "MACD Momentum Confirmation", status: "UP", score: 78, weight: "16%", reason: "Positive turn." },
          { id: 5, name: "Stochastic Reversal", status: "UP", score: 84, weight: "15%", reason: "Oversold crossover." },
          { id: 6, name: "Candlestick Price Action", status: "WAIT", score: 58, weight: "15%", reason: "Hammer candle." },
        ],
      },
      WAIT: {
        direction: "WAIT",
        score: 52,
        agreement: "2 of 6",
        opposingCount: 2,
        headline: "WAIT STATE — RANGE EQUILIBRIUM",
        reason: "Stochastic neutral and EMA intertwined. Low conviction state.",
        actionTitle: "STANDBY / DO NOT ENTER",
        strategies: [
          { id: 1, name: "EMA Trend + RSI Pullback", status: "WAIT", score: 50, weight: "18%", reason: "Flat MAs." },
          { id: 2, name: "Support & Resistance Reversal", status: "WAIT", score: 55, weight: "20%", reason: "No key level hit." },
          { id: 3, name: "Bollinger Bands Breakout", status: "WAIT", score: 45, weight: "16%", reason: "Tight channel." },
          { id: 4, name: "MACD Momentum Confirmation", status: "WAIT", score: 50, weight: "16%", reason: "Flat histogram." },
          { id: 5, name: "Stochastic Reversal", status: "WAIT", score: 54, weight: "15%", reason: "Mid band." },
          { id: 6, name: "Candlestick Price Action", status: "WAIT", score: 51, weight: "15%", reason: "Spinning top." },
        ],
      },
    },
  },
  {
    id: "USD/JPY",
    pair: "USD/JPY",
    base: "USD",
    quote: "JPY",
    market: "Regular",
    rate: "154.230",
    rateChange: "+0.02%",
    candleTime: "18:44:00 UTC",
    latency: "98ms",
    defaultMode: "WAIT",
    modes: {
      WAIT: {
        direction: "WAIT",
        score: 54,
        agreement: "2 of 6",
        opposingCount: 2,
        headline: "WAIT STATE — INSUFFICIENT CONSENSUS",
        reason:
          "Indicators in direct conflict. Weighted score (54/100) below required 70 threshold. Market evidence incomplete. Never force a trade.",
        actionTitle: "STANDBY / DO NOT ENTER",
        strategies: [
          { id: 1, name: "EMA Trend + RSI Pullback", status: "WAIT", score: 52, weight: "18%", reason: "Flat moving averages showing no directional trend momentum." },
          { id: 2, name: "Support & Resistance Reversal", status: "UP", score: 65, weight: "20%", reason: "Minor wick test near range low, weak confirmation." },
          { id: 3, name: "Bollinger Bands Breakout", status: "WAIT", score: 48, weight: "16%", reason: "Price trapped tightly inside neutral middle band (20 SMA)." },
          { id: 4, name: "MACD Momentum Confirmation", status: "DOWN", score: 55, weight: "16%", reason: "Conflicting negative micro-histogram tick against range low." },
          { id: 5, name: "Stochastic Reversal", status: "WAIT", score: 50, weight: "15%", reason: "Stochastic hovering around 50 without clear exit velocity." },
          { id: 6, name: "Candlestick Price Action", status: "WAIT", score: 52, weight: "15%", reason: "Doji indecision candle; high probability of chop." },
        ],
      },
      UP: {
        direction: "UP",
        score: 83,
        agreement: "5 of 6",
        opposingCount: 0,
        headline: "BULLISH BREAKOUT ON JPY WEAKNESS",
        reason: "Clean break above 154.200 psychological barrier with surging MACD momentum.",
        actionTitle: "CALL / HIGHER (BUY)",
        strategies: [
          { id: 1, name: "EMA Trend + RSI Pullback", status: "UP", score: 86, weight: "18%", reason: "EMA 9 steep upward angle." },
          { id: 2, name: "Support & Resistance Reversal", status: "UP", score: 84, weight: "20%", reason: "Resistance flipped to support." },
          { id: 3, name: "Bollinger Bands Breakout", status: "UP", score: 80, weight: "16%", reason: "Upper band walking." },
          { id: 4, name: "MACD Momentum Confirmation", status: "UP", score: 85, weight: "16%", reason: "Expansion above 0." },
          { id: 5, name: "Stochastic Reversal", status: "UP", score: 78, weight: "15%", reason: "Momentum continuation." },
          { id: 6, name: "Candlestick Price Action", status: "WAIT", score: 64, weight: "15%", reason: "Strong marubozu." },
        ],
      },
      DOWN: {
        direction: "DOWN",
        score: 80,
        agreement: "4 of 6",
        opposingCount: 1,
        headline: "BEARISH PULLBACK ON YEN STRENGTH",
        reason: "Double top at 154.500 with RSI divergence and bearish engulfing candle.",
        actionTitle: "PUT / LOWER (SELL)",
        strategies: [
          { id: 1, name: "EMA Trend + RSI Pullback", status: "DOWN", score: 82, weight: "18%", reason: "EMA 9 crossed below." },
          { id: 2, name: "Support & Resistance Reversal", status: "DOWN", score: 85, weight: "20%", reason: "Double top confirmed." },
          { id: 3, name: "Bollinger Bands Breakout", status: "DOWN", score: 76, weight: "16%", reason: "Reversal off upper band." },
          { id: 4, name: "MACD Momentum Confirmation", status: "DOWN", score: 81, weight: "16%", reason: "Bearish crossover." },
          { id: 5, name: "Stochastic Reversal", status: "WAIT", score: 65, weight: "15%", reason: "Mid-level crossover." },
          { id: 6, name: "Candlestick Price Action", status: "DOWN", score: 80, weight: "15%", reason: "Bearish engulfing." },
        ],
      },
    },
  },
  {
    id: "AUD/USD",
    pair: "AUD/USD",
    base: "AUD",
    quote: "USD",
    market: "OTC",
    rate: "0.65410",
    rateChange: "+0.08%",
    candleTime: "18:44:00 UTC",
    latency: "116ms",
    defaultMode: "UP",
    modes: {
      UP: {
        direction: "UP",
        score: 82,
        agreement: "5 of 6",
        opposingCount: 0,
        headline: "BULLISH TREND ACCELERATION",
        reason:
          "Australian Dollar bouncing off dynamic support zone with higher lows and heavy bullish volume expansion.",
        actionTitle: "CALL / HIGHER (BUY)",
        strategies: [
          { id: 1, name: "EMA Trend + RSI Pullback", status: "UP", score: 86, weight: "18%", reason: "EMA 9 steep angle." },
          { id: 2, name: "Support & Resistance Reversal", status: "UP", score: 84, weight: "20%", reason: "0.65380 support bounce." },
          { id: 3, name: "Bollinger Bands Breakout", status: "UP", score: 78, weight: "16%", reason: "Upper band push." },
          { id: 4, name: "MACD Momentum Confirmation", status: "UP", score: 83, weight: "16%", reason: "Green bars expanding." },
          { id: 5, name: "Stochastic Reversal", status: "UP", score: 80, weight: "15%", reason: "Golden cross." },
          { id: 6, name: "Candlestick Price Action", status: "WAIT", score: 62, weight: "15%", reason: "Bullish candle closed." },
        ],
      },
      DOWN: {
        direction: "DOWN",
        score: 77,
        agreement: "4 of 6",
        opposingCount: 1,
        headline: "RESISTANCE TEST FAILURE",
        reason: "Pin bar rejection at 0.65500 session high with stochastic divergence.",
        actionTitle: "PUT / LOWER (SELL)",
        strategies: [
          { id: 1, name: "EMA Trend + RSI Pullback", status: "DOWN", score: 80, weight: "18%", reason: "RSI tick below 50." },
          { id: 2, name: "Support & Resistance Reversal", status: "DOWN", score: 82, weight: "20%", reason: "Session high wick rejection." },
          { id: 3, name: "Bollinger Bands Breakout", status: "WAIT", score: 65, weight: "16%", reason: "Upper band pullback." },
          { id: 4, name: "MACD Momentum Confirmation", status: "DOWN", score: 79, weight: "16%", reason: "Histogram declining." },
          { id: 5, name: "Stochastic Reversal", status: "DOWN", score: 81, weight: "15%", reason: "Overbought cross." },
          { id: 6, name: "Candlestick Price Action", status: "WAIT", score: 60, weight: "15%", reason: "Shooting star." },
        ],
      },
      WAIT: {
        direction: "WAIT",
        score: 49,
        agreement: "2 of 6",
        opposingCount: 3,
        headline: "WAIT STATE — CONFLICTING SIGNALS",
        reason: "Heavy market indecision between commodity sentiment and dollar strength.",
        actionTitle: "STANDBY / DO NOT ENTER",
        strategies: [
          { id: 1, name: "EMA Trend + RSI Pullback", status: "WAIT", score: 48, weight: "18%", reason: "No clear trend." },
          { id: 2, name: "Support & Resistance Reversal", status: "WAIT", score: 50, weight: "20%", reason: "Mid-zone." },
          { id: 3, name: "Bollinger Bands Breakout", status: "WAIT", score: 46, weight: "16%", reason: "Chop." },
          { id: 4, name: "MACD Momentum Confirmation", status: "WAIT", score: 52, weight: "16%", reason: "Flatline." },
          { id: 5, name: "Stochastic Reversal", status: "WAIT", score: 50, weight: "15%", reason: "Neutral." },
          { id: 6, name: "Candlestick Price Action", status: "WAIT", score: 48, weight: "15%", reason: "Spinning top." },
        ],
      },
    },
  },
  {
    id: "USD/CAD",
    pair: "USD/CAD",
    base: "USD",
    quote: "CAD",
    market: "Regular",
    rate: "1.39120",
    rateChange: "-0.04%",
    candleTime: "18:44:00 UTC",
    latency: "104ms",
    defaultMode: "DOWN",
    modes: {
      DOWN: {
        direction: "DOWN",
        score: 83,
        agreement: "5 of 6",
        opposingCount: 0,
        headline: "BEARISH OVERHEAD REJECTION",
        reason:
          "Sustained downward drift rejected cleanly off 1.39200 round number resistance and 200 EMA.",
        actionTitle: "PUT / LOWER (SELL)",
        strategies: [
          { id: 1, name: "EMA Trend + RSI Pullback", status: "DOWN", score: 85, weight: "18%", reason: "EMA 9 below 21." },
          { id: 2, name: "Support & Resistance Reversal", status: "DOWN", score: 87, weight: "20%", reason: "Key round number rejection." },
          { id: 3, name: "Bollinger Bands Breakout", status: "DOWN", score: 79, weight: "16%", reason: "Lower band expansion." },
          { id: 4, name: "MACD Momentum Confirmation", status: "DOWN", score: 84, weight: "16%", reason: "Red histogram widening." },
          { id: 5, name: "Stochastic Reversal", status: "DOWN", score: 78, weight: "15%", reason: "Bearish cycle active." },
          { id: 6, name: "Candlestick Price Action", status: "WAIT", score: 62, weight: "15%", reason: "Bearish candle close." },
        ],
      },
      UP: {
        direction: "UP",
        score: 76,
        agreement: "4 of 6",
        opposingCount: 1,
        headline: "BULLISH CRUDE OIL CORRELATION DIVERGENCE",
        reason: "Bounce from ascending trendline with green MACD histogram tick.",
        actionTitle: "CALL / HIGHER (BUY)",
        strategies: [
          { id: 1, name: "EMA Trend + RSI Pullback", status: "UP", score: 78, weight: "18%", reason: "RSI recovery." },
          { id: 2, name: "Support & Resistance Reversal", status: "UP", score: 82, weight: "20%", reason: "Trendline test hold." },
          { id: 3, name: "Bollinger Bands Breakout", status: "WAIT", score: 66, weight: "16%", reason: "Mid-band bounce." },
          { id: 4, name: "MACD Momentum Confirmation", status: "UP", score: 76, weight: "16%", reason: "Histogram shift." },
          { id: 5, name: "Stochastic Reversal", status: "UP", score: 80, weight: "15%", reason: "Oversold crossover." },
          { id: 6, name: "Candlestick Price Action", status: "WAIT", score: 60, weight: "15%", reason: "Hammer." },
        ],
      },
      WAIT: {
        direction: "WAIT",
        score: 51,
        agreement: "2 of 6",
        opposingCount: 2,
        headline: "WAIT STATE — RANGE BOUND",
        reason: "Price trapped between 1.39100 and 1.39200 without volume confirmation.",
        actionTitle: "STANDBY / DO NOT ENTER",
        strategies: [
          { id: 1, name: "EMA Trend + RSI Pullback", status: "WAIT", score: 50, weight: "18%", reason: "Flat." },
          { id: 2, name: "Support & Resistance Reversal", status: "WAIT", score: 52, weight: "20%", reason: "Mid range." },
          { id: 3, name: "Bollinger Bands Breakout", status: "WAIT", score: 48, weight: "16%", reason: "Squeeze." },
          { id: 4, name: "MACD Momentum Confirmation", status: "WAIT", score: 52, weight: "16%", reason: "Zero line." },
          { id: 5, name: "Stochastic Reversal", status: "WAIT", score: 50, weight: "15%", reason: "Neutral." },
          { id: 6, name: "Candlestick Price Action", status: "WAIT", score: 51, weight: "15%", reason: "Doji." },
        ],
      },
    },
  },
  {
    id: "EUR/GBP",
    pair: "EUR/GBP",
    base: "EUR",
    quote: "GBP",
    market: "OTC",
    rate: "0.84150",
    rateChange: "+0.01%",
    candleTime: "18:44:00 UTC",
    latency: "120ms",
    defaultMode: "WAIT",
    modes: {
      WAIT: {
        direction: "WAIT",
        score: 51,
        agreement: "2 of 6",
        opposingCount: 2,
        headline: "WAIT STATE — LOW VOLATILITY CHOP",
        reason:
          "ADX reading at 14 indicates complete absence of directional trend momentum. Consolidating tightly in 8-pip range.",
        actionTitle: "STANDBY / DO NOT ENTER",
        strategies: [
          { id: 1, name: "EMA Trend + RSI Pullback", status: "WAIT", score: 50, weight: "18%", reason: "Moving averages tangled." },
          { id: 2, name: "Support & Resistance Reversal", status: "WAIT", score: 52, weight: "20%", reason: "No distinct level." },
          { id: 3, name: "Bollinger Bands Breakout", status: "WAIT", score: 47, weight: "16%", reason: "Ultra-tight squeeze." },
          { id: 4, name: "MACD Momentum Confirmation", status: "WAIT", score: 50, weight: "16%", reason: "Zero line flatline." },
          { id: 5, name: "Stochastic Reversal", status: "WAIT", score: 53, weight: "15%", reason: "Centering at 50." },
          { id: 6, name: "Candlestick Price Action", status: "WAIT", score: 51, weight: "15%", reason: "Micro bodies." },
        ],
      },
      UP: {
        direction: "UP",
        score: 80,
        agreement: "4 of 6",
        opposingCount: 1,
        headline: "BULLISH BREAKOUT OFF CHOP BASE",
        reason: "Surge above 0.84200 resistance with sudden volume injection.",
        actionTitle: "CALL / HIGHER (BUY)",
        strategies: [
          { id: 1, name: "EMA Trend + RSI Pullback", status: "UP", score: 82, weight: "18%", reason: "EMA breakout." },
          { id: 2, name: "Support & Resistance Reversal", status: "UP", score: 84, weight: "20%", reason: "Level breached." },
          { id: 3, name: "Bollinger Bands Breakout", status: "UP", score: 78, weight: "16%", reason: "Band rupture." },
          { id: 4, name: "MACD Momentum Confirmation", status: "UP", score: 81, weight: "16%", reason: "Histogram pop." },
          { id: 5, name: "Stochastic Reversal", status: "UP", score: 76, weight: "15%", reason: "Upward expansion." },
          { id: 6, name: "Candlestick Price Action", status: "WAIT", score: 60, weight: "15%", reason: "Large green bar." },
        ],
      },
      DOWN: {
        direction: "DOWN",
        score: 78,
        agreement: "4 of 6",
        opposingCount: 1,
        headline: "BEARISH PRESSURE BREAKDOWN",
        reason: "Support breakdown at 0.84100 with pound strength dominating cross.",
        actionTitle: "PUT / LOWER (SELL)",
        strategies: [
          { id: 1, name: "EMA Trend + RSI Pullback", status: "DOWN", score: 80, weight: "18%", reason: "EMA breakdown." },
          { id: 2, name: "Support & Resistance Reversal", status: "DOWN", score: 82, weight: "20%", reason: "Floor lost." },
          { id: 3, name: "Bollinger Bands Breakout", status: "DOWN", score: 76, weight: "16%", reason: "Lower band slide." },
          { id: 4, name: "MACD Momentum Confirmation", status: "DOWN", score: 79, weight: "16%", reason: "Red histogram." },
          { id: 5, name: "Stochastic Reversal", status: "DOWN", score: 75, weight: "15%", reason: "Overbought flush." },
          { id: 6, name: "Candlestick Price Action", status: "WAIT", score: 62, weight: "15%", reason: "Bearish candle." },
        ],
      },
    },
  },
];

export default function LiveSignalsPage() {
  const [selectedPairId, setSelectedPairId] = useState<string>("EUR/USD");
  const [currentMode, setCurrentMode] = useState<SignalMode>("UP");
  const [secondsRemaining, setSecondsRemaining] = useState(48);
  const [mounted, setMounted] = useState(false);

  // 1. Audio Sound state
  const [soundEnabled, setSoundEnabled] = useState(true);

  // 2. Full-screen Outcome celebration state
  const [outcomeModal, setOutcomeModal] = useState<OutcomeType | null>(null);

  // 3. Pair switching loading state
  const [isSwitchingPair, setIsSwitchingPair] = useState(false);
  const [pendingPairId, setPendingPairId] = useState<string | null>(null);
  const [syncStep, setSyncStep] = useState<string>("Purging stale candle state...");

  // Active Pair & Signal
  const activePair =
    MONITORED_PAIRS.find((p) => p.id === selectedPairId) || MONITORED_PAIRS[0];
  const pendingPair =
    MONITORED_PAIRS.find((p) => p.id === pendingPairId) || activePair;
  const activeSignal =
    activePair.modes[currentMode] || activePair.modes[activePair.defaultMode];

  const isUp = activeSignal.direction === "UP";
  const isDown = activeSignal.direction === "DOWN";
  const isWait = activeSignal.direction === "WAIT";

  const involvedStrategies =
    activeSignal.strategies.filter((s) =>
      isWait ? s.status === "WAIT" : s.status === activeSignal.direction
    );

  // Toggle sound
  const toggleSound = () => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    soundEffects.isMuted = !nextState;
    if (nextState) {
      soundEffects.playUpSignal();
    }
  };

  // Play signal alert sound whenever mode changes manually
  const setModeWithSound = (mode: SignalMode) => {
    setCurrentMode(mode);
    if (soundEnabled) {
      if (mode === "UP") soundEffects.playUpSignal();
      else if (mode === "DOWN") soundEffects.playDownSignal();
    }
  };

  // Handle pair selection with high-tech loading transition
  const handleSelectPair = (pairId: string) => {
    if (pairId === selectedPairId || isSwitchingPair) return;

    setIsSwitchingPair(true);
    setPendingPairId(pairId);
    setSyncStep("Purging previous M1 candle buffer...");

    if (soundEnabled) {
      soundEffects.playPairSwitch();
    }

    setTimeout(() => {
      setSyncStep(`Connecting to ${pairId} WebSocket feed (~110ms)...`);
    }, 220);

    setTimeout(() => {
      setSelectedPairId(pairId);
      const target = MONITORED_PAIRS.find((p) => p.id === pairId);
      if (target) {
        setCurrentMode(target.defaultMode);
        if (soundEnabled) {
          if (target.defaultMode === "UP") soundEffects.playUpSignal();
          else if (target.defaultMode === "DOWN") soundEffects.playDownSignal();
        }
      }
      setIsSwitchingPair(false);
      setPendingPairId(null);
    }, 550);
  };

  // Trigger Win celebration
  const triggerWin = () => {
    if (soundEnabled) soundEffects.playWin();
    setOutcomeModal("WIN");
  };

  // Trigger Loss alert
  const triggerLoss = () => {
    if (soundEnabled) soundEffects.playLoss();
    setOutcomeModal("LOSS");
  };

  // 60-second continuous countdown: starts at 60s and counts down continuously to 00s
  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev <= 1 ? 60 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Trading window rules:
  // Starts from 60s down to 31s (first 30s of candle): Trading window is OPEN
  // Rest of the 30s (30s down to 00s): Trading window is CLOSED / EXPIRY PHASE (SHOWN IN YELLOW)
  const isWindowOpen = secondsRemaining > 30;

  const baseCurrency = CURRENCY_MAP[activePair.base];
  const quoteCurrency = CURRENCY_MAP[activePair.quote];

  return (
    <AppShell
      title="Live Signals"
      description="Real-time 60-second fixed expiry signal engine with synchronized pair telemetry."
    >
      <div className="space-y-6 relative">
        {/* ── FULL SCREEN WIN / LOSS CELEBRATION MODAL ── */}
        <TradeOutcomeModal
          outcome={outcomeModal}
          pair={activePair.pair}
          base={activePair.base}
          quote={activePair.quote}
          market={activePair.market}
          direction={activeSignal.direction}
          entryPrice={activePair.rate}
          exitPrice={
            isUp
              ? (parseFloat(activePair.rate) + 0.00014).toFixed(5)
              : (parseFloat(activePair.rate) - 0.00014).toFixed(5)
          }
          onClose={() => setOutcomeModal(null)}
        />

        {/* ══════════════════════════════════════════════════════════════
            ACTIVE MONITORED PAIR TELEMETRY SHOWCASE
        ══════════════════════════════════════════════════════════════ */}
        <section className="p-6 sm:p-7 rounded-2xl bg-card border border-border shadow-xl relative overflow-hidden min-h-[260px]">
          {/* Subtle background ambient corner glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

          {/* ── PAIR SWITCHING LOADING OVERLAY ── */}
          {isSwitchingPair && (
            <div className="absolute inset-0 z-30 bg-background/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
              {/* Pulsing Pair Flags */}
              <div className="relative mb-3">
                <DualFlagIcon
                  base={pendingPair.base}
                  quote={pendingPair.quote}
                  size="hero"
                  className="scale-110 drop-shadow-[0_0_20px_rgba(79,142,247,0.5)] animate-pulse"
                />
                <div className="absolute -inset-2 rounded-xl border border-primary/40 animate-ping pointer-events-none" />
              </div>

              {/* Title & Spinner */}
              <div className="flex items-center gap-2 mb-1.5">
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
                <h3 className="font-mono font-bold text-lg text-foreground">
                  Synchronizing {pendingPair.pair} ({pendingPair.market})
                </h3>
              </div>

              {/* Live Status Step */}
              <p className="text-xs font-mono text-muted-foreground mb-3">
                {syncStep}
              </p>

              {/* Progress Bar Line */}
              <div className="w-48 h-1 rounded-full bg-secondary overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary to-up animate-[pulse_0.6s_ease-in-out_infinite] w-full" />
              </div>
            </div>
          )}

          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-xs font-mono font-bold text-primary bg-primary/10 border border-primary/30 px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  Active Monitored Asset Feed
                </span>

                <span
                  className={cn(
                    "text-xs font-mono font-bold px-3 py-1 rounded-full border uppercase tracking-wider",
                    activePair.market === "OTC"
                      ? "bg-purple-950/80 text-purple-300 border-purple-800/80 shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                      : "bg-blue-950/80 text-blue-300 border-blue-800/80 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                  )}
                >
                  {activePair.market} Market
                </span>

                <span className="text-xs font-mono text-up bg-up/10 border border-up/20 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-up" />
                  Stream Healthy ({activePair.latency})
                </span>
              </div>

              {/* Sound Toggle Button */}
              <button
                type="button"
                onClick={toggleSound}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-mono font-semibold border flex items-center gap-1.5 transition-all",
                  soundEnabled
                    ? "bg-up/15 text-up border-up/30 shadow-[0_0_12px_rgba(0,200,150,0.15)]"
                    : "bg-secondary text-muted-foreground border-border hover:text-foreground"
                )}
                title={soundEnabled ? "Audio alert is ON (click to mute)" : "Audio alert is MUTED (click to enable)"}
              >
                {soundEnabled ? (
                  <Volume2 className="w-3.5 h-3.5 text-up" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 text-muted-foreground" />
                )}
                <span>Sound: {soundEnabled ? "ON" : "MUTED"}</span>
              </button>
            </div>

            {/* MASSIVE DUAL COUNTRY FLAGS + PAIR TICKER */}
            <div className="flex flex-wrap items-center gap-5 sm:gap-6 pt-1">
              <DualFlagIcon
                base={activePair.base}
                quote={activePair.quote}
                size="hero"
              />

              <div>
                <div className="flex items-baseline gap-3">
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black font-mono tracking-tight text-foreground">
                    {activePair.pair}
                  </h1>
                  <span className="text-sm sm:text-base font-mono text-muted-foreground font-bold">
                    M1 • 60s
                  </span>
                </div>

                {/* Currency Full Names Breakdown */}
                <p className="text-xs sm:text-sm font-sans font-medium text-muted-foreground mt-1.5 flex flex-wrap items-center gap-2">
                  <span className="text-foreground font-semibold">
                    {baseCurrency?.name} ({baseCurrency?.symbol})
                  </span>
                  <span className="text-subtle">vs</span>
                  <span className="text-foreground font-semibold">
                    {quoteCurrency?.name} ({quoteCurrency?.symbol})
                  </span>
                  <span className="text-subtle">|</span>
                  <span className="font-mono text-primary">
                    Live Rate: {activePair.rate} ({activePair.rateChange})
                  </span>
                </p>
              </div>
            </div>

            {/* Feed Telemetry Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
              <div className="p-2.5 rounded-lg bg-secondary border border-border">
                <span className="text-[10px] font-mono text-subtle block">BASE CURRENCY</span>
                <span className="text-xs font-mono font-bold text-foreground">
                  {activePair.base} ({baseCurrency?.countryCode})
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-secondary border border-border">
                <span className="text-[10px] font-mono text-subtle block">QUOTE CURRENCY</span>
                <span className="text-xs font-mono font-bold text-foreground">
                  {activePair.quote} ({quoteCurrency?.countryCode})
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-secondary border border-border">
                <span className="text-[10px] font-mono text-subtle block">CANDLE TIMESTAMP</span>
                <span className="text-xs font-mono font-bold text-primary">
                  {activePair.candleTime}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-secondary border border-border">
                <span className="text-[10px] font-mono text-subtle block">FEED PROTOCOL</span>
                <span className="text-xs font-mono font-bold text-up">
                  Low-Latency WebSocket
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            3. MASSIVE HERO SIGNAL COMMAND CENTER
        ══════════════════════════════════════════════════════════════ */}
        <section
          className={cn(
            "relative rounded-2xl border p-6 sm:p-8 lg:p-10 transition-all duration-300 overflow-hidden",
            isUp &&
              "bg-gradient-to-br from-up/15 via-card to-background border-up/40 shadow-[0_0_50px_rgba(0,200,150,0.12)]",
            isDown &&
              "bg-gradient-to-br from-down/15 via-card to-background border-down/40 shadow-[0_0_50px_rgba(240,77,92,0.12)]",
            isWait &&
              "bg-gradient-to-br from-muted-foreground/10 via-card to-background border-muted-foreground/30 shadow-[0_0_40px_rgba(122,139,160,0.08)]"
          )}
        >
          {/* Top Ambient Light Strip */}
          <div
            className={cn(
              "absolute inset-x-0 top-0 h-1.5",
              isUp && "bg-up",
              isDown && "bg-down",
              isWait && "bg-muted-foreground"
            )}
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* ── LEFT: GIGANTIC SIGNAL DIRECTION & HERO TEXT (7 COLS) ── */}
            <div className="lg:col-span-7 space-y-6">
              {/* Category, Pair & Status Badges */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Embedded Pair Badge with Flags */}
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border border-border">
                  <DualFlagIcon base={activePair.base} quote={activePair.quote} size="sm" />
                  <span className="font-mono font-bold text-xs text-foreground">
                    {activePair.pair}
                  </span>
                  <span
                    className={cn(
                      "text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase",
                      activePair.market === "OTC"
                        ? "bg-purple-950 text-purple-300"
                        : "bg-blue-950 text-blue-300"
                    )}
                  >
                    {activePair.market}
                  </span>
                </div>

                <span
                  className={cn(
                    "text-xs font-mono font-bold px-3 py-1 rounded-full uppercase tracking-wider border",
                    isUp && "bg-up/20 text-up border-up/40",
                    isDown && "bg-down/20 text-down border-down/40",
                    isWait && "bg-muted-foreground/20 text-muted-foreground border-muted-foreground/40"
                  )}
                >
                  {isWait ? "STANDBY STATE" : "VERIFIED ACTIONABLE SIGNAL"}
                </span>

                <span className="text-xs font-mono text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
                  60-Second Fixed Expiry
                </span>

                {/* Status indicator for window phase */}
                {isWindowOpen ? (
                  <span className="text-xs font-mono font-bold text-up bg-up/10 border border-up/30 px-3 py-1 rounded-full flex items-center gap-1.5 animate-pulse">
                    <Unlock className="w-3.5 h-3.5" />
                    Window: OPEN (30s)
                  </span>
                ) : (
                  <span className="text-xs font-mono font-bold text-warning bg-warning/15 border border-warning/40 px-3 py-1 rounded-full flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    Window: LOCKED (Rest 30s)
                  </span>
                )}
              </div>

              {/* MASSIVE SIGNAL CALLOUT */}
              <div className="flex items-center gap-6">
                {/* Huge Direction Icon Box */}
                <div
                  className={cn(
                    "w-24 h-24 sm:w-28 sm:h-28 rounded-2xl flex items-center justify-center border shrink-0 transition-transform duration-200",
                    isUp &&
                      "bg-up/15 border-up/50 text-up shadow-[0_0_30px_rgba(0,200,150,0.25)]",
                    isDown &&
                      "bg-down/15 border-down/50 text-down shadow-[0_0_30px_rgba(240,77,92,0.25)]",
                    isWait &&
                      "bg-muted-foreground/15 border-muted-foreground/40 text-muted-foreground shadow-[0_0_20px_rgba(122,139,160,0.15)]"
                  )}
                >
                  {isUp && <ArrowUpRight className="w-14 h-14 sm:w-16 sm:h-16 stroke-[2.5]" />}
                  {isDown && <ArrowDownRight className="w-14 h-14 sm:w-16 sm:h-16 stroke-[2.5]" />}
                  {isWait && <Clock className="w-12 h-12 sm:w-14 sm:h-14 stroke-[2]" />}
                </div>

                {/* Giant Text Label */}
                <div>
                  <div className="flex items-baseline gap-3">
                    <h2
                      className={cn(
                        "text-5xl sm:text-7xl font-black font-mono tracking-tight leading-none",
                        isUp && "text-up",
                        isDown && "text-down",
                        isWait && "text-muted-foreground"
                      )}
                    >
                      {activeSignal.direction}
                    </h2>
                    <span className="text-lg sm:text-xl font-mono text-muted-foreground font-semibold">
                      {isWait ? "STATE" : "DIRECTION"}
                    </span>
                  </div>

                  <p
                    className={cn(
                      "text-sm sm:text-base font-bold font-mono tracking-wider mt-2",
                      isUp && "text-up",
                      isDown && "text-down",
                      isWait && "text-muted-foreground"
                    )}
                  >
                    ACTION: {activeSignal.actionTitle}
                  </p>
                </div>
              </div>

              {/* Signal Rationale Statement / Involved Strategies Tags */}
              <div className="p-4 sm:p-5 rounded-xl bg-background/80 border border-border text-xs sm:text-sm text-foreground leading-relaxed space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2">
                  <span className="text-primary font-semibold uppercase font-mono text-xs flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    Central Engine Evaluation on {activePair.pair} ({activePair.market}):
                  </span>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    {involvedStrategies.length} Confirming Strategies
                  </span>
                </div>

                {/* Strategies involved in signal in the form of tags */}
                <div className="flex flex-wrap items-center gap-2">
                  {involvedStrategies.map((strat, idx) => (
                    <div key={strat.id} className="flex items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border transition-all",
                          isUp &&
                            "bg-up/12 text-up border-up/30 shadow-[0_0_12px_rgba(0,200,150,0.1)]",
                          isDown &&
                            "bg-down/12 text-down border-down/30 shadow-[0_0_12px_rgba(240,77,92,0.1)]",
                          isWait && "bg-secondary text-muted-foreground border-border"
                        )}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>{strat.name}</span>
                      </span>
                      {idx < involvedStrategies.length - 1 && (
                        <span className="text-muted-foreground/70 font-mono font-bold text-sm select-none">
                          +
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed pt-0.5">
                  {activeSignal.reason}
                </p>
              </div>
            </div>

            {/* ── RIGHT: 60S TIMER WITH 30S TRADING WINDOW + YELLOW REST (5 COLS) ── */}
            <div className="lg:col-span-5 space-y-4">
              <div
                className={cn(
                  "p-5 rounded-xl border transition-all duration-300 space-y-3.5",
                  isWindowOpen
                    ? "bg-background/90 border-border"
                    : "bg-gradient-to-br from-warning/10 to-background border-warning/50 shadow-[0_0_30px_rgba(245,166,35,0.12)]"
                )}
              >
                {/* Header of Timer */}
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 font-bold",
                      isWindowOpen ? "text-muted-foreground" : "text-warning"
                    )}
                  >
                    <Clock
                      className={cn(
                        "w-4 h-4",
                        isWindowOpen ? "text-primary" : "text-warning"
                      )}
                    />
                    {isWindowOpen
                      ? "Trading Window: Open (60s → 31s)"
                      : "Trading Window: Closed (30s → 00s)"}
                  </span>

                  <span
                    className={cn(
                      "text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase border",
                      isWindowOpen
                        ? "bg-up/15 text-up border-up/30"
                        : "bg-warning/20 text-warning border-warning/40 animate-pulse"
                    )}
                  >
                    {isWindowOpen ? "ENTER NOW" : "LOCKED / WAIT"}
                  </span>
                </div>

                {/* Big Countdown Timer Display: Continuous countdown starting from 60s down to 00s */}
                <div className="flex items-baseline justify-between pt-1">
                  <div>
                    <span
                      className={cn(
                        "text-5xl sm:text-6xl font-black font-mono transition-colors",
                        isWindowOpen ? "text-foreground" : "text-warning"
                      )}
                    >
                      {String(secondsRemaining).padStart(2, "0")}s
                    </span>
                    <span
                      className={cn(
                        "text-xs ml-2 font-mono font-semibold block sm:inline mt-1 sm:mt-0",
                        isWindowOpen ? "text-up" : "text-warning"
                      )}
                    >
                      {isWindowOpen
                        ? "• Window Open (60s → 31s)"
                        : "• Window Locked (30s → 00s)"}
                    </span>
                  </div>

                  <span
                    className={cn(
                      "text-xs font-mono font-bold px-2.5 py-1 rounded border",
                      isWindowOpen
                        ? "bg-up/10 text-up border-up/30"
                        : "bg-warning/20 text-warning border-warning/40 animate-pulse"
                    )}
                  >
                    {isWindowOpen ? "Window: Open" : "Phase: Yellow Lock"}
                  </span>
                </div>

                {/* Visual Two-Stage Progress Bar: First 30s Green/Active, Rest 30s YELLOW */}
                <div className="space-y-1.5">
                  <div className="w-full h-3 rounded-full bg-secondary overflow-hidden flex border border-border">
                    {/* Stage 1: First 30s (60s down to 31s - Trading Window Open) */}
                    <div className="w-1/2 h-full relative border-r border-background">
                      <div
                        className={cn(
                          "h-full transition-all duration-1000",
                          isWindowOpen
                            ? isUp
                              ? "bg-up"
                              : isDown
                              ? "bg-down"
                              : "bg-muted-foreground"
                            : "bg-up/40"
                        )}
                        style={{
                          width: isWindowOpen
                            ? `${Math.round(((60 - secondsRemaining) / 30) * 100)}%`
                            : "100%",
                        }}
                      />
                    </div>

                    {/* Stage 2: Rest of 30s (30s down to 00s - YELLOW Expiry Lockout) */}
                    <div className="w-1/2 h-full relative">
                      <div
                        className="h-full bg-warning transition-all duration-1000 shadow-[0_0_12px_rgba(245,166,35,0.4)]"
                        style={{
                          width: !isWindowOpen
                            ? `${Math.round(((30 - secondsRemaining) / 30) * 100)}%`
                            : "0%",
                        }}
                      />
                    </div>
                  </div>

                  {/* Stage Labels */}
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className={cn(isWindowOpen ? "text-up font-bold" : "text-muted-foreground")}>
                      [60s → 31s] Window Open
                    </span>
                    <span className={cn(!isWindowOpen ? "text-warning font-bold" : "text-muted-foreground")}>
                      [30s → 00s] Lockout / Expiry (Yellow)
                    </span>
                  </div>
                </div>

                {/* Phase Status Banner */}
                {isWindowOpen ? (
                  <div className="p-2.5 rounded-lg bg-up/10 border border-up/20 flex items-center gap-2 text-xs text-up">
                    <Unlock className="w-4 h-4 shrink-0" />
                    <span>Trading window is open (60s to 31s). Execute trade now during first 30 seconds.</span>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-lg bg-warning/15 border border-warning/40 flex items-center gap-2 text-xs text-warning">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-warning" />
                    <span className="font-semibold">
                      Window closed (30s to 00s). In-trade expiry phase. Do not enter new trades; wait for next candle open.
                    </span>
                  </div>
                )}
              </div>

              {/* Weighted Score & Consensus Metrics */}
              <div className="grid grid-cols-2 gap-3">
                {/* Weighted Score Card */}
                <div className="p-4 rounded-xl bg-background/90 border border-border">
                  <p className="text-[10px] font-mono text-subtle uppercase tracking-wider">
                    Weighted Score
                  </p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span
                      className={cn(
                        "text-3xl font-extrabold font-mono",
                        activeSignal.score >= 70 ? "text-up" : "text-muted-foreground"
                      )}
                    >
                      {activeSignal.score}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">/ 100</span>
                  </div>
                  <p className="text-[10px] font-mono text-muted-foreground mt-1">
                    {activeSignal.score >= 70
                      ? "Passed (≥ 70 Required)"
                      : "Below 70 Threshold"}
                  </p>
                </div>

                {/* Strategy Agreement Card */}
                <div className="p-4 rounded-xl bg-background/90 border border-border">
                  <p className="text-[10px] font-mono text-subtle uppercase tracking-wider">
                    Consensus Vote
                  </p>
                  <p className="text-3xl font-extrabold font-mono text-primary mt-1">
                    {activeSignal.agreement}
                  </p>
                  <p className="text-[10px] font-mono text-muted-foreground mt-1">
                    {isWait ? "Failed Consensus" : "Passed (≥ 4 of 6 Agree)"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── ACTIONABLE MANUAL EXECUTION GUIDE BANNER ── */}
        <section className="p-4 sm:p-5 rounded-xl bg-card border border-border">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div
                className={cn(
                  "p-2.5 rounded-lg border shrink-0",
                  isWindowOpen
                    ? "bg-primary/10 border-primary/20 text-primary"
                    : "bg-warning/15 border-warning/30 text-warning"
                )}
              >
                <Info className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <DualFlagIcon base={activePair.base} quote={activePair.quote} size="sm" />
                  <span>
                    {isWindowOpen
                      ? `Execution Window Active on ${activePair.pair}`
                      : `Execution Window Locked on ${activePair.pair}`}
                  </span>
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isWindowOpen ? (
                    <>
                      Open your broker chart for{" "}
                      <strong className="text-foreground font-mono">
                        {activePair.pair} ({activePair.market} Market)
                      </strong>
                      , verify expiry is strictly set to{" "}
                      <strong className="text-primary font-mono">60 SECONDS</strong>, and execute{" "}
                      <strong
                        className={cn(
                          "font-mono",
                          isUp
                            ? "text-up"
                            : isDown
                            ? "text-down"
                            : "text-muted-foreground"
                        )}
                      >
                        {activeSignal.actionTitle}
                      </strong>
                      .
                    </>
                  ) : (
                    <>
                      The 30-second trade execution window for this candle has elapsed on{" "}
                      <strong className="text-foreground font-mono">{activePair.pair}</strong>. The system is in the{" "}
                      <strong className="text-warning font-mono">
                        30-Second Yellow Lockout / Expiry Phase
                      </strong>
                      . Wait for candle close at 00s.
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
              <span className="text-[11px] font-mono text-subtle border border-border px-3 py-1.5 rounded-lg bg-secondary">
                Zero Auto-Execution Policy
              </span>
            </div>
          </div>
        </section>

        {/* ── THE 6 INDEPENDENT STRATEGY CONSENSUS BREAKDOWN ── */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                Independent 6-Strategy Analysis Matrix for {activePair.pair}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Every strategy operates independently without sharing state to avoid correlation bias.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="px-2.5 py-1 rounded bg-card border border-border text-muted-foreground">
                Threshold: <strong className="text-primary">≥ 4 Agree</strong>
              </span>
              <span className="px-2.5 py-1 rounded bg-card border border-border text-muted-foreground">
                Max Opposing: <strong className="text-warning">≤ 1</strong>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeSignal.strategies.map((strat, idx) => {
              const stratIsUp = strat.status === "UP";
              const stratIsDown = strat.status === "DOWN";
              const stratIsWait = strat.status === "WAIT";

              return (
                <div
                  key={strat.id}
                  className="p-4 rounded-xl border border-border bg-card hover:border-subtle transition-all flex flex-col justify-between space-y-3"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-secondary text-[10px] font-mono text-primary flex items-center justify-center border border-border">
                          0{idx + 1}
                        </span>
                        <h4 className="text-xs font-bold text-foreground truncate max-w-[170px]">
                          {strat.name}
                        </h4>
                      </div>

                      {/* Vote Badge */}
                      <span
                        className={cn(
                          "text-[10px] font-mono font-bold px-2 py-0.5 rounded border shrink-0",
                          stratIsUp && "bg-up/15 text-up border-up/30",
                          stratIsDown && "bg-down/15 text-down border-down/30",
                          stratIsWait && "bg-muted-foreground/15 text-muted-foreground border-muted-foreground/30"
                        )}
                      >
                        {strat.status}
                      </span>
                    </div>

                    {/* Technical Explanation */}
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {strat.reason}
                    </p>
                  </div>

                  {/* Score & Weight Footer */}
                  <div className="space-y-2 pt-2 border-t border-border/60">
                    <div className="flex justify-between items-center text-[11px] font-mono text-muted-foreground">
                      <span>Confidence Score</span>
                      <span
                        className={cn(
                          "font-bold",
                          strat.score >= 70 ? "text-up" : "text-muted-foreground"
                        )}
                      >
                        {strat.score} / 100
                      </span>
                    </div>

                    <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          stratIsUp && "bg-up",
                          stratIsDown && "bg-down",
                          stratIsWait && "bg-muted-foreground"
                        )}
                        style={{ width: `${strat.score}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[10px] font-mono text-subtle">
                      <span>Engine Weight: {strat.weight}</span>
                      <span>M1 Confirmed</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
