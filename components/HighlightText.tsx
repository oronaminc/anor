import { Fragment } from "react";

/** Renders `text` with case-insensitive occurrences of `query` wrapped in <mark>. */
export function HighlightText({
  text,
  query,
}: {
  text: string;
  query?: string;
}) {
  const q = query?.trim();
  if (!q) return <>{text}</>;

  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === q.toLowerCase() ? (
          <mark key={i}>{part}</mark>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}
