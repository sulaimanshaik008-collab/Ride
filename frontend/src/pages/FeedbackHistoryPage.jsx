import React, { useState, useEffect } from 'react';
import { Star, Clock, Car, User, RefreshCw, CheckCircle2 } from 'lucide-react';
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
      <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
        <RefreshCw size={32} className="spin-animation" style={{ margin: '0 auto 1rem', color: '#059669' }} />
        <p style={{ color: '#64748b', fontWeight: 600 }}>Loading your feedback history...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem 0', maxWidth: '900px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 900, color: '#0f2920', margin: 0, display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <Star size={28} color="#d97706" />
          <span>My Ride Ratings & Feedback</span>
        </h1>
        <p style={{ color: '#64748b', margin: '0.35rem 0 0', fontSize: '0.9rem', fontWeight: 500 }}>
          Historical ratings and comments submitted for completed corporate journeys ({feedbackList.length} reviews)
        </p>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', color: '#ef4444', padding: '1rem 1.25rem', borderRadius: '12px', marginBottom: '1.5rem', fontWeight: 700 }}>
          ⚠️ {error}
        </div>
      )}

      {feedbackList.length === 0 ? (
        <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '20px', padding: '4rem 2rem', textAlign: 'center', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⭐</div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0f2920', marginBottom: '0.5rem' }}>No Feedback Submitted Yet</h3>
          <p style={{ color: '#64748b', maxWidth: '440px', margin: '0 auto', fontSize: '0.9rem', lineHeight: 1.5 }}>
            After you complete a corporate ride booking, you can submit star ratings and performance notes directly from your My Bookings dashboard.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {feedbackList.map((f) => (
            <div
              key={f.id}
              style={{
                background: '#ffffff',
                border: '1.5px solid #e2e8f0',
                borderRadius: '18px',
                padding: '1.5rem',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span style={{ fontWeight: 900, fontSize: '1.1rem', color: '#0f2920' }}>{f.bookingReference}</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '0.2rem 0.55rem', borderRadius: '6px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
                      {f.bookingDate}
                    </span>
                  </div>
                  <div style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem', fontWeight: 600 }}>
                    {f.pickupLocation} → {f.destination}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <FeedbackRating value={f.rating} readOnly size={20} />
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      padding: '0.25rem 0.65rem',
                      borderRadius: '6px',
                      background: f.reviewStatus === 'NORMAL' ? '#ecfdf5' : f.reviewStatus === 'NEEDS_REVIEW' ? '#fffbeb' : '#eff6ff',
                      color: f.reviewStatus === 'NORMAL' ? '#059669' : f.reviewStatus === 'NEEDS_REVIEW' ? '#d97706' : '#2563eb',
                      border: `1px solid ${f.reviewStatus === 'NORMAL' ? '#a7f3d0' : f.reviewStatus === 'NEEDS_REVIEW' ? '#fde68a' : '#bfdbfe'}`,
                    }}
                  >
                    {f.reviewStatus}
                  </span>
                </div>
              </div>

              {f.comments && (
                <div
                  style={{
                    background: '#f8faf9',
                    border: '1.5px solid #e2e8f0',
                    padding: '1rem',
                    borderRadius: '10px',
                    fontSize: '0.9rem',
                    color: '#0f172a',
                    marginBottom: '0.85rem',
                    fontStyle: 'italic',
                    fontWeight: 500,
                  }}
                >
                  "{f.comments}"
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.825rem', color: '#64748b', borderTop: '1.5px solid #f1f5f9', paddingTop: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  Driver: <strong style={{ color: '#0f2920' }}>{f.driverName}</strong> &bull; Cab: <strong style={{ color: '#2563eb' }}>{f.vehicleRegistrationNumber}</strong>
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
