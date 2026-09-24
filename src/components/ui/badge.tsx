import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium", {
  variants: {
    variant: {
      default: "border-border bg-primary text-primary-foreground",
      success: "border-primary bg-primary text-primary-foreground",
      warning: "border-border bg-muted text-foreground",
      danger: "border-foreground/25 bg-background text-foreground",
      secondary: "border-border bg-muted text-foreground/80",
    },
  },
  defaultVariants: { variant: "default" },
});

type BadgeProps = HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
