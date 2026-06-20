import React from "react";

interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  padding?: string;
}

export function Card({ children, style, padding = "1.5rem" }: CardProps) {
  return (
    <div style={{
      background: "var(--bg-primary)",
      border: "0.5px solid var(--border-subtle)",
      borderRadius: "var(--radius-lg)",
      padding,
      ...style,
    }}>
      {children}
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
  valueColor?: string;
}

export function MetricCard({ label, value, sub, valueColor }: MetricCardProps) {
  return (
    <div style={{
      background: "var(--bg-secondary)",
      borderRadius: "var(--radius-md)",
      padding: "0.9rem 1rem",
    }}>
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-tertiary)", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 500, color: valueColor ?? "var(--text-primary)" }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 2 }}>
          {sub}
        </div>
      )}
    </div>
  );
}
