import { Navigate, Outlet } from "react-router-dom";
import { useMe } from "../hooks/useAuth";

export default function ProtectedRoute() {
  const { data: user, isLoading } = useMe();
  if (isLoading) {
    return (
      <div className="grid min-h-dvh place-items-center bg-black">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}
