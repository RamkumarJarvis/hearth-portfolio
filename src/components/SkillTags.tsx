interface SkillsProps {
  skills: Record<string, string[]>;
}

const LABELS: Record<string, string> = {
  frontend: "Frontend",
  architecture: "Architecture",
  state: "State & data",
  uiux: "UI / UX",
  libraries: "Libraries",
  realtime: "Real-time",
  integrations: "Integrations",
  backend: "Backend",
  tools: "Tools",
};

export default function SkillTags({ skills }: SkillsProps) {
  return (
    <div>
      {Object.entries(skills).map(([group, items]) => (
        <div class="skill-group" key={group}>
          <span class="skill-group__label">{LABELS[group] ?? group}</span>
          <div class="skill-group__tags">
            {items.map((item) => (
              <span class="tag" key={item}>{item}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
