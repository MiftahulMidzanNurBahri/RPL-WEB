import { useState } from "react";
import { Link } from "react-router-dom";
import { Image, MapPin, MoveUpRight } from "lucide-react";
import { StatusBadge, type ItemStatus } from "./StatusBadge";
import styles from "../styles/ItemCard.module.css";

export interface ItemCardData {
  id: string;
  title: string;
  category: string;
  status: ItemStatus;
  location: string;
  incidentDate: string;
  imageUrl?: string | null;
  reporter?: { name: string; avatarInitials: string };
}

interface ItemCardProps {
  item: ItemCardData;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" })
    .format(new Date(value));
}

export function ItemCard({ item }: ItemCardProps) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <article className={styles.card}>
      <Link className={styles.link} to={`/items/${item.id}`} aria-label={`Lihat ${item.title}`}>
        <div className={styles.imageFrame}>
          {item.imageUrl && !imageFailed ? (
            <img
              className={styles.image}
              src={item.imageUrl}
              alt={item.title}
              loading="lazy"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className={styles.imageFallback} aria-hidden="true"><Image size={25} strokeWidth={1.6} /></div>
          )}
          <StatusBadge className={styles.status} status={item.status} />
        </div>
        <div className={styles.content}>
          <div className={styles.category}>{item.category}</div>
          <h3>{item.title}</h3>
          <div className={styles.location}><MapPin size={15} /><span>{item.location}</span></div>
          <div className={styles.cardFooter}>
            <time dateTime={item.incidentDate}>{formatDate(item.incidentDate)}</time>
            <span className={styles.openIcon} aria-hidden="true"><MoveUpRight size={16} /></span>
          </div>
        </div>
      </Link>
    </article>
  );
}