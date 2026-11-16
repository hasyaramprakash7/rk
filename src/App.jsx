import { BrowserRouter, Routes, Route } from "react-router-dom";
import RKInteriorStudio from "./componunts/RKInteriorStudio";
import RKDashboard from "./componunts/RKDashboard";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RKInteriorStudio />} />
        <Route path="/admin" element={<RKDashboard siteUrl="/" />} />
      </Routes>
    </BrowserRouter>
  );
}