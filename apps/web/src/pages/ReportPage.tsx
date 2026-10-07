import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { ArrowRight, ImagePlus, ShieldCheck, Upload, X } from "lucide-react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { DropOffPoints, ItemCategories } from "../../../../packages/shared/src/index.js";
import { apiRequest, type ApiData, type ApiItem } from "../api/client";
import { DemoPresets, presetImageUrl, presetToFile } from "./demoPresets";
import { useToast } from "../components/Toast";
import styles from "../styles/Pages.module.css";

interface ReportFormData {
  title: string;
  category: string;
  reportType: "lost" | "found";
  description: string;
  additionalInfo: string;
  location: string;
  dropOffPoint: string;
  incidentDate: string;
  incidentTime: string;
  meetUpTime: string;
}

const currentDate = new Date().toISOString().slice(0, 10);
const operatingHoursError = "Waktu penyerahan/pertemuan harus antara 09:00 dan 19:00 WIB. Pilih waktu pada rentang tersebut atau jadwalkan penyerahan pada hari operasional kampus.";
const blankForm: ReportFormData = {
  title: "",
  category: ItemCategories[0],
  reportType: "lost",
  description: "",
  additionalInfo: "",
  location: "",
  dropOffPoint: "",
  incidentDate: currentDate,
  incidentTime: "",
  meetUpTime: ""
};

