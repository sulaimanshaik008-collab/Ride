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
      case 'RIDE_BOOKED': return '#3b82f6';
      case 'RIDE_SCHEDULED': return '#8b5cf6';
      case 'DRIVER_ASSIGNED': return '#06b6d4';
      case 'TRIP_STARTED': return '#10b981';
      case 'TRIP_COMPLETED': return '#059669';
      case 'RIDE_CANCELLED': return '#ef4444';
      default: return '#6366f1';
    }
  };

  const getChannelBadge = (channel, status) => {
    const isSms = channel === 'SMS';
    const isDelivered = status === 'DELIVERED';
    const color = isDelivered ? '#10b981' : (status === 'NOT_CONFIGURED' ? '#9ca3af' : '#ef4444');

    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        background: 'rgba(255,255,255,0.06)',
        border: `1px solid ${color}44`,
        padding: '2px 7px',
        borderRadius: '4px',
        fontSize: '0.72rem',
        color: '#f3f4f6'
      }}>
        {isSms ? <Smartphone size={11} color={color} /> : <MessageSquare size={11} color={color} />}
        <span>{channel}</span>
        <span style={{ color: color, fontWeight: 600 }}>({status})</span>
      </span>
    );
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Notification Center</h1>
          <p className="page-subtitle">
            Stay updated with your corporate ride bookings, schedule changes, driver assignments, and SMS alerts.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={handleMarkAllAsRead} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <CheckCheck size={16} />
            Mark All Read
          </button>
          <button onClick={fetchNotifications} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* FILTER & SEARCH BAR */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} color="var(--text-dim)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search notifications by title, details, or booking reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.75rem' }}
          />
        </div>

        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            onClick={() => { setFilterUnread(false); setPage(0); }}
            className={`btn ${!filterUnread ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.85rem', padding: '0.45rem 1rem' }}
          >
            All Notifications
          </button>
          <button
            onClick={() => { setFilterUnread(true); setPage(0); }}
            className={`btn ${filterUnread ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.85rem', padding: '0.45rem 1rem' }}
          >
            Unread Only
          </button>
        </div>
      </div>

      {/* NOTIFICATIONS LIST */}
      {loading ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>Loading your notification feed...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Bell size={40} color="#6366f1" style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.3rem' }}>
            No Notifications Found
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            {filterUnread ? 'You have no unread notifications.' : 'You have no notifications yet.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {filteredNotifications.map((n) => (
            <div
              key={n.id}
              className="glass-card"
              style={{
                padding: '1.25rem',
                borderLeft: `4px solid ${getBadgeColor(n.notificationType)}`,
                background: n.isRead ? 'var(--bg-glass)' : 'rgba(99, 102, 241, 0.05)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span
                    style={{
                      background: `${getBadgeColor(n.notificationType)}22`,
                      color: getBadgeColor(n.notificationType),
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}
                  >
                    {n.notificationType.replace(/_/g, ' ')}
                  </span>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                    {n.title}
                  </h3>
                  {n.bookingReference && (
                    <span className="booking-ref" style={{ fontSize: '0.78rem' }}>
                      {n.bookingReference}
                    </span>
                  )}
                </div>

                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0, lineHeight: 1.4 }}>
                  {n.message}
                </p>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
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
                    onClick={() => handleMarkAsRead(n.id)}
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <Check size={14} />
                    Mark Read
                  </button>
                ) : (
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <CheckCheck size={14} color="#10b981" />
                    Read
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
