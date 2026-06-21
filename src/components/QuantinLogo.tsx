interface Props {
  iconSize?: number;
  showText?: boolean;
  gap?: number;
}

export function QuantinLogo({ iconSize = 20, showText = true, gap = 8 }: Props) {
  const w = Math.round((44 / 36) * iconSize);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap }}>
      <svg width={w} height={iconSize} viewBox="0 0 44 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="22" cy="9"    rx="3"   ry="7"   fill="#0C447C" />
        <ellipse cx="22" cy="20.5" rx="9.5" ry="3"   fill="#378ADD" fillOpacity="0.7" />
        <ellipse cx="22" cy="27"   rx="15"  ry="2"   fill="#85B7EB" fillOpacity="0.55" />
      </svg>
      {showText && (
        <span style={{
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 300,
          fontSize: Math.round(iconSize * 0.78),
          color: "#1e1e1c",
          letterSpacing: 0,
          lineHeight: 1,
        }}>
          quantin
        </span>
      )}
    </span>
  );
}
