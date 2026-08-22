interface Props {
  iconSize?: number;
  fontWeight?: number;
}

export function QuantinLogo({ iconSize = 20, fontWeight = 300 }: Props) {
  return (
    <span style={{
      fontFamily: "'Cormorant Garamond', Garamond, Georgia, serif",
      fontWeight,
      fontSize: Math.round(iconSize * 0.85),
      color: "var(--text-primary)",
      letterSpacing: Math.max(1, Math.round(iconSize * 0.04)),
      lineHeight: 1,
      textTransform: "uppercase",
      fontFeatureSettings: '"swsh" 1',
    }}>
      quantin
    </span>
  );
}
