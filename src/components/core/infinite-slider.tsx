import * as React from "react";
import useEmblaCarousel, { type UseEmblaCarouselType } from "embla-carousel-react";
import AutoScroll from "embla-carousel-auto-scroll";
import { useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

type CarouselApi = UseEmblaCarouselType[1];
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>;
type CarouselOptions = UseCarouselParameters[0];
type CarouselPlugin = UseCarouselParameters[1];

type InfiniteSliderProps = {
  orientation?: "horizontal" | "vertical";
  opts?: CarouselOptions;
  plugins?: CarouselPlugin;
  setApi?: (api: CarouselApi) => void;
  speed?: number; // Base auto-scroll speed (default: 1)
  // Speed when hovered (e.g., 0.3 for slow motion). AutoScroll copies its
  // options at init, so this only shifts speed while the plugin re-reads them —
  // prefer `pauseOnHover` when the slides need to be interacted with.
  speedOnHover?: number;
  pauseOnHover?: boolean; // Stop dead on hover/focus — use when the slides are links
  gap?: number;
  className?: string;
  children: React.ReactNode;
};

type InfiniteSliderContextProps = {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0];
  api: ReturnType<typeof useEmblaCarousel>[1];
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
  orientation?: "horizontal" | "vertical";
} & InfiniteSliderProps;

const InfiniteSliderContext = React.createContext<InfiniteSliderContextProps | null>(null);

function useInfiniteSlider() {
  const context = React.useContext(InfiniteSliderContext);

  if (!context) {
    throw new Error("useInfiniteSlider must be used within an <InfiniteSlider />");
  }

  return context;
}

