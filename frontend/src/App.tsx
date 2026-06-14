import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { DashboardPage } from "./pages/DashboardPage";
import { RoomDashboardPage } from "./pages/RoomDashboardPage";
import { HistoryPage } from "./pages/HistoryPage";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { RoomEntryPage } from "./pages/RoomEntryPage";
import { StatsPage } from "./pages/StatsPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/rooms-entry" element={<RoomEntryPage />} />
      <Route path="/room/:roomId" element={<Layout />}>
        <Route index element={<RoomDashboardPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="leaderboard" element={<LeaderboardPage />} />
        <Route path="stats" element={<StatsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
