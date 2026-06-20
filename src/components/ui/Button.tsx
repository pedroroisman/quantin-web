import React from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "link";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: "var(--text-primary)",
    color: "var(--bg-primary)",
    border: "none",
  },
  secondary: {
    background: "var(--bg-secondary)",
    color: "var(--text-primary)",
    border: "0.5px solid var(--border-default)",
  },
  ghost: {
    background: "transparent",
    color: "var(--text-secondary)",
    border: "0.5px solid var(--border-default)",
  },
  link: {
    background: "transparent",
    color: "var(--accent)",
    border: "none",
    padding: 0,
    textDecoration: "underline",
    textUnderlineOffset: 2,
  },
};

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: { padding: "7px 14px", fontSize: 13 },
  md: { padding: "11px 22px", fontSize: 14 },
  lg: { padding: "13px 28px", fontSize: 15 },
};

export function Button({ variant = "primary", size = "md", children, style, ...props }: ButtonProps) {
  return (
    <button
      style={{
        fontFamily: "var(--font-sans)",
        fontWeight: 500,
        borderRadius: "var(--radius-md)",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        whiteSpace: "nowrap",
        transition: "opacity 0.15s",
        ...variantStyles[variant],
        ...sizeStyles[size],
        ...style,
      }}
      onMouseOver={e => (e.currentTarget.style.opacity = "0.85")}
      onMouseOut={e => (e.currentTarget.style.opacity = "1")}
      {...props}
    >
      {children}
    </button>
  );
}
