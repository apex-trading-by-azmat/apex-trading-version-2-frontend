"use client";

import * as React from "react";
import { Slider as SliderPrimitive } from "@base-ui/react/slider";
import { cn } from "@/lib/utils";

export interface SliderProps extends React.ComponentProps<typeof SliderPrimitive.Root> {
  className?: string;
  trackClassName?: string;
  thumbClassName?: string;
}

const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  ({ className, trackClassName, thumbClassName, ...props }, ref) => {
    return (
      <SliderPrimitive.Root
        ref={ref}
        data-slot="slider"
        className={cn(
          "relative flex w-full touch-none select-none items-center",
          className
        )}
        {...props}
      >
        <SliderPrimitive.Control className="relative flex w-full items-center">
          <SliderPrimitive.Track
            className={cn(
              "relative h-1.5 w-full grow overflow-hidden rounded-full bg-secondary border border-border/60",
              trackClassName
            )}
          >
            <SliderPrimitive.Indicator className="absolute h-full bg-primary rounded-full transition-all" />
          </SliderPrimitive.Track>
          <SliderPrimitive.Thumb
            className={cn(
              "block size-4 rounded-full border-2 border-primary bg-card shadow-md transition-all hover:scale-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:pointer-events-none disabled:opacity-50 cursor-grab active:cursor-grabbing",
              thumbClassName
            )}
          />
        </SliderPrimitive.Control>
      </SliderPrimitive.Root>
    );
  }
);
Slider.displayName = "Slider";

export { Slider };
