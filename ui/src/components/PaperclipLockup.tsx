import type { HTMLAttributes } from "react";
import { cn } from "../lib/utils";

interface PaperclipLockupProps extends HTMLAttributes<HTMLDivElement> {
  decorative?: boolean;
  title?: string;
}

export function PaperclipLockup({
  decorative = false,
  title = "LuMekH",
  className,
  ...rest
}: PaperclipLockupProps) {
  return (
    <div
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : title}
      className={cn("inline-flex items-center gap-2.5 select-none", className)}
      {...rest}
    >
      <img
        src="/brand/lumekh-logo.png"
        alt="LuMekH"
        className="size-8 object-contain shrink-0 drop-shadow-sm"
      />
      <span className="text-xl font-bold tracking-tight text-foreground">
        LuMekH
      </span>
    </div>
  );
}
