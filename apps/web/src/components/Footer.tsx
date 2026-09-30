import { Link } from "react-router-dom";
import { ArrowUpRight, MapPin } from "lucide-react";
import styles from "../styles/Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brandBlock}>
          <Link to="/" className={styles.brand}>Lost &amp; Found <span>Pradita</span></Link>
          <p>Ruang temu kembali barang di lingkungan kampus.</p>
        </div>
        <div className={styles.campus}>
          <MapPin size={17} aria-hidden="true" />
          <span>Scientia Business Park, Gading Serpong</span>
          <a href="https://pradita.ac.id" target="_blank" rel="noreferrer" aria-label="Situs Universitas Pradita">
            pradita.ac.id <ArrowUpRight size={14} />
          </a>
        </div>
        <div className={styles.copyright}>© 2026 Universitas Pradita</div>
      </div>
    </footer>
  );
}