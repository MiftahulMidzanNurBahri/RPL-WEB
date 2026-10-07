import { useEffect, useState } from "react";
import { ArrowRight, Check, Clock3, Inbox, RefreshCw, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { apiRequest, type ApiData, type ApiItem, type ApiList } from "../api/client";
import { useAuth } from "../auth/AuthProvider";
import { StatusBadge } from "../components/StatusBadge";
import { useToast } from "../components/Toast";
import styles from "../styles/Pages.module.css";

interface PersonalDashboard {
  lost: number;
  found: number;
  returned: number;
  matchCount: number;
  recentItems: ApiItem[];
}

interface MatchEntry {
  ownItem: ApiItem;
  candidate: ApiItem;
  score: number;
  percentage: number;
  reasons: string[];
}

interface InquiryEntry {
  id: string;
  kind: "inquiry" | "claim";
  status: "pending" | "replied" | "resolved";
  message: string;
  createdAt: string;
  item: { id: string; title: string } | null;
  sender: { id: string; name: string; avatarInitials: string };
  recipient: { id: string; name: string; avatarInitials: string };
}

type DashboardTab = "reports" | "archive" | "matches" | "messages";

export function DashboardPage() {
  const [summary, setSummary] = useState<PersonalDashboard | null>(null);
  const [matches, setMatches] = useState<MatchEntry[]>([]);
  const [inquiries, setInquiries] = useState<InquiryEntry[]>([]);
  const [archivedItems, setArchivedItems] = useState<ApiItem[]>([]);
  const [archivePage, setArchivePage] = useState(1);
  const [archiveTotal, setArchiveTotal] = useState(0);
  const [tab, setTab] = useState<DashboardTab>("reports");
  const [filter, setFilter] = useState<"all" | "active" | "done">("all");
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [renewingId, setRenewingId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState("");
  const { user } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    setLoading(true);
    setLoadError("");
    Promise.all([
      apiRequest<ApiData<PersonalDashboard>>("/api/dashboard/me"),
      apiRequest<ApiList<MatchEntry>>("/api/matches?page=1&pageSize=50"),
      apiRequest<ApiList<InquiryEntry>>("/api/inquiries?page=1&pageSize=50"),
      apiRequest<ApiList<ApiItem>>(`/api/dashboard/me/archived?page=${archivePage}&pageSize=20`)
    ])
      .then(([dashboard, matchResult, inquiryResult, archiveResult]) => {
        setSummary(dashboard.data);
        setMatches(matchResult.data);
        setInquiries(inquiryResult.data);
        setArchivedItems(archiveResult.data);
        setArchiveTotal(archiveResult.pagination.total);
      })
        .catch(() => setLoadError("Dashboard belum dapat dimuat. Coba perbarui atau masuk kembali."))
      .finally(() => setLoading(false));
      }, [refreshKey, archivePage]);

  const renewReport = async (itemId: string) => {
    setRenewingId(itemId);
    try {
      await apiRequest(`/api/items/${encodeURIComponent(itemId)}/renew`, { method: "POST" });
      showToast("Laporan aktif kembali selama 14 hari.", "success");
      setArchivePage(1);
      setRefreshKey((key) => key + 1);
    } catch (requestError) {
      showToast(requestError instanceof Error ? requestError.message : "Laporan belum dapat diperpanjang.", "error");
    } finally {
      setRenewingId(null);
    }
  };

  const updateInquiry = async (inquiryId: string, status: "replied" | "resolved") => {
    try {
      await apiRequest(`/api/inquiries/${inquiryId}`, {
        method: "PATCH", body: JSON.stringify({ status })
      });
      setInquiries((current) => current.map((inquiry) => inquiry.id === inquiryId ? { ...inquiry, status } : inquiry));
      showToast(status === "resolved" ? "Pesan ditandai selesai." : "Pesan ditandai telah dibalas.", "success");
    } catch {
      showToast("Status pesan belum dapat diperbarui.", "error");
    }
  };

  const reports = summary?.recentItems.filter((item) => {
    if (filter === "active") return item.status !== "returned";
    if (filter === "done") return item.status === "returned";
    return true;
  }) ?? [];

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div><div className={styles.eyebrow}>RUANG PERSONAL</div><h1>Dashboard saya</h1>
          <p>Pantau laporan, rekomendasi kecocokan, dan pesan masuk.</p></div>
        <button className="button button--outline" type="button" onClick={() => setRefreshKey((key) => key + 1)}>
          <RefreshCw size={15} /> Perbarui
        </button>
      </header>

      <div className={styles.dashboardMetrics}>
        <DashboardMetric label="Barang hilang" value={summary?.lost ?? 0} tone="red" loading={loading} />
        <DashboardMetric label="Barang ditemukan" value={summary?.found ?? 0} tone="green" loading={loading} />
        <DashboardMetric label="Rekomendasi cocok" value={summary?.matchCount ?? 0} tone="blue" loading={loading} />
        <DashboardMetric label="Selesai dikembalikan" value={summary?.returned ?? 0} tone="slate" loading={loading} />
      </div>

      <div className={styles.dashboardTabs} role="tablist" aria-label="Dashboard pribadi">
        <button role="tab" aria-selected={tab === "reports"} className={tab === "reports" ? styles.tabActive : ""} onClick={() => setTab("reports")}>
          Laporan saya <span>{summary?.recentItems.length ?? 0}</span>
        </button>
        <button role="tab" aria-selected={tab === "archive"} className={tab === "archive" ? styles.tabActive : ""} onClick={() => setTab("archive")}>
          Arsip <span>{archiveTotal}</span>
        </button>
        <button role="tab" aria-selected={tab === "matches"} className={tab === "matches" ? styles.tabActive : ""} onClick={() => setTab("matches")}>
          Barang cocok <span>{matches.length}</span>
        </button>
        <button role="tab" aria-selected={tab === "messages"} className={tab === "messages" ? styles.tabActive : ""} onClick={() => setTab("messages")}>
          Pesan <span>{inquiries.filter((inquiry) => inquiry.status === "pending").length}</span>
        </button>
      </div>

      {loadError && <div className={styles.formError} role="alert">{loadError}</div>}
      {tab === "reports" && <section className={styles.dashboardPanel}>
        <div className={styles.panelHeading}><div><h2>Laporan saya</h2><p>Perbarui status setelah verifikasi dan serah terima.</p></div>
          <div className={styles.filterPills}>
            {(["all", "active", "done"] as const).map((value) => <button key={value} className={filter === value ? styles.pillActive : ""}
              onClick={() => setFilter(value)}>{value === "all" ? "Semua" : value === "active" ? "Aktif" : "Selesai"}</button>)}
          </div>
        </div>
        {loading ? <div className={styles.listSkeleton} /> : reports.length ? <div className={styles.reportList}>
          {reports.map((item) => <PersonalReportRow key={item.id} item={item} renewing={renewingId === item.id}
            onRenew={() => void renewReport(item.id)} />)}
        </div> : <div className={styles.emptyState}><p>Belum ada laporan pada filter ini.</p><Link className="button button--primary" to="/report">Buat laporan</Link></div>}
      </section>}

      {tab === "archive" && <section className={styles.dashboardPanel}>
        <div className={styles.panelHeading}><div><h2>Arsip laporan</h2><p>Laporan yang masa aktifnya telah berakhir. Data tetap tersimpan dan dapat diaktifkan kembali.</p></div></div>
        {loading ? <div className={styles.listSkeleton} /> : archivedItems.length ? <>
          <div className={styles.reportList}>
            {archivedItems.map((item) => <PersonalReportRow key={item.id} item={item} archived renewing={renewingId === item.id}
              onRenew={() => void renewReport(item.id)} />)}
          </div>
          {archiveTotal > 20 && <div className={styles.filterPills} aria-label="Halaman arsip">
            <button type="button" disabled={archivePage <= 1} onClick={() => setArchivePage((page) => page - 1)}>Sebelumnya</button>
            <span>{archivePage} / {Math.ceil(archiveTotal / 20)}</span>
            <button type="button" disabled={archivePage >= Math.ceil(archiveTotal / 20)} onClick={() => setArchivePage((page) => page + 1)}>Berikutnya</button>
          </div>}
        </> : <div className={styles.emptyState}><p>Belum ada laporan yang diarsipkan.</p></div>}
      </section>}

      {tab === "matches" && <section className={styles.dashboardPanel}>
        <div className={styles.panelHeading}><div><h2>Rekomendasi kecocokan</h2><p>Perbandingan laporan aktif dari kategori dan zona kampus.</p></div><Sparkles size={19} /></div>
        {loading ? <div className={styles.listSkeleton} /> : matches.length ? <div className={styles.matchList}>
          {matches.map((match) => <article className={styles.matchRow} key={`${match.ownItem.id}-${match.candidate.id}`}>
            <div className={styles.matchScore}><strong>{match.percentage}%</strong><span>{match.score} poin</span></div>
            <div className={styles.matchPair}>
              <div><small>LAPORAN SAYA</small><Link to={`/items/${match.ownItem.id}`}>{match.ownItem.title}</Link><StatusBadge status={match.ownItem.status} /></div>
              <ArrowRight size={17} />
              <div><small>LAPORAN LAIN</small><Link to={`/items/${match.candidate.id}`}>{match.candidate.title}</Link><StatusBadge status={match.candidate.status} /></div>
            </div>
            <div className={styles.matchReasons}>{match.reasons.map((reason) => <span key={reason}>{reason}</span>)}</div>
          </article>)}
        </div> : <div className={styles.emptyState}><Sparkles size={22} /><h2>Belum ada kecocokan</h2><p>Rekomendasi akan muncul saat ada laporan aktif yang memenuhi ambang skor.</p></div>}
      </section>}

      {tab === "messages" && <section className={styles.dashboardPanel}>
        <div className={styles.panelHeading}><div><h2>Pesan dan klaim</h2><p>Diskusikan verifikasi tanpa membuka kontak pribadi.</p></div><Inbox size={19} /></div>
        {loading ? <div className={styles.listSkeleton} /> : inquiries.length ? <div className={styles.inquiryList}>
          {inquiries.map((inquiry) => {
            const incoming = inquiry.recipient.id === user?.id;
            const participant = incoming ? inquiry.sender : inquiry.recipient;
            return <article className={styles.inquiryRow} key={inquiry.id}>
              <div className={styles.inquiryAvatar}>{participant.avatarInitials}</div>
              <div className={styles.inquiryBody}>
                <div className={styles.inquiryTitle}><strong>{participant.name}</strong><span>{inquiry.kind === "claim" ? "Klaim barang" : "Pertanyaan"}</span></div>
                {inquiry.item ? <Link to={`/items/${inquiry.item.id}`}>{inquiry.item.title}</Link>
                  : <span>Laporan telah dihapus setelah masa retensi selesai.</span>}
                <p>{inquiry.message}</p>
                <small><Clock3 size={13} /> {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(inquiry.createdAt))}</small>
              </div>
              <div className={styles.inquiryActions}>
                <span className={`${styles.inquiryStatus} ${styles[`inquiry_${inquiry.status}`]}`}>
                  {inquiry.status === "pending" ? "Menunggu" : inquiry.status === "replied" ? "Dibalas" : "Selesai"}
                </span>
                {inquiry.status !== "resolved" && incoming && <button type="button"
                  onClick={() => void updateInquiry(inquiry.id, inquiry.status === "pending" ? "replied" : "resolved")}>
                  <Check size={14} /> {inquiry.status === "pending" ? "Tandai dibalas" : "Selesaikan"}
                </button>}
              </div>
            </article>;
          })}
        </div> : <div className={styles.emptyState}><Inbox size={22} /><h2>Belum ada pesan</h2><p>Pesan terkait klaim atau pertanyaan akan muncul di sini.</p></div>}
      </section>}
    </div>
  );
}

