import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { QuantinLogo } from "../components/ui";

const outfit = "'Outfit', sans-serif";

async function routeBySubscription(email: string, navigate: (path: string) => void) {
  const { data } = await supabase
    .from("subscribers")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  navigate(data ? "/portfolio" : "/subscribe");
}

export function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (event === "SIGNED_IN" && session?.user?.email) {
        subscription.unsubscribe();
        await routeBySubscription(session.user.email, navigate);
      }
    });

    const code = new URLSearchParams(window.location.search).get("code");
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error && mounted) {
          subscription.unsubscribe();
          navigate("/signin?error=invalid_link");
        }
      });
    } else {
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (!mounted) return;
        subscription.unsubscribe();
        if (session?.user?.email) {
          await routeBySubscription(session.user.email, navigate);
        } else {
          navigate("/signin");
        }
      });
    }

    return () => { mounted = false; subscription.unsubscribe(); };
  }, [navigate]);

  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg-tertiary)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: "1.5rem",
    }}>
      <QuantinLogo iconSize={28} />
      <p style={{
        fontFamily: outfit, fontWeight: 300, fontSize: 14,
        color: "var(--text-tertiary)", letterSpacing: "0.02em",
      }}>
        Signing you in…
      </p>
    </div>
  );
}
