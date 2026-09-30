import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { CampusLocations, ItemCategories } from "../../../../packages/shared/src/index.js";
import { apiRequest, type ApiItem, type ApiList } from "../api/client";
import { ItemCard } from "../components/ItemCard";
import styles from "../styles/Pages.module.css";

type StatusFilter = "all" | "lost" | "found";
const pageSize = 12;

export function ItemsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [result, setResult] = useState<ApiList<ApiItem>>({
    data: [], pagination: { page: 1, pageSize, total: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search.trim()), 280);
    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("q", debouncedSearch);
    if (status !== "all") params.set("reportType", status);
    if (category) params.set("category", category);
    if (location) params.set("location", location);
    params.set("sort", sort);
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    setSearchParams(debouncedSearch ? { q: debouncedSearch } : {}, { replace: true });
    setLoading(true);
    setError("");
    apiRequest<ApiList<ApiItem>>(`/api/items?${params}`)
      .then(setResult)
      .catch(() => setError("Katalog belum dapat dimuat. Periksa koneksi lalu coba lagi."))
      .finally(() => setLoading(false));
  }, [debouncedSearch, status, category, location, sort, page, refreshKey, setSearchParams]);

  const resetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setStatus("all");
    setCategory("");
    setLocation("");
    setSort("newest");
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(result.pagination.total / pageSize));
  const hasFilters = Boolean(search || status !== "all" || category || location || sort !== "newest");

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div><div className={styles.eyebrow}>DIREKTORI KAMPUS</div><h1>Cari barang</h1>
          <p>Telusuri laporan kehilangan dan temuan di area Universitas Pradita.</p></div>
        <div className={styles.resultCount}>{result.pagination.total.toLocaleString("id-ID")} laporan</div>
      </header>

      <section className={styles.catalogTools} aria-label="Pencarian dan filter katalog">
        <label className={styles.catalogSearch}>
          <Search size={19} aria-hidden="true" />
          <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }}
            placeholder="Nama barang, deskripsi, atau lokasi" aria-label="Cari barang" />
          <span className={styles.searchHint}>Cari</span>
        </label>
        <div className={styles.filterRow}>
          <div className={styles.statusSegments} role="group" aria-label="Filter jenis laporan">
            {(["all", "lost", "found"] as const).map((filter) => (
              <button key={filter} type="button" aria-pressed={status === filter}
                className={status === filter ? styles.segmentActive : ""}
                onClick={() => { setStatus(filter); setPage(1); }}>
                {filter === "all" ? "Semua" : filter === "lost" ? "Hilang" : "Ditemukan"}
              </button>
            ))}
          </div>
          <label className={styles.selectFilter}><SlidersHorizontal size={15} />
            <select aria-label="Filter kategori" value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }}>
              <option value="">Semua kategori</option>
              {ItemCategories.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <label className={styles.selectFilter}>
            <select aria-label="Filter lokasi" value={location} onChange={(event) => { setLocation(event.target.value); setPage(1); }}>
              <option value="">Semua lokasi</option>
              {CampusLocations.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <label className={styles.selectFilter}>
            <select aria-label="Urutkan laporan" value={sort} onChange={(event) => { setSort(event.target.value as "newest" | "oldest"); setPage(1); }}>
              <option value="newest">Terbaru</option>
              <option value="oldest">Terlama</option>
            </select>
          </label>
          {hasFilters && <button className={styles.resetButton} type="button" onClick={resetFilters}><RotateCcw size={14} /> Reset</button>}
        </div>
      </section>

      {loading ? (
        <div className={styles.cardGrid} aria-label="Memuat katalog">
          {[0, 1, 2, 3].map((index) => <div className={styles.cardSkeleton} key={index} />)}
        </div>
      ) : error ? (
        <div className={styles.emptyState}><p>{error}</p><button className="button button--outline" onClick={() => setRefreshKey((key) => key + 1)}>Coba lagi</button></div>
      ) : result.data.length ? (
        <>
          <div className={styles.catalogSummary}>Menampilkan {result.data.length} dari {result.pagination.total} laporan</div>
          <div className={styles.cardGrid}>{result.data.map((item) => <ItemCard key={item.id} item={item} />)}</div>
          {totalPages > 1 && <nav className={styles.pagination} aria-label="Halaman katalog">
            <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}><ArrowLeft size={16} /> Sebelumnya</button>
            <span>Halaman {page} dari {totalPages}</span>
            <button type="button" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Berikutnya <ArrowRight size={16} /></button>
          </nav>}
        </>
      ) : (
        <div className={styles.emptyState}><Search size={25} /><h2>Belum ada barang yang cocok</h2>
          <p>Coba kata kunci atau filter lokasi yang berbeda.</p>
          {hasFilters && <button type="button" className="button button--outline" onClick={resetFilters}>Hapus semua filter</button>}
        </div>
      )}
    </div>
  );
}
