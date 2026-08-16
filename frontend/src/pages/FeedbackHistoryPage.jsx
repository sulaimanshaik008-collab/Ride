import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { feedbackService } from '../services/feedbackService';
import { FeedbackRating } from '../components/FeedbackRating';

export default function FeedbackHistoryPage() {
  const { currentUser } = useAuth();
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadFeedback = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await feedbackService.getMyFeedbackHistory();
      setFeedbackList(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load feedback history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeedback();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '3rem 0', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
        <p style={{ color: 'var(--text-muted)' }}>Loading your feedback history...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem 0', maxWidth: '900px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>My Ride Ratings & Feedback</h1>
        <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
          Historical ratings and comments submitted for completed corporate journeys ({feedbackList.length} reviews)
        </p>
      </div>

      {error && (
        <div className="card" style={{ marginBottom: '1.5rem', borderColor: 'var(--danger)', background: 'rgba(239, 68, 68, 0.1)' }}>
          <p style={{ color: 'var(--danger)', margin: 0 }}>⚠️ {error}</p>
        </div>
      )}

      {feedbackList.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⭐</div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>No Feedback Submitted Yet</h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto' }}>
            After you complete a corporate ride booking, you can submit star ratings and performance notes directly from your My Bookings dashboard.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {feedbackList.map((f) => (
            <div key={f.id} className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>{f.bookingReference}</span>
                    <span className="badge badge-primary">{f.bookingDate}</span>
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    {f.pickupLocation} → {f.destination}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <FeedbackRating value={f.rating} readOnly size={20} />
                  <span className={`badge ${
                    f.reviewStatus === 'NORMAL' ? 'badge-success' :
                    f.reviewStatus === 'NEEDS_REVIEW' ? 'badge-warning' : 'badge-primary'
                  }`}>
                    {f.reviewStatus}
                  </span>
                </div>
              </div>

              {f.comments && (
                <div style={{
                  background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px',
                  fontSize: '0.9rem', color: '#e5e7eb', marginBottom: '0.75rem', fontStyle: 'italic'
                }}>
                  "{f.comments}"
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                <div>
                  Driver: <span style={{ color: '#f3f4f6', fontWeight: 500 }}>{f.driverName}</span> &bull; Vehicle: <span style={{ color: '#f3f4f6', fontWeight: 500 }}>{f.vehicleRegistrationNumber}</span>
                </div>
                <div>
                  Reviewed on {new Date(f.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
