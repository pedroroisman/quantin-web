import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import "./styles/global.css";

import { Landing }       from "./pages/Landing";
import { FreePreview }   from "./pages/FreePreview";
import { Checkout }      from "./pages/Checkout";
import { Dashboard }     from "./pages/Dashboard";
import { SmartSelector } from "./pages/SmartSelector";
import { SignIn }        from "./pages/SignIn";
import { AuthCallback }  from "./pages/AuthCallback";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"               element={<Landing />} />
        <Route path="/preview"        element={<FreePreview />} />
        <Route path="/subscribe"      element={<Checkout />} />
        <Route path="/portfolio"      element={<Dashboard />} />
        <Route path="/smart-selector" element={<SmartSelector />} />
        <Route path="/signin"         element={<SignIn />} />
        <Route path="/auth/callback"  element={<AuthCallback />} />
      </Routes>
      <Analytics />
    </BrowserRouter>
  );
}
