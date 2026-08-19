import React, { useState, useEffect } from 'react';
import {
  History,
  Calendar,
  Filter,
  RefreshCw,
  MapPin,
  Clock,
  User,
  Car,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { rideService } from '../../services/rideService';
import { StatusBadge } from '../../components/StatusBadge';

export const DriverHistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;

      const data = await rideService.getDriverHistory(params);
      setHistory(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load driver trip history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [statusFilter, fromDate, toDate]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.25s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f2920', margin: 0, display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <History size={28} color="#059669" />
            <span>Driver Trip History</span>
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '4px' }}>
            Archive of completed and historical rides operated across your duty history.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchHistory}
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

      {/* Filter Bar */}
      <div
        style={{
          background: '#ffffff',
          border: '1.5px solid #e2e8f0',
          borderRadius: '16px',
          padding: '1.1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} color="#64748b" />
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f2920' }}>Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              background: '#ffffff',
              border: '1.5px solid #e2e8f0',
              borderRadius: '8px',
              padding: '0.5rem 0.85rem',
              color: '#0f172a',
              fontSize: '0.85rem',
              fontWeight: 700,
              outline: 'none',
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={16} color="#64748b" />
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f2920' }}>From:</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            style={{
              background: '#ffffff',
              border: '1.5px solid #e2e8f0',
              borderRadius: '8px',
              padding: '0.5rem 0.75rem',
              color: '#0f172a',
              fontSize: '0.85rem',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f2920' }}>To:</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            style={{
              background: '#ffffff',
              border: '1.5px solid #e2e8f0',
              borderRadius: '8px',
              padding: '0.5rem 0.75rem',
              color: '#0f172a',
              fontSize: '0.85rem',
              outline: 'none',
            }}
          />
        </div>

        {(statusFilter !== 'ALL' || fromDate || toDate) && (
          <button
            type="button"
            onClick={() => {
              setStatusFilter('ALL');
              setFromDate('');
              setToDate('');
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ef4444',
              fontSize: '0.85rem',
              fontWeight: 800,
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', color: '#ef4444', padding: '0.85rem 1.25rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* History Cards */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
          <RefreshCw size={28} className="spin-animation" style={{ margin: '0 auto 0.75rem auto' }} />
          <div>Loading historical records...</div>
        </div>
      ) : history.length === 0 ? (
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
          <h3 style={{ color: '#0f2920', fontSize: '1.15rem', fontWeight: 900, margin: '0 0 0.4rem 0' }}>No History Records Found</h3>
          <p style={{ fontSize: '0.85rem', maxWidth: '400px', margin: '0 auto' }}>
            There are no completed or past trips matching your selected date and status filters.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {history.map((ride) => (
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
                boxShadow: '0 4px 18px rgba(0, 0, 0, 0.04)',
              }}
            >
              <div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, marginBottom: '2px' }}>
                  Ride #{ride.bookingReference} &bull; {ride.bookingDate} {ride.pickupTime?.slice(0, 5)}
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f2920' }}>
                  {ride.pickupLocation} &rarr; {ride.destination}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.4rem', fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                  <span>Passenger: <strong style={{ color: '#0f2920' }}>{ride.employeeName}</strong></span>
                  <span>&bull;</span>
                  <span>Vehicle: <strong style={{ color: '#2563eb' }}>{ride.vehicleMakeModel || 'Fleet'} ({ride.vehicleRegistration || 'REG-101'})</strong></span>
                </div>
              </div>

              <StatusBadge status={ride.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DriverHistoryPage;
