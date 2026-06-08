"use client";

type PaletteItem = {
  index: number;
  answered?: boolean;
  marked?: boolean;
  current?: boolean;
};

export default function QuestionPalette({
  items,
  onSelect,
}: {
  items: PaletteItem[];
  onSelect: (index: number) => void;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 text-sm font-medium text-white">Questions</div>
      <div className="grid grid-cols-5 gap-2 sm:grid-cols-6 lg:grid-cols-5">
        {items.map((item) => {
          const cls = item.current
            ? "border-red-500/40 bg-red-500 text-white"
            : item.marked
              ? "border-red-400/30 bg-red-400/10 text-red-200"
              : item.answered
                ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                : "border-white/10 bg-white/[0.02] text-zinc-300";

          return (
            <button
              key={item.index}
              onClick={() => onSelect(item.index)}
              className={[
                "h-10 rounded-2xl border text-sm font-medium transition hover:scale-[1.02]",
                cls,
              ].join(" ")}
            >
              {item.index + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}
