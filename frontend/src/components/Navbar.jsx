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
              background: 'var(--bg-surface, #14171b)',
              border: '1px solid var(--border-glass, rgba(255, 255, 255, 0.15))',
              padding: '0.35rem 0.75rem 0.35rem 0.4rem',
              borderRadius: '9999px',
              color: 'var(--text-main, #ffffff)',
              cursor: 'pointer',
              boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
              transition: 'all 0.15s ease-in-out',
            }}
          >
            <UserAvatar user={currentUser} size={30} />
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.2 }}>
              <span style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main, #ffffff)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentUser?.fullName || 'User'}
              </span>
              <span style={{ fontSize: '0.68rem', color: 'var(--accent-teal, #10b981)', fontWeight: 600 }}>
                {currentUser?.role?.replace('_', ' ') || 'EMPLOYEE'}
              </span>
            </div>
            <ChevronDown size={14} style={{ color: 'var(--text-muted, #9ca3af)', marginLeft: '0.2rem', transform: isDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>

          {/* Glassmorphic Dropdown Popover */}
          {isDropdownOpen && (
            <div
              className="profile-dropdown-menu"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '280px',
                background: 'var(--bg-card, #111418)',
                border: '1px solid var(--border-glass, rgba(255, 255, 255, 0.15))',
                borderRadius: '16px',
                padding: '0.85rem',
                boxShadow: '0 15px 35px rgba(0, 0, 0, 0.5), 0 1px 0 rgba(255, 255, 255, 0.1) inset',
                zIndex: 1000,
                animation: 'modalIn 0.2s ease-out',
              }}
            >
              {/* Header Info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-glass, rgba(255, 255, 255, 0.08))', marginBottom: '0.75rem' }}>
                <UserAvatar user={currentUser} size={40} />
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-main, #ffffff)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {currentUser?.fullName || 'Active User'}
                  </div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted, #9ca3af)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {currentUser?.email}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--accent-teal, #10b981)', fontWeight: 700, marginTop: '2px' }}>
                    {currentUser?.organizationName || 'Acme Corp'} &bull; {currentUser?.role?.replace('_', ' ')}
                  </div>
                </div>
              </div>

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
                  padding: '0.55rem',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  color: '#f87171',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  fontSize: '0.825rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.22)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)')}
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
