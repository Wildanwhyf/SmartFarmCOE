import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import DashboardLayout from "./components/layout/DashboardLayout";

import Dashboard from "./pages/Dashboard";
import SensorHistory from "./pages/SensorHistory";
import Alerts from "./pages/Alerts";
import UserManagement from "./pages/UserManagement";
import AlertThresholds from "./pages/AlertThresholds";

function App() {
  return (
    <BrowserRouter>
      <DashboardLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />

          <Route path="/dashboard" element={<Dashboard />} />

          <Route
            path="/sensor-history"
            element={<SensorHistory />}
          />

            <Route
            path="/alerts"
            element={<Alerts />}
          />

          <Route
            path="/user-management"
            element={<UserManagement />}
          />

          <Route
            path="/thresholds"
            element={<AlertThresholds />}
          />

          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />
        </Routes>
      </DashboardLayout>
    </BrowserRouter>
  );
}

export default App;