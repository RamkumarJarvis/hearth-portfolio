import { useEffect, useRef } from "preact/hooks";
import gsap from "gsap";
import profile from "../data/profile.json";

// Directional character shots. To add a dedicated expression (e.g. a
// wink or a smile) instead of reusing a directional look, drop the PNG
// in public/images, add a key here, then point a REACTIONS entry at it.
const IMAGES = {
  straight: "/images/looks_stright_view.png",
  up: "/images/looks_up_view.png",
  down: "/images/looks_down_view.png",
  left: "/images/looks_left_view.png",
  right: "/images/looks_right_view.png",
  downLeft: "/images/looks_down_left_view.png",
  downRight: "/images/looks_down_right_view.png",
} as const;

type Direction = keyof typeof IMAGES;

// Maps a chat "topic" to the face shown while that reaction is active.
const REACTIONS: Record<string, Direction> = {
  me: "straight",
  projects: "down",
  skills: "up",
  fun: "downRight",
  contact: "right",
  greeting: "straight",
};

const REACTION_LOCK_MS = 1500;
const CENTER_DEADZONE_PX = 70;

const initials = profile.name
  .split(" ")
  .map((w) => w[0])
  .join("");

export interface FaceReaction {
  key: string;
  nonce: number;
}

export default function FaceAvatar({
  reaction,
  size = 160,
  radius = 20,
  className = "",
}: {
  reaction?: FaceReaction | null;
  size?: number;
  radius?: number;
  className?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const layerA = useRef<HTMLImageElement>(null);
  const layerB = useRef<HTMLImageElement>(null);
  const activeLayer = useRef<0 | 1>(0);
  const currentDir = useRef<Direction>("straight");
  const lockedUntil = useRef(0);
  const reducedMotion = useRef(false);
  const quickX = useRef<((v: number) => void) | null>(null);
  const quickY = useRef<((v: number) => void) | null>(null);

  useEffect(() => {
    reducedMotion.current =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    Object.values(IMAGES).forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  useEffect(() => {
    if (!wrapRef.current) return;
    quickX.current = gsap.quickTo(wrapRef.current, "x", { duration: 0.6, ease: "power3.out" });
    quickY.current = gsap.quickTo(wrapRef.current, "y", { duration: 0.6, ease: "power3.out" });
  }, []);

  function swapTo(dir: Direction) {
    if (dir === currentDir.current) return;
    currentDir.current = dir;
    const layers = [layerA.current, layerB.current];
    const outEl = layers[activeLayer.current];
    const nextIndex = activeLayer.current === 0 ? 1 : 0;
    const inEl = layers[nextIndex];
    if (!outEl || !inEl) return;

    inEl.src = IMAGES[dir];
    gsap.killTweensOf([outEl, inEl]);
    gsap.set(inEl, { opacity: 0 });
    gsap.to(outEl, { opacity: 0, duration: 0.28, ease: "power1.out" });
    gsap.to(inEl, { opacity: 1, duration: 0.28, ease: "power1.out" });
    activeLayer.current = nextIndex;
  }

  // Cursor tracking: the face looks toward the pointer, and the whole
  // avatar drifts a few px toward it for a subtle parallax feel.
  useEffect(() => {
    let raf = 0;
    function onMove(e: PointerEvent) {
      if (Date.now() < lockedUntil.current) return;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const el = wrapRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const dx = e.clientX - (rect.left + rect.width / 2);
        const dy = e.clientY - (rect.top + rect.height / 2);
        const dist = Math.hypot(dx, dy);

        if (!reducedMotion.current) {
          quickX.current?.(Math.max(-10, Math.min(10, dx / 18)));
          quickY.current?.(Math.max(-6, Math.min(6, dy / 24)));
        }

        if (dist < CENTER_DEADZONE_PX) {
          swapTo("straight");
          return;
        }

        const angle = Math.atan2(dy, dx) * (180 / Math.PI); // 0 = right, 90 = down
        let dir: Direction;
        if (angle > -22.5 && angle <= 22.5) dir = "right";
        else if (angle > 22.5 && angle <= 67.5) dir = "downRight";
        else if (angle > 67.5 && angle <= 112.5) dir = "down";
        else if (angle > 112.5 && angle <= 157.5) dir = "downLeft";
        else if (angle > -157.5 && angle <= -112.5) dir = "up";
        else if (angle > -112.5 && angle <= -67.5) dir = "up";
        else dir = "left";
        swapTo(dir);
      });
    }

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Prompt / chip-driven reactions momentarily override the cursor look.
  useEffect(() => {
    if (!reaction) return;
    const dir = REACTIONS[reaction.key] ?? "straight";
    lockedUntil.current = Date.now() + REACTION_LOCK_MS;
    swapTo(dir);

    const wrap = wrapRef.current;
    if (wrap && !reducedMotion.current) {
      gsap.fromTo(
        wrap,
        { scale: 1 },
        { scale: 1.06, duration: 0.18, ease: "power2.out", yoyo: true, repeat: 1 }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reaction?.key, reaction?.nonce]);

  return (
    <div
      class={`face-avatar ${className}`}
      ref={wrapRef}
      style={{ width: `${size}px`, borderRadius: `${radius}px` }}
    >
      <span class="face-avatar__fallback">{initials}</span>
      <img ref={layerA} class="face-avatar__layer" src={IMAGES.straight} style={{ opacity: 1 }} alt="" />
      <img ref={layerB} class="face-avatar__layer" src={IMAGES.straight} style={{ opacity: 0 }} alt="" />
    </div>
  );
}
