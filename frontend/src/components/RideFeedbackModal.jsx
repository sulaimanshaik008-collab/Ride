import React, { useState } from 'react';
import { FeedbackRating } from './FeedbackRating';
import { feedbackService } from '../services/feedbackService';

export const RideFeedbackModal = ({ ride, onClose, onSuccess }) => {
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating || rating < 1 || rating > 5) {
      setError('Please select a star rating between 1 and 5');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await feedbackService.submitFeedback({
        rideId: ride.id,
        rating,
        comments: comments.trim(),
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem'
    }}>
      <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🚗 ⭐</div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0 }}>How was your ride?</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            {ride.bookingReference} &bull; {ride.pickupLocation} → {ride.destination}
          </p>
        </div>

        {error && (
          <div className="card" style={{ marginBottom: '1.25rem', borderColor: 'var(--danger)', background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem 1rem' }}>
            <p style={{ color: 'var(--danger)', margin: 0, fontSize: '0.875rem' }}>⚠️ {error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Your Overall Rating *</label>
            <FeedbackRating value={rating} onChange={setRating} size={36} />
            <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: rating <= 2 ? 'var(--warning)' : '#fbbf24' }}>
              {rating === 5 && 'Outstanding Experience (5/5)'}
              {rating === 4 && 'Good Ride (4/5)'}
              {rating === 3 && 'Average / Neutral (3/5)'}
              {rating === 2 && 'Below Standard (2/5)'}
              {rating === 1 && 'Poor Experience (1/5)'}
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Tell us about your experience (Optional)</label>
            <textarea
              className="form-control"
              rows={4}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="e.g. Driver was punctual, vehicle was clean, smooth route..."
              maxLength={1000}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
