import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium", {
  variants: {
    variant: {
      default: "border-border bg-primary text-primary-foreground",
      success: "border-emerald-400/15 bg-emerald-400/10 text-emerald-300",
      warning: "border-amber-400/15 bg-amber-400/10 text-amber-300",
      danger: "border-red-400/15 bg-red-400/10 text-red-300",
      secondary: "border-border bg-muted text-foreground/80",
    },
  },
  defaultVariants: { variant: "default" },
});

type BadgeProps = HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
