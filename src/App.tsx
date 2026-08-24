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
import { UserProfile }  from "./pages/UserProfile";
import { Movements }    from "./pages/Movements";
import { PrivateRoute }  from "./components/PrivateRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"               element={<Landing />} />
        <Route path="/preview"        element={<FreePreview />} />
        <Route path="/subscribe"      element={<Checkout />} />
        <Route path="/signin"         element={<SignIn />} />
        <Route path="/auth/callback"  element={<AuthCallback />} />
        <Route path="/portfolio"      element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/smart-selector" element={<PrivateRoute><SmartSelector /></PrivateRoute>} />
        <Route path="/user"           element={<PrivateRoute><UserProfile /></PrivateRoute>} />
        <Route path="/movements"      element={<PrivateRoute><Movements /></PrivateRoute>} />
      </Routes>
      <Analytics />
    </BrowserRouter>
  );
}
