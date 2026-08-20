import React, { useState, useEffect } from 'react';
import { Star, ShieldCheck, MessageSquare, AlertCircle, CheckCircle2, ArrowLeft, RefreshCw, Zap, Search, Filter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { feedbackService } from '../services/feedbackService';
import { FeedbackRating } from '../components/FeedbackRating';

export default function ManagerFeedbackPage() {
  const { currentUser } = useAuth();
  const [feedbackPage, setFeedbackPage] = useState({ content: [], totalPages: 0, totalElements: 0 });
  const [summary, setSummary] = useState(null);
  const [intelligence, setIntelligence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterRating, setFilterRating] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [message, setMessage] = useState({ type: '', text: '' });

  const loadData = async (page = 0) => {
    try {
      setLoading(true);
      const [sumData, intelData, pData] = await Promise.all([
        feedbackService.getFeedbackSummary(),
        feedbackService.getFeedbackIntelligence(),
        feedbackService.getOrganizationFeedback({
          rating: filterRating,
          reviewStatus: filterStatus,
          search: searchTerm,
          page,
          size: 10,
        }),
      ]);
      setSummary(sumData);
      setIntelligence(intelData);
      setFeedbackPage(pData);
      setCurrentPage(page);
    } catch (err) {
      setMessage({ type: 'danger', text: err.message || 'Failed to load feedback management data' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(0);
  }, [currentUser, filterRating, filterStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData(0);
  };

  const handleReviewStatusUpdate = async (id, newStatus) => {
    try {
      setMessage({ type: '', text: '' });
      await feedbackService.updateReviewStatus(id, newStatus);
      setMessage({ type: 'success', text: `Feedback #${id.substring(0, 8)} status marked as ${newStatus}` });
      loadData(currentPage);
    } catch (err) {
      setMessage({ type: 'danger', text: err.message || 'Failed to update review status' });
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 900, color: '#0f2920', margin: 0, display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Star size={28} color="#d97706" />
            <span>Transportation Quality & Ratings</span>
          </h1>
          <p style={{ color: '#64748b', margin: '0.35rem 0 0', fontSize: '0.9rem', fontWeight: 500 }}>
            Monitor passenger satisfaction, resolve service complaints, and inspect Anti-Gravity quality patterns
          </p>
        </div>
      </div>

      {message.text && (
        <div
          style={{
            marginBottom: '1.5rem',
            padding: '1rem 1.25rem',
            borderRadius: '12px',
            border: `1.5px solid ${message.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
            background: message.type === 'success' ? '#ecfdf5' : '#fef2f2',
            color: message.type === 'success' ? '#059669' : '#ef4444',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* KPI Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
        <div style={{ background: '#ffffff', border: '1.5px solid #fde68a', borderLeft: '4px solid #d97706', borderRadius: '18px', padding: '1.25rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
          <div style={{ color: '#d97706', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase' }}>Average Fleet Rating</div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#d97706', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.35rem' }}>
            {summary?.averageRating || 0} <span style={{ fontSize: '1.35rem' }}>★</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem', fontWeight: 500 }}>
            Based on {summary?.totalFeedback || 0} verified rides
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1.5px solid #bfdbfe', borderLeft: '4px solid #2563eb', borderRadius: '18px', padding: '1.25rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
          <div style={{ color: '#2563eb', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase' }}>Total Reviews</div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0f2920', marginTop: '0.35rem' }}>
            {summary?.totalFeedback || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem', fontWeight: 500 }}>
            {summary?.fiveStarCount || 0} five-star journeys
          </div>
        </div>

        <div style={{ background: '#ffffff', border: `1.5px solid ${(summary?.oneStarCount + summary?.twoStarCount) > 0 ? '#fecaca' : '#e2e8f0'}`, borderLeft: (summary?.oneStarCount + summary?.twoStarCount) > 0 ? '4px solid #ef4444' : '1.5px solid #e2e8f0', borderRadius: '18px', padding: '1.25rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
          <div style={{ color: (summary?.oneStarCount + summary?.twoStarCount) > 0 ? '#ef4444' : '#64748b', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase' }}>Low Ratings (≤2★)</div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: (summary?.oneStarCount + summary?.twoStarCount) > 0 ? '#ef4444' : '#059669', marginTop: '0.35rem' }}>
            {(summary?.oneStarCount || 0) + (summary?.twoStarCount || 0)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem', fontWeight: 500 }}>
            {summary?.needsReviewCount || 0} flagged for review
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1.5px solid #a7f3d0', borderLeft: '4px solid #059669', borderRadius: '18px', padding: '1.25rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
          <div style={{ color: '#059669', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase' }}>Manager Resolutions</div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#059669', marginTop: '0.35rem' }}>
            {summary?.reviewedCount || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem', fontWeight: 500 }}>
            {summary?.escalatedCount || 0} escalated actions
          </div>
        </div>
      </div>

      {/* Anti-Gravity Intelligent Quality Insights */}
      {intelligence && (
        (intelligence.driverPerformanceAlerts?.length > 0 ||
         intelligence.vehicleInspectionAlerts?.length > 0 ||
         intelligence.routeQualityAlerts?.length > 0) && (
          <div
            style={{
              background: '#ffffff',
              border: '1.5px solid #fde68a',
              borderRadius: '20px',
              padding: '1.5rem',
              marginBottom: '1.75rem',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
            }}
          >
            <h3 style={{ fontSize: '1.15rem', fontWeight: 900, marginBottom: '1rem', color: '#0f2920', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Zap size={20} color="#d97706" />
              <span>Service Quality Signals & Alerts</span>
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
              {intelligence.driverPerformanceAlerts?.map((d) => (
                <div key={d.driverId} style={{ background: '#fffbeb', padding: '1rem', borderRadius: '12px', borderLeft: '4px solid #d97706', border: '1px solid #fde68a' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f2920' }}>Driver Alert: {d.driverName}</div>
                  <div style={{ fontSize: '0.8125rem', color: '#d97706', marginTop: '0.25rem', fontWeight: 700 }}>
                    Rating: {d.averageRating}★ &bull; {d.lowRatingCount} low ratings
                  </div>
                  <p style={{ fontSize: '0.775rem', color: '#64748b', margin: '0.5rem 0 0', fontWeight: 500 }}>{d.recommendation}</p>
                </div>
              ))}

              {intelligence.vehicleInspectionAlerts?.map((v) => (
                <div key={v.vehicleId} style={{ background: '#eff6ff', padding: '1rem', borderRadius: '12px', borderLeft: '4px solid #2563eb', border: '1px solid #bfdbfe' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f2920' }}>Vehicle Inspection: {v.registrationNumber}</div>
                  <div style={{ fontSize: '0.8125rem', color: '#2563eb', marginTop: '0.25rem', fontWeight: 700 }}>
                    Rating: {v.averageRating}★ &bull; {v.complaintCount} ride reviews
                  </div>
                  <p style={{ fontSize: '0.775rem', color: '#64748b', margin: '0.5rem 0 0', fontWeight: 500 }}>{v.recommendation}</p>
                </div>
              ))}

              {intelligence.routeQualityAlerts?.map((r, idx) => (
                <div key={idx} style={{ background: '#faf5ff', padding: '1rem', borderRadius: '12px', borderLeft: '4px solid #9333ea', border: '1px solid #e9d5ff' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f2920' }}>Route Review: {r.pickupLocation} → {r.destination}</div>
                  <div style={{ fontSize: '0.8125rem', color: '#9333ea', marginTop: '0.25rem', fontWeight: 700 }}>
                    Rating: {r.averageRating}★ &bull; {r.tripCount} reviews
                  </div>
                  <p style={{ fontSize: '0.775rem', color: '#64748b', margin: '0.5rem 0 0', fontWeight: 500 }}>{r.recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {/* Filter & Search Bar */}
      <div
        style={{
          background: '#ffffff',
          border: '1.5px solid #e2e8f0',
          borderRadius: '16px',
          padding: '1.1rem 1.25rem',
          marginBottom: '1.5rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
        }}
      >
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <div style={{ flex: '1 1 240px', position: 'relative' }}>
            <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search comments, passenger, booking reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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

          <div style={{ width: '160px' }}>
            <select
              value={filterRating}
              onChange={(e) => setFilterRating(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem',
                background: '#ffffff',
                border: '1.5px solid #e2e8f0',
                borderRadius: '8px',
                color: '#0f172a',
                fontSize: '0.85rem',
                fontWeight: 700,
                outline: 'none',
              }}
            >
              <option value="">All Star Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>

          <div style={{ width: '180px' }}>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem',
                background: '#ffffff',
                border: '1.5px solid #e2e8f0',
                borderRadius: '8px',
                color: '#0f172a',
                fontSize: '0.85rem',
                fontWeight: 700,
                outline: 'none',
              }}
            >
              <option value="">All Review Statuses</option>
              <option value="NORMAL">Normal</option>
              <option value="NEEDS_REVIEW">Needs Review</option>
              <option value="REVIEWED">Reviewed</option>
              <option value="ESCALATED">Escalated</option>
            </select>
          </div>

          <button
            type="submit"
            style={{
              padding: '0.55rem 1.25rem',
              borderRadius: '8px',
              background: '#f8faf9',
              border: '1.5px solid #e2e8f0',
              color: '#0f2920',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            Search
          </button>
        </form>
      </div>

      {/* Feedback Records Table */}
      <div
        style={{
          background: '#ffffff',
          border: '1.5px solid #e2e8f0',
          borderRadius: '18px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center' }}>
            <RefreshCw size={28} className="spin-animation" style={{ margin: '0 auto 0.75rem', color: '#059669' }} />
            <p style={{ color: '#64748b', fontWeight: 600 }}>Loading feedback...</p>
          </div>
        ) : feedbackPage.content.length === 0 ? (
          <div style={{ padding: '4rem 1.5rem', textAlign: 'center', color: '#64748b' }}>
            <Star size={36} color="#d97706" style={{ margin: '0 auto 0.75rem' }} />
            <div style={{ fontWeight: 800, color: '#0f2920', fontSize: '1.1rem' }}>No feedback records found</div>
            <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>Try adjusting your filters or search terms.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8faf9', borderBottom: '1.5px solid #e2e8f0' }}>
                  <th style={{ padding: '0.9rem 1.25rem', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>RIDE & PASSENGER</th>
                  <th style={{ padding: '0.9rem 1.25rem', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>DRIVER & VEHICLE</th>
                  <th style={{ padding: '0.9rem 1.25rem', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>RATING</th>
                  <th style={{ padding: '0.9rem 1.25rem', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>COMMENTS</th>
                  <th style={{ padding: '0.9rem 1.25rem', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>STATUS & ACTION</th>
                </tr>
              </thead>
              <tbody>
                {feedbackPage.content.map((f) => (
                  <tr key={f.id} style={{ borderBottom: '1.5px solid #f1f5f9' }}>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ fontWeight: 900, color: '#0f2920' }}>{f.bookingReference}</div>
                      <div style={{ fontSize: '0.825rem', color: '#2563eb', fontWeight: 600 }}>{f.employeeName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>{f.pickupLocation} → {f.destination}</div>
                    </td>

                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ fontWeight: 700, color: '#0f2920' }}>{f.driverName}</div>
                      <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>{f.vehicleRegistrationNumber} ({f.vehicleMakeModel})</div>
                    </td>

                    <td style={{ padding: '1rem 1.25rem' }}>
                      <FeedbackRating value={f.rating} readOnly size={18} />
                    </td>

                    <td style={{ padding: '1rem 1.25rem', maxWidth: '300px' }}>
                      {f.comments ? (
                        <div style={{ fontSize: '0.875rem', color: '#0f172a', fontWeight: 500, fontStyle: 'italic' }}>"{f.comments}"</div>
                      ) : (
                        <span style={{ fontSize: '0.8125rem', color: '#94a3b8', fontStyle: 'italic' }}>No written comment</span>
                      )}
                    </td>

                    <td style={{ padding: '1rem 1.25rem' }}>
                      <select
                        style={{
                          padding: '0.4rem 0.65rem',
                          fontSize: '0.825rem',
                          background: '#ffffff',
                          border: '1.5px solid #e2e8f0',
                          borderRadius: '8px',
                          color: '#0f172a',
                          fontWeight: 700,
                          outline: 'none',
                        }}
                        value={f.reviewStatus}
                        onChange={(e) => handleReviewStatusUpdate(f.id, e.target.value)}
                      >
                        <option value="NORMAL">Normal</option>
                        <option value="NEEDS_REVIEW">Needs Review</option>
                        <option value="REVIEWED">Reviewed</option>
                        <option value="ESCALATED">Escalated</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {feedbackPage.totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderTop: '1.5px solid #e2e8f0', background: '#f8faf9' }}>
            <button
              type="button"
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                background: '#ffffff',
                border: '1.5px solid #e2e8f0',
                color: '#0f2920',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
                opacity: currentPage === 0 ? 0.5 : 1,
              }}
              disabled={currentPage === 0}
              onClick={() => loadData(currentPage - 1)}
            >
              Previous
            </button>
            <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 600 }}>
              Page {currentPage + 1} of {feedbackPage.totalPages}
            </span>
            <button
              type="button"
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                background: '#ffffff',
                border: '1.5px solid #e2e8f0',
                color: '#0f2920',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: currentPage >= feedbackPage.totalPages - 1 ? 'not-allowed' : 'pointer',
                opacity: currentPage >= feedbackPage.totalPages - 1 ? 0.5 : 1,
              }}
              disabled={currentPage >= feedbackPage.totalPages - 1}
              onClick={() => loadData(currentPage + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
