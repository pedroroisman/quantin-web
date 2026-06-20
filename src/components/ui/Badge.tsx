import React from "react";

type BadgeVariant = "default" | "success" | "danger" | "warning" | "info" | "live";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  dot?: boolean;
}

const styles: Record<BadgeVariant, React.CSSProperties> = {
  default: { background: "var(--bg-secondary)", border: "0.5px solid var(--border-default)", color: "var(--text-secondary)" },
  success: { background: "var(--success-bg)", border: "0.5px solid var(--success-border)", color: "var(--success-text)" },
  danger:  { background: "var(--danger-bg)",  border: "0.5px solid var(--danger-border)",  color: "var(--danger-text)"  },
  warning: { background: "var(--warning-bg)", border: "0.5px solid var(--warning-border)", color: "var(--warning-text)" },
  info:    { background: "var(--info-bg)",    border: "0.5px solid var(--info-border)",    color: "var(--info-text)"    },
  live:    { background: "var(--success-bg)", border: "0.5px solid var(--success-border)", color: "var(--success-text)" },
};

export function Badge({ children, variant = "default", dot }: BadgeProps) {
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      borderRadius: "var(--radius-full)",
      padding: "3px 10px",
      fontSize: 11,
      fontWeight: 500,
      ...styles[variant],
    }}>
      {dot && (
        <span style={{
          width: 6, height: 6,
          borderRadius: "50%",
          background: "currentColor",
          flexShrink: 0,
        }} />
      )}
      {children}
    </span>
  );
}
