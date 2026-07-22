/** @jsxImportSource react */
// Real React island (see astro.config.mjs REACT_SCOPE) — rendered as a
// standalone client:load island in index.astro, positioned via CSS to sit
// in the same spot as ChatApp's page-header, since a React tree can't be
// nested inside ChatApp's Preact tree directly.
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { PATHS } from "./Icon";

export default function InfoDialog() {
  return (
    <div className="info-dialog-overlay">
      <Dialog>
        <DialogTrigger asChild>
          <button className="info-icon" aria-label="About this chat" title="About this chat">
            <svg
              width={18}
              height={18}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {PATHS.info.split(" M").map((seg, i) => (
                <path key={i} d={i === 0 ? seg : "M" + seg} />
              ))}
            </svg>
          </button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>About this chat</DialogTitle>
            <DialogDescription>
              This is an AI assistant answering from Ram's resume data — his experience,
              projects, and skills. Ask it anything about his background, or use the chips below
              the input (Me, Projects, Skills, Fun, Contact) to jump straight to a topic.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