function PersonalReportRow({ item, archived = false, renewing, onRenew }: {
  item: ApiItem;
  archived?: boolean;
  renewing: boolean;
  onRenew: () => void;
}) {
  const date = archived ? item.archivedAt : item.expiresAt;
  const dateLabel = date
    ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(date))
    : "belum ditentukan";

  return <article className={styles.reportRow}>
    <div className={styles.reportTypeMark}><span className={item.reportType === "lost" ? styles.markLost : styles.markFound} /></div>
    <div className={styles.reportRowMain}><Link to={`/items/${item.id}`}>{item.title}</Link>
      <small>{[item.category, item.location, item.dropOffPoint ? `Titik temu: ${item.dropOffPoint}` : null]
        .filter((detail): detail is string => Boolean(detail)).join(" · ")} · {archived ? "Diarsipkan" : "Aktif hingga"} {dateLabel}</small>
      {item.status !== "returned" && <button className={styles.renewButton} type="button" disabled={renewing} onClick={onRenew}>
        <RefreshCw size={12} /> {renewing ? "Memperpanjang..." : "Perpanjang laporan"}
      </button>}
    </div>
    <StatusBadge status={item.status} />
    <Link className={styles.rowArrow} aria-label={`Lihat ${item.title}`} to={`/items/${item.id}`}><ArrowRight size={16} /></Link>
  </article>;
}

function DashboardMetric({ label, value, tone, loading }: {
  label: string;
  value: number;
  tone: "red" | "green" | "blue" | "slate";
  loading: boolean;
}) {
  return <div className={`${styles.dashboardMetric} ${styles[`dashboardMetric_${tone}`]}`}>
    <span>{loading ? "—" : value.toLocaleString("id-ID")}</span><small>{label}</small>
  </div>;
}