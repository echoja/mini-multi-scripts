import { useEffect, useMemo, useRef, useState } from "react";
import { toSimpleSelector } from "./utils/selector";
import styles from "./live-locator.css?inline";

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

export function LiveLocatorApp({ version, onClose }: LiveLocatorAppProps) {
  const overlayRootRef = useRef<HTMLDivElement | null>(null);
  const [hovered, setHovered] = useState<HTMLElement | null>(null);
  const [selected, setSelected] = useState<HTMLElement | null>(null);
  const [overlayRect, setOverlayRect] = useState<OverlayRect | null>(null);
  const initialVersionRef = useRef(version);
  const lastHoveredRef = useRef<HTMLElement | null>(null);
  const lastSelectedRef = useRef<HTMLElement | null>(null);

  const activeTarget = selected ?? hovered;

  useEffect(() => {
    console.log("[banner-tool] Live Locator app mounted", {
      version: initialVersionRef.current,
    });
    return () => {
      console.log("[banner-tool] Live Locator app unmounted");
    };
  }, []);

  useEffect(() => {
    const overlayRoot = overlayRootRef.current;
    const handlePointerMove = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) {
        setHovered(null);
        return;
      }
      if (overlayRoot && event.composedPath().includes(overlayRoot)) {
        return;
      }
      setHovered(target);
    };

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) {
        return;
      }
      if (overlayRoot && event.composedPath().includes(overlayRoot)) {
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
    if (selected) {
      return;
    }
    if (hovered === lastHoveredRef.current) {
      return;
    }
    if (!hovered) {
      if (lastHoveredRef.current) {
        console.log("[banner-tool] Live Locator hover cleared");
        lastHoveredRef.current = null;
      }
      return;
    }
    lastHoveredRef.current = hovered;
    console.log("[banner-tool] Live Locator hover target", {
      selector: toSimpleSelector(hovered),
    });
  }, [hovered, selected]);

  useEffect(() => {
    if (selected === lastSelectedRef.current) {
      return;
    }
    if (!selected) {
      if (lastSelectedRef.current) {
        console.log("[banner-tool] Live Locator selection cleared");
        lastSelectedRef.current = null;
      }
      return;
    }
    lastSelectedRef.current = selected;
    console.log("[banner-tool] Live Locator selection updated", {
      selector: toSimpleSelector(selected),
    });
  }, [selected]);

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
        label: toSimpleSelector(activeTarget),
      });
    };

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(updateOverlay)
        : null;
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
        description:
          "페이지의 영역을 클릭하면 해당 위치의 정보를 확인할 수 있습니다.",
      };
    }

    return {
      title: "선택된 요소",
      description: toSimpleSelector(selected),
    };
  }, [selected]);

  return (
    <>
      <style>{styles}</style>
      <div
        className="fixed inset-0 font-sans pointer-events-none banner-live-locator z-2147483647 text-slate-50"
        ref={overlayRootRef}
      >
        <div className="banner-live-locator__topbar pointer-events-auto fixed left-1/2 top-4 flex -translate-x-1/2 items-center gap-3 rounded-full bg-slate-900/95 px-5 py-2.5 shadow-[0_20px_45px_rgba(15,23,42,0.35)] z-10 border border-slate-600">
          <span className="banner-live-locator__label text-[13px] tracking-[0.01em]">
            Banner Live Locator · v{version}
          </span>
          <button
            type="button"
            className="banner-live-locator__button pointer-events-auto rounded-full border-0 bg-slate-100 px-3 py-1.5 text-[13px] font-semibold text-slate-900 transition-colors hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/60"
            onClick={onClose}
          >
            종료
          </button>
        </div>
        {overlayRect ? (
          <div
            className="banner-live-locator__outline fixed pointer-events-none rounded-xl border-2 border-blue-500/90 shadow-[0_0_0_4px_rgba(59,130,246,0.15)] transition-[transform,width,height] duration-75 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
            style={{
              transform: `translate(${overlayRect.left}px, ${overlayRect.top}px)`,
              width: `${overlayRect.width}px`,
              height: `${overlayRect.height}px`,
            }}
            data-label={overlayRect.label}
          />
        ) : null}
        <aside className="banner-live-locator__panel pointer-events-auto fixed bottom-6 right-6 min-w-[260px] rounded-2xl bg-[rgba(15,23,42,0.93)] p-5 shadow-[0_25px_50px_rgba(15,23,42,0.3)]">
          <h3 className="m-0 mb-3 text-base font-semibold text-slate-100">
            {panelContent.title}
          </h3>
          <p className="m-0 wrap-break-word text-[13px] leading-normal text-[#cbd5f5]">
            {panelContent.description}
          </p>
        </aside>
      </div>
    </>
  );
}
