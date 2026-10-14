"use client";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { createPortal } from "react-dom";
import { runawayPosition, type Point } from "@/lib/runaway";

export function RunawayNoButton({ onChoose }: { onChoose: () => void }) {
  const button = useRef<HTMLButtonElement>(null);
  const positionRef = useRef<Point | null>(null);
  const lastPointerType = useRef("keyboard");
  const [portalHost, setPortalHost] = useState<HTMLElement | null>(null);
  const restoreFocus = useRef(false);
  const [position, setPosition] = useState<Point | null>(null);
  const [slotSize, setSlotSize] = useState<{ width: number; height: number } | null>(null);

  function dodge(pointer: Point) {
    const element = button.current;
    if (!element || document.activeElement === element) return;
    const rect = element.getBoundingClientRect();
    const exclusions = [...document.querySelectorAll<HTMLElement>("button, a, input, select, textarea")]
      .filter(control => control !== element)
      .map(control => control.getBoundingClientRect())
      .filter(box => box.width > 0 && box.height > 0 && box.bottom > 0 && box.top < window.innerHeight && box.right > 0 && box.left < window.innerWidth);
    const next = runawayPosition({ width: window.innerWidth, height: window.innerHeight }, rect, pointer, exclusions, positionRef.current || undefined, Math.random());
    if (!next) return;
    setPortalHost(element.closest<HTMLElement>(".invite-root"));
    setSlotSize(current => current || { width: rect.width, height: rect.height });
    positionRef.current = next;
    setPosition(next);
  }
  function approach(event: PointerEvent<HTMLButtonElement>) {
    if (event.pointerType !== "mouse" || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    dodge({ x: event.clientX, y: event.clientY });
  }
  useEffect(() => {
    function reset() { positionRef.current = null; setPosition(null); }
    window.addEventListener("resize", reset);
    window.addEventListener("scroll", reset, { passive: true });
    return () => { window.removeEventListener("resize", reset); window.removeEventListener("scroll", reset); };
  }, []);
  useEffect(() => {
    if (!position && restoreFocus.current) { restoreFocus.current = false; button.current?.focus({ preventScroll: true }); }
  }, [position]);
  const control = <button ref={button} className={`invite-button invite-secondary invite-runaway ${position ? "invite-runaway-floating" : ""}`}
      style={position ? { left: position.x, top: position.y } : undefined}
      onPointerEnter={approach} onPointerMove={approach}
      onPointerDown={event => {
        lastPointerType.current = event.pointerType;
        if (event.pointerType === "mouse" && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
          event.preventDefault(); dodge({ x: event.clientX, y: event.clientY });
        }
      }}
      onFocus={() => { if (position) { restoreFocus.current = true; positionRef.current = null; setPosition(null); } }}
      onClick={event => { if (event.detail === 0 || lastPointerType.current !== "mouse" || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) onChoose(); }}
    >No</button>;
  // The welcome animation creates a CSS containing block. Render the floating
  // button directly under the root so fixed coordinates refer to the viewport.
  return <span className="invite-runaway-slot" style={slotSize ? { width: slotSize.width, height: slotSize.height } : undefined}>
    {position && portalHost ? createPortal(control, portalHost) : control}
  </span>;
}
