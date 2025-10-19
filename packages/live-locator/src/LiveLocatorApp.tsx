import { useEffect, useMemo, useRef, useState } from "react";
import { toSimpleSelector } from "./utils/selector";

type LiveLocatorAppProps = {
  version: string;
  onClose: () => void;
};

type OverlayRect = {
  top: number;
  left: number;
  width: number;
  height: number;
  label: string;
};

const styles = `
  .banner-live-locator {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 2147483647;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: #f8fafc;
  }
  .banner-live-locator__topbar {
    pointer-events: auto;
    position: fixed;
    top: 16px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(15, 23, 42, 0.95);
    border-radius: 999px;
    padding: 10px 20px;
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow: 0 20px 45px rgba(15, 23, 42, 0.35);
  }
  .banner-live-locator__label {
    font-size: 13px;
    letter-spacing: 0.01em;
  }
  .banner-live-locator__button {
    pointer-events: auto;
    padding: 6px 12px;
    border-radius: 999px;
    border: none;
    font-size: 13px;
    font-weight: 600;
    background: #f1f5f9;
    color: #0f172a;
    cursor: pointer;
  }
  .banner-live-locator__outline {
    position: fixed;
    border: 2px solid rgba(59, 130, 246, 0.9);
    border-radius: 12px;
    pointer-events: none;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
    transition: transform 80ms ease, width 80ms ease, height 80ms ease;
  }
  .banner-live-locator__outline::after {
    content: attr(data-label);
    position: absolute;
    top: -28px;
    left: 0;
    background: rgba(59, 130, 246, 0.95);
    color: #f8fafc;
    padding: 4px 8px;
    border-radius: 8px;
    font-size: 12px;
    pointer-events: none;
  }
  .banner-live-locator__panel {
    pointer-events: auto;
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: rgba(15, 23, 42, 0.93);
    padding: 20px;
    border-radius: 16px;
    min-width: 260px;
    box-shadow: 0 25px 50px rgba(15, 23, 42, 0.3);
  }
  .banner-live-locator__panel h3 {
    margin: 0 0 12px;
    font-size: 16px;
    font-weight: 600;
  }
  .banner-live-locator__panel p {
    margin: 0;
    font-size: 13px;
    line-height: 1.5;
    color: #cbd5f5;
    word-break: break-all;
  }
`;

export function LiveLocatorApp({ version, onClose }: LiveLocatorAppProps) {
  const overlayRootRef = useRef<HTMLDivElement | null>(null);
  const [hovered, setHovered] = useState<HTMLElement | null>(null);
  const [selected, setSelected] = useState<HTMLElement | null>(null);
  const [overlayRect, setOverlayRect] = useState<OverlayRect | null>(null);

  const activeTarget = selected ?? hovered;

  useEffect(() => {
    const overlayRoot = overlayRootRef.current;
    const handlePointerMove = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) {
        setHovered(null);
        return;
      }
      if (overlayRoot && overlayRoot.contains(target)) {
        return;
      }
      setHovered(target);
    };

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) {
        return;
      }
      if (overlayRoot && overlayRoot.contains(target)) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      setSelected(target);
    };

    document.addEventListener("mousemove", handlePointerMove, true);
    document.addEventListener("click", handleClick, true);

    const previousCursor = document.body.style.cursor;
    document.body.style.cursor = "crosshair";

    return () => {
      document.body.style.cursor = previousCursor;
      document.removeEventListener("mousemove", handlePointerMove, true);
      document.removeEventListener("click", handleClick, true);
    };
  }, []);

  useEffect(() => {
    if (!activeTarget) {
      setOverlayRect(null);
      return;
    }

    const updateOverlay = () => {
      const rect = activeTarget.getBoundingClientRect();
      setOverlayRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        label: toSimpleSelector(activeTarget)
      });
    };

    const resizeObserver =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateOverlay) : null;
    resizeObserver?.observe(activeTarget);
    window.addEventListener("scroll", updateOverlay, true);
    window.addEventListener("resize", updateOverlay);
    updateOverlay();

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("scroll", updateOverlay, true);
      window.removeEventListener("resize", updateOverlay);
    };
  }, [activeTarget]);

  const panelContent = useMemo(() => {
    if (!selected) {
      return {
        title: "요소를 선택하세요",
        description: "페이지의 영역을 클릭하면 해당 위치의 정보를 확인할 수 있습니다."
      };
    }

    return {
      title: "선택된 요소",
      description: toSimpleSelector(selected)
    };
  }, [selected]);

  return (
    <div className="banner-live-locator" ref={overlayRootRef}>
      <style>{styles}</style>
      <div className="banner-live-locator__topbar">
        <span className="banner-live-locator__label">Banner Live Locator · v{version}</span>
        <button
          type="button"
          className="banner-live-locator__button"
          onClick={onClose}
        >
          종료
        </button>
      </div>
      {overlayRect ? (
        <div
          className="banner-live-locator__outline"
          style={{
            transform: `translate(${overlayRect.left}px, ${overlayRect.top}px)`,
            width: `${overlayRect.width}px`,
            height: `${overlayRect.height}px`
          }}
          data-label={overlayRect.label}
        />
      ) : null}
      <aside className="banner-live-locator__panel">
        <h3>{panelContent.title}</h3>
        <p>{panelContent.description}</p>
      </aside>
    </div>
  );
}
