import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./styles/global.css";

import { Landing }       from "./pages/Landing";
import { FreePreview }   from "./pages/FreePreview";
import { Checkout }      from "./pages/Checkout";
import { Dashboard }     from "./pages/Dashboard";
import { SmartSelector } from "./pages/SmartSelector";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"               element={<Landing />} />
        <Route path="/preview"        element={<FreePreview />} />
        <Route path="/subscribe"      element={<Checkout />} />
        <Route path="/portfolio"      element={<Dashboard />} />
        <Route path="/smart-selector" element={<SmartSelector />} />
      </Routes>
    </BrowserRouter>
  );
}
