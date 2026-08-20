import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, Clock, ArrowRight, ExternalLink } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { notificationService } from '../services/notificationService';
import { useAuth } from '../context/AuthContext';

export const NotificationBell = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchUnreadCount = async () => {
    try {
      const data = await notificationService.getUnreadCount();
      setUnreadCount(data?.unreadCount || 0);
    } catch (err) {
      console.warn('Failed to fetch unread count:', err);
    }
  };

  const fetchPreviewNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationService.getUserNotifications({ page: 0, size: 5 });
      setNotifications(data?.content || []);
    } catch (err) {
      console.warn('Failed to fetch notifications preview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 15000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  useEffect(() => {
    if (isOpen) {
      fetchPreviewNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id, e) => {
    e?.stopPropagation();
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.warn('Failed to mark read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.warn('Failed to mark all read:', err);
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        style={{
          background: '#ffffff',
          border: '1.5px solid #e2e8f0',
          borderRadius: '50%',
          width: '38px',
          height: '38px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#0f2920',
          position: 'relative',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
          transition: 'all 0.15s ease',
        }}
      >
        <Bell size={18} color="#0f2920" />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: '#ef4444',
              color: '#ffffff',
              borderRadius: '10px',
              padding: '2px 6px',
              fontSize: '0.68rem',
              fontWeight: 900,
              boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)',
              border: '2px solid #ffffff',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '46px',
            right: 0,
            width: '350px',
            background: '#ffffff',
            border: '1.5px solid #e2e8f0',
            borderRadius: '16px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.12)',
            zIndex: 1000,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.9rem 1.1rem',
              borderBottom: '1.5px solid #f1f5f9',
              background: '#ffffff',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: 900, fontSize: '0.95rem', color: '#0f2920' }}>Notifications</span>
              {unreadCount > 0 && (
                <span style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '1px 6px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800 }}>
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#059669',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <CheckCheck size={14} />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                <Bell size={28} color="#059669" style={{ margin: '0 auto 0.5rem' }} />
                <div style={{ fontWeight: 700, color: '#0f2920' }}>No notifications yet</div>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => {
                    if (!n.isRead) handleMarkAsRead(n.id);
                  }}
                  style={{
                    padding: '0.85rem 1.1rem',
                    borderBottom: '1px solid #f1f5f9',
                    background: n.isRead ? '#ffffff' : '#f0fdf4',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: n.isRead ? 700 : 900, fontSize: '0.875rem', color: '#0f2920' }}>
                      {n.title}
                    </span>
                    {!n.isRead && (
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#059669', marginTop: '4px', flexShrink: 0 }} />
                    )}
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#475569', margin: '0 0 0.35rem 0', lineHeight: 1.4, fontWeight: 500 }}>
                    {n.message}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.725rem', color: '#64748b' }}>
                    <span>{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {n.bookingReference && <span style={{ color: '#2563eb', fontWeight: 700 }}>{n.bookingReference}</span>}
                  </div>
                </div>
              ))
            )}
          </div>

          <div
            style={{
              padding: '0.75rem 1rem',
              borderTop: '1.5px solid #f1f5f9',
              background: '#f8faf9',
              textAlign: 'center',
            }}
          >
            <Link
              to="/notifications"
              onClick={() => setIsOpen(false)}
              style={{
                color: '#059669',
                fontSize: '0.825rem',
                fontWeight: 800,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              View All Notifications
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
