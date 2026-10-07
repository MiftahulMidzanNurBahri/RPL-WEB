import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, CalendarDays, Clock3, MapPin, ShieldCheck, Trash2 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiRequest, type ApiData, type ApiItem } from "../api/client";
import { useAuth } from "../auth/AuthProvider";
import { Modal } from "../components/Modal";
import { StatusBadge } from "../components/StatusBadge";
import { useToast } from "../components/Toast";
import styles from "../styles/Pages.module.css";

export function ItemDetailPage() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [item, setItem] = useState<ApiItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [kind, setKind] = useState<"inquiry" | "claim">("claim");
  const [sending, setSending] = useState(false);
  const [confirmReturn, setConfirmReturn] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setLoading(true);
    apiRequest<ApiData<ApiItem>>(`/api/items/${encodeURIComponent(id)}`)
      .then((response) => setItem(response.data))
      .catch(() => setItem(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className={styles.page}><div className={styles.detailSkeleton} /></div>;
  if (!item) return <div className={styles.page}><div className={styles.emptyState}><h1>Laporan tidak ditemukan</h1><Link to="/items">Kembali ke katalog</Link></div></div>;

  const formatDate = item.incidentDate
    ? new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date(item.incidentDate))
    : null;

  const submitInquiry = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSending(true);
    try {
      await apiRequest(`/api/items/${encodeURIComponent(item.id)}/inquiries`, {
        method: "POST", body: JSON.stringify({ kind, message })
      });
      setMessage("");
      showToast("Pesan terkirim kepada pelapor.", "success");
    } catch {
      showToast("Pesan belum dapat dikirim. Silakan masuk dan coba lagi.", "error");
    } finally {
      setSending(false);
    }
  };

  const markReturned = async () => {
    try {
      const response = await apiRequest<ApiData<ApiItem>>(`/api/items/${item.id}/return`, { method: "POST" });
      setItem(response.data);
      showToast("Status barang diperbarui.", "success");
    } catch {
      showToast("Status belum dapat diperbarui.", "error");
    } finally {
      setConfirmReturn(false);
    }
  };

  const deleteItem = async () => {
    try {
      await apiRequest<void>(`/api/items/${item.id}`, { method: "DELETE" });
      showToast("Laporan dihapus dari katalog.", "success");
      navigate("/items");
    } catch {
      showToast("Laporan belum dapat dihapus.", "error");
    } finally {
      setConfirmDelete(false);
    }
  };

  return (
    <div className={styles.page}>
      <Link className={styles.backLink} to="/items"><ArrowLeft size={16} /> Kembali ke katalog</Link>
      <div className={styles.detailLayout}>
        <div className={styles.detailMain}>
          <div className={styles.detailImage}>
            {item.imageUrl ? <img src={item.imageUrl} alt={item.title} /> : <div className={styles.detailImageFallback} aria-hidden="true" />}
            <StatusBadge status={item.status} />
          </div>
          <section className={styles.detailDescription}>
            <div className={styles.eyebrow}>DESKRIPSI BARANG</div>
            <p>{item.description}</p>
            {item.isMine && item.additionalInfo && <div className={styles.privateInfo}><ShieldCheck size={17} />
              <span><strong>Ciri verifikasi pribadi</strong>{item.additionalInfo}</span></div>}
          </section>
          {item.isMine && item.status !== "returned" && <div className={styles.ownerActions}>
            <Link className="button button--outline" to={`/items/${item.id}/edit`}>Ubah laporan</Link>
            <button className="button button--outline" type="button" onClick={() => setConfirmDelete(true)}><Trash2 size={15} /> Hapus</button>
            <button className="button button--primary" type="button" onClick={() => setConfirmReturn(true)}>Tandai dikembalikan</button>
          </div>}
        </div>
        <aside className={styles.detailAside}>
          <div className={styles.eyebrow}>{item.reportType === "lost" ? "LAPORAN KEHILANGAN" : "LAPORAN TEMUAN"}</div>
          <h1>{item.title}</h1>
          {item.category && <div className={styles.detailCategory}>{item.category}</div>}
          <div className={styles.metadataList}>
            {item.location && <div><MapPin size={17} /><span><small>Lokasi</small>{item.location}</span></div>}
            {formatDate && <div><CalendarDays size={17} /><span><small>Tanggal kejadian</small>{formatDate}</span></div>}
            {item.incidentTime && <div><Clock3 size={17} /><span><small>Perkiraan waktu</small>{item.incidentTime}</span></div>}
            {item.dropOffPoint && <div><MapPin size={17} /><span><small>Titik temu penyerahan</small>{item.dropOffPoint}</span></div>}
            {item.meetUpTime && <div><Clock3 size={17} /><span><small>Waktu penyerahan</small>{item.meetUpTime}</span></div>}
          </div>
          <div className={styles.verificationNote}><ShieldCheck size={19} /><p>Verifikasi kepemilikan dilakukan langsung dengan mencocokkan ciri khusus. Jangan membagikan informasi sensitif di ruang publik.</p></div>
          {!item.isMine && item.status !== "returned" && (user ? (
            <form className={styles.inquiryForm} onSubmit={submitInquiry}>
              <h2>Hubungi pelapor</h2>
              <label>Jenis pesan
                <select value={kind} onChange={(event) => setKind(event.target.value as "inquiry" | "claim")}>
                  <option value="claim">Ajukan klaim</option><option value="inquiry">Tanyakan detail</option>
                </select>
              </label>
              <label>Pesan
                <textarea required maxLength={2000} rows={4} value={message} onChange={(event) => setMessage(event.target.value)}
                  placeholder="Sampaikan ciri barang yang dapat membantu verifikasi." />
              </label>
              <button className="button button--primary button--wide" disabled={sending} type="submit">
                {sending ? "Mengirim..." : "Kirim pesan"}
              </button>
            </form>
          ) : <Link className="button button--primary button--wide" to="/login">Masuk untuk menghubungi</Link>)}
        </aside>
      </div>
      <Modal open={confirmReturn} title="Tandai barang dikembalikan?" onClose={() => setConfirmReturn(false)}>
        <p className={styles.modalText}>Pastikan verifikasi dan serah terima barang sudah dilakukan.</p>
        <div className={styles.modalActions}><button className="button button--outline" onClick={() => setConfirmReturn(false)}>Batal</button>
          <button className="button button--primary" onClick={() => void markReturned()}>Ya, selesai</button></div>
      </Modal>
      <Modal open={confirmDelete} title="Hapus laporan ini?" onClose={() => setConfirmDelete(false)}>
        <p className={styles.modalText}>Laporan akan disembunyikan dari katalog. Riwayat terkait tetap tersimpan.</p>
        <div className={styles.modalActions}><button className="button button--outline" onClick={() => setConfirmDelete(false)}>Batal</button>
          <button className="button button--danger" onClick={() => void deleteItem()}>Hapus laporan</button></div>
      </Modal>
    </div>
  );
}