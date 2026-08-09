import * as React from "react";
import useEmblaCarousel, { type UseEmblaCarouselType } from "embla-carousel-react";
import AutoScroll from "embla-carousel-auto-scroll";

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
  speedOnHover?: number; // Speed when hovered (e.g., 0.3 for slow motion)
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
      gap = 24,
      ...props
    },
    ref
  ) => {
    // 1. Initialize AutoScroll plugin with non-stopping interaction settings
    const autoScrollPlugin = React.useMemo(
      () =>
        AutoScroll({
          speed: speed,
          startDelay: 0,
          stopOnInteraction: false, // Don't kill auto-scroll when user drags
          stopOnMouseEnter: false,  // Handled manually via React events
          playOnInit: true,
        }),
      [speed]
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

    // 2. Adjust AutoScroll speed on hover and guarantee play state on leave
    const handleMouseEnter = React.useCallback(() => {
      setIsHovering(true);
      const autoScroll = api?.plugins()?.autoScroll;
      if (autoScroll) {
        autoScroll.options.speed = speedOnHover;
      }
    }, [api, speedOnHover]);

    const handleMouseLeave = React.useCallback(() => {
      setIsHovering(false);
      const autoScroll = api?.plugins()?.autoScroll;
      if (autoScroll) {
        autoScroll.options.speed = speed;
        if (!autoScroll.isPlaying()) {
          autoScroll.play();
        }
      }
    }, [api, speed]);

    React.useEffect(() => {
      if (!api || !setApi) return;
      setApi(api);
    }, [api, setApi]);

    // 3. Re-trigger AutoScroll explicitly whenever a drag/touch gesture ends
    React.useEffect(() => {
      if (!api) return;

      const autoScroll = api.plugins()?.autoScroll;

      const handlePointerUp = () => {
        if (autoScroll && !autoScroll.isPlaying()) {
          autoScroll.play();
        }
      };

      onSelect(api);
      api.on("reInit", onSelect);
      api.on("select", onSelect);
      api.on("pointerUp", handlePointerUp);

      return () => {
        api.off("select", onSelect);
        api.off("pointerUp", handlePointerUp);
      };
    }, [api, onSelect]);

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
          gap,
          className,
          children,
        }}
      >
        <div
          ref={ref}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className={cn(
            "relative w-full",
            isHovering && "cursor-grab active:cursor-grabbing",
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
    <div ref={carouselRef} className="overflow-hidden w-full">
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