import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, BadgeCheck, Building2, Search, ShieldCheck, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest, type ApiData, type ApiItem } from "../api/client";
import { ItemCard } from "../components/ItemCard";
import styles from "../styles/Pages.module.css";

interface HomeSummary {
  lostActive: number;
  foundActive: number;
  returned: number;
  latestItems: ApiItem[];
}

const emptySummary: HomeSummary = { lostActive: 0, foundActive: 0, returned: 0, latestItems: [] };

export function HomePage() {
  const [summary, setSummary] = useState(emptySummary);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    apiRequest<ApiData<HomeSummary>>("/api/dashboard/summary")
      .then((response) => setSummary(response.data))
      .catch(() => setSummary(emptySummary))
      .finally(() => setLoading(false));
  }, []);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());
    navigate(`/items${params.size ? `?${params}` : ""}`);
  };

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <div className={styles.eyebrow}><span /> LAYANAN KAMPUS PRADITA</div>
          <h1>Barang kembali.<br /><span>Rasa tenang menyusul.</span></h1>
          <p>Satu ruang untuk menemukan barang tertinggal dan membantu barang temuan kembali ke pemiliknya.</p>
          <form className={styles.heroSearch} onSubmit={submitSearch} role="search">
            <Search size={19} aria-hidden="true" />
            <input aria-label="Cari nama barang atau lokasi" placeholder="Cari nama barang atau lokasi"
              value={search} onChange={(event) => setSearch(event.target.value)} />
            <button type="submit" aria-label="Cari laporan"><ArrowRight size={18} /></button>
          </form>
          <div className={styles.heroActions}>
            <Link className="button button--primary" to="/report?type=lost">Saya kehilangan <ArrowRight size={16} /></Link>
            <Link className="button button--outline" to="/report?type=found">Saya menemukan</Link>
          </div>
        </div>
        <div className={styles.heroArt} aria-hidden="true">
          <div className={styles.artTopline}><span>PRADITA CAMPUS</span><span>01 / 04</span></div>
          <div className={styles.artCircle}><span className={styles.artRing} /><span className={styles.artPin}><BadgeCheck size={27} /></span></div>
          <div className={styles.artLabel}><span className={styles.artIndex}>A</span><span>Temukan kembali<br /><strong>di sekitar kampus</strong></span></div>
          <div className={styles.artFoot}><Building2 size={15} /><span>Gading Serpong, Tangerang</span></div>
        </div>
      </section>

      <section className={styles.metrics} aria-label="Ringkasan laporan kampus">
        <Metric label="Laporan kehilangan aktif" value={summary.lostActive} tone="red" loading={loading} />
        <Metric label="Barang ditemukan" value={summary.foundActive} tone="green" loading={loading} />
        <Metric label="Berhasil dikembalikan" value={summary.returned} tone="blue" loading={loading} />
        <div className={styles.metricNote}><ShieldCheck size={18} /><span>Informasi kontak pribadi tidak ditampilkan di katalog.</span></div>
      </section>

      <section className={styles.latestSection}>
        <div className={styles.sectionHeading}>
          <div><div className={styles.eyebrow}>BARU DILAPORKAN</div><h2>Jejak terbaru di kampus</h2></div>
          <Link className={styles.textLink} to="/items">Lihat semua <ArrowRight size={16} /></Link>
        </div>
        {loading ? (
          <div className={styles.cardGrid} aria-label="Memuat laporan terbaru">
            {[0, 1, 2].map((index) => <div key={index} className={styles.cardSkeleton} />)}
          </div>
        ) : summary.latestItems.length ? (
          <div className={styles.cardGrid}>
            {summary.latestItems.slice(0, 3).map((item) => <ItemCard key={item.id} item={item} />)}
          </div>
        ) : (
          <div className={styles.emptyState}><Sparkles size={22} /><p>Belum ada laporan terbaru.</p></div>
        )}
      </section>

      <section className={styles.stepsSection}>
        <div className={styles.sectionHeading}>
          <div><div className={styles.eyebrow}>ALUR LAYANAN</div><h2>Dari laporan ke serah terima</h2></div>
        </div>
        <div className={styles.stepsGrid}>
          {[
            ["01", "Laporkan", "Ceritakan barang dan area kampus tempat kejadian."],
            ["02", "Cari & cocokkan", "Telusuri katalog dan periksa rekomendasi kecocokan."],
            ["03", "Verifikasi", "Cocokkan ciri khusus langsung dengan pelapor."],
            ["04", "Serah terima", "Atur pertemuan di area kampus dan tandai selesai."]
          ].map(([number, title, description]) => (
            <article className={styles.step} key={number}>
              <span>{number}</span><h3>{title}</h3><p>{description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value, tone, loading }: {
  label: string;
  value: number;
  tone: "red" | "green" | "blue";
  loading: boolean;
}) {
  return (
    <div className={`${styles.metric} ${styles[`metric_${tone}`]}`}>
      <span className={styles.metricValue}>{loading ? "—" : value.toLocaleString("id-ID")}</span>
      <span className={styles.metricLabel}>{label}</span>
    </div>
  );
}