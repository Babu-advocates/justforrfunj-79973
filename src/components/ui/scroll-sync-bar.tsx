import React, { useEffect, useRef, useState } from "react";

interface ScrollSyncBarProps {
  targetRef: React.RefObject<HTMLElement | null>;
  height?: number; // height of the fixed scrollbar in pixels
}

// A fixed, full-width horizontal scrollbar that mirrors the scroll position
// of a target horizontal scroll container.
export const ScrollSyncBar: React.FC<ScrollSyncBarProps> = ({ targetRef, height = 12 }) => {
  const ghostRef = useRef<HTMLDivElement | null>(null);
  const [contentWidth, setContentWidth] = useState(0);
  const [visible, setVisible] = useState(false);
  const syncing = useRef(false);

  useEffect(() => {
    const target = targetRef.current as HTMLElement | null;
    if (!target) return;

    const update = () => {
      const sw = target.scrollWidth;
      const cw = target.clientWidth;
      setContentWidth(sw);
      setVisible(sw > cw + 1);
    };

    update();

    const ro = new ResizeObserver(update);
    ro.observe(target);
    window.addEventListener("resize", update);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [targetRef]);

  useEffect(() => {
    const target = targetRef.current as HTMLElement | null;
    const ghost = ghostRef.current;
    if (!visible || !target || !ghost) return;

    const onGhostScroll = () => {
      if (syncing.current) return;
      syncing.current = true;
      const ghost = ghostRef.current!;
      const target = targetRef.current as HTMLElement;
      const gr = Math.max(ghost.scrollWidth - ghost.clientWidth, 1);
      const tr = Math.max(target.scrollWidth - target.clientWidth, 1);
      const ratio = ghost.scrollLeft / gr;
      target.scrollLeft = ratio * tr;
      syncing.current = false;
    };

    const onTargetScroll = () => {
      if (syncing.current) return;
      syncing.current = true;
      const ghost = ghostRef.current!;
      const target = targetRef.current as HTMLElement;
      const gr = Math.max(ghost.scrollWidth - ghost.clientWidth, 1);
      const tr = Math.max(target.scrollWidth - target.clientWidth, 1);
      const ratio = target.scrollLeft / tr;
      ghost.scrollLeft = ratio * gr;
      syncing.current = false;
    };

    // Initial sync so the handles match and can reach both ends
    ghost.scrollLeft = target.scrollLeft;

    ghost.addEventListener("scroll", onGhostScroll, { passive: true });
    target.addEventListener("scroll", onTargetScroll, { passive: true });

    return () => {
      ghost.removeEventListener("scroll", onGhostScroll as any);
      target.removeEventListener("scroll", onTargetScroll as any);
    };
  }, [visible, targetRef]);

  if (!visible) return null;

  return (
    <div
      className="fixed left-0 right-0 bottom-0 z-40 pointer-events-auto"
      aria-hidden
    >
      <div
        ref={ghostRef}
        className="overflow-x-auto overflow-y-hidden"
        style={{ height }}
      >
        {/* The inner spacer defines the scrollable width */}
        <div style={{ width: contentWidth, height: 1 }} />
      </div>
    </div>
  );
};
