import { useState, useEffect } from "react";

export type RegimeKey = "BULL_LOW_VOL" | "BULL_HIGH_VOL" | "BEAR" | "SIDEWAYS";

const REGIME_LABEL: Record<string, string> = {
  BULL_LOW_VOL:  "Bull market, low volatility",
  BULL_HIGH_VOL: "Bull market, high volatility",
  BEAR:          "Bear market",
  SIDEWAYS:      "Sideways market",
};

const REGIME_COLOR: Record<string, { text: string; dot: string; bg: string; border: string }> = {
  BULL_LOW_VOL:  { text: "#34D399", dot: "#34D399", bg: "rgba(52,211,153,0.10)",  border: "rgba(52,211,153,0.25)"  },
  BULL_HIGH_VOL: { text: "#FAC775", dot: "#D97706", bg: "rgba(217,119,6,0.12)",   border: "rgba(217,119,6,0.30)"   },
  BEAR:          { text: "#F7C1C1", dot: "#B5621A", bg: "rgba(181,98,26,0.12)",   border: "rgba(181,98,26,0.30)"   },
  SIDEWAYS:      { text: "#9BA4BE", dot: "#6B7280", bg: "rgba(107,114,128,0.10)", border: "rgba(107,114,128,0.25)" },
};

export function useRegime() {
  const [regime, setRegime] = useState<string | null>(null);

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || "";
    fetch(`${apiUrl}/api/regime_breakdown`)
      .then(r => r.json())
      .then(d => setRegime(d.hybrid_b ?? null))
      .catch(() => {});
  }, []);

  const label  = regime ? (REGIME_LABEL[regime]  ?? regime) : null;
  const colors = regime ? (REGIME_COLOR[regime]  ?? REGIME_COLOR.SIDEWAYS) : REGIME_COLOR.BULL_LOW_VOL;

  return { regime, label, colors };
}