export function ReportPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [form, setForm] = useState<ReportFormData>({
    ...blankForm,
    reportType: searchParams.get("type") === "found" ? "found" : "lost"
  });
  const [file, setFile] = useState<File | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [existingImage, setExistingImage] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    apiRequest<ApiData<ApiItem>>(`/api/items/${encodeURIComponent(id)}`)
      .then(({ data }) => {
        if (!data.isMine || data.status === "returned") {
          setError("Laporan ini tidak dapat diubah oleh akun Anda.");
          return;
        }
        setForm({
          title: data.title,
          category: data.category ?? ItemCategories[0],
          reportType: data.reportType,
          description: data.description,
          additionalInfo: data.additionalInfo ?? "",
          location: data.location ?? "",
          dropOffPoint: data.dropOffPoint ?? "",
          incidentDate: data.incidentDate?.slice(0, 10) ?? currentDate,
          incidentTime: data.incidentTime ?? "",
          meetUpTime: data.meetUpTime ?? ""
        });
        setExistingImage(data.imageUrl);
      })
      .catch(() => setError("Laporan tidak ditemukan atau Anda tidak memiliki akses."))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const imageUrl = URL.createObjectURL(file);
    setPreview(imageUrl);
    return () => URL.revokeObjectURL(imageUrl);
  }, [file]);

  const update = <Key extends keyof ReportFormData>(key: Key, value: ReportFormData[Key]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };
  const isOutsideOperatingHours = form.reportType === "found" && Boolean(form.meetUpTime) &&
    (form.meetUpTime < "09:00" || form.meetUpTime > "19:00");

  const selectImage = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] ?? null;
    if (selectedFile && selectedFile.size > 5 * 1024 * 1024) {
      setError("Ukuran foto maksimal 5 MB.");
      event.target.value = "";
      return;
    }
    setError("");
    setSelectedPreset(null);
    setFile(selectedFile);
  };

  const applyPreset = async (presetId: string) => {
    const preset = DemoPresets.find((candidate) => candidate.id === presetId);
    if (!preset) return;
    try {
      setError("");
      setForm((current) => ({ ...current, title: preset.title, category: preset.category }));
      setFile(await presetToFile(preset));
      setSelectedPreset(preset.id);
    } catch {
      setError("Preset gambar belum dapat dimuat.");
    }
  };

  const submitReport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isOutsideOperatingHours) return;
    if (form.reportType === "lost" && !form.location.trim()) {
      setError("Lokasi kehilangan wajib diisi.");
      return;
    }
    setSubmitting(true);
    setError("");
    const body = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (form.reportType === "found" && ["category", "location", "incidentDate", "incidentTime", "additionalInfo"].includes(key)) return;
      if (form.reportType === "lost" && ["dropOffPoint", "meetUpTime"].includes(key)) return;
      if (value) body.append(key, value);
    });
    if (file) body.append("image", file);

    try {
      const response = await apiRequest<ApiData<ApiItem>>(id ? `/api/items/${id}` : "/api/items", {
        method: id ? "PUT" : "POST",
        body
      });
      showToast(id ? "Laporan berhasil diperbarui." : "Laporan berhasil dibuat.", "success");
      navigate(`/items/${response.data.id}`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Laporan belum dapat disimpan.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className={styles.page}><div className={styles.detailSkeleton} /></div>;

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div><div className={styles.eyebrow}>{id ? "KELOLA LAPORAN" : "LAPORAN BARANG"}</div>
          <h1>{id ? "Ubah laporan" : "Ceritakan barangnya"}</h1>
          <p>Lengkapi detail secukupnya agar civitas kampus dapat membantu.</p></div>
      </header>
      <form className={styles.reportLayout} onSubmit={submitReport}>
        <div className={styles.reportFields}>
          <section className={styles.formSection}>
            <div className={styles.formSectionHeading}><span>01</span><div><h2>Jenis laporan</h2><p>Pilih kondisi yang sesuai.</p></div></div>
            <div className={styles.reportTypeChoices} role="radiogroup" aria-label="Jenis laporan">
              {(["lost", "found"] as const).map((type) => (
                <button key={type} type="button" role="radio" aria-checked={form.reportType === type}
                  className={form.reportType === type ? styles.reportTypeActive : ""}
                  onClick={() => update("reportType", type)}>
                  <span className={styles.radioMark} />
                  <span><strong>{type === "lost" ? "Saya kehilangan" : "Saya menemukan"}</strong>
                    <small>{type === "lost" ? "Barang milik saya hilang" : "Barang diamankan untuk pemilik"}</small></span>
                </button>
              ))}
            </div>
          </section>

          <section className={styles.formSection}>
            <div className={styles.formSectionHeading}><span>02</span><div><h2>Informasi barang</h2><p>Rincian umum tampil di katalog publik.</p></div></div>
            <div className={styles.formGrid}>
              <label className={`${styles.formField} ${styles.fieldFull}`}>Nama barang
                <input required maxLength={160} value={form.title} onChange={(event) => update("title", event.target.value)}
                  placeholder="Contoh: Laptop ASUS warna perak" />
              </label>
              {form.reportType === "lost" && <>
                <label className={styles.formField}>Kategori
                  <select value={form.category} onChange={(event) => update("category", event.target.value)}>
                    {ItemCategories.map((category) => <option key={category} value={category}>{category}</option>)}
                  </select>
                </label>
                <label className={styles.formField}>Lokasi kehilangan
                  <input type="text" required maxLength={250} value={form.location}
                    onChange={(event) => update("location", event.target.value)}
                    placeholder="Contoh: Di dekat meja nomor 14, Lab Komputer Lt. 3 Gedung A" />
                </label>
                <label className={styles.formField}>Tanggal kejadian
                  <input type="date" required max={currentDate} value={form.incidentDate}
                    onChange={(event) => update("incidentDate", event.target.value)} />
                </label>
                <label className={styles.formField}>Perkiraan waktu <span className={styles.optional}>(opsional)</span>
                  <input type="time" value={form.incidentTime} onChange={(event) => update("incidentTime", event.target.value)} />
                </label>
              </>}
              <label className={`${styles.formField} ${styles.fieldFull}`}>Deskripsi umum
                <textarea required maxLength={3000} rows={4} value={form.description}
                  onChange={(event) => update("description", event.target.value)}
                  placeholder="Warna, ukuran, merek, atau detail umum lain." />
              </label>
              {form.reportType === "lost" && (
                <label className={`${styles.formField} ${styles.fieldFull}`}>
                  <span>Ciri verifikasi pribadi <span className={styles.optional}>(opsional, hanya terlihat oleh Anda)</span></span>
                  <textarea maxLength={1000} rows={3} value={form.additionalInfo}
                    onChange={(event) => update("additionalInfo", event.target.value)}
                    placeholder="Simpan detail yang dapat membuktikan kepemilikan. Jangan masukkan ke deskripsi umum." />
                </label>
              )}
              {form.reportType === "found" && (
                <>
                  <label className={`${styles.formField} ${styles.fieldFull}`}>
                    Titik temu / penyerahan barang <span className={styles.optional}>(opsional)</span>
                    <select value={form.dropOffPoint} onChange={(event) => update("dropOffPoint", event.target.value)}>
                      <option value="">— Pilih titik temu —</option>
                      {DropOffPoints.map((point) => <option key={point} value={point}>{point}</option>)}
                    </select>
                  </label>
                  <label className={styles.formField}>Waktu penyerahan <span className={styles.optional}>(opsional)</span>
                    <input type="time" min="09:00" max="19:00" value={form.meetUpTime} aria-invalid={isOutsideOperatingHours}
                      aria-describedby={isOutsideOperatingHours ? "meet-up-time-error" : undefined}
                      onChange={(event) => update("meetUpTime", event.target.value)} />
                    {isOutsideOperatingHours && <span id="meet-up-time-error" className={styles.formError} role="alert">{operatingHoursError}</span>}
                  </label>
                </>
              )}
            </div>
          </section>

          <section className={styles.formSection}>
            <div className={styles.formSectionHeading}><span>03</span><div><h2>Foto barang{form.reportType === "found" && <span className={styles.optional}> (wajib untuk barang temuan)</span>}</h2><p>Foto membantu orang lain mengenali barang.</p></div></div>
            <label className={styles.uploadBox}>
              {preview || existingImage ? <img src={preview ?? existingImage ?? ""} alt="Pratinjau barang" /> : <ImagePlus size={27} />}
              <span><strong>{file ? file.name : "Pilih foto dari perangkat"}</strong><small>JPEG, PNG, atau WebP · Maks. 5 MB</small></span>
              <Upload size={18} />
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={selectImage}
                  required={form.reportType === "found" && !existingImage && !file} />
            </label>
            <div className={styles.presetSection}>
              <div className={styles.presetHeading}><strong>Preset demo cepat</strong><span>Isi contoh untuk pengujian</span></div>
              <div className={styles.presetGrid}>
                {DemoPresets.map((preset) => <button key={preset.id} type="button" aria-pressed={selectedPreset === preset.id}
                  className={selectedPreset === preset.id ? styles.presetSelected : ""}
                  onClick={() => void applyPreset(preset.id)}>
                  <img src={presetImageUrl(preset)} alt="" loading="lazy" />
                  <span>{preset.label}</span>
                </button>)}
              </div>
            </div>
            {file && <button className={styles.removeFile} type="button" onClick={() => { setFile(null); setSelectedPreset(null); }}><X size={14} /> Hapus foto pilihan</button>}
            {existingImage && !file && <p className={styles.uploadHint}>Foto saat ini dipertahankan jika tidak memilih foto baru.</p>}
          </section>
        </div>

        <aside className={styles.reportAside}>
          <div className={styles.reportAsideHead}><ShieldCheck size={19} /><strong>Privasi laporan</strong></div>
          <p>Nomor telepon dan email tidak ditampilkan pada katalog. Pesan klaim diteruskan melalui aplikasi.</p>
          <div className={styles.asideDivider} />
          <div className={styles.reportAsideHead}><span className={styles.asideNumber}>04</span><strong>Setelah dikirim</strong></div>
          <p>Laporan dapat ditemukan di katalog. Match Engine akan memeriksa kecocokan dengan barang berstatus sebaliknya.</p>
          {error && <div className={styles.formError} role="alert">{error}</div>}
          <button className="button button--primary button--wide" type="submit" disabled={submitting}>
            {submitting ? "Menyimpan..." : id ? "Simpan perubahan" : "Terbitkan laporan"}<ArrowRight size={16} />
          </button>
          <Link className={styles.cancelLink} to={id ? `/items/${id}` : "/items"}>Batal</Link>
        </aside>
      </form>
    </div>
  );
}