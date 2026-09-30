import styles from "../styles/StatusBadge.module.css";

export type ItemStatus = "lost" | "found" | "returned";

const statusLabels: Record<ItemStatus, string> = {
  lost: "Hilang",
  found: "Ditemukan",
  returned: "Dikembalikan"
};

interface StatusBadgeProps {
  status: ItemStatus;
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[status]} ${className}`.trim()}>
      <span className={styles.dot} aria-hidden="true" />
      {statusLabels[status]}
    </span>
  );
}