const InfiniteSlider = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & InfiniteSliderProps
>(
  (
    {
      orientation = "horizontal",
      opts,
      setApi,
      plugins = [],
      className,
      children,
      speed = 1,
      speedOnHover = 0.3,
      pauseOnHover = false,
      gap = 24,
      ...props
    },
    ref
  ) => {
    // A marquee that never stops is exactly what prefers-reduced-motion asks us
    // not to ship, so those visitors get the same wall, standing still.
    const reduced = !!useReducedMotion();

    // 1. Initialize AutoScroll plugin with non-stopping interaction settings
    const autoScrollPlugin = React.useMemo(
      () =>
        AutoScroll({
          speed: speed,
          startDelay: 0,
          stopOnInteraction: false, // Don't kill auto-scroll when user drags
          stopOnMouseEnter: false,  // Handled manually via React events
          // When we own the hold, the plugin's own focus handling must stand
          // down: its "focusout -> play" listener otherwise restarts the rail
          // out from under a visitor whose pointer is still on it.
          stopOnFocusIn: !pauseOnHover,
          playOnInit: !reduced,
        }),
      [speed, reduced, pauseOnHover]
    );

    const [carouselRef, api] = useEmblaCarousel(
      {
        ...opts,
        axis: orientation === "horizontal" ? "x" : "y",
        loop: true,
        dragFree: true,
      },
      [autoScrollPlugin, ...(Array.isArray(plugins) ? plugins : [plugins])]
    );

    const [canScrollPrev, setCanScrollPrev] = React.useState(false);
    const [canScrollNext, setCanScrollNext] = React.useState(false);
    const [isHovering, setIsHovering] = React.useState(false);

    const onSelect = React.useCallback((api: CarouselApi) => {
      if (!api) return;
      setCanScrollPrev(api.canScrollPrev());
      setCanScrollNext(api.canScrollNext());
    }, []);

    const scrollPrev = React.useCallback(() => {
      api?.scrollPrev();
    }, [api]);

    const scrollNext = React.useCallback(() => {
      api?.scrollNext();
    }, [api]);

    // 2. Hover/focus handling. `pauseOnHover` slides that hold links still so
    // they can be clicked; otherwise the original speed-shift behaviour stands.
    const isPointerOver = React.useRef(false);
    const hasFocusInside = React.useRef(false);

    const syncPlayState = React.useCallback(() => {
      const autoScroll = api?.plugins()?.autoScroll;
      if (!autoScroll) return;
      const held =
        reduced || (pauseOnHover && (isPointerOver.current || hasFocusInside.current));
      if (held) {
        if (autoScroll.isPlaying()) autoScroll.stop();
      } else if (!autoScroll.isPlaying()) {
        autoScroll.play();
      }
    }, [api, pauseOnHover, reduced]);

    const handleMouseEnter = React.useCallback(() => {
      setIsHovering(true);
      isPointerOver.current = true;
      const autoScroll = api?.plugins()?.autoScroll;
      if (autoScroll && !pauseOnHover) {
        autoScroll.options.speed = speedOnHover;
      }
      syncPlayState();
    }, [api, pauseOnHover, speedOnHover, syncPlayState]);

    const handleMouseLeave = React.useCallback(() => {
      setIsHovering(false);
      isPointerOver.current = false;
      const autoScroll = api?.plugins()?.autoScroll;
      if (autoScroll && !pauseOnHover) {
        autoScroll.options.speed = speed;
      }
      syncPlayState();
    }, [api, pauseOnHover, speed, syncPlayState]);

    // React's onFocus/onBlur bubble, so these fire for anything inside a slide.
    const handleFocus = React.useCallback(() => {
      hasFocusInside.current = true;
      syncPlayState();
    }, [syncPlayState]);

    const handleBlur = React.useCallback((event: React.FocusEvent<HTMLDivElement>) => {
      // Tabbing from one slide to the next shouldn't hand the rail back for a
      // frame — only a focus that actually leaves the region releases it.
      if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
      hasFocusInside.current = false;
      syncPlayState();
    }, [syncPlayState]);

    React.useEffect(() => {
      if (!api || !setApi) return;
      setApi(api);
    }, [api, setApi]);

    // 3. Re-trigger AutoScroll explicitly whenever a drag/touch gesture ends
    React.useEffect(() => {
      if (!api) return;

      onSelect(api);
      syncPlayState();
      api.on("reInit", onSelect);
      api.on("select", onSelect);
      api.on("pointerUp", syncPlayState);
      // AutoScroll re-runs `playOnInit` on every re-init (a lazy logo settling
      // is enough to trigger one), so re-assert the hold each time.
      api.on("reInit", syncPlayState);

      return () => {
        api.off("reInit", onSelect);
        api.off("select", onSelect);
        api.off("pointerUp", syncPlayState);
        api.off("reInit", syncPlayState);
      };
    }, [api, onSelect, syncPlayState]);

    return (
      <InfiniteSliderContext.Provider
        value={{
          carouselRef,
          api: api,
          opts,
          orientation: orientation || (opts?.axis === "y" ? "vertical" : "horizontal"),
          scrollPrev,
          scrollNext,
          canScrollPrev,
          canScrollNext,
          speed,
          speedOnHover,
          pauseOnHover,
          gap,
          className,
          children,
        }}
      >
        <div
          ref={ref}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={cn(
            "relative w-full",
            isHovering && !pauseOnHover && "cursor-grab active:cursor-grabbing",
            className
          )}
          role="region"
          aria-roledescription="carousel"
          {...props}
        >
          {children}
        </div>
      </InfiniteSliderContext.Provider>
    );
  }
);
InfiniteSlider.displayName = "InfiniteSlider";

const InfiniteSliderContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { carouselRef, orientation } = useInfiniteSlider();

  return (
    // Embla positions the track with transforms, so any real scrollLeft here
    // (a browser scrolling a focused link into view) only knocks it out of
    // alignment — snap it straight back.
    <div
      ref={carouselRef}
      className="overflow-hidden w-full"
      onScroll={(event) => {
        event.currentTarget.scrollLeft = 0;
        event.currentTarget.scrollTop = 0;
      }}
    >
      <div
        ref={ref}
        className={cn(
          "flex touch-pan-y",
          orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col",
          className
        )}
        {...props}
      />
    </div>
  );
});
InfiniteSliderContent.displayName = "InfiniteSliderContent";

const InfiniteSliderItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { orientation } = useInfiniteSlider();

  return (
    <div
      ref={ref}
      role="group"
      aria-roledescription="slide"
      className={cn(
        "min-w-0 shrink-0 grow-0",
        orientation === "horizontal" ? "pl-4" : "pt-4",
        className
      )}
      {...props}
    />
  );
});
InfiniteSliderItem.displayName = "InfiniteSliderItem";

export {
  InfiniteSlider,
  InfiniteSliderContent,
  InfiniteSliderItem,
  type InfiniteSliderProps,
};