/**
 * Small status indicator badge
 */
export function StatusBadge({ status, label }) {
  const styles = {
    optimal: 'bg-optimal/10 text-optimal border-optimal/30',
    caution: 'bg-caution/10 text-caution border-caution/30',
    critical: 'bg-critical/10 text-critical border-critical/30',
    offline: 'bg-zinc-800 text-zinc-500 border-zinc-700',
  };

  const dotStyles = {
    optimal: 'bg-optimal',
    caution: 'bg-caution',
    critical: 'bg-critical animate-pulse',
    offline: 'bg-zinc-600',
  };

  return (
    <span className={`
      inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium
      border ${styles[status]}
    `}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotStyles[status]}`} />
      {label}
    </span>
  );
}
