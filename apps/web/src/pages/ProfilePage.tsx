import { useEffect, useState, type FormEvent } from "react";
import { Activity, ArrowRight, KeyRound, Save, ShieldCheck, UserRound } from "lucide-react";
import { apiRequest, type ApiData, type ApiList, type ApiUser } from "../api/client";
import { useAuth } from "../auth/AuthProvider";
import { useToast } from "../components/Toast";
import styles from "../styles/Pages.module.css";

interface ActivityEntry {
  id: string;
  action: string;
  createdAt: string;
  itemId: string | null;
}

export function ProfilePage() {
  const { refreshUser } = useAuth();
  const { showToast } = useToast();
  const [profile, setProfile] = useState<ApiUser | null>(null);
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    Promise.all([
      apiRequest<ApiData<ApiUser>>("/api/profile"),
      apiRequest<ApiList<ActivityEntry>>("/api/activities?page=1&pageSize=20")
    ])
      .then(([profileResponse, activityResponse]) => {
        setProfile(profileResponse.data);
        setName(profileResponse.data.name);
        setPhone(profileResponse.data.phone ?? "");
        setBio(profileResponse.data.bio ?? "");
        setActivities(activityResponse.data);
      })
      .catch(() => setPageError("Profil belum dapat dimuat."))
      .finally(() => setLoading(false));
  }, []);

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await apiRequest<ApiData<ApiUser>>("/api/profile", {
        method: "PUT", body: JSON.stringify({ name, phone: phone || null, bio: bio || null })
      });
      setProfile(response.data);
      await refreshUser();
      showToast("Profil berhasil diperbarui.", "success");
    } catch (requestError) {
      showToast(requestError instanceof Error ? requestError.message : "Profil belum dapat disimpan.", "error");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast("Konfirmasi kata sandi baru tidak sama.", "error");
      return;
    }
    setSaving(true);
    try {
      await apiRequest("/api/auth/password", {
        method: "PUT", body: JSON.stringify({ currentPassword, newPassword })
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast("Kata sandi berhasil diganti.", "success");
    } catch (requestError) {
      showToast(requestError instanceof Error ? requestError.message : "Kata sandi belum dapat diganti.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className={styles.page}><div className={styles.detailSkeleton} /></div>;
  if (!profile) return <div className={styles.page}><div className={styles.emptyState}><p>{pageError || "Profil tidak tersedia."}</p></div></div>;

  const roleLabel = profile.role === "student" ? "Mahasiswa" : profile.role === "campus_staff" ? "Petugas kampus" : "Dosen / staf";

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div><div className={styles.eyebrow}>IDENTITAS KAMPUS</div><h1>Profil saya</h1>
          <p>Perbarui informasi kontak dan keamanan akun.</p></div>
      </header>
      <div className={styles.profileLayout}>
        <aside className={styles.profileIdentity}>
          <div className={styles.avatar}>{profile.avatarInitials}</div>
          <h2>{profile.name}</h2>
          <span className={styles.roleChip}><UserRound size={13} /> {roleLabel}</span>
          <div className={styles.profileMeta}><span>Email institusi</span><strong>{profile.email}</strong></div>
          {profile.studentNumber && <div className={styles.profileMeta}><span>NIM</span><strong>{profile.studentNumber}</strong></div>}
          <div className={styles.profileMeta}><span>Bergabung</span><strong>{new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date(profile.createdAt))}</strong></div>
          <div className={styles.profileSafety}><ShieldCheck size={16} /><span>Email dan role akun hanya diubah melalui verifikasi institusi.</span></div>
        </aside>

        <div className={styles.profileContent}>
          <form className={styles.profilePanel} onSubmit={saveProfile}>
            <div className={styles.panelHeading}><div><h2>Informasi pribadi</h2><p>Data ini tidak ditampilkan sebagai kontak publik.</p></div><Save size={18} /></div>
            <label className={styles.formField}>Nama lengkap
              <input required maxLength={120} value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <label className={styles.formField}>Email institusi
              <input value={profile.email} disabled />
            </label>
            <label className={styles.formField}>Nomor telepon
              <input type="tel" maxLength={32} value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+62 ..." />
            </label>
            <label className={styles.formField}>Bio
              <textarea maxLength={500} rows={3} value={bio} onChange={(event) => setBio(event.target.value)} />
            </label>
            <button className="button button--primary" type="submit" disabled={saving}>Simpan profil <ArrowRight size={15} /></button>
          </form>

          <form className={styles.profilePanel} onSubmit={changePassword}>
            <div className={styles.panelHeading}><div><h2>Keamanan akun</h2><p>Sesi lain akan berakhir setelah kata sandi diganti.</p></div><KeyRound size={18} /></div>
            <label className={styles.formField}>Kata sandi saat ini
              <input type="password" required maxLength={128} autoComplete="current-password" value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)} />
            </label>
            <div className={styles.formGrid}>
              <label className={styles.formField}>Kata sandi baru
                <input type="password" required minLength={8} maxLength={128} autoComplete="new-password" value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)} />
              </label>
              <label className={styles.formField}>Ulangi kata sandi baru
                <input type="password" required minLength={8} maxLength={128} autoComplete="new-password" value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)} />
              </label>
            </div>
            <button className="button button--outline" type="submit" disabled={saving}>Ganti kata sandi</button>
          </form>

          <section className={styles.profilePanel}>
            <div className={styles.panelHeading}><div><h2>Aktivitas terbaru</h2><p>Riwayat laporan dan komunikasi akun Anda.</p></div><Activity size={18} /></div>
            {activities.length ? <div className={styles.activityList}>
              {activities.map((activity) => <div className={styles.activityRow} key={activity.id}>
                <span className={styles.activityDot} />
                <span>{activity.action}</span>
                <time>{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(activity.createdAt))}</time>
              </div>)}
            </div> : <div className={styles.emptyInline}>Belum ada aktivitas tercatat.</div>}
          </section>
        </div>
      </div>
    </div>
  );
}