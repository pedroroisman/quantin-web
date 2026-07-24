interface Props {
  iconSize?: number;
  showText?: boolean;
  gap?: number;
}

export function QuantinLogo({ iconSize = 20, showText = true, gap = 8 }: Props) {
  const w = Math.round((25 / 26) * iconSize);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap }}>
      <svg width={w} height={iconSize} viewBox="0 0 25 26" fill="none" xmlns="http://www.w3.org/2000/svg">
        <polygon points="6,5 12,5 14,7 14,21 12,23 6,23 4,21 4,7" fill="#0B1D33"/>
        <polygon points="11,5 17,5 19,7 19,21 17,23 11,23 9,21 9,7" fill="#00D97E" transform="rotate(12,14,14)"/>
      </svg>
      {showText && (
        <span style={{
          fontFamily: "'Cormorant Garamond', Garamond, Georgia, serif",
          fontWeight: 300,
          fontSize: Math.round(iconSize * 0.85),
          color: "#1e1e1c",
          letterSpacing: Math.max(1, Math.round(iconSize * 0.1)),
          lineHeight: 1,
          textTransform: "uppercase",
        }}>
          quantin
        </span>
      )}
    </span>
  );
}
