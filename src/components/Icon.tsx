const PATHS: Record<string, string> = {
  send: "M4 12L20 4L14 20L11 13L4 12Z",
  info: "M12 11V16 M12 8H12.01 M12 21A9 9 0 1 0 12 3A9 9 0 0 0 12 21Z",
  mail: "M4 6H20A1 1 0 0 1 21 7V17A1 1 0 0 1 20 18H4A1 1 0 0 1 3 17V7A1 1 0 0 1 4 6Z M3.5 7L12 13L20.5 7",
  briefcase: "M4 8H20A1 1 0 0 1 21 9V19A1 1 0 0 1 20 20H4A1 1 0 0 1 3 19V9A1 1 0 0 1 4 8Z M9 8V6A2 2 0 0 1 11 4H13A2 2 0 0 1 15 6V8",
  layers: "M12 3L21 8L12 13L3 8L12 3Z M3 13L12 18L21 13 M3 10.5L12 15.5L21 10.5",
  sparkles: "M12 3L13.5 8.5L19 10L13.5 11.5L12 17L10.5 11.5L5 10L10.5 8.5L12 3Z M19 17L19.7 19.3L22 20L19.7 20.7L19 23L18.3 20.7L16 20L18.3 19.3L19 17Z",
  user: "M12 12A4 4 0 1 0 12 4A4 4 0 0 0 12 12Z M4 20A8 8 0 0 1 20 20",
  chevronDown: "M6 9L12 15L18 9",
  x: "M6 6L18 18 M18 6L6 18",
};

interface IconProps {
  name: keyof typeof PATHS | "stop";
  size?: number;
  class?: string;
}

export default function Icon({ name, size = 20, class: className }: IconProps) {
  if (name === "stop") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" class={className}>
        <rect x="6" y="6" width="12" height="12" rx="2" />
      </svg>
    );
  }

  const d = PATHS[name];
  if (!d) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      class={className}
    >
      {d.split(" M").map((seg, i) => (
        <path key={i} d={i === 0 ? seg : "M" + seg} />
      ))}
    </svg>
  );
}
