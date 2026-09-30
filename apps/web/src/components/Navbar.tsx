import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { ArrowRight, CircleUserRound, LayoutDashboard, LogOut, Menu, PackageSearch, Plus, X } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import { useToast } from "./Toast";
import styles from "../styles/Navbar.module.css";

const links = [
  { to: "/items", label: "Cari barang", icon: PackageSearch },
  { to: "/report", label: "Buat laporan", icon: Plus },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard }
];

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { showToast } = useToast();

  const logout = async () => {
    try {
      await signOut();
      setMenuOpen(false);
      window.location.replace("/");
    } catch {
      showToast("Sesi belum dapat diakhiri.", "error");
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link className={styles.brand} to="/" aria-label="Lost And Found Universitas Pradita">
          <span className={styles.brandMark} aria-hidden="true"><PackageSearch size={21} /></span>
          <span className={styles.brandText}>
            <strong>Lost &amp; Found</strong>
            <small>UNIVERSITAS PRADITA</small>
          </span>
        </Link>

        <button
          className={styles.menuToggle}
          type="button"
          aria-label={menuOpen ? "Tutup navigasi" : "Buka navigasi"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>

        <nav className={`${styles.navigation} ${menuOpen ? styles.navigationOpen : ""}`} aria-label="Navigasi utama">
          <div className={styles.navLinks}>
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ""}`}
                onClick={() => setMenuOpen(false)}
              >
                <Icon size={17} strokeWidth={1.9} />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
          <div className={styles.accountLinks}>
            {user ? <>
              <NavLink className={styles.profileLink} to="/profile" onClick={() => setMenuOpen(false)}>
                <span className={styles.avatar}>{user.avatarInitials}</span>
                <span>{user.name.split(" ")[0]}</span>
              </NavLink>
              <button className={styles.logoutButton} type="button" title="Keluar" aria-label="Keluar" onClick={() => void logout()}>
                <LogOut size={17} />
              </button>
            </> : <>
              <NavLink className={styles.profileLink} to="/login" onClick={() => setMenuOpen(false)}>
                <CircleUserRound size={18} /><span>Profil</span>
              </NavLink>
              <Link className={styles.loginLink} to="/login" onClick={() => setMenuOpen(false)}>
                <span>Masuk</span><ArrowRight size={16} />
              </Link>
            </>}
          </div>
        </nav>
      </div>
    </header>
  );
}