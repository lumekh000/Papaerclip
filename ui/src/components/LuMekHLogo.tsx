import type { HTMLAttributes } from "react";
import { cn } from "../lib/utils";

interface LuMekHLogoProps extends HTMLAttributes<HTMLDivElement> {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showWordmark?: boolean;
}

export function LuMekHLogo({
  className,
  size = "md",
  showWordmark = false,
  ...props
}: LuMekHLogoProps) {
  const sizeClasses = {
    xs: "size-5",
    sm: "size-6",
    md: "size-8",
    lg: "size-10",
    xl: "size-14",
  };

  return (
    <div className={cn("inline-flex items-center gap-2 select-none", className)} {...props}>
      <img
        src="/brand/lumekh-logo.png"
        alt="LuMekH"
        className={cn("shrink-0 object-contain drop-shadow-sm", sizeClasses[size])}
      />
      {showWordmark && (
        <span className="font-bold tracking-tight text-foreground text-lg">
          LuMekH
        </span>
      )}
    </div>
  );
}
