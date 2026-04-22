import { useRef, useState, useEffect, RefObject } from "react";

interface UseParallaxOptions {
  speed?: number; // 0.1 = subtle, 0.5 = strong
  direction?: "vertical" | "horizontal";
}

export function useParallax<T extends HTMLElement = HTMLDivElement>(
  options: UseParallaxOptions = {}
): { ref: RefObject<T>; offset: number; style: React.CSSProperties } {
  const { speed = 0.2, direction = "vertical" } = options;
  const ref = useRef<T>(null!);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let rafId: number;
    const handleScroll = () => {
      rafId = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const viewCenter = window.innerHeight / 2;
        const delta = (center - viewCenter) * speed;
        setOffset(delta);
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, [speed]);

  const style: React.CSSProperties =
    direction === "vertical"
      ? { transform: `translateY(${offset}px)`, willChange: "transform" }
      : { transform: `translateX(${offset}px)`, willChange: "transform" };

  return { ref, offset, style };
}
