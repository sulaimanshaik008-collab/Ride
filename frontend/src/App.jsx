import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { BookRidePage } from './pages/BookRidePage';
import { MyRidesPage } from './pages/MyRidesPage';
import { RideSchedulingPage } from './pages/RideSchedulingPage';
import { RideAssignmentPage } from './pages/RideAssignmentPage';
import { DriverTripPage } from './pages/DriverTripPage';
import { TripMonitoringPage } from './pages/TripMonitoringPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { DriverManagementPage } from './pages/DriverManagementPage';
import CorporateAdminDashboardPage from './pages/CorporateAdminDashboardPage';
import OrganizationSettingsPage from './pages/OrganizationSettingsPage';
import UserManagementPage from './pages/UserManagementPage';
import FeedbackHistoryPage from './pages/FeedbackHistoryPage';
import ManagerFeedbackPage from './pages/ManagerFeedbackPage';

export const App = () => {
  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/book-ride" replace />} />
          <Route path="/book-ride" element={<BookRidePage />} />
          <Route path="/my-rides" element={<MyRidesPage />} />
          <Route path="/scheduling" element={<RideSchedulingPage />} />
          <Route path="/assignments" element={<RideAssignmentPage />} />
          <Route path="/driver-trips" element={<DriverTripPage />} />
          <Route path="/monitoring" element={<TripMonitoringPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/analytics" element={<ReportingAnalyticsPage />} />
          <Route path="/drivers" element={<DriverManagementPage />} />
          <Route path="/vehicles" element={<VehicleManagementPage />} />
          <Route path="/admin" element={<CorporateAdminDashboardPage />} />
          <Route path="/admin/organization" element={<OrganizationSettingsPage />} />
          <Route path="/admin/users" element={<UserManagementPage />} />
          <Route path="/feedback" element={<FeedbackHistoryPage />} />
          <Route path="/manager/feedback" element={<ManagerFeedbackPage />} />
          <Route path="*" element={<Navigate to="/book-ride" replace />} />
        </Routes>
      </main>
    </div>
  );
};
export default App;
