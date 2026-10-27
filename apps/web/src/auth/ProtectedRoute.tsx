import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export function ProtectedRoute() {
  const { user, status, error, refreshUser } = useAuth();
  const location = useLocation();

  if (status === "checking") return <div className="route-loading" aria-label="Memuat akun" />;
  if (status === "unavailable") return (
    <div className="route-loading" role="alert">
      <p>{error || "Sesi belum dapat diverifikasi. Periksa koneksi lalu coba lagi."}</p>
      <button type="button" onClick={() => { void refreshUser().catch(() => {}); }}>Coba lagi</button>
    </div>
  );
  if (status === "anonymous" || !user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}
