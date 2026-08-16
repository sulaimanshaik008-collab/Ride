import React, { useState, useEffect } from 'react';
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Transportation Quality & Ratings</h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
            Monitor passenger satisfaction, resolve service complaints, and inspect Anti-Gravity quality patterns
          </p>
        </div>
      </div>

      {message.text && (
        <div className="card" style={{
          marginBottom: '1.5rem',
          borderColor: message.type === 'success' ? 'var(--success)' : 'var(--danger)',
          background: message.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'
        }}>
          <p style={{ color: message.type === 'success' ? 'var(--success)' : 'var(--danger)', margin: 0 }}>
            {message.type === 'success' ? '✓' : '⚠️'} {message.text}
          </p>
        </div>
      )}

      {/* KPI Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>Average Fleet Rating</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
            {summary?.averageRating || 0} <span style={{ fontSize: '1.25rem' }}>★</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Based on {summary?.totalFeedback || 0} verified rides
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>Total Reviews</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-light)', marginTop: '0.25rem' }}>
            {summary?.totalFeedback || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {summary?.fiveStarCount || 0} five-star journeys
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>Low Ratings (≤2★)</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: (summary?.oneStarCount + summary?.twoStarCount) > 0 ? 'var(--danger)' : 'var(--success)', marginTop: '0.25rem' }}>
            {(summary?.oneStarCount || 0) + (summary?.twoStarCount || 0)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {summary?.needsReviewCount || 0} flagged for review
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>Manager Resolutions</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--success)', marginTop: '0.25rem' }}>
            {summary?.reviewedCount || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {summary?.escalatedCount || 0} escalated actions
          </div>
        </div>
      </div>

      {/* Anti-Gravity Intelligent Quality Insights */}
      {intelligence && (
        (intelligence.driverPerformanceAlerts?.length > 0 ||
         intelligence.vehicleInspectionAlerts?.length > 0 ||
         intelligence.routeQualityAlerts?.length > 0) && (
          <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem', borderColor: 'rgba(234, 179, 8, 0.4)', background: 'rgba(234, 179, 8, 0.05)' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', color: '#facc15', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              ⚡ Anti-Gravity Service Quality Signals
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
              {intelligence.driverPerformanceAlerts?.map((d) => (
                <div key={d.driverId} style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid var(--warning)' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Driver Alert: {d.driverName}</div>
                  <div style={{ fontSize: '0.8125rem', color: '#fbbf24', marginTop: '0.25rem' }}>
                    Rating: {d.averageRating}★ &bull; {d.lowRatingCount} low ratings
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.5rem 0 0' }}>{d.recommendation}</p>
                </div>
              ))}

              {intelligence.vehicleInspectionAlerts?.map((v) => (
                <div key={v.vehicleId} style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #38bdf8' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Vehicle Inspection: {v.registrationNumber}</div>
                  <div style={{ fontSize: '0.8125rem', color: '#38bdf8', marginTop: '0.25rem' }}>
                    Rating: {v.averageRating}★ &bull; {v.complaintCount} ride reviews
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.5rem 0 0' }}>{v.recommendation}</p>
                </div>
              ))}

              {intelligence.routeQualityAlerts?.map((r, idx) => (
                <div key={idx} style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #a855f7' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Route Review: {r.pickupLocation} → {r.destination}</div>
                  <div style={{ fontSize: '0.8125rem', color: '#a855f7', marginTop: '0.25rem' }}>
                    Rating: {r.averageRating}★ &bull; {r.tripCount} reviews
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.5rem 0 0' }}>{r.recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {/* Filter & Search Bar */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <div style={{ flex: '1 1 200px' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search comments, passenger, booking reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ width: '160px' }}>
            <select className="form-control" value={filterRating} onChange={(e) => setFilterRating(e.target.value)}>
              <option value="">All Star Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>

          <div style={{ width: '180px' }}>
            <select className="form-control" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">All Review Statuses</option>
              <option value="NORMAL">Normal</option>
              <option value="NEEDS_REVIEW">Needs Review</option>
              <option value="REVIEWED">Reviewed</option>
              <option value="ESCALATED">Escalated</option>
            </select>
          </div>

          <button type="submit" className="btn btn-secondary">
            Search
          </button>
        </form>
      </div>

      {/* Feedback Records Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
            <p style={{ color: 'var(--text-muted)' }}>Loading feedback...</p>
          </div>
        ) : feedbackPage.content.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No feedback records match the current filters.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '0.875rem 1.25rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>RIDE & PASSENGER</th>
                  <th style={{ padding: '0.875rem 1.25rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>DRIVER & VEHICLE</th>
                  <th style={{ padding: '0.875rem 1.25rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>RATING</th>
                  <th style={{ padding: '0.875rem 1.25rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>COMMENTS</th>
                  <th style={{ padding: '0.875rem 1.25rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>STATUS & ACTION</th>
                </tr>
              </thead>
              <tbody>
                {feedbackPage.content.map((f) => (
                  <tr key={f.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ fontWeight: 600 }}>{f.bookingReference}</div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{f.employeeName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{f.pickupLocation} → {f.destination}</div>
                    </td>

                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ fontWeight: 500 }}>{f.driverName}</div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{f.vehicleRegistrationNumber} ({f.vehicleMakeModel})</div>
                    </td>

                    <td style={{ padding: '1rem 1.25rem' }}>
                      <FeedbackRating value={f.rating} readOnly size={18} />
                    </td>

                    <td style={{ padding: '1rem 1.25rem', maxWidth: '300px' }}>
                      {f.comments ? (
                        <div style={{ fontSize: '0.875rem', color: '#e5e7eb' }}>"{f.comments}"</div>
                      ) : (
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No written comment</span>
                      )}
                    </td>

                    <td style={{ padding: '1rem 1.25rem' }}>
                      <select
                        className="form-control"
                        style={{ padding: '0.35rem 0.5rem', fontSize: '0.8125rem', width: 'auto' }}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderTop: '1px solid var(--border)' }}>
            <button
              className="btn btn-secondary"
              disabled={currentPage === 0}
              onClick={() => loadData(currentPage - 1)}
            >
              Previous
            </button>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Page {currentPage + 1} of {feedbackPage.totalPages}
            </span>
            <button
              className="btn btn-secondary"
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
