interface Project {
  slug: string;
  name: string;
  category: string;
  description: string;
  tech: string[];
  image: string;
}

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <div class="project-card">
      <div class="project-card__image" style={{ backgroundImage: `url(${project.image})` }} />
      <div class="project-card__body">
        <span class="project-card__eyebrow">{project.category}</span>
        <h3 class="project-card__title">{project.name}</h3>
        <p class="project-card__desc">{project.description}</p>
        <div class="project-card__tags">
          {project.tech.map((t) => (
            <span class="tag" key={t}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
