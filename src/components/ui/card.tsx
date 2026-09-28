import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface p-6 text-fg",
        className,
      )}
      {...props}
    />
  );
}
