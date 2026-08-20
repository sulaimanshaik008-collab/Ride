import React, { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, Users, Car, MapPin, Clock, 
  Download, Calendar, AlertCircle, CheckCircle2, ShieldAlert, Sparkles, RefreshCw, ChevronDown 
} from 'lucide-react';
import { analyticsService } from '../services/analyticsService';
import { useAuth } from '../context/AuthContext';

export const ReportingAnalyticsPage = () => {
  const { currentUser } = useAuth();
  
  // Date Filters
  const [dateRangePreset, setDateRangePreset] = useState('30d');
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Tab
  const [activeTab, setActiveTab] = useState('overview'); // overview, rides, drivers, vehicles, routes, capacity, insights

  // Data states
  const [overview, setOverview] = useState(null);
  const [rideTrends, setRideTrends] = useState([]);
  const [driverStats, setDriverStats] = useState([]);
  const [vehicleStats, setVehicleStats] = useState([]);
  const [routeStats, setRouteStats] = useState([]);
  const [peakHours, setPeakHours] = useState([]);
  const [capacityStats, setCapacityStats] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handlePresetChange = (preset) => {
    setDateRangePreset(preset);
    const end = new Date();
    const start = new Date();

    if (preset === 'today') {
      // today
    } else if (preset === '7d') {
      start.setDate(start.getDate() - 7);
    } else if (preset === '30d') {
      start.setDate(start.getDate() - 30);
    } else if (preset === '90d') {
      start.setDate(start.getDate() - 90);
    }
    
    setFromDate(start.toISOString().split('T')[0]);
    setToDate(end.toISOString().split('T')[0]);
  };

  const fetchAllAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = { from: fromDate, to: toDate };
      const [ov, rt, dr, vh, ro, ph, cp, ins] = await Promise.all([
        analyticsService.getOverview(params),
        analyticsService.getRideTrends(params),
        analyticsService.getDriverAnalytics(params),
        analyticsService.getVehicleAnalytics(params),
        analyticsService.getRouteAnalytics(params),
        analyticsService.getPeakHours(params),
        analyticsService.getCapacityAnalysis(params),
        analyticsService.getInsights(params),
      ]);

      setOverview(ov);
      setRideTrends(rt || []);
      setDriverStats(dr || []);
      setVehicleStats(vh || []);
      setRouteStats(ro || []);
      setPeakHours(ph || []);
      setCapacityStats(cp || []);
      setInsights(ins || []);
    } catch (err) {
      setError(err.message || 'Failed to load transportation reporting data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchAllAnalytics();
    }
  }, [currentUser, fromDate, toDate]);

  const handleExportCsv = () => {
    const params = new URLSearchParams({ from: fromDate, to: toDate }).toString();
    window.open(`/api/v1/analytics/export?${params}`, '_blank');
  };

  const isManager = currentUser?.role === 'TRANSPORT_MANAGER' || 
                    currentUser?.role === 'CORPORATE_ADMIN' || 
                    currentUser?.role === 'SYSTEM_ADMIN';

  if (!isManager) {
    return (
      <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '20px', textAlign: 'center', padding: '4rem', marginTop: '2rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
        <ShieldAlert size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
        <h2 style={{ color: '#0f2920', fontSize: '1.4rem', fontWeight: 900 }}>Access Denied</h2>
        <p style={{ color: '#64748b', maxWidth: '400px', margin: '0.5rem auto' }}>
          Transportation Reporting & Analytics is restricted to Transport Managers and Corporate Administrators.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 900, color: '#0f2920', margin: 0, display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <BarChart3 size={28} color="#059669" />
            <span>Transportation Reports & Analytics</span>
          </h1>
          <p style={{ color: '#64748b', margin: '0.35rem 0 0', fontSize: '0.9rem', fontWeight: 500 }}>
            Executive KPIs, fleet utilization, transit demand, driver performance, and operational insights.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleExportCsv}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: '#ffffff',
              border: '1.5px solid #e2e8f0',
              color: '#0f2920',
              padding: '0.6rem 1.1rem',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            }}
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={fetchAllAnalytics}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: 'linear-gradient(180deg, #184738 0%, #103327 100%)',
              color: '#ffffff',
              border: 'none',
              padding: '0.6rem 1.1rem',
              borderRadius: '10px',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(19, 56, 44, 0.25)',
            }}
          >
            <RefreshCw size={15} className={loading ? 'spin-animation' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', color: '#ef4444', padding: '1rem 1.25rem', borderRadius: '12px', fontWeight: 700 }}>
          ⚠️ {error}
        </div>
      )}

      {/* FILTER BAR */}
      <div
        style={{
          background: '#ffffff',
          border: '1.5px solid #e2e8f0',
          borderRadius: '16px',
          padding: '1.1rem 1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 800 }}>Period:</span>
          {['today', '7d', '30d', '90d'].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => handlePresetChange(p)}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.825rem',
                fontWeight: 800,
                cursor: 'pointer',
                background: dateRangePreset === p ? 'linear-gradient(180deg, #184738 0%, #103327 100%)' : '#f8faf9',
                color: dateRangePreset === p ? '#ffffff' : '#0f2920',
                border: dateRangePreset === p ? 'none' : '1.5px solid #e2e8f0',
              }}
            >
              {p === 'today' ? 'Today' : `Last ${p.replace('d', ' Days')}`}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.825rem', color: '#64748b', fontWeight: 700 }}>From:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setDateRangePreset('custom'); }}
              style={{
                padding: '0.45rem 0.75rem',
                fontSize: '0.85rem',
                background: '#ffffff',
                border: '1.5px solid #e2e8f0',
                borderRadius: '8px',
                color: '#0f172a',
                outline: 'none',
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.825rem', color: '#64748b', fontWeight: 700 }}>To:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setDateRangePreset('custom'); }}
              style={{
                padding: '0.45rem 0.75rem',
                fontSize: '0.85rem',
                background: '#ffffff',
                border: '1.5px solid #e2e8f0',
                borderRadius: '8px',
                color: '#0f172a',
                outline: 'none',
              }}
            />
          </div>
        </div>
      </div>

      {/* EXECUTIVE KPI CARDS */}
      {overview && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '18px', padding: '1.25rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Total Ride Volume</span>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0f2920', margin: '0.35rem 0' }}>{overview.totalRides}</div>
            <div style={{ fontSize: '0.775rem', color: '#64748b', fontWeight: 500 }}>Requested in selected period</div>
          </div>

          <div style={{ background: '#ffffff', border: '1.5px solid #a7f3d0', borderLeft: '4px solid #059669', borderRadius: '18px', padding: '1.25rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
            <span style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 800, textTransform: 'uppercase' }}>Completion Rate</span>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#059669', margin: '0.35rem 0' }}>{overview.completionRate}%</div>
            <div style={{ fontSize: '0.775rem', color: '#64748b', fontWeight: 500 }}>{overview.completedRides} trips completed</div>
          </div>

          <div style={{ background: '#ffffff', border: '1.5px solid #fecaca', borderLeft: '4px solid #ef4444', borderRadius: '18px', padding: '1.25rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
            <span style={{ fontSize: '0.78rem', color: '#ef4444', fontWeight: 800, textTransform: 'uppercase' }}>Cancellation Rate</span>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#ef4444', margin: '0.35rem 0' }}>{overview.cancellationRate}%</div>
            <div style={{ fontSize: '0.775rem', color: '#64748b', fontWeight: 500 }}>{overview.cancelledRides} trips cancelled</div>
          </div>

          <div style={{ background: '#ffffff', border: '1.5px solid #bfdbfe', borderLeft: '4px solid #2563eb', borderRadius: '18px', padding: '1.25rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
            <span style={{ fontSize: '0.78rem', color: '#2563eb', fontWeight: 800, textTransform: 'uppercase' }}>Avg Scheduling Lead Time</span>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0f2920', margin: '0.35rem 0' }}>{overview.averageSchedulingLeadTimeHours}h</div>
            <div style={{ fontSize: '0.775rem', color: '#64748b', fontWeight: 500 }}>Lead hours before departure</div>
          </div>

          <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '18px', padding: '1.25rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Active Fleet Capacity</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f2920', margin: '0.35rem 0' }}>
              {overview.totalActiveDrivers} <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>Drivers</span> / {overview.totalActiveVehicles} <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>Cabs</span>
            </div>
            <div style={{ fontSize: '0.775rem', color: '#64748b', fontWeight: 500 }}>{overview.totalUniquePassengers} unique passengers served</div>
          </div>
        </div>
      )}

      {/* TABS NAVIGATION */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1.5px solid #e2e8f0', overflowX: 'auto', paddingBottom: '0.75rem' }}>
        {[
          { id: 'overview', label: 'Ride Trends & Status', icon: BarChart3 },
          { id: 'insights', label: 'Intelligent Insights', icon: Sparkles },
          { id: 'drivers', label: 'Driver Performance', icon: Users },
          { id: 'vehicles', label: 'Vehicle Utilization', icon: Car },
          { id: 'routes', label: 'Top Transit Routes', icon: MapPin },
          { id: 'capacity', label: 'Peak Surge & Capacity', icon: Clock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.6rem 1.1rem',
                borderRadius: '10px',
                fontSize: '0.85rem',
                fontWeight: 800,
                cursor: 'pointer',
                background: isActive ? 'linear-gradient(180deg, #184738 0%, #103327 100%)' : '#ffffff',
                color: isActive ? '#ffffff' : '#0f2920',
                border: isActive ? 'none' : '1.5px solid #e2e8f0',
                boxShadow: isActive ? '0 4px 15px rgba(19, 56, 44, 0.25)' : 'none',
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: OVERVIEW & TRENDS */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '20px', padding: '1.75rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f2920', margin: '0 0 1.25rem 0' }}>
              Daily Ride Booking & Fulfillment Trend
            </h3>
            {rideTrends.length === 0 ? (
              <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>No trend data for the selected range.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {rideTrends.map((t) => (
                  <div key={t.date} style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.85rem' }}>
                    <div style={{ width: '130px', color: '#0f2920', fontWeight: 700 }}>
                      {t.date} ({t.dayOfWeek})
                    </div>
                    <div style={{ flex: 1, display: 'flex', height: '24px', borderRadius: '6px', overflow: 'hidden', background: '#f1f5f9' }}>
                      {t.completed > 0 && (
                        <div
                          style={{
                            width: `${(t.completed / Math.max(1, t.totalRequested)) * 100}%`,
                            background: '#059669',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                          }}
                          title={`${t.completed} Completed`}
                        >
                          {t.completed}
                        </div>
                      )}
                      {t.scheduled > 0 && (
                        <div
                          style={{
                            width: `${(t.scheduled / Math.max(1, t.totalRequested)) * 100}%`,
                            background: '#2563eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                          }}
                          title={`${t.scheduled} Scheduled`}
                        >
                          {t.scheduled}
                        </div>
                      )}
                      {t.cancelled > 0 && (
                        <div
                          style={{
                            width: `${(t.cancelled / Math.max(1, t.totalRequested)) * 100}%`,
                            background: '#ef4444',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                          }}
                          title={`${t.cancelled} Cancelled`}
                        >
                          {t.cancelled}
                        </div>
                      )}
                    </div>
                    <div style={{ width: '90px', textAlign: 'right', fontWeight: 900, color: '#0f2920' }}>
                      {t.totalRequested} total
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: INTELLIGENT INSIGHTS */}
      {activeTab === 'insights' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
          {insights.map((ins, i) => (
            <div
              key={i}
              style={{
                background: '#ffffff',
                border: '1.5px solid #e2e8f0',
                borderLeft: `5px solid ${ins.severity === 'CRITICAL' ? '#ef4444' : ins.severity === 'WARNING' ? '#f59e0b' : ins.severity === 'SUCCESS' ? '#059669' : '#2563eb'}`,
                borderRadius: '18px',
                padding: '1.5rem',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                  {ins.category}
                </span>
                <span
                  style={{
                    background: '#f8faf9',
                    border: '1px solid #e2e8f0',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    color: '#0f2920',
                  }}
                >
                  {ins.metricHighlight}
                </span>
              </div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f2920', margin: '0 0 0.35rem 0' }}>
                {ins.title}
              </h4>
              <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0, lineHeight: 1.5, fontWeight: 500 }}>
                {ins.message}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* TAB CONTENT: DRIVERS */}
      {activeTab === 'drivers' && (
        <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '20px', padding: '1.75rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)', overflowX: 'auto' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f2920', margin: '0 0 1.25rem 0' }}>
            Driver Performance & Trip Fulfillment
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1.5px solid #e2e8f0', background: '#f8faf9' }}>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' }}>Driver Name</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' }}>Status</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' }}>Assigned Trips</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' }}>Completed</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' }}>Cancelled</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' }}>Completion Rate</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' }}>Relative Utilization</th>
              </tr>
            </thead>
            <tbody>
              {driverStats.map((d) => (
                <tr key={d.driverId} style={{ borderBottom: '1.5px solid #f1f5f9' }}>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#0f2920' }}>{d.driverName}</td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span style={{ color: d.driverStatus === 'ACTIVE' ? '#059669' : '#ef4444', fontWeight: 800, background: d.driverStatus === 'ACTIVE' ? '#ecfdf5' : '#fef2f2', padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.75rem' }}>
                      {d.driverStatus}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#0f2920' }}>{d.totalAssignedTrips}</td>
                  <td style={{ padding: '0.85rem 1rem', color: '#059669', fontWeight: 800 }}>{d.completedTrips}</td>
                  <td style={{ padding: '0.85rem 1rem', color: '#ef4444', fontWeight: 800 }}>{d.cancelledTrips}</td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 900, color: '#0f2920' }}>{d.completionRate}%</td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ width: '100px', background: '#f1f5f9', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${d.utilizationPercentage}%`, background: '#2563eb', height: '100%' }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB CONTENT: VEHICLES */}
      {activeTab === 'vehicles' && (
        <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '20px', padding: '1.75rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)', overflowX: 'auto' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f2920', margin: '0 0 1.25rem 0' }}>
            Fleet Vehicle Utilization & Capacity
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1.5px solid #e2e8f0', background: '#f8faf9' }}>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' }}>Vehicle Reg</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' }}>Type</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' }}>Make / Model</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' }}>Seats</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' }}>Status</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' }}>Assigned Trips</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' }}>Completed</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' }}>Utilization</th>
              </tr>
            </thead>
            <tbody>
              {vehicleStats.map((v) => (
                <tr key={v.vehicleId} style={{ borderBottom: '1.5px solid #f1f5f9' }}>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 900, color: '#2563eb' }}>{v.registrationNumber}</td>
                  <td style={{ padding: '0.85rem 1rem', color: '#0f2920', fontWeight: 600 }}>{v.vehicleType}</td>
                  <td style={{ padding: '0.85rem 1rem', color: '#0f2920', fontWeight: 700 }}>{v.makeModel}</td>
                  <td style={{ padding: '0.85rem 1rem', color: '#64748b', fontWeight: 600 }}>{v.seatingCapacity} seats</td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span style={{ color: v.vehicleStatus === 'ACTIVE' ? '#059669' : '#ef4444', fontWeight: 800, background: v.vehicleStatus === 'ACTIVE' ? '#ecfdf5' : '#fef2f2', padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.75rem' }}>
                      {v.vehicleStatus}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#0f2920' }}>{v.totalAssignedTrips}</td>
                  <td style={{ padding: '0.85rem 1rem', color: '#059669', fontWeight: 800 }}>{v.completedTrips}</td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ width: '100px', background: '#f1f5f9', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${v.utilizationPercentage}%`, background: '#059669', height: '100%' }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB CONTENT: ROUTES */}
      {activeTab === 'routes' && (
        <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '20px', padding: '1.75rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)', overflowX: 'auto' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f2920', margin: '0 0 1.25rem 0' }}>
            High-Frequency Transit Routes
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1.5px solid #e2e8f0', background: '#f8faf9' }}>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' }}>Transit Corridor</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' }}>Total Requests</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' }}>Completed</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' }}>Cancelled</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' }}>Demand Share</th>
              </tr>
            </thead>
            <tbody>
              {routeStats.map((r, i) => (
                <tr key={i} style={{ borderBottom: '1.5px solid #f1f5f9' }}>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#0f2920' }}>{r.routeName}</td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#0f2920' }}>{r.totalRequests}</td>
                  <td style={{ padding: '0.85rem 1rem', color: '#059669', fontWeight: 800 }}>{r.completedRides}</td>
                  <td style={{ padding: '0.85rem 1rem', color: '#ef4444', fontWeight: 800 }}>{r.cancelledRides}</td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 900, color: '#2563eb' }}>{r.demandPercentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB CONTENT: CAPACITY & PEAK HOURS */}
      {activeTab === 'capacity' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '20px', padding: '1.75rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f2920', margin: '0 0 1.25rem 0' }}>
              Hourly Transit Demand & Surge Analysis
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.75rem' }}>
              {peakHours.map((ph) => {
                const isSurge = ph.demandLevel === 'SURGE';
                const isHigh = ph.demandLevel === 'HIGH_DEMAND';
                const bg = isSurge ? '#fef2f2' : isHigh ? '#fffbeb' : '#f8faf9';
                const border = isSurge ? '#fecaca' : isHigh ? '#fde68a' : '#e2e8f0';

                return (
                  <div
                    key={ph.hour}
                    style={{
                      background: bg,
                      border: `1.5px solid ${border}`,
                      borderRadius: '12px',
                      padding: '0.85rem',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, marginBottom: '0.2rem' }}>{ph.timeSlotLabel}</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f2920' }}>{ph.rideCount}</div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: isSurge ? '#ef4444' : isHigh ? '#d97706' : '#64748b', marginTop: '0.25rem' }}>
                      {ph.demandLevel}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '20px', padding: '1.75rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f2920', margin: '0 0 1.25rem 0' }}>
              Fleet Seating Capacity vs Demand Balance
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {capacityStats.filter(c => c.requestedRides > 0).map((c) => (
                <div key={c.hour} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1.5px solid #f1f5f9', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ width: '130px', fontWeight: 800, color: '#0f2920' }}>{c.timeSlotLabel}</div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Demand: <b style={{ color: '#0f2920' }}>{c.requestedRides}</b> rides</span>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Fleet Capacity: <b style={{ color: '#059669' }}>{c.availableFleetSeats}</b> seats</span>
                  </div>
                  <div>
                    <span
                      style={{
                        background: c.capacityStatus === 'CAPACITY_RISK' ? '#fef2f2' : '#ecfdf5',
                        color: c.capacityStatus === 'CAPACITY_RISK' ? '#ef4444' : '#059669',
                        border: `1px solid ${c.capacityStatus === 'CAPACITY_RISK' ? '#fecaca' : '#a7f3d0'}`,
                        padding: '0.25rem 0.65rem',
                        borderRadius: '6px',
                        fontSize: '0.775rem',
                        fontWeight: 800,
                      }}
                    >
                      {c.capacityStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportingAnalyticsPage;
