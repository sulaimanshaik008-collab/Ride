import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarCheck,
  Navigation,
  History,
  Bell,
  User,
  LogOut,
  ChevronDown,
  ShieldCheck,
  Car,
  Activity,
  CheckCircle2,
  Moon,
  Sun,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { driverService } from '../../services/driverService';
import { MotorcycleKeyIcon } from '../auth/BrandLogo';
import { NotificationBell } from '../NotificationBell';
import { UserAvatar } from '../UserAvatar';

export const DriverLayout = () => {
  const { currentUser, logout, theme, toggleTheme } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [driverProfile, setDriverProfile] = useState(null);
  const [driverStatus, setDriverStatus] = useState('AVAILABLE'); // AVAILABLE | OFFLINE | ON_RIDE
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState('');

  const statusMenuRef = useRef(null);
  const profileMenuRef = useRef(null);

  const fetchDriverProfile = async () => {
    try {
      const data = await driverService.getSelfDriverProfile();
      setDriverProfile(data);
      if (data?.availabilityStatus === 'ON_TRIP') {
        setDriverStatus('ON_RIDE');
      } else if (data?.availabilityStatus === 'AVAILABLE') {
        setDriverStatus('AVAILABLE');
      } else {
        setDriverStatus('OFFLINE');
      }
    } catch (err) {
      console.warn('Driver profile fetch notice:', err.message);
    }
  };

  useEffect(() => {
    fetchDriverProfile();
  }, [currentUser]);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target)) {
        setStatusDropdownOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStatusChange = async (newAvailability) => {
    if (!driverProfile?.id) return;
    try {
      setStatusLoading(true);
      setStatusError('');
      await driverService.updateDriverAvailability(driverProfile.id, {
        availabilityStatus: newAvailability,
      });
      if (newAvailability === 'AVAILABLE') setDriverStatus('AVAILABLE');
      else if (newAvailability === 'ON_TRIP') setDriverStatus('ON_RIDE');
      else setDriverStatus('OFFLINE');
      setStatusDropdownOpen(false);
      await fetchDriverProfile();
    } catch (err) {
      setStatusError(err.message || 'Failed to update availability status');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const driverBadgeId = driverProfile?.licenseNumber 
    ? `DRV-${driverProfile.licenseNumber.replace(/[^0-9A-Z]/g, '').slice(-4) || '1024'}`
    : 'DRV-1024';

  return (
    <div className="driver-app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f4f6f4', color: '#0f2920' }}>
      {/* DESKTOP & MOBILE TOP DRIVER HEADER */}
      <header
        style={{
          height: '68px',
          background: 'rgba(251, 251, 249, 0.94)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1.5px solid #e2e8f0',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1.75rem',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        {/* Left: Brand + Driver Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexShrink: 0 }}>
          <NavLink
            to="/driver/dashboard"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              textDecoration: 'none',
              color: '#0f2920',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(145deg, #184738 0%, #0d261e 100%)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981',
                boxShadow: '0 4px 12px rgba(19, 56, 44, 0.25)',
                flexShrink: 0,
              }}
            >
              <MotorcycleKeyIcon size={26} color="#10b981" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}>
              <span
                style={{
                  fontWeight: 900,
                  fontSize: '1.2rem',
                  letterSpacing: '-0.025em',
                  color: '#0f2920',
                  lineHeight: 1,
                }}
              >
                RideFlow
              </span>
              <span
                style={{
                  fontSize: '0.7rem',
                  padding: '0.25rem 0.55rem',
                  borderRadius: '6px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#047857',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  whiteSpace: 'nowrap',
                  display: 'inline-flex',
                  alignItems: 'center',
                  lineHeight: 1,
                  flexShrink: 0,
                }}
              >
                Driver Desk
              </span>
            </div>
          </NavLink>
        </div>

        {/* Center: Desktop Navigation Bar */}
        <nav
          className="driver-desktop-nav"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            background: '#eef2ef',
            padding: '0.35rem',
            borderRadius: '9999px',
            border: '1.5px solid #e2e8f0',
            margin: '0 1.5rem',
            flexShrink: 0,
          }}
        >
          <NavLink
            to="/driver/dashboard"
            className={({ isActive }) => `driver-nav-pill ${isActive ? 'active' : ''}`}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.5rem 0.95rem',
              borderRadius: '9999px',
              fontSize: '0.84rem',
              fontWeight: 700,
              textDecoration: 'none',
              transition: 'all 0.15s ease',
              background: isActive ? 'linear-gradient(180deg, #184738 0%, #103327 100%)' : 'transparent',
              color: isActive ? '#ffffff' : '#475569',
              boxShadow: isActive ? '0 3px 10px rgba(19, 56, 44, 0.25)' : 'none',
            })}
          >
            <LayoutDashboard size={16} />
            Dashboard
          </NavLink>

          <NavLink
            to="/driver/rides/today"
            className={({ isActive }) => `driver-nav-pill ${isActive ? 'active' : ''}`}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.5rem 0.95rem',
              borderRadius: '9999px',
              fontSize: '0.84rem',
              fontWeight: 700,
              textDecoration: 'none',
              transition: 'all 0.15s ease',
              background: isActive ? 'linear-gradient(180deg, #184738 0%, #103327 100%)' : 'transparent',
              color: isActive ? '#ffffff' : '#475569',
              boxShadow: isActive ? '0 3px 10px rgba(19, 56, 44, 0.25)' : 'none',
            })}
          >
            <CalendarCheck size={16} />
            Today's Schedule
          </NavLink>

          <NavLink
            to="/driver/rides/history"
            className={({ isActive }) => `driver-nav-pill ${isActive ? 'active' : ''}`}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.5rem 0.95rem',
              borderRadius: '9999px',
              fontSize: '0.84rem',
              fontWeight: 700,
              textDecoration: 'none',
              transition: 'all 0.15s ease',
              background: isActive ? 'linear-gradient(180deg, #184738 0%, #103327 100%)' : 'transparent',
              color: isActive ? '#ffffff' : '#475569',
              boxShadow: isActive ? '0 3px 10px rgba(19, 56, 44, 0.25)' : 'none',
            })}
          >
            <History size={16} />
            Ride History
          </NavLink>
        </nav>

        {/* Right: Availability Toggle + Notification Bell + Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0, marginLeft: 'auto' }}>
          {/* Driver Status Pill & Dropdown */}
          <div ref={statusMenuRef} style={{ position: 'relative', flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
              disabled={statusLoading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.45rem 0.9rem',
                borderRadius: '9999px',
                background: driverStatus === 'AVAILABLE' 
                  ? 'rgba(16, 185, 129, 0.12)' 
                  : driverStatus === 'ON_RIDE' 
                  ? 'rgba(59, 130, 246, 0.12)' 
                  : '#f1f5f9',
                color: driverStatus === 'AVAILABLE' 
                  ? '#059669' 
                  : driverStatus === 'ON_RIDE' 
                  ? '#2563eb' 
                  : '#64748b',
                border: `1.5px solid ${
                  driverStatus === 'AVAILABLE' 
                    ? 'rgba(16, 185, 129, 0.35)' 
                    : driverStatus === 'ON_RIDE' 
                    ? 'rgba(59, 130, 246, 0.35)' 
                    : '#e2e8f0'
                }`,
                fontSize: '0.8rem',
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: driverStatus === 'AVAILABLE' ? '#10b981' : driverStatus === 'ON_RIDE' ? '#3b82f6' : '#94a3b8',
                  boxShadow: driverStatus === 'AVAILABLE' ? '0 0 8px #10b981' : 'none',
                }}
              />
              <span>{driverStatus === 'AVAILABLE' ? 'Available for Rides' : driverStatus === 'ON_RIDE' ? 'On Active Ride' : 'Offline'}</span>
              <ChevronDown size={14} />
            </button>

            {statusDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: '210px',
                  background: '#ffffff',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '0.6rem',
                  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.12)',
                  zIndex: 200,
                }}
              >
                <div style={{ fontSize: '0.72rem', color: '#64748b', padding: '0.35rem 0.5rem', fontWeight: 800 }}>
                  DRIVER AVAILABILITY
                </div>
                <button
                  type="button"
                  onClick={() => handleStatusChange('AVAILABLE')}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.55rem 0.6rem',
                    borderRadius: '8px',
                    background: driverStatus === 'AVAILABLE' ? '#ecfdf5' : 'transparent',
                    color: '#059669',
                    border: 'none',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#059669' }} />
                  Available for Rides
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange('OFF_DUTY')}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.55rem 0.6rem',
                    borderRadius: '8px',
                    background: driverStatus === 'OFFLINE' ? '#f1f5f9' : 'transparent',
                    color: '#64748b',
                    border: 'none',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'left',
                    marginTop: '2px',
                  }}
                >
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#94a3b8' }} />
                  Offline / Off Duty
                </button>
              </div>
            )}
          </div>

          <NotificationBell />

          {/* Profile Popover */}
          <div ref={profileMenuRef} style={{ position: 'relative', flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(255, 255, 255, 0.95)',
                border: '1.5px solid #e2e8f0',
                borderRadius: '9999px',
                cursor: 'pointer',
                padding: '0.25rem 0.75rem 0.25rem 0.25rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                transition: 'all 0.15s ease',
              }}
            >
              <UserAvatar user={currentUser} size={32} />
              <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0f2920', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentUser?.fullName || currentUser?.email?.split('@')[0] || 'Driver'}
              </span>
              <ChevronDown size={14} color="#64748b" />
            </button>

            {profileDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: '260px',
                  background: '#ffffff',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '1rem',
                  boxShadow: '0 15px 35px rgba(0, 0, 0, 0.12)',
                  zIndex: 200,
                }}
              >
                <div style={{ paddingBottom: '0.65rem', borderBottom: '1.5px solid #e2e8f0', marginBottom: '0.65rem' }}>
                  <div style={{ fontWeight: 900, fontSize: '0.95rem', color: '#0f2920' }}>{currentUser?.fullName || 'Driver'}</div>
                  <div style={{ fontSize: '0.775rem', color: '#64748b' }}>{currentUser?.email}</div>
                  <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 800, marginTop: '2px' }}>{driverBadgeId} &bull; Active Driver</div>
                </div>

                <NavLink
                  to="/driver/profile"
                  onClick={() => setProfileDropdownOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.55rem',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '8px',
                    color: '#0f2920',
                    textDecoration: 'none',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    marginBottom: '4px',
                  }}
                >
                  <User size={16} color="#64748b" />
                  Driver Profile & Vehicle
                </NavLink>

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
                    borderRadius: '8px',
                    background: '#fef2f2',
                    color: '#ef4444',
                    border: '1.5px solid #fecaca',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    marginTop: '0.4rem',
                  }}
                >
                  <LogOut size={14} />
                  Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* MAIN OPERATIONS OUTLET */}
      <main style={{ flex: 1, padding: '1.5rem', maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
        {statusError && (
          <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', color: '#ef4444', padding: '0.75rem 1rem', borderRadius: '10px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 700 }}>
            <AlertCircle size={16} />
            <span>{statusError}</span>
          </div>
        )}
        <Outlet />
      </main>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav
        className="driver-mobile-bottom-nav"
        style={{
          display: 'none',
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '62px',
          background: 'rgba(17, 20, 24, 0.95)',
          backdropFilter: 'blur(16px)',
          borderTop: '1px solid var(--border-glass, rgba(255, 255, 255, 0.1))',
          alignItems: 'center',
          justifyContent: 'space-around',
          zIndex: 100,
          padding: '0 0.5rem',
        }}
      >
        <NavLink
          to="/driver/dashboard"
          style={({ isActive }) => ({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            textDecoration: 'none',
            fontSize: '0.7rem',
            fontWeight: 600,
            color: isActive ? '#34d399' : 'var(--text-muted, #9ca3af)',
          })}
        >
          <LayoutDashboard size={20} />
          <span>Home</span>
        </NavLink>

        <NavLink
          to="/driver/rides/today"
          style={({ isActive }) => ({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            textDecoration: 'none',
            fontSize: '0.7rem',
            fontWeight: 600,
            color: isActive ? '#34d399' : 'var(--text-muted, #9ca3af)',
          })}
        >
          <CalendarCheck size={20} />
          <span>Schedule</span>
        </NavLink>

        <NavLink
          to="/driver/rides/history"
          style={({ isActive }) => ({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            textDecoration: 'none',
            fontSize: '0.7rem',
            fontWeight: 600,
            color: isActive ? '#34d399' : 'var(--text-muted, #9ca3af)',
          })}
        >
          <History size={20} />
          <span>History</span>
        </NavLink>

        <NavLink
          to="/driver/profile"
          style={({ isActive }) => ({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            textDecoration: 'none',
            fontSize: '0.7rem',
            fontWeight: 600,
            color: isActive ? '#34d399' : 'var(--text-muted, #9ca3af)',
          })}
        >
          <User size={20} />
          <span>Profile</span>
        </NavLink>
      </nav>

      {/* Style for responsive media queries */}
      <style>{`
        @media (max-width: 768px) {
          .driver-desktop-nav { display: none !important; }
          .driver-mobile-bottom-nav { display: flex !important; }
          .driver-greeting-block { display: none !important; }
          main { padding-bottom: 80px !important; }
        }
      `}</style>
    </div>
  );
};

export default DriverLayout;
