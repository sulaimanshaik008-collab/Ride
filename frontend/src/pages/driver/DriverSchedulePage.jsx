import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarCheck,
  Clock,
  MapPin,
  User,
  Car,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  RefreshCw,
  Navigation
} from 'lucide-react';
import { rideService } from '../../services/rideService';
import { StatusBadge } from '../../components/StatusBadge';

export const DriverSchedulePage = () => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await rideService.getDriverTodayRides();
      setRides(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load today schedule');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.25s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f2920', margin: 0, display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <CalendarCheck size={28} color="#059669" />
            <span>Today's Shift Schedule</span>
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '4px' }}>
            Chronological itinerary and duty roster of rides assigned for today.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchSchedule}
          disabled={loading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.6rem 1.1rem',
            borderRadius: '10px',
            background: '#ffffff',
            border: '1.5px solid #e2e8f0',
            color: '#0f2920',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
          }}
        >
          <RefreshCw size={14} className={loading ? 'spin-animation' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', color: '#ef4444', padding: '0.85rem 1.25rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Timeline List */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
          <RefreshCw size={28} className="spin-animation" style={{ margin: '0 auto 0.75rem auto' }} />
          <div>Loading today's schedule...</div>
        </div>
      ) : rides.length === 0 ? (
        <div
          style={{
            background: '#ffffff',
            border: '1.5px dashed #cbd5e1',
            borderRadius: '16px',
            padding: '3rem 1.5rem',
            textAlign: 'center',
            color: '#64748b',
          }}
        >
          <CheckCircle2 size={36} color="#059669" style={{ margin: '0 auto 0.75rem auto' }} />
          <h3 style={{ color: '#0f2920', fontSize: '1.15rem', fontWeight: 900, margin: '0 0 0.4rem 0' }}>No Rides Assigned for Today</h3>
          <p style={{ fontSize: '0.85rem', maxWidth: '400px', margin: '0 auto' }}>
            You have no further trips on your roster today. Enjoy your break or check back for new assignments.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {rides.map((ride, index) => (
            <div
              key={ride.id}
              style={{
                background: '#ffffff',
                border: '1.5px solid #e2e8f0',
                borderRadius: '16px',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
                position: 'relative',
                boxShadow: '0 4px 18px rgba(0, 0, 0, 0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem' }}>
                {/* Time Indicator Badge */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '75px',
                    padding: '0.6rem 0.75rem',
                    background: '#f8faf9',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '10px',
                  }}
                >
                  <Clock size={16} color="#059669" />
                  <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0f2920', marginTop: '3px' }}>
                    {ride.pickupTime?.slice(0, 5) || '08:30'}
                  </span>
                </div>

                {/* Ride Summary */}
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, marginBottom: '3px' }}>
                    Ride #{ride.bookingReference}
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 900, color: '#0f2920', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span>{ride.pickupLocation}</span>
                    <span style={{ color: '#059669' }}>&rarr;</span>
                    <span>{ride.destination}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginTop: '0.65rem', flexWrap: 'wrap', fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <User size={14} color="#2563eb" />
                      <strong style={{ color: '#0f2920' }}>{ride.employeeName || 'Corporate Passenger'}</strong>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Car size={14} color="#059669" />
                      <span>{ride.vehicleMakeModel || 'Fleet Vehicle'} ({ride.vehicleRegistration || 'REG-101'})</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Status and Action */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <StatusBadge status={ride.status} />
                <Link
                  to="/driver/dashboard"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.55rem 1.15rem',
                    borderRadius: '8px',
                    background: 'linear-gradient(180deg, #184738 0%, #103327 100%)',
                    color: '#ffffff',
                    textDecoration: 'none',
                    fontSize: '0.825rem',
                    fontWeight: 800,
                    boxShadow: '0 3px 10px rgba(19, 56, 44, 0.25)',
                  }}
                >
                  <span>Operate</span>
                  <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DriverSchedulePage;
