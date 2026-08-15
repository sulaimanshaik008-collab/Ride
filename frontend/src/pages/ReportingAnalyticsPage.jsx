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
      <div className="glass-card" style={{ textAlign: 'center', padding: '4rem', marginTop: '2rem' }}>
        <ShieldAlert size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
        <h2 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 700 }}>Access Denied</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0.5rem auto' }}>
          Transportation Reporting & Analytics is restricted to Transport Managers and Corporate Administrators.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* HEADER */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Transportation Reports & Analytics</h1>
          <p className="page-subtitle">
            Executive KPIs, fleet utilization, transit demand, driver performance, and AI-driven operational insights.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button onClick={handleExportCsv} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Download size={16} />
            Export CSV
          </button>
          <button onClick={fetchAllAnalytics} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* FILTER BAR */}
      <div className="glass-card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Period:</span>
          {['today', '7d', '30d', '90d'].map((p) => (
            <button
              key={p}
              onClick={() => handlePresetChange(p)}
              className={`btn ${dateRangePreset === p ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem' }}
            >
              {p === 'today' ? 'Today' : `Last ${p.replace('d', ' Days')}`}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>From:</span>
            <input
              type="date"
              className="form-control"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setDateRangePreset('custom'); }}
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.82rem' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>To:</span>
            <input
              type="date"
              className="form-control"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setDateRangePreset('custom'); }}
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.82rem' }}
            />
          </div>
        </div>
      </div>

      {/* EXECUTIVE KPI CARDS */}
      {overview && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Ride Volume</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', margin: '0.4rem 0' }}>{overview.totalRides}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Requested in selected period</div>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '3px solid #10b981' }}>
            <span style={{ fontSize: '0.82rem', color: '#10b981', fontWeight: 600 }}>Completion Rate</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981', margin: '0.4rem 0' }}>{overview.completionRate}%</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{overview.completedRides} trips completed successfully</div>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '3px solid #ef4444' }}>
            <span style={{ fontSize: '0.82rem', color: '#ef4444', fontWeight: 600 }}>Cancellation Rate</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ef4444', margin: '0.4rem 0' }}>{overview.cancellationRate}%</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{overview.cancelledRides} trips cancelled</div>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '3px solid #6366f1' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>Avg Scheduling Lead Time</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', margin: '0.4rem 0' }}>{overview.averageSchedulingLeadTimeHours}h</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Lead hours before departure</div>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Active Fleet Capacity</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', margin: '0.4rem 0' }}>
              {overview.totalActiveDrivers} <span style={{ fontSize: '1rem', color: 'var(--text-dim)', fontWeight: 400 }}>Drivers</span> / {overview.totalActiveVehicles} <span style={{ fontSize: '1rem', color: 'var(--text-dim)', fontWeight: 400 }}>Vehicles</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{overview.totalUniquePassengers} unique passengers served</div>
          </div>
        </div>
      )}

      {/* TABS NAVIGATION */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
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
              onClick={() => setActiveTab(tab.id)}
              className={`btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: OVERVIEW & TRENDS */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>
              Daily Ride Booking & Fulfillment Trend
            </h3>
            {rideTrends.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No trend data for the selected range.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {rideTrends.map((t) => (
                  <div key={t.date} style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.82rem' }}>
                    <div style={{ width: '120px', color: 'var(--text-dim)', fontWeight: 600 }}>
                      {t.date} ({t.dayOfWeek})
                    </div>
                    <div style={{ flex: 1, display: 'flex', height: '22px', borderRadius: '4px', overflow: 'hidden', background: 'rgba(255,255,255,0.04)' }}>
                      {t.completed > 0 && (
                        <div
                          style={{
                            width: `${(t.completed / Math.max(1, t.totalRequested)) * 100}%`,
                            background: '#10b981',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontSize: '0.72rem',
                            fontWeight: 700,
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
                            background: '#6366f1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontSize: '0.72rem',
                            fontWeight: 700,
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
                            fontSize: '0.72rem',
                            fontWeight: 700,
                          }}
                          title={`${t.cancelled} Cancelled`}
                        >
                          {t.cancelled}
                        </div>
                      )}
                    </div>
                    <div style={{ width: '80px', textAlign: 'right', fontWeight: 700, color: '#fff' }}>
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
              className="glass-card"
              style={{
                padding: '1.25rem',
                borderLeft: `4px solid ${ins.severity === 'CRITICAL' ? '#ef4444' : ins.severity === 'WARNING' ? '#f59e0b' : ins.severity === 'SUCCESS' ? '#10b981' : '#6366f1'}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                  {ins.category}
                </span>
                <span
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: '#fff',
                  }}
                >
                  {ins.metricHighlight}
                </span>
              </div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: '0 0 0.35rem 0' }}>
                {ins.title}
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                {ins.message}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* TAB CONTENT: DRIVERS */}
      {activeTab === 'drivers' && (
        <div className="glass-card" style={{ padding: '1.5rem', overflowX: 'auto' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>
            Driver Performance & Trip Fulfillment
          </h3>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.75rem' }}>Driver Name</th>
                <th style={{ padding: '0.75rem' }}>Status</th>
                <th style={{ padding: '0.75rem' }}>Assigned Trips</th>
                <th style={{ padding: '0.75rem' }}>Completed</th>
                <th style={{ padding: '0.75rem' }}>Cancelled</th>
                <th style={{ padding: '0.75rem' }}>Completion Rate</th>
                <th style={{ padding: '0.75rem' }}>Relative Utilization</th>
              </tr>
            </thead>
            <tbody>
              {driverStats.map((d) => (
                <tr key={d.driverId} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '0.75rem', fontWeight: 600, color: '#fff' }}>{d.driverName}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{ color: d.driverStatus === 'ACTIVE' ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                      {d.driverStatus}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem' }}>{d.totalAssignedTrips}</td>
                  <td style={{ padding: '0.75rem', color: '#10b981', fontWeight: 600 }}>{d.completedTrips}</td>
                  <td style={{ padding: '0.75rem', color: '#ef4444' }}>{d.cancelledTrips}</td>
                  <td style={{ padding: '0.75rem', fontWeight: 700 }}>{d.completionRate}%</td>
                  <td style={{ padding: '0.75rem' }}>
                    <div style={{ width: '100px', background: 'rgba(255,255,255,0.08)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${d.utilizationPercentage}%`, background: '#6366f1', height: '100%' }} />
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
        <div className="glass-card" style={{ padding: '1.5rem', overflowX: 'auto' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>
            Fleet Vehicle Utilization & Capacity
          </h3>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.75rem' }}>Vehicle Reg</th>
                <th style={{ padding: '0.75rem' }}>Type</th>
                <th style={{ padding: '0.75rem' }}>Make / Model</th>
                <th style={{ padding: '0.75rem' }}>Seats</th>
                <th style={{ padding: '0.75rem' }}>Status</th>
                <th style={{ padding: '0.75rem' }}>Assigned Trips</th>
                <th style={{ padding: '0.75rem' }}>Completed</th>
                <th style={{ padding: '0.75rem' }}>Utilization</th>
              </tr>
            </thead>
            <tbody>
              {vehicleStats.map((v) => (
                <tr key={v.vehicleId} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>{v.registrationNumber}</td>
                  <td style={{ padding: '0.75rem' }}>{v.vehicleType}</td>
                  <td style={{ padding: '0.75rem' }}>{v.makeModel}</td>
                  <td style={{ padding: '0.75rem' }}>{v.seatingCapacity} seats</td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{ color: v.vehicleStatus === 'ACTIVE' ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                      {v.vehicleStatus}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem' }}>{v.totalAssignedTrips}</td>
                  <td style={{ padding: '0.75rem', color: '#10b981' }}>{v.completedTrips}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <div style={{ width: '100px', background: 'rgba(255,255,255,0.08)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${v.utilizationPercentage}%`, background: '#10b981', height: '100%' }} />
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
        <div className="glass-card" style={{ padding: '1.5rem', overflowX: 'auto' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>
            High-Frequency Transit Routes
          </h3>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.75rem' }}>Transit Corridor</th>
                <th style={{ padding: '0.75rem' }}>Total Requests</th>
                <th style={{ padding: '0.75rem' }}>Completed</th>
                <th style={{ padding: '0.75rem' }}>Cancelled</th>
                <th style={{ padding: '0.75rem' }}>Demand Share</th>
              </tr>
            </thead>
            <tbody>
              {routeStats.map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '0.75rem', fontWeight: 700, color: '#fff' }}>{r.routeName}</td>
                  <td style={{ padding: '0.75rem' }}>{r.totalRequests}</td>
                  <td style={{ padding: '0.75rem', color: '#10b981' }}>{r.completedRides}</td>
                  <td style={{ padding: '0.75rem', color: '#ef4444' }}>{r.cancelledRides}</td>
                  <td style={{ padding: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>{r.demandPercentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB CONTENT: CAPACITY & PEAK HOURS */}
      {activeTab === 'capacity' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>
              Hourly Transit Demand & Surge Analysis
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '0.75rem' }}>
              {peakHours.map((ph) => {
                const isSurge = ph.demandLevel === 'SURGE';
                const isHigh = ph.demandLevel === 'HIGH_DEMAND';
                const bg = isSurge ? 'rgba(239, 68, 68, 0.15)' : isHigh ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255,255,255,0.03)';
                const border = isSurge ? '#ef4444' : isHigh ? '#f59e0b' : 'rgba(255,255,255,0.08)';

                return (
                  <div
                    key={ph.hour}
                    style={{
                      background: bg,
                      border: `1px solid ${border}`,
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.75rem',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.2rem' }}>{ph.timeSlotLabel}</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>{ph.rideCount}</div>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: isSurge ? '#ef4444' : isHigh ? '#f59e0b' : 'var(--text-dim)', marginTop: '0.25rem' }}>
                      {ph.demandLevel}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>
              Fleet Seating Capacity vs Demand Balance
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {capacityStats.filter(c => c.requestedRides > 0).map((c) => (
                <div key={c.hour} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ width: '120px', fontWeight: 600, color: '#fff' }}>{c.timeSlotLabel}</div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Demand: <b style={{ color: '#fff' }}>{c.requestedRides}</b> rides</span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Fleet Capacity: <b style={{ color: '#10b981' }}>{c.availableFleetSeats}</b> seats</span>
                  </div>
                  <div>
                    <span
                      style={{
                        background: c.capacityStatus === 'CAPACITY_RISK' ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)',
                        color: c.capacityStatus === 'CAPACITY_RISK' ? '#ef4444' : '#10b981',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
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
