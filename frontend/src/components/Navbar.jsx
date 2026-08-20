import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  CalendarPlus,
  History,
  Building,
  Users,
  CalendarCheck,
  UserCheck,
  Activity,
  Navigation,
  BarChart3,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NotificationBell } from './NotificationBell';
import { MotorcycleKeyIcon } from './auth/BrandLogo';
import { UserAvatar } from './UserAvatar';

export const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isManager = currentUser?.role === 'TRANSPORT_MANAGER' || 
                    currentUser?.role === 'CORPORATE_ADMIN' || 
                    currentUser?.role === 'SYSTEM_ADMIN';

  const isDriver = currentUser?.role === 'DRIVER';

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setIsDropdownOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      {/* BRAND LOGO & NAME */}
      <NavLink to="/book-ride" className="brand">
        <div className="brand-icon">
          <MotorcycleKeyIcon size={24} color="currentColor" />
        </div>
        <span>RideFlow</span>
      </NavLink>

      {/* NAVIGATION LINKS */}
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
          <NavLink to="/driver/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Navigation size={16} />
            Driver Dashboard
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

      {/* RIGHT USER & NOTIFICATIONS CONTROLS */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <NotificationBell />

        {/* Custom Profile & Account Dropdown */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            aria-expanded={isDropdownOpen}
            aria-label="User profile and account switcher"
            className="user-profile-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.55rem',
              background: '#ffffff',
              border: '1.5px solid #e2e8f0',
              padding: '0.35rem 0.75rem 0.35rem 0.4rem',
              borderRadius: '9999px',
              color: '#0f2920',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              transition: 'all 0.15s ease-in-out',
            }}
          >
            <UserAvatar user={currentUser} size={30} />
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.2 }}>
              <span style={{ fontSize: '0.825rem', fontWeight: 800, color: '#0f2920', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentUser?.fullName || 'User'}
              </span>
              <span style={{ fontSize: '0.68rem', color: '#059669', fontWeight: 800 }}>
                {currentUser?.role?.replace('_', ' ') || 'EMPLOYEE'}
              </span>
            </div>
            <ChevronDown size={14} style={{ color: '#64748b', marginLeft: '0.2rem', transform: isDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>

          {/* Luxury Dropdown Popover */}
          {isDropdownOpen && (
            <div
              className="profile-dropdown-menu"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '280px',
                background: '#ffffff',
                border: '1.5px solid #e2e8f0',
                borderRadius: '18px',
                padding: '1rem',
                boxShadow: '0 15px 35px rgba(0, 0, 0, 0.12)',
                zIndex: 1000,
                animation: 'modalIn 0.2s ease-out',
              }}
            >
              {/* Header Info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', paddingBottom: '0.75rem', borderBottom: '1.5px solid #e2e8f0', marginBottom: '0.75rem' }}>
                <UserAvatar user={currentUser} size={40} />
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontWeight: 900, fontSize: '0.925rem', color: '#0f2920', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {currentUser?.fullName || 'Active User'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {currentUser?.email}
                  </div>
                  <div style={{ fontSize: '0.725rem', color: '#059669', fontWeight: 800, marginTop: '2px' }}>
                    {currentUser?.organizationName || 'Acme Corp'} &bull; {currentUser?.role?.replace('_', ' ')}
                  </div>
                </div>
              </div>

              {/* Direct Link to Manager Control Center */}
              {(currentUser?.role === 'TRANSPORT_MANAGER' || currentUser?.role === 'CORPORATE_ADMIN' || currentUser?.role === 'SYSTEM_ADMIN') && (
                <NavLink
                  to="/transport-manager/dashboard"
                  onClick={() => setIsDropdownOpen(false)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '10px',
                    background: '#eff6ff',
                    color: '#2563eb',
                    border: '1px solid #bfdbfe',
                    fontSize: '0.825rem',
                    fontWeight: 800,
                    textDecoration: 'none',
                    marginBottom: '0.5rem',
                  }}
                >
                  <Navigation size={14} />
                  <span>Open Manager Desk</span>
                </NavLink>
              )}

              {/* Direct Link to Driver Operations */}
              <NavLink
                to="/driver/dashboard"
                onClick={() => setIsDropdownOpen(false)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.6rem 0.75rem',
                  borderRadius: '10px',
                  background: '#ecfdf5',
                  color: '#059669',
                  border: '1px solid #a7f3d0',
                  fontSize: '0.825rem',
                  fontWeight: 800,
                  textDecoration: 'none',
                  marginBottom: '0.5rem',
                }}
              >
                <Navigation size={14} />
                <span>Open Driver Operations</span>
              </NavLink>

              {/* Logout Option */}
              <button
                type="button"
                onClick={handleLogout}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                  padding: '0.6rem',
                  borderRadius: '10px',
                  background: '#fef2f2',
                  color: '#ef4444',
                  border: '1.5px solid #fecaca',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <LogOut size={14} />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>

        {/* Dedicated Quick Logout Button */}
        <button
          type="button"
          onClick={handleLogout}
          title="Log Out"
          aria-label="Log Out of RideFlow"
          className="logout-nav-btn"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.35rem',
            background: 'rgba(239, 68, 68, 0.12)',
            color: '#f87171',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            padding: '0.45rem 0.75rem',
            borderRadius: '8px',
            fontSize: '0.8rem',
            fontWeight: 700,
            cursor: 'pointer',
            minHeight: '36px',
            transition: 'all 0.15s ease-in-out',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.22)';
            e.currentTarget.style.borderColor = '#ef4444';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.25)';
          }}
        >
          <LogOut size={15} />
          <span style={{ display: 'inline' }}>Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
