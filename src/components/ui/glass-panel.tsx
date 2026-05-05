import * as React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const GlassPanel = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<typeof Card>>(
  ({ className, ...props }, ref) => (
    <Card
      ref={ref}
      className={cn(
        "glass-panel border border-white/20 bg-white/10 text-foreground shadow-lg transition duration-300",
        className
      )}
      {...props}
    />
  )
);
GlassPanel.displayName = "GlassPanel";

export { GlassPanel };
