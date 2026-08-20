import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { DriverLayout } from './components/driver/DriverLayout';
import { BookRidePage } from './pages/BookRidePage';
import { MyRidesPage } from './pages/MyRidesPage';
import { RideSchedulingPage } from './pages/RideSchedulingPage';
import { RideAssignmentPage } from './pages/RideAssignmentPage';
import { DriverTripPage } from './pages/DriverTripPage';
import { DriverDashboardPage } from './pages/driver/DriverDashboardPage';
import { DriverSchedulePage } from './pages/driver/DriverSchedulePage';
import { DriverHistoryPage } from './pages/driver/DriverHistoryPage';
import { DriverProfilePage } from './pages/driver/DriverProfilePage';
import { TripMonitoringPage } from './pages/TripMonitoringPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { DriverManagementPage } from './pages/DriverManagementPage';
import { VehicleManagementPage } from './pages/VehicleManagementPage';
import { ReportingAnalyticsPage } from './pages/ReportingAnalyticsPage';
import CorporateAdminDashboardPage from './pages/CorporateAdminDashboardPage';
import OrganizationSettingsPage from './pages/OrganizationSettingsPage';
import UserManagementPage from './pages/UserManagementPage';
import FeedbackHistoryPage from './pages/FeedbackHistoryPage';
import ManagerFeedbackPage from './pages/ManagerFeedbackPage';
import { ManagerLayout } from './components/manager/ManagerLayout';
import { ManagerDashboardPage } from './pages/manager/ManagerDashboardPage';
import { ManagerRideRequestsPage } from './pages/manager/ManagerRideRequestsPage';
import { ManagerAssignmentsPage } from './pages/manager/ManagerAssignmentsPage';
import { ManagerOperationsPage } from './pages/manager/ManagerOperationsPage';
import { ManagerSchedulePage } from './pages/manager/ManagerSchedulePage';
import { ManagerLiveTripsPage } from './pages/manager/ManagerLiveTripsPage';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import MapDemoPage from './pages/MapDemoPage';

export const App = () => {
  const { currentUser } = useAuth();
  const location = useLocation();

  // If a logged in DRIVER tries to navigate to employee booking pages, redirect to driver dashboard
  const isDriver = currentUser?.role === 'DRIVER';
  const isManager = currentUser?.role === 'TRANSPORT_MANAGER';
  const isEmployeeRoute = location.pathname === '/book-ride' || location.pathname === '/my-rides';

  if (isDriver && isEmployeeRoute) {
    return <Navigate to="/driver/dashboard" replace />;
  }

  if (isManager && isEmployeeRoute) {
    return <Navigate to="/transport-manager/dashboard" replace />;
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* DEDICATED DRIVER OPERATIONS PORTAL */}
      <Route path="/driver" element={<DriverLayout />}>
        <Route index element={<Navigate to="/driver/dashboard" replace />} />
        <Route path="dashboard" element={<DriverDashboardPage />} />
        <Route path="rides/today" element={<DriverSchedulePage />} />
        <Route path="rides/history" element={<DriverHistoryPage />} />
        <Route path="profile" element={<DriverProfilePage />} />
      </Route>

      {/* DEDICATED TRANSPORT MANAGER OPERATIONS COMMAND PORTAL */}
      <Route path="/transport-manager" element={<ManagerLayout />}>
        <Route index element={<Navigate to="/transport-manager/dashboard" replace />} />
        <Route path="dashboard" element={<ManagerDashboardPage />} />
        <Route path="requests" element={<ManagerRideRequestsPage />} />
        <Route path="operations" element={<ManagerOperationsPage />} />
        <Route path="schedule" element={<ManagerSchedulePage />} />
        <Route path="assignments" element={<ManagerAssignmentsPage />} />
        <Route path="live-trips" element={<ManagerLiveTripsPage />} />
        <Route path="drivers" element={<DriverManagementPage />} />
        <Route path="vehicles" element={<VehicleManagementPage />} />
        <Route path="employees" element={<UserManagementPage />} />
        <Route path="reports" element={<ReportingAnalyticsPage />} />
        <Route path="feedback" element={<ManagerFeedbackPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="*" element={<Navigate to="/transport-manager/dashboard" replace />} />
      </Route>

      {/* STANDARD CORPORATE & MANAGER PORTAL */}
      <Route
        path="/*"
        element={
          <div className="app-container">
            <Navbar />
            <main className="main-content">
              <Routes>
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
                <Route path="/map-demo" element={<MapDemoPage />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </main>
          </div>
        }
      />
    </Routes>
  );
};
export default App;
