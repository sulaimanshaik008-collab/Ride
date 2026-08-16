import React from 'react';
import { NavLink } from 'react-router-dom';
import { Car, CalendarPlus, History, Building, User, Users, CalendarCheck, UserCheck, Activity, Navigation, Bell, BarChart3 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NotificationBell } from './NotificationBell';

export const Navbar = () => {
  const { currentUser, demoUsers, switchDemoUser } = useAuth();

  const isManager = currentUser?.role === 'TRANSPORT_MANAGER' || 
                    currentUser?.role === 'CORPORATE_ADMIN' || 
                    currentUser?.role === 'SYSTEM_ADMIN';

  const isDriver = currentUser?.role === 'DRIVER';

  const canSeeVehicles = isManager || isDriver;

  return (
    <header className="navbar">
      <NavLink to="/book-ride" className="brand">
        <div className="brand-icon">
          <Car size={22} />
        </div>
        <span>FleetSync Corporate</span>
      </NavLink>

      <nav className="nav-links">
        <NavLink to="/book-ride" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <CalendarPlus size={16} />
          Book Office Ride
        </NavLink>

        <NavLink to="/my-rides" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <History size={16} />
          My Bookings
        </NavLink>

        {isManager && (
          <NavLink to="/monitoring" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Activity size={16} />
            Live Tracking
          </NavLink>
        )}

        {(isDriver || isManager) && (
          <NavLink to="/driver-trips" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Navigation size={16} />
            Driver Console
          </NavLink>
        )}

        {isManager && (
          <NavLink to="/scheduling" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <CalendarCheck size={16} />
            Ride Schedules
          </NavLink>
        )}

        {isManager && (
          <NavLink to="/assignments" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <UserCheck size={16} />
            Assign Rides
          </NavLink>
        )}

        {isManager && (
          <NavLink to="/drivers" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Users size={16} />
            Manage Drivers
          </NavLink>
        )}

        <NavLink to="/feedback" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <History size={16} />
          My Feedback
        </NavLink>

        {isManager && (
          <NavLink to="/manager/feedback" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Activity size={16} />
            Feedback & Reviews
          </NavLink>
        )}

        {isManager && (
          <NavLink to="/analytics" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <BarChart3 size={16} />
            Reports & Analytics
          </NavLink>
        )}

        {(currentUser?.role === 'CORPORATE_ADMIN' || currentUser?.role === 'SYSTEM_ADMIN') && (
          <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Building size={16} />
            Admin Center
          </NavLink>
        )}
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <NotificationBell />

        <div className="tenant-switcher">
          {currentUser && (
            <div className="tenant-badge">
              <Building size={14} color="#6366f1" />
              <span style={{ fontWeight: 600, color: '#f3f4f6' }}>{currentUser.organizationName}</span>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <User size={14} color="#9ca3af" />
            <select
              className="tenant-select"
              value={currentUser?.email || ''}
              onChange={(e) => switchDemoUser(e.target.value)}
            >
              {demoUsers.map((u) => (
                <option key={u.id} value={u.email}>
                  {u.fullName} ({u.organizationCode} - {u.role})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};
