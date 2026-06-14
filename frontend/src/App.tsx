import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { DashboardPage } from "./pages/DashboardPage";
import { HistoryPage } from "./pages/HistoryPage";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { RoomEntryPage } from "./pages/RoomEntryPage";
import { StatsPage } from "./pages/StatsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RoomEntryPage />} />
      <Route path="/room/:roomId" element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="leaderboard" element={<LeaderboardPage />} />
        <Route path="stats" element={<StatsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
