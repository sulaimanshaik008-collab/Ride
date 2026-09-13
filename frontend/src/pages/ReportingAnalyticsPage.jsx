import React, { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, Users, Car, MapPin, Clock, 
  Download, Calendar, AlertCircle, CheckCircle2, ShieldAlert, Sparkles, RefreshCw, ChevronDown, CreditCard, DollarSign, FileText, CheckCheck, ShieldCheck
} from 'lucide-react';
import { analyticsService } from '../services/analyticsService';
import { driverService } from '../services/driverService';
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
  const [activeTab, setActiveTab] = useState('overview'); // overview, payouts, drivers, vehicles, routes, capacity, insights

  // Data states
  const [overview, setOverview] = useState(null);
  const [rideTrends, setRideTrends] = useState([]);
  const [driverStats, setDriverStats] = useState([]);
  const [vehicleStats, setVehicleStats] = useState([]);
  const [routeStats, setRouteStats] = useState([]);
  const [peakHours, setPeakHours] = useState([]);
  const [capacityStats, setCapacityStats] = useState([]);
  const [insights, setInsights] = useState([]);
  const [monthlyPayouts, setMonthlyPayouts] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutSuccessMsg, setPayoutSuccessMsg] = useState('');
  const [companyVerifiedMonths, setCompanyVerifiedMonths] = useState({});
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

  const fetchMonthlyPayouts = async (month) => {
    try {
      setPayoutLoading(true);
      const data = await driverService.getMonthlyPayouts(month || selectedMonth);
      setMonthlyPayouts(data || []);
    } catch (err) {
      console.error('Failed to load monthly payouts:', err);
    } finally {
      setPayoutLoading(false);
    }
  };

  const handleProcessPayout = async (driverId, amount) => {
    try {
      setPayoutLoading(true);
      setPayoutSuccessMsg('');
      const ref = 'TXN-' + Math.random().toString(36).substring(2, 9).toUpperCase();
      await driverService.processDriverPayout(driverId, {
        month: selectedMonth,
        amount: amount,
        paymentReference: ref,
        notes: `End-of-month driver settlement for ${selectedMonth}`
      });
      setPayoutSuccessMsg(`Successfully credited ₹${amount.toLocaleString()} to driver account (Ref: ${ref})`);
      fetchMonthlyPayouts(selectedMonth);
    } catch (err) {
      setError(err.message || 'Failed to process driver payout');
    } finally {
      setPayoutLoading(false);
    }
  };

  const handleVerifyCompanyMonthlyReport = () => {
    setCompanyVerifiedMonths((prev) => ({
      ...prev,
      [selectedMonth]: {
        verifiedAt: new Date().toLocaleString(),
        verifiedBy: currentUser?.fullName || 'Transport Manager',
      },
    }));
    setPayoutSuccessMsg(`Company Monthly Settlement for ${selectedMonth} has been officially VERIFIED and audited.`);
  };

  const handleDownloadCompanyReport = () => {
    if (!monthlyPayouts || monthlyPayouts.length === 0) {
      alert('No driver payout records found for ' + selectedMonth);
      return;
    }

    const headers = [
      'Driver Name',
      'Driving License',
      'Vehicle Plate Number',
      'Vehicle Model',
      'Completed Rides',
      'Total Earnings (INR)',
      'Settlement Status',
      'Payment Reference',
      'Paid At',
      'Bank Account Number',
      'Bank IFSC Code',
      'UPI ID',
      'Settlement Month',
      'Company Verification'
    ];

    const isVerified = companyVerifiedMonths[selectedMonth];
    const verificationText = isVerified 
      ? `VERIFIED by ${isVerified.verifiedBy} on ${isVerified.verifiedAt}`
      : 'PENDING COMPANY VERIFICATION';

    const rows = monthlyPayouts.map((p) => [
      `"${(p.driverName || '').replace(/"/g, '""')}"`,
      `"${(p.licenseNumber || 'N/A').replace(/"/g, '""')}"`,
      `"${(p.vehiclePlateNumber || 'Not Assigned').replace(/"/g, '""')}"`,
      `"${(p.vehicleModel || '').replace(/"/g, '""')}"`,
      p.totalRides || 0,
      p.totalEarnings || 0,
      `"${p.paymentStatus === 'PAID' ? 'PAID' : 'PENDING'}"`,
      `"${(p.paymentReference || 'N/A').replace(/"/g, '""')}"`,
      `"${(p.paidAt || 'N/A').replace(/"/g, '""')}"`,
      `"${(p.bankAccountNumber || 'N/A').replace(/"/g, '""')}"`,
      `"${(p.bankIfscCode || 'N/A').replace(/"/g, '""')}"`,
      `"${(p.upiId || 'N/A').replace(/"/g, '""')}"`,
      `"${selectedMonth}"`,
      `"${verificationText}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `company_driver_payout_report_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadDriverStatement = (p) => {
    const isVerified = companyVerifiedMonths[selectedMonth];
    const verificationText = isVerified 
      ? `VERIFIED & APPROVED (${isVerified.verifiedBy} at ${isVerified.verifiedAt})`
      : 'PENDING CORPORATE AUDIT';

    const lines = [
      `"CORPORATE RIDE DISPATCH - INDIVIDUAL DRIVER MONTHLY STATEMENT"`,
      `"Generated At","${new Date().toLocaleString()}"`,
      `"Billing Period","${selectedMonth}"`,
      `"Company Verification Status","${verificationText}"`,
      `""`,
      `"DRIVER INFORMATION"`,
      `"Driver Name","${(p.driverName || '').replace(/"/g, '""')}"`,
      `"License Number","${(p.licenseNumber || 'N/A').replace(/"/g, '""')}"`,
      `"Vehicle Registration (Plate)","${(p.vehiclePlateNumber || 'Not Assigned').replace(/"/g, '""')}"`,
      `"Vehicle Model","${(p.vehicleModel || '').replace(/"/g, '""')}"`,
      `""`,
      `"SETTLEMENT & EARNINGS BREAKDOWN"`,
      `"Total Completed Rides in Month",${p.totalRides || 0}`,
      `"Gross Driver Earnings (INR)","INR ${Number(p.totalEarnings || 0).toLocaleString()}"`,
      `"Payment Status","${p.paymentStatus === 'PAID' ? 'PAID & CREDITED' : 'PENDING SETTLEMENT'}"`,
      `"Payment Reference","${p.paymentReference || 'Direct Bank/UPI'}"`,
      `"Settlement Date","${p.paidAt || 'Pending'}"`,
      `""`,
      `"BANK & DISBURSEMENT DETAILS"`,
      `"Bank Account Number","${p.bankAccountNumber || 'N/A'}"`,
      `"IFSC Code","${p.bankIfscCode || 'N/A'}"`,
      `"UPI ID","${p.upiId || 'N/A'}"`,
      `""`,
      `"Corporate Transport Management Verification Seal: RideFlow Autonomous Transport System"`
    ];

    const csvContent = lines.join('\r\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeName = (p.driverName || 'driver').replace(/[^a-zA-Z0-9]/g, '_');
    link.href = url;
    link.setAttribute('download', `driver_statement_${safeName}_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (currentUser) {
      fetchAllAnalytics();
      fetchMonthlyPayouts(selectedMonth);
    }
  }, [currentUser, fromDate, toDate, selectedMonth]);

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
          { id: 'payouts', label: 'Driver Monthly Payouts', icon: CreditCard },
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

      {/* TAB CONTENT: DRIVER MONTHLY PAYOUTS & SETTLEMENT */}
      {activeTab === 'payouts' && (() => {
        const totalDriversCount = monthlyPayouts.length;
        const totalCompletedTripsSum = monthlyPayouts.reduce((sum, p) => sum + (p.totalRides || 0), 0);
        const totalGrossEarningsSum = monthlyPayouts.reduce((sum, p) => sum + (p.totalEarnings || 0), 0);
        const totalSettledAmount = monthlyPayouts.filter((p) => p.paymentStatus === 'PAID').reduce((sum, p) => sum + (p.totalEarnings || 0), 0);
        const totalPendingAmount = monthlyPayouts.filter((p) => p.paymentStatus !== 'PAID').reduce((sum, p) => sum + (p.totalEarnings || 0), 0);
        const isVerified = companyVerifiedMonths[selectedMonth];

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Month Selector Bar & Company Actions */}
            <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '18px', padding: '1.25rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <CreditCard size={24} color="#059669" />
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f2920', margin: 0 }}>
                    Monthly Driver Payouts & Corporate Verification
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    Audit completed rides, generate corporate settlement reports, and export individual driver statements.
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#334155' }}>Billing Month:</span>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  style={{ padding: '0.5rem 0.85rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.875rem', fontWeight: 700 }}
                />
                <button
                  type="button"
                  onClick={() => fetchMonthlyPayouts(selectedMonth)}
                  style={{ padding: '0.55rem 1rem', borderRadius: '8px', background: '#f1f5f9', color: '#0f2920', border: '1.5px solid #cbd5e1', fontWeight: 800, cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  Refresh
                </button>
                <button
                  type="button"
                  onClick={handleDownloadCompanyReport}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.55rem 1.1rem',
                    borderRadius: '8px',
                    background: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 800,
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    boxShadow: '0 2px 8px rgba(2, 132, 199, 0.25)',
                  }}
                >
                  <Download size={15} />
                  <span>Export Company Report (Excel/CSV)</span>
                </button>
              </div>
            </div>

            {/* COMPANY VERIFICATION & METRIC OVERVIEW BANNER */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Total Driver Partners</div>
                <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#0f2920', margin: '0.25rem 0' }}>{totalDriversCount}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Active in {selectedMonth}</div>
              </div>

              <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Total Completed Trips</div>
                <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#0f2920', margin: '0.25rem 0' }}>{totalCompletedTripsSum}</div>
                <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700 }}>100% Driver Verified</div>
              </div>

              <div style={{ background: '#ffffff', border: '1.5px solid #bbf7d0', borderLeft: '4px solid #059669', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
                <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 800, textTransform: 'uppercase' }}>Gross Driver Compensation</div>
                <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#059669', margin: '0.25rem 0' }}>₹{totalGrossEarningsSum.toLocaleString()}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>₹{totalSettledAmount.toLocaleString()} Settled &bull; ₹{totalPendingAmount.toLocaleString()} Pending</div>
              </div>

              <div style={{ background: isVerified ? '#f0fdf4' : '#fffbeb', border: `1.5px solid ${isVerified ? '#86efac' : '#fde68a'}`, borderRadius: '16px', padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: isVerified ? '#15803d' : '#b45309', fontWeight: 800, textTransform: 'uppercase' }}>
                    Corporate Audit & Verification
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: isVerified ? '#14532d' : '#92400e', marginTop: '0.25rem' }}>
                    {isVerified ? '✓ Verified & Approved' : 'Audit Verification Pending'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    {isVerified ? `By ${isVerified.verifiedBy}` : 'Submit after validating trip records'}
                  </div>
                </div>

                {!isVerified ? (
                  <button
                    type="button"
                    onClick={handleVerifyCompanyMonthlyReport}
                    style={{
                      marginTop: '0.5rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem',
                      padding: '0.45rem 0.85rem',
                      borderRadius: '8px',
                      background: 'linear-gradient(180deg, #184738 0%, #103327 100%)',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    <ShieldCheck size={14} />
                    <span>Verify & Submit Monthly Report</span>
                  </button>
                ) : (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.72rem', color: '#16a34a', fontWeight: 700 }}>
                    Official Audit Seal Applied
                  </div>
                )}
              </div>
            </div>

            {payoutSuccessMsg && (
              <div style={{ background: '#ecfdf5', border: '1.5px solid #a7f3d0', color: '#047857', padding: '0.85rem 1.25rem', borderRadius: '12px', fontSize: '0.875rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={18} />
                <span>{payoutSuccessMsg}</span>
              </div>
            )}

            {/* Payouts Table */}
            <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '20px', padding: '1.75rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 900, color: '#0f2920', margin: 0 }}>
                  Driver Compensation Breakdown for {selectedMonth}
                </h4>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  Download individual driver statement files or process batch credits
                </span>
              </div>

              {payoutLoading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                  <RefreshCw size={28} className="spin-animation" style={{ margin: '0 auto 0.75rem', color: '#059669' }} />
                  <div>Loading monthly driver payout calculations...</div>
                </div>
              ) : monthlyPayouts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                  <Users size={36} color="#94a3b8" style={{ margin: '0 auto 0.75rem' }} />
                  <div style={{ fontWeight: 800, color: '#0f2920' }}>No active driver records found for this period</div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                        <th style={{ padding: '0.75rem 1rem' }}>Driver Partner</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Vehicle & Plate</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Completed Rides</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Total Earnings</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Settlement Status</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Bank / UPI Account</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Driver Statement</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Disbursement</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyPayouts.map((p) => {
                        const isPaid = p.paymentStatus === 'PAID';
                        return (
                          <tr key={p.driverId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '1rem', fontWeight: 800, color: '#0f2920' }}>
                              <div>{p.driverName}</div>
                              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>DL: {p.licenseNumber || 'N/A'}</div>
                            </td>
                            <td style={{ padding: '1rem', color: '#334155' }}>
                              <div style={{ fontWeight: 700, fontFamily: 'monospace', letterSpacing: '0.5px' }}>{p.vehiclePlateNumber || 'Not assigned'}</div>
                              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{p.vehicleModel || ''}</div>
                            </td>
                            <td style={{ padding: '1rem', fontWeight: 800, color: '#0f2920' }}>
                              {p.totalRides} trips
                            </td>
                            <td style={{ padding: '1rem', fontWeight: 900, color: '#059669', fontSize: '1rem' }}>
                              ₹{(p.totalEarnings || 0).toLocaleString()}
                            </td>
                            <td style={{ padding: '1rem' }}>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 10px',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                background: isPaid ? '#dcfce7' : '#fef3c7',
                                color: isPaid ? '#15803d' : '#b45309',
                                border: `1px solid ${isPaid ? '#bbf7d0' : '#fde68a'}`
                              }}>
                                {isPaid ? '✓ Paid & Credited' : 'Pending Payment'}
                              </span>
                              {p.paidAt && (
                                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                                  Ref: {p.paymentReference || 'Direct'}
                                </div>
                              )}
                            </td>
                            <td style={{ padding: '1rem', fontSize: '0.8rem', color: '#475569' }}>
                              {p.bankAccountNumber ? (
                                <div>
                                  <div><strong>A/C:</strong> {p.bankAccountNumber}</div>
                                  <div><strong>IFSC:</strong> {p.bankIfscCode || 'N/A'}</div>
                                </div>
                              ) : (
                                <div>{p.upiId ? `UPI: ${p.upiId}` : 'Not linked'}</div>
                              )}
                            </td>
                            <td style={{ padding: '1rem' }}>
                              <button
                                type="button"
                                onClick={() => handleDownloadDriverStatement(p)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                  padding: '0.4rem 0.75rem',
                                  borderRadius: '6px',
                                  background: '#f8fafc',
                                  border: '1.5px solid #cbd5e1',
                                  color: '#0f172a',
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                              >
                                <FileText size={13} color="#2563eb" />
                                <span>Statement (CSV)</span>
                              </button>
                            </td>
                            <td style={{ padding: '1rem', textAlign: 'right' }}>
                              {isPaid ? (
                                <span style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 800 }}>Settled ✓</span>
                              ) : (
                                <button
                                  type="button"
                                  disabled={payoutLoading || p.totalEarnings <= 0}
                                  onClick={() => handleProcessPayout(p.driverId, p.totalEarnings)}
                                  style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '8px',
                                    background: p.totalEarnings > 0 ? 'linear-gradient(180deg, #184738 0%, #103327 100%)' : '#e2e8f0',
                                    color: p.totalEarnings > 0 ? '#ffffff' : '#94a3b8',
                                    border: 'none',
                                    fontWeight: 800,
                                    fontSize: '0.8rem',
                                    cursor: p.totalEarnings > 0 ? 'pointer' : 'not-allowed',
                                    boxShadow: p.totalEarnings > 0 ? '0 2px 10px rgba(19, 56, 44, 0.25)' : 'none'
                                  }}
                                >
                                  Credit Driver Account
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default ReportingAnalyticsPage;
