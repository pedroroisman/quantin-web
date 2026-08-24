import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";

export function PrivateRoute({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate(`/signin?next=${encodeURIComponent(location.pathname)}`, { replace: true });
      } else {
        setChecking(false);
      }
    });
  }, [navigate, location.pathname]);

  if (checking) return null;
  return <>{children}</>;
}
