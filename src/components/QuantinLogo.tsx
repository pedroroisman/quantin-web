interface Props {
  iconSize?: number;
  showText?: boolean;
  showIcon?: boolean;
  gap?: number;
  fontWeight?: number;
}

export function QuantinLogo({ iconSize = 20, showText = true, showIcon = true, gap = 8, fontWeight = 300 }: Props) {
  const w = Math.round((25 / 26) * iconSize);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap }}>
      {showIcon && (
        <svg width={w} height={iconSize} viewBox="0 0 25 26" fill="none" xmlns="http://www.w3.org/2000/svg">
          <polygon points="6,5 12,5 14,7 14,21 12,23 6,23 4,21 4,7" fill="#EDE8DC"/>
          <polygon points="11,5 17,5 19,7 19,21 17,23 11,23 9,21 9,7" fill="#00D97E" transform="rotate(12,14,14)"/>
        </svg>
      )}
      {showText && (
        <span style={{
          fontFamily: "'Cormorant Garamond', Garamond, Georgia, serif",
          fontWeight,
          fontSize: Math.round(iconSize * 0.85),
          color: "var(--text-primary)",
          letterSpacing: Math.max(1, Math.round(iconSize * 0.04)),
          lineHeight: 1,
          textTransform: "uppercase",
        }}>
          quantin
        </span>
      )}
    </span>
  );
}
