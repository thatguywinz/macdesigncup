import * as React from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const GlassButton = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, ...props }, ref) => (
  <Button
    ref={ref}
    className={cn(
      "glass-button border border-white/20 bg-white/10 text-foreground shadow-lg backdrop-blur-xl transition duration-300 hover:border-white/40 hover:bg-white/20 hover:shadow-[0_18px_50px_-30px_rgba(59,130,246,0.7)]",
      className
    )}
    {...props}
  />
));
GlassButton.displayName = "GlassButton";

export { GlassButton };
