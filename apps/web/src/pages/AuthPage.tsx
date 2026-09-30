import { useState, type FormEvent } from "react";
import { ArrowRight, GraduationCap, KeyRound, ShieldCheck } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ApiClientError } from "../api/client";
import { useAuth } from "../auth/AuthProvider";
import { useToast } from "../components/Toast";
import styles from "../styles/Pages.module.css";

export function AuthPage() {
  const location = useLocation();
  const isRegister = location.pathname === "/register";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { signIn, register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const returnTo = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;

  const authenticate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      if (isRegister) {
        await register({ name, email, password, ...(studentNumber ? { studentNumber } : {}) });
        showToast("Akun berhasil dibuat.", "success");
      } else {
        await signIn({ email, password });
        showToast("Selamat datang kembali.", "success");
      }
      navigate(returnTo || "/dashboard", { replace: true });
    } catch (requestError) {
      const message = requestError instanceof ApiClientError
        ? requestError.message
        : "Layanan autentikasi belum dapat dihubungi.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const useDemoAccount = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("password123");
    setSubmitting(true);
    setError("");
    try {
      await signIn({ email: demoEmail, password: "password123" });
      showToast("Masuk dengan akun demo.", "success");
      navigate(returnTo || "/dashboard", { replace: true });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Akun demo belum dapat digunakan.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`${styles.page} ${styles.authPage}`}>
      <section className={styles.authIntro}>
        <div className={styles.eyebrow}><span /> AKUN CIVITAS PRADITA</div>
        <h1>{isRegister ? "Mulai dari" : "Senang melihat"}<br /><span>{isRegister ? "sini." : "Anda kembali."}</span></h1>
        <p>Gunakan akun institusi untuk mengelola laporan dan menghubungi pelapor dengan aman.</p>
        <div className={styles.authTrust}><ShieldCheck size={18} /><span>Kontak pribadi hanya digunakan untuk kebutuhan akun dan tidak ditampilkan di katalog.</span></div>
      </section>
      <section className={styles.authPanel}>
        <div className={styles.authPanelHeading}>
          <div className={styles.authIcon}><GraduationCap size={22} /></div>
          <div><div className={styles.eyebrow}>{isRegister ? "PENDAFTARAN" : "AKSES AKUN"}</div><h2>{isRegister ? "Buat akun Pradita" : "Masuk ke akun"}</h2></div>
        </div>
        <form className={styles.formStack} onSubmit={authenticate}>
          {isRegister && <label className={styles.formField}>Nama lengkap
            <input autoComplete="name" required maxLength={120} value={name} onChange={(event) => setName(event.target.value)} />
          </label>}
          <label className={styles.formField}>Email institusi
            <input type="email" autoComplete="username" required maxLength={254} placeholder="nama@student.pradita.ac.id"
              value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          {isRegister && email.endsWith("@student.pradita.ac.id") && <label className={styles.formField}>NIM <span className={styles.optional}>(opsional)</span>
            <input maxLength={40} value={studentNumber} onChange={(event) => setStudentNumber(event.target.value)} />
          </label>}
          <label className={styles.formField}>Kata sandi
            <input type="password" autoComplete={isRegister ? "new-password" : "current-password"} required minLength={isRegister ? 12 : 1} maxLength={128}
              value={password} onChange={(event) => setPassword(event.target.value)} />
            {isRegister && <small>Minimal 12 karakter.</small>}
          </label>
          {error && <div className={styles.formError} role="alert">{error}</div>}
          <button className="button button--primary button--wide" disabled={submitting} type="submit">
            {submitting ? "Memproses..." : isRegister ? "Buat akun" : "Masuk"}<ArrowRight size={16} />
          </button>
        </form>
        <div className={styles.authSwitch}>
          {isRegister ? "Sudah memiliki akun?" : "Belum memiliki akun?"}
          <Link to={isRegister ? "/login" : "/register"}>{isRegister ? "Masuk" : "Daftar"}</Link>
        </div>
        {!isRegister && import.meta.env.DEV && <div className={styles.demoAccounts}>
          <div className={styles.demoHeading}><KeyRound size={15} /> AKSES DEMO</div>
          <button type="button" disabled={submitting} onClick={() => void useDemoAccount("alex.rivera@student.pradita.ac.id")}>
            <span><strong>Alex Rivera</strong><small>Mahasiswa</small></span><ArrowRight size={15} />
          </button>
          <button type="button" disabled={submitting} onClick={() => void useDemoAccount("sarah.jenkins@pradita.ac.id")}>
            <span><strong>Dr. Sarah Jenkins</strong><small>Dosen / staf</small></span><ArrowRight size={15} />
          </button>
        </div>}
      </section>
    </div>
  );
}