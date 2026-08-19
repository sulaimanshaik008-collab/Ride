import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Inbox,
  Clock,
  CalendarDays,
  UserCheck,
  Radio,
  Users,
  Car,
  BarChart3,
  MessageSquareQuote,
  Bell,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  ShieldCheck,
  Building2,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { rideService } from '../../services/rideService';
import { notificationService } from '../../services/notificationService';

export const ManagerLayout = () => {
  const { currentUser, logout, theme, toggleTheme } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [needAssignmentCount, setNeedAssignmentCount] = useState(0);
  const [activeTripsCount, setActiveTripsCount] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Real-time clock update
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch quick metrics for sidebar badges
  const fetchBadgeCounts = async () => {
    try {
      const [schedulable, pendingAssign, active] = await Promise.all([
        rideService.getSchedulableRides().catch(() => []),
        rideService.getPendingAssignmentRides().catch(() => []),
        rideService.getActiveTrips().catch(() => []),
      ]);

      const pendingReqs = (schedulable || []).filter((r) => r.status === 'PENDING_APPROVAL');
      setPendingRequestsCount(pendingReqs.length);
      setNeedAssignmentCount((pendingAssign || []).length);
      setActiveTripsCount((active || []).length);

      const notifs = await notificationService.getNotifications().catch(() => []);
      const unread = (notifs || []).filter((n) => !n.isRead).length;
      setUnreadNotifications(unread);
    } catch {
      // Graceful fallback
    }
  };

  useEffect(() => {
    fetchBadgeCounts();
    const interval = setInterval(fetchBadgeCounts, 15000);
    return () => clearInterval(interval);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navGroups = [
    {
      title: 'OPERATIONS COMMAND',
      items: [
        {
          to: '/transport-manager/dashboard',
          label: 'Dashboard',
          icon: LayoutDashboard,
          badge: pendingRequestsCount + needAssignmentCount > 0 ? `${pendingRequestsCount + needAssignmentCount}` : null,
          badgeVariant: 'warning',
        },
        {
          to: '/transport-manager/requests',
          label: 'Ride Requests',
          icon: Inbox,
          badge: pendingRequestsCount > 0 ? `${pendingRequestsCount}` : null,
          badgeVariant: 'danger',
        },
        {
          to: '/transport-manager/operations',
          label: "Today's Operations",
          icon: Clock,
          badge: activeTripsCount > 0 ? `${activeTripsCount} Live` : null,
          badgeVariant: 'live',
        },
        {
          to: '/transport-manager/schedule',
          label: 'Schedule Calendar',
          icon: CalendarDays,
        },
        {
          to: '/transport-manager/assignments',
          label: 'Assignment Center',
          icon: UserCheck,
          badge: needAssignmentCount > 0 ? `${needAssignmentCount}` : null,
          badgeVariant: 'warning',
        },
        {
          to: '/transport-manager/live-trips',
          label: 'Live Trip Monitoring',
          icon: Radio,
          badge: activeTripsCount > 0 ? 'Radar' : null,
          badgeVariant: 'live',
        },
      ],
    },
    {
      title: 'FLEET & PERSONNEL',
      items: [
        {
          to: '/transport-manager/drivers',
          label: 'Drivers Fleet',
          icon: Users,
        },
        {
          to: '/transport-manager/vehicles',
          label: 'Vehicle Inventory',
          icon: Car,
        },
        {
          to: '/transport-manager/employees',
          label: 'Employees',
          icon: Building2,
        },
      ],
    },
    {
      title: 'ANALYTICS & GOVERNANCE',
      items: [
        {
          to: '/transport-manager/reports',
          label: 'Reports & Analytics',
          icon: BarChart3,
        },
        {
          to: '/transport-manager/feedback',
          label: 'Quality & Feedback',
          icon: MessageSquareQuote,
        },
        {
          to: '/transport-manager/notifications',
          label: 'System Alerts',
          icon: Bell,
          badge: unreadNotifications > 0 ? `${unreadNotifications}` : null,
          badgeVariant: 'info',
        },
      ],
    },
  ];

  return (
    <div
      className="manager-control-layout"
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: '#f4f6f4',
        color: '#0f2920',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      }}
    >
      {/* ======================================================== */}
      {/* DESKTOP OPERATIONS SIDEBAR */}
      {/* ======================================================== */}
      <aside
        className="manager-sidebar"
        style={{
          width: '280px',
          flexShrink: 0,
          background: '#ffffff',
          borderRight: '1.5px solid #e2e8f0',
          boxShadow: '2px 0 16px rgba(0, 0, 0, 0.03)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 100,
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflowY: 'auto',
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1.5px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
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
              boxShadow: '0 4px 12px rgba(19, 56, 44, 0.25)',
              color: '#10b981',
            }}
          >
            <ShieldCheck size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: '1.1rem', letterSpacing: '-0.02em', color: '#0f2920' }}>
              RideFlow
            </div>
            <div
              style={{
                fontSize: '0.7rem',
                fontWeight: 800,
                color: '#059669',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              Control Center
            </div>
          </div>
        </div>

        {/* Organization Badge Banner */}
        <div
          style={{
            margin: '0.85rem 1rem 0.25rem',
            padding: '0.65rem 0.85rem',
            borderRadius: '10px',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Building2 size={16} color="#059669" />
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '0.675rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
              Organization Scope
            </div>
            <div
              style={{
                fontSize: '0.8rem',
                fontWeight: 800,
                color: '#0f2920',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {currentUser?.organizationName || 'Acme Global Corporation'}
            </div>
          </div>
        </div>

        {/* Navigation Groups */}
        <div style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {navGroups.map((group) => (
            <div key={group.title}>
              <div
                style={{
                  padding: '0 0.75rem 0.4rem',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  color: '#64748b',
                  textTransform: 'uppercase',
                }}
              >
                {group.title}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        `manager-nav-item ${isActive ? 'active' : ''}`
                      }
                      style={({ isActive }) => ({
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.6rem 0.85rem',
                        borderRadius: '10px',
                        fontSize: '0.85rem',
                        fontWeight: isActive ? 800 : 600,
                        textDecoration: 'none',
                        transition: 'all 0.15s ease',
                        background: isActive ? 'linear-gradient(180deg, #184738 0%, #103327 100%)' : 'transparent',
                        color: isActive ? '#ffffff' : '#475569',
                        boxShadow: isActive ? '0 3px 10px rgba(19, 56, 44, 0.25)' : 'none',
                      })}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <Icon size={17} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          style={{
                            fontSize: '0.675rem',
                            fontWeight: 800,
                            padding: '0.15rem 0.45rem',
                            borderRadius: '9999px',
                            background:
                              item.badgeVariant === 'danger'
                                ? '#fef2f2'
                                : item.badgeVariant === 'warning'
                                ? '#fffbeb'
                                : '#ecfdf5',
                            color:
                              item.badgeVariant === 'danger'
                                ? '#ef4444'
                                : item.badgeVariant === 'warning'
                                ? '#d97706'
                                : '#059669',
                            border: `1px solid ${
                              item.badgeVariant === 'danger'
                                ? '#fecaca'
                                : item.badgeVariant === 'warning'
                                ? '#fde68a'
                                : '#a7f3d0'
                            }`,
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Manager Profile & Quick Logout Footer */}
        <div
          style={{
            padding: '1rem',
            borderTop: '1.5px solid #e2e8f0',
            background: '#f8faf9',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', overflow: 'hidden' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: 'linear-gradient(145deg, #184738 0%, #103327 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  color: '#ffffff',
                }}
              >
                {currentUser?.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'M'}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div
                  style={{
                    fontSize: '0.825rem',
                    fontWeight: 800,
                    color: '#0f2920',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {currentUser?.fullName || 'Transport Manager'}
                </div>
                <div style={{ fontSize: '0.675rem', color: '#059669', fontWeight: 700 }}>
                  TRANSPORT MANAGER
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              title="Log out of Manager Portal"
              aria-label="Logout"
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#ef4444',
                borderRadius: '8px',
                padding: '0.45rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s',
              }}
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* MAIN CONTENT AREA & TOPBAR */}
      {/* ======================================================== */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowX: 'hidden' }}>
        {/* Top Operational Command Bar */}
        <header
          style={{
            height: '64px',
            background: 'rgba(251, 251, 249, 0.94)',
            backdropFilter: 'blur(16px)',
            borderBottom: '1.5px solid #e2e8f0',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 1.75rem',
            position: 'sticky',
            top: 0,
            zIndex: 90,
          }}
        >
          {/* Left: Mobile Toggle & Page Context */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              type="button"
              className="manager-mobile-menu-btn"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              style={{
                display: 'none',
                background: 'transparent',
                border: 'none',
                color: '#0f2920',
                cursor: 'pointer',
                padding: '4px',
              }}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.25rem 0.65rem',
                  borderRadius: '9999px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#059669',
                  fontSize: '0.725rem',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#10b981',
                    boxShadow: '0 0 8px #10b981',
                  }}
                />
                <span>CONTROL DESK ACTIVE</span>
              </div>
            </div>
          </div>

          {/* Right: Operational Live Clock & Quick Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            {/* Live Clock */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.35rem 0.85rem',
                borderRadius: '8px',
                background: '#ffffff',
                border: '1.5px solid #e2e8f0',
                fontSize: '0.8rem',
                color: '#475569',
              }}
            >
              <Clock size={14} color="#059669" />
              <span style={{ fontWeight: 800, color: '#0f2920', fontFamily: 'monospace' }}>
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                {currentTime.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>

            {/* Notifications Button */}
            <NavLink
              to="/transport-manager/notifications"
              title="System Alerts & Notifications"
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: '#ffffff',
                border: '1.5px solid #e2e8f0',
                color: '#0f2920',
                textDecoration: 'none',
              }}
            >
              <Bell size={17} />
              {unreadNotifications > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: '#ef4444',
                    color: '#ffffff',
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 8px rgba(239, 68, 68, 0.8)',
                  }}
                >
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              )}
            </NavLink>
          </div>
        </header>

        {/* Dynamic Main Workspace Container */}
        <main
          style={{
            flex: 1,
            padding: '1.75rem 2rem',
            maxWidth: '1600px',
            width: '100%',
            margin: '0 auto',
          }}
        >
          <Outlet />
        </main>
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div
          className="manager-mobile-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            zIndex: 200,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '280px',
              height: '100%',
              background: '#0f141d',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#ffffff' }}>Transport Control</div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {navGroups.flatMap((g) => g.items).map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setIsMobileMenuOpen(false)}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      color: isActive ? '#38bdf8' : '#94a3b8',
                      background: isActive ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                      textDecoration: 'none',
                      fontWeight: isActive ? 700 : 500,
                    })}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleLogout}
              style={{
                marginTop: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.75rem',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <LogOut size={16} />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default ManagerLayout;
