import { getLevelBadgeClass, getLevelLabel } from "@/lib/levelModel";

export default function LevelBadge({ level, emptyLabel = "Sin nivel" }) {
  const label = level ? getLevelLabel(level) : emptyLabel;

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[8px] font-black uppercase tracking-wider ${getLevelBadgeClass(level)}`}>
      {label}
    </span>
  );
}
