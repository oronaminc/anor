import { cn } from "@/lib/utils";

export function HashtagChips({
  hashtags,
  className,
  limit,
}: {
  hashtags: string[] | null | undefined;
  className?: string;
  limit?: number;
}) {
  if (!hashtags || hashtags.length === 0) return null;
  const shown = typeof limit === "number" ? hashtags.slice(0, limit) : hashtags;

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {shown.map((tag) => (
        <span
          key={tag}
          className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
        >
          #{tag}
        </span>
      ))}
    </div>
  );
}
