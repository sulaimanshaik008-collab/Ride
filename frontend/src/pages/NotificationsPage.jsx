import React, { useState, useEffect } from 'react';
import { 
  Bell, Check, CheckCheck, Clock, Filter, 
  Search, RefreshCw, Calendar, MapPin, User, Car, ShieldAlert, MessageSquare, Smartphone 
} from 'lucide-react';
import { notificationService } from '../services/notificationService';
import { useAuth } from '../context/AuthContext';

export const NotificationsPage = () => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterUnread, setFilterUnread] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await notificationService.getUserNotifications({
        page,
        size: 20,
        unreadOnly: filterUnread || undefined,
      });
      setNotifications(data?.content || []);
      setTotalPages(data?.totalPages || 0);
    } catch (err) {
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
    }
  }, [currentUser, page, filterUnread]);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.warn('Failed to mark read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.warn('Failed to mark all read:', err);
    }
  };

  const filteredNotifications = notifications.filter(n => {
    const q = search.toLowerCase();
    return n.title.toLowerCase().includes(q) ||
           n.message.toLowerCase().includes(q) ||
           (n.bookingReference && n.bookingReference.toLowerCase().includes(q));
  });

  const getBadgeColor = (type) => {
    switch (type) {
      case 'RIDE_BOOKED': return '#2563eb';
      case 'RIDE_SCHEDULED': return '#7c3aed';
      case 'DRIVER_ASSIGNED': return '#0284c7';
      case 'TRIP_STARTED': return '#059669';
      case 'TRIP_COMPLETED': return '#059669';
      case 'RIDE_CANCELLED': return '#ef4444';
      default: return '#4f46e5';
    }
  };

  const getChannelBadge = (channel, status) => {
    const isSms = channel === 'SMS';
    const isDelivered = status === 'DELIVERED';
    const color = isDelivered ? '#059669' : (status === 'NOT_CONFIGURED' ? '#64748b' : '#ef4444');
    const bg = isDelivered ? '#ecfdf5' : (status === 'NOT_CONFIGURED' ? '#f1f5f9' : '#fef2f2');

    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
        background: bg,
        border: `1px solid ${color}44`,
        padding: '2px 8px',
        borderRadius: '6px',
        fontSize: '0.72rem',
        color: '#0f172a',
        fontWeight: 600,
      }}>
        {isSms ? <Smartphone size={11} color={color} /> : <MessageSquare size={11} color={color} />}
        <span>{channel}</span>
        <span style={{ color: color, fontWeight: 700 }}>({status})</span>
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 900, color: '#0f2920', margin: 0, display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Bell size={28} color="#059669" />
            <span>Notification Center</span>
          </h1>
          <p style={{ color: '#64748b', margin: '0.35rem 0 0', fontSize: '0.9rem', fontWeight: 500 }}>
            Stay updated with your corporate ride bookings, schedule changes, driver assignments, and SMS alerts.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleMarkAllAsRead}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.6rem 1.1rem',
              fontSize: '0.85rem',
              background: '#ffffff',
              border: '1.5px solid #e2e8f0',
              color: '#0f2920',
              borderRadius: '10px',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            <CheckCheck size={16} />
            <span>Mark All Read</span>
          </button>
          <button
            type="button"
            onClick={fetchNotifications}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.6rem 1.1rem',
              fontSize: '0.85rem',
              background: '#ffffff',
              border: '1.5px solid #e2e8f0',
              color: '#0f2920',
              borderRadius: '10px',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={16} className={loading ? 'spin-animation' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', color: '#ef4444', padding: '1rem 1.25rem', borderRadius: '12px', fontWeight: 700 }}>
          ⚠️ {error}
        </div>
      )}

      {/* FILTER & SEARCH BAR */}
      <div
        style={{
          background: '#ffffff',
          border: '1.5px solid #e2e8f0',
          borderRadius: '16px',
          padding: '1.1rem 1.25rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search notifications by title, details, or booking reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              paddingLeft: '2.35rem',
              paddingRight: '0.75rem',
              paddingTop: '0.55rem',
              paddingBottom: '0.55rem',
              background: '#ffffff',
              border: '1.5px solid #e2e8f0',
              borderRadius: '8px',
              color: '#0f172a',
              fontSize: '0.875rem',
              fontWeight: 600,
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => { setFilterUnread(false); setPage(0); }}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.825rem',
              fontWeight: 800,
              borderRadius: '8px',
              border: !filterUnread ? '1.5px solid #059669' : '1.5px solid #e2e8f0',
              background: !filterUnread ? 'linear-gradient(180deg, #184738 0%, #103327 100%)' : '#f8faf9',
              color: !filterUnread ? '#ffffff' : '#475569',
              cursor: 'pointer',
            }}
          >
            All Notifications
          </button>
          <button
            type="button"
            onClick={() => { setFilterUnread(true); setPage(0); }}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.825rem',
              fontWeight: 800,
              borderRadius: '8px',
              border: filterUnread ? '1.5px solid #059669' : '1.5px solid #e2e8f0',
              background: filterUnread ? 'linear-gradient(180deg, #184738 0%, #103327 100%)' : '#f8faf9',
              color: filterUnread ? '#ffffff' : '#475569',
              cursor: 'pointer',
            }}
          >
            Unread Only
          </button>
        </div>
      </div>

      {/* NOTIFICATIONS LIST */}
      {loading ? (
        <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '18px', textAlign: 'center', padding: '4rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
          <RefreshCw size={28} className="spin-animation" style={{ margin: '0 auto 0.75rem', color: '#059669' }} />
          <p style={{ color: '#64748b', fontWeight: 600 }}>Loading your notification feed...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '18px', textAlign: 'center', padding: '4rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
          <Bell size={40} color="#059669" style={{ margin: '0 auto 0.75rem' }} />
          <p style={{ color: '#0f2920', fontSize: '1.1rem', fontWeight: 900, marginBottom: '0.3rem' }}>
            No Notifications Found
          </p>
          <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
            {filterUnread ? 'You have no unread notifications.' : 'You have no notifications yet.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {filteredNotifications.map((n) => (
            <div
              key={n.id}
              style={{
                padding: '1.25rem 1.5rem',
                border: '1.5px solid #e2e8f0',
                borderLeft: `5px solid ${getBadgeColor(n.notificationType)}`,
                borderRadius: '16px',
                background: n.isRead ? '#ffffff' : '#f0fdf4',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      background: '#f8faf9',
                      color: getBadgeColor(n.notificationType),
                      border: `1px solid ${getBadgeColor(n.notificationType)}44`,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '0.725rem',
                      fontWeight: 800,
                    }}
                  >
                    {n.notificationType.replace(/_/g, ' ')}
                  </span>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f2920', margin: 0 }}>
                    {n.title}
                  </h3>
                  {n.bookingReference && (
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#2563eb' }}>
                      {n.bookingReference}
                    </span>
                  )}
                </div>

                <p style={{ color: '#475569', fontSize: '0.88rem', margin: 0, lineHeight: 1.5, fontWeight: 500 }}>
                  {n.message}
                </p>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Clock size={13} />
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                  {getChannelBadge(n.channel, n.channelStatus)}
                </div>
              </div>

              <div>
                {!n.isRead ? (
                  <button
                    type="button"
                    onClick={() => handleMarkAsRead(n.id)}
                    style={{
                      padding: '0.45rem 0.85rem',
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      background: 'linear-gradient(180deg, #184738 0%, #103327 100%)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    <Check size={14} />
                    <span>Mark Read</span>
                  </button>
                ) : (
                  <span style={{ fontSize: '0.8rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 700 }}>
                    <CheckCheck size={16} color="#059669" />
                    <span>Read</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
