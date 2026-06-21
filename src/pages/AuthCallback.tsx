import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { QuantinLogo } from "../components/ui";

const outfit = "'Outfit', sans-serif";

export function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code");
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) navigate("/signin?error=invalid_link");
        else navigate("/portfolio");
      });
    } else {
      supabase.auth.getSession().then(({ data: { session } }) => {
        navigate(session ? "/portfolio" : "/signin");
      });
    }
  }, [navigate]);

  return (
    <div style={{
      minHeight: "100vh", background: "#ffffff",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: "1.5rem",
    }}>
      <QuantinLogo iconSize={28} />
      <p style={{
        fontFamily: outfit, fontWeight: 300, fontSize: 14,
        color: "#888780", letterSpacing: "0.02em",
      }}>
        Signing you in…
      </p>
    </div>
  );
}
