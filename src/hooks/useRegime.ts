import { useState, useEffect } from "react";

export type RegimeKey = "BULL_LOW_VOL" | "BULL_HIGH_VOL" | "BEAR" | "SIDEWAYS";

const REGIME_LABEL: Record<string, string> = {
  BULL_LOW_VOL:  "Bull market, low volatility",
  BULL_HIGH_VOL: "Bull market, high volatility",
  BEAR:          "Bear market",
  SIDEWAYS:      "Sideways market",
};

const REGIME_COLOR: Record<string, { text: string; dot: string; bg: string; border: string }> = {
  BULL_LOW_VOL:  { text: "#0F6E56", dot: "#1D9E75", bg: "#f0f8f4", border: "#c0e0d4" },
  BULL_HIGH_VOL: { text: "#7C5A00", dot: "#D97706", bg: "#fffbeb", border: "#fde68a" },
  BEAR:          { text: "#7C1D1D", dot: "#B5621A", bg: "#fff5f0", border: "#fecaca" },
  SIDEWAYS:      { text: "#374151", dot: "#6B7280", bg: "#f9fafb", border: "#e5e7eb" },
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
