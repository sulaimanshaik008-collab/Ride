import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  MapPin,
  Clock,
  Car,
  User,
  CheckCircle2,
  XCircle,
  Play,
  Navigation,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Eye,
  ArrowRight,
  PhoneCall,
  Calendar,
  Layers,
  ChevronRight,
  ShieldAlert,
  Gauge,
  Compass,
  AlertCircle
} from 'lucide-react';
import { rideService } from '../../services/rideService';
import { driverService } from '../../services/driverService';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/StatusBadge';
import { MapView } from '../../components/map/MapView';

export const DriverDashboardPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [assignedRides, setAssignedRides] = useState([]);
  const [todayRides, setTodayRides] = useState([]);
  const [driverProfile, setDriverProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Reject Modal State
  const [rejectModalRide, setRejectModalRide] = useState(null);
  const [rejectReason, setRejectReason] = useState('Vehicle issue');
  const [rejectNotes, setRejectNotes] = useState('');

  // Verification Modal State
  const [verifyModalRide, setVerifyModalRide] = useState(null);
  const [verificationInput, setVerificationInput] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [verificationSuccess, setVerificationSuccess] = useState(false);

  // Complete Ride Modal
  const [completeModalRide, setCompleteModalRide] = useState(null);

  // Live GPS Telemetry for In-Progress Ride
  const [lastLocation, setLastLocation] = useState(null);
  const [geoStatus, setGeoStatus] = useState('Standby');
  const watchIdRef = useRef(null);
  const simIntervalRef = useRef(null);
  const simStepRef = useRef(0);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const [assignedData, todayData, profileData] = await Promise.all([
        rideService.getDriverAssignedTrips(),
        rideService.getDriverTodayRides(),
        driverService.getSelfDriverProfile().catch(() => null),
      ]);

      setAssignedRides(assignedData || []);
      setTodayRides(todayData || []);
      setDriverProfile(profileData);

      // Handle GPS streaming for active in-progress ride
      const activeTrip = (assignedData || []).find((r) => r.status === 'IN_PROGRESS');
      if (activeTrip) {
        if (!watchIdRef.current && !simIntervalRef.current) {
          startLocationStreaming(activeTrip);
        }
      } else {
        stopLocationStreaming();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load driver dashboard operations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [currentUser]);

  useEffect(() => {
    return () => {
      stopLocationStreaming();
    };
  }, []);

  // GPS Telemetry Streamer
  const transmitLocation = async (rideId, payload) => {
    try {
      const response = await rideService.updateLocation(rideId, payload);
      setLastLocation(response);
      setGeoStatus('Live GPS Telemetry Active');
    } catch (err) {
      console.warn('Location transmission error:', err.message);
      setGeoStatus(`Transmission Notice: ${err.message}`);
    }
  };

  const startLocationStreaming = (ride) => {
    stopLocationStreaming();
    setGeoStatus('Activating GPS Telemetry...');

    const originLat = ride.pickupLatitude || 12.9716;
    const originLng = ride.pickupLongitude || 77.5946;
    const destLat = ride.destinationLatitude || 12.9352;
    const destLng = ride.destinationLongitude || 77.6245;

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      const handlePosition = (position) => {
        const { latitude, longitude, accuracy, speed, heading } = position.coords;
        transmitLocation(ride.id, {
          latitude,
          longitude,
          accuracy: accuracy || 5.0,
          speed: speed ? Number((speed * 3.6).toFixed(1)) : 38.0,
          heading: heading || 0.0,
          recordedAt: new Date().toISOString(),
        });
      };

      const handleError = (err) => {
        console.warn('GPS browser fallback notice:', err.message);
        setGeoStatus(`GPS fallback enabled: ${err.message}`);
        startSimulatedTelemetry(ride, originLng, originLat, destLng, destLat);
      };

      navigator.geolocation.getCurrentPosition(handlePosition, handleError, {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 0,
      });

      watchIdRef.current = navigator.geolocation.watchPosition(handlePosition, handleError, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 4000,
      });
    } else {
      startSimulatedTelemetry(ride, originLng, originLat, destLng, destLat);
    }
  };

  const startSimulatedTelemetry = (ride, originLng, originLat, destLng, destLat) => {
    if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    simStepRef.current = 0;
    const totalSteps = 20;

    simIntervalRef.current = setInterval(() => {
      simStepRef.current = (simStepRef.current + 1) % totalSteps;
      const progress = simStepRef.current / totalSteps;
      const curLat = originLat + (destLat - originLat) * progress;
      const curLng = originLng + (destLng - originLng) * progress;

      transmitLocation(ride.id, {
        latitude: Number(curLat.toFixed(6)),
        longitude: Number(curLng.toFixed(6)),
        accuracy: 4.5,
        speed: 42.0,
        heading: 90.0,
        recordedAt: new Date().toISOString(),
      });
    }, 6000);
  };

  const stopLocationStreaming = () => {
    if (watchIdRef.current && typeof navigator !== 'undefined') {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }
    setGeoStatus('Standby');
  };

  // ACTION: Accept Ride
  const handleAcceptRide = async (ride) => {
    try {
      setActionLoading(true);
      setErrorMsg(null);
      await rideService.acceptRide(ride.id);
      setFeedbackMsg(`Ride #${ride.bookingReference} Accepted. Please proceed to the pickup location.`);
      await fetchDashboardData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to accept ride');
    } finally {
      setActionLoading(false);
    }
  };

  // ACTION: Reject Ride
  const handleConfirmReject = async () => {
    if (!rejectModalRide) return;
    try {
      setActionLoading(true);
      setErrorMsg(null);
      await rideService.rejectRide(rejectModalRide.id, rejectReason, rejectNotes);
      setFeedbackMsg(`Ride #${rejectModalRide.bookingReference} rejected. Transport manager has been notified.`);
      setRejectModalRide(null);
      setRejectNotes('');
      await fetchDashboardData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to reject ride');
    } finally {
      setActionLoading(false);
    }
  };

  // ACTION: Verify Employee
  const handleVerifyEmployee = async () => {
    if (!verifyModalRide || !verificationInput.trim()) {
      setVerificationError('Please enter the employee ID, email, or name to verify.');
      return;
    }
    try {
      setActionLoading(true);
      setVerificationError('');
      await rideService.verifyEmployee(verifyModalRide.id, verificationInput.trim());
      setVerificationSuccess(true);
      setTimeout(async () => {
        setVerifyModalRide(null);
        setVerificationSuccess(false);
        setVerificationInput('');
        setFeedbackMsg(`Employee verified successfully. You may now start the ride.`);
        await fetchDashboardData();
      }, 1200);
    } catch (err) {
      setVerificationError(err.message || 'Employee could not be verified. Please check info and try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // ACTION: Start Ride
  const handleStartRide = async (ride) => {
    try {
      setActionLoading(true);
      setErrorMsg(null);
      await rideService.startTrip(ride.id);
      setFeedbackMsg(`Trip Started! Real-time GPS and Google Maps tracking is live.`);
      await fetchDashboardData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to start trip');
    } finally {
      setActionLoading(false);
    }
  };

  // ACTION: Complete Ride
  const handleCompleteRide = async () => {
    if (!completeModalRide) return;
    try {
      setActionLoading(true);
      setErrorMsg(null);
      await rideService.completeTrip(completeModalRide.id);
      stopLocationStreaming();
      setFeedbackMsg(`Ride Completed Successfully! Thank you.`);
      setCompleteModalRide(null);
      await fetchDashboardData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to complete trip');
    } finally {
      setActionLoading(false);
    }
  };

  // 1. Prioritized Cards:
  // (A) In Progress Ride (Active Trip)
  const inProgressRide = assignedRides.find((r) => r.status === 'IN_PROGRESS');

  // (B) Accepted Ride (Pickup Mode / Go to pickup)
  const acceptedRide = assignedRides.find((r) => r.status === 'ASSIGNED' && r.isDriverAccepted);

  // (C) New Ride Assignment (Not yet accepted or rejected)
  const newAssignmentRide = assignedRides.find((r) => r.status === 'ASSIGNED' && !r.isDriverAccepted);

  // (D) Next upcoming rides
  const nextRides = assignedRides.filter((r) => r.id !== inProgressRide?.id && r.id !== acceptedRide?.id && r.id !== newAssignmentRide?.id);

  // Completed Today count
  const completedTodayCount = todayRides.filter((r) => r.status === 'COMPLETED').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.25s ease' }}>
      {/* Top Banner Alert Feedback */}
      {feedbackMsg && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid #10b981',
            color: '#6ee7b7',
            padding: '0.85rem 1.25rem',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <CheckCircle2 size={18} color="#10b981" />
            <span>{feedbackMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            style={{ background: 'transparent', border: 'none', color: '#6ee7b7', cursor: 'pointer', fontSize: '1rem' }}
          >
            &times;
          </button>
        </div>
      )}

      {errorMsg && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #ef4444',
            color: '#fca5a5',
            padding: '0.85rem 1.25rem',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <AlertCircle size={18} color="#ef4444" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            style={{ background: 'transparent', border: 'none', color: '#fca5a5', cursor: 'pointer', fontSize: '1rem' }}
          >
            &times;
          </button>
        </div>
      )}

      {/* 1. PRIORITY 1: NEW RIDE ASSIGNMENT CARD */}
      {newAssignmentRide && (
        <section
          style={{
            background: '#ffffff',
            border: '2px solid #f59e0b',
            borderRadius: '20px',
            padding: '1.5rem',
            boxShadow: '0 8px 30px rgba(245, 158, 11, 0.15)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: '#d97706',
                  boxShadow: '0 0 10px #d97706',
                }}
              />
              <h2 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f2920', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                New Ride Assignment
              </h2>
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#d97706', background: '#fffbeb', border: '1px solid #fde68a', padding: '0.35rem 0.85rem', borderRadius: '8px' }}>
              Ride #{newAssignmentRide.bookingReference}
            </div>
          </div>

          {/* Core Ride Info Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1rem',
              background: '#f8faf9',
              padding: '1.25rem',
              borderRadius: '14px',
              border: '1.5px solid #e2e8f0',
              marginBottom: '1.25rem',
            }}
          >
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>
                Pickup Location
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f2920', display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                <MapPin size={16} color="#059669" style={{ marginTop: '2px', flexShrink: 0 }} />
                <span>{newAssignmentRide.pickupLocation}</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>
                Destination
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f2920', display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                <MapPin size={16} color="#2563eb" style={{ marginTop: '2px', flexShrink: 0 }} />
                <span>{newAssignmentRide.destination}</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>
                Pickup Time
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Clock size={16} />
                <span>{newAssignmentRide.pickupTime?.slice(0, 5) || '08:30'} &bull; {newAssignmentRide.bookingDate}</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>
                Passenger / Employee
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f2920', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <User size={16} color="#2563eb" />
                <span>{newAssignmentRide.employeeName || 'Corporate Passenger'}</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>
                Assigned Vehicle
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f2920', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Car size={16} color="#059669" />
                <span>{newAssignmentRide.vehicleMakeModel || 'Fleet Vehicle'} ({newAssignmentRide.vehicleRegistration || 'REG-101'})</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>
                Assigned By
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#64748b' }}>
                Transport Manager ({newAssignmentRide.organizationName || 'Fleet Dept'})
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.85rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => {
                setRejectModalRide(newAssignmentRide);
                setRejectReason('Vehicle issue');
              }}
              disabled={actionLoading}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '10px',
                background: '#fef2f2',
                color: '#ef4444',
                border: '1.5px solid #fecaca',
                fontSize: '0.9rem',
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Reject Ride
            </button>

            <button
              type="button"
              onClick={() => handleAcceptRide(newAssignmentRide)}
              disabled={actionLoading}
              style={{
                padding: '0.75rem 1.75rem',
                borderRadius: '10px',
                background: 'linear-gradient(180deg, #184738 0%, #103327 100%)',
                color: '#ffffff',
                border: 'none',
                fontSize: '0.95rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 15px rgba(19, 56, 44, 0.25)',
              }}
            >
              <CheckCircle2 size={18} />
              <span>Accept Ride</span>
            </button>
          </div>
        </section>
      )}

      {/* 2. PRIORITY 2: ACTIVE IN-PROGRESS TRIP MODE (Prioritize Map & Navigation) */}
      {inProgressRide && (
        <section
          style={{
            background: '#ffffff',
            border: '2px solid #059669',
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: '0 12px 35px rgba(5, 150, 105, 0.15)',
          }}
        >
          {/* Header Bar */}
          <div
            style={{
              padding: '1rem 1.5rem',
              background: '#ecfdf5',
              borderBottom: '1.5px solid #a7f3d0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: '#059669',
                  boxShadow: '0 0 10px #059669',
                }}
              />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f2920', margin: 0, letterSpacing: '0.02em' }}>
                CURRENT ACTIVE TRIP &bull; #{inProgressRide.bookingReference}
              </h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem', borderRadius: '6px', background: '#ffffff', color: '#059669', border: '1px solid #a7f3d0', fontWeight: 800 }}>
                {geoStatus}
              </span>
              <StatusBadge status={inProgressRide.status} />
            </div>
          </div>

          {/* Interactive Google Map Panel */}
          <div style={{ height: '340px', width: '100%', position: 'relative' }}>
            <MapView
              pickupLocation={inProgressRide.pickupLocation}
              destination={inProgressRide.destination}
              pickupCoords={inProgressRide.pickupLongitude && inProgressRide.pickupLatitude ? [inProgressRide.pickupLongitude, inProgressRide.pickupLatitude] : null}
              destCoords={inProgressRide.destinationLongitude && inProgressRide.destinationLatitude ? [inProgressRide.destinationLongitude, inProgressRide.destinationLatitude] : null}
              isLive={true}
              driverLocation={lastLocation ? [lastLocation.longitude, lastLocation.latitude] : null}
            />
          </div>

          {/* Trip Telemetry & Destination Summary Bar */}
          <div style={{ padding: '1.25rem 1.5rem', background: '#f8faf9', borderTop: '1.5px solid #e2e8f0' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '1.25rem',
              }}
            >
              <div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>
                  Destination
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f2920' }}>
                  {inProgressRide.destination}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>
                  Passenger
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#2563eb' }}>
                  {inProgressRide.employeeName}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>
                  Vehicle
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f2920' }}>
                  {inProgressRide.vehicleMakeModel || 'Assigned Cab'} ({inProgressRide.vehicleRegistration})
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>
                  Employee Verified
                </div>
                <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#059669', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <ShieldCheck size={16} />
                  <span>Verified & Boarded</span>
                </div>
              </div>
            </div>

            {/* Complete Ride Trigger Button */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1rem' }}>
              <button
                type="button"
                onClick={() => setCompleteModalRide(inProgressRide)}
                disabled={actionLoading}
                style={{
                  padding: '0.85rem 2rem',
                  borderRadius: '12px',
                  background: 'linear-gradient(180deg, #184738 0%, #103327 100%)',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '1rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  boxShadow: '0 6px 20px rgba(19, 56, 44, 0.25)',
                }}
              >
                <CheckCircle2 size={20} />
                <span>Complete Ride</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 3. PRIORITY 3: ACCEPTED RIDE — PICKUP MODE & EMPLOYEE VERIFICATION */}
      {acceptedRide && !inProgressRide && (
        <section
          style={{
            background: '#ffffff',
            border: '2px solid #059669',
            borderRadius: '20px',
            padding: '1.5rem',
            boxShadow: '0 10px 30px rgba(5, 150, 105, 0.12)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: '#059669',
                  boxShadow: '0 0 10px #059669',
                }}
              />
              <h2 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f2920', margin: 0 }}>
                PROCEED TO PICKUP &bull; #{acceptedRide.bookingReference}
              </h2>
            </div>
            <span style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem', borderRadius: '8px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', fontWeight: 800 }}>
              ACCEPTED &bull; EN ROUTE TO PASSENGER
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '1.25rem',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ background: '#f8faf9', padding: '1.25rem', borderRadius: '14px', border: '1.5px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px' }}>
                Pickup Location
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f2920', display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                <MapPin size={18} color="#059669" style={{ marginTop: '2px', flexShrink: 0 }} />
                <span>{acceptedRide.pickupLocation}</span>
              </div>
              <div style={{ fontSize: '0.82rem', color: '#d97706', marginTop: '0.5rem', fontWeight: 700 }}>
                Scheduled Time: {acceptedRide.pickupTime?.slice(0, 5)}
              </div>
            </div>

            <div style={{ background: '#f8faf9', padding: '1.25rem', borderRadius: '14px', border: '1.5px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px' }}>
                Passenger Details
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f2920', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <User size={18} color="#2563eb" />
                <span>{acceptedRide.employeeName || 'Corporate Passenger'}</span>
              </div>
              <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.5rem', fontWeight: 600 }}>
                Email: {acceptedRide.employeeEmail}
              </div>
            </div>
          </div>

          {/* Verification Status & Start Ride Controls */}
          <div
            style={{
              padding: '1.25rem',
              borderRadius: '14px',
              background: acceptedRide.isEmployeeVerified ? '#ecfdf5' : '#fffbeb',
              border: `1.5px solid ${acceptedRide.isEmployeeVerified ? '#a7f3d0' : '#fde68a'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0f2920', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                {acceptedRide.isEmployeeVerified ? (
                  <>
                    <ShieldCheck size={20} color="#059669" />
                    <span style={{ color: '#059669' }}>Employee Verified ✓</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert size={20} color="#d97706" />
                    <span style={{ color: '#d97706' }}>Employee Verification Required</span>
                  </>
                )}
              </div>
              <div style={{ fontSize: '0.825rem', color: '#64748b', marginTop: '4px', fontWeight: 500 }}>
                {acceptedRide.isEmployeeVerified
                  ? 'Identity confirmed. Passenger is authorized to board. You can start the trip.'
                  : 'Verify employee corporate identity before passenger boards to unlock "Start Ride".'}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {!acceptedRide.isEmployeeVerified ? (
                <button
                  type="button"
                  onClick={() => {
                    setVerifyModalRide(acceptedRide);
                    setVerificationInput(acceptedRide.employeeEmail || '');
                    setVerificationError('');
                  }}
                  disabled={actionLoading}
                  style={{
                    padding: '0.75rem 1.5rem',
                    borderRadius: '10px',
                    background: '#f59e0b',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '0.9rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.25)',
                  }}
                >
                  <ShieldCheck size={18} />
                  <span>Verify Employee</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleStartRide(acceptedRide)}
                  disabled={actionLoading}
                  style={{
                    padding: '0.75rem 1.75rem',
                    borderRadius: '10px',
                    background: 'linear-gradient(180deg, #184738 0%, #103327 100%)',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '0.95rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 15px rgba(19, 56, 44, 0.25)',
                  }}
                >
                  <Play size={18} />
                  <span>Start Ride</span>
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 4. UPCOMING SCHEDULE & SUMMARY */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Next Assigned Rides */}
        <div
          style={{
            background: '#ffffff',
            border: '1.5px solid #e2e8f0',
            borderRadius: '18px',
            padding: '1.5rem',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f2920', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={18} color="#2563eb" />
              <span>Next Assigned Rides</span>
            </h3>
            <Link to="/driver/rides/today" style={{ fontSize: '0.825rem', color: '#059669', textDecoration: 'none', fontWeight: 800 }}>
              View Schedule &rarr;
            </Link>
          </div>

          {nextRides.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748b' }}>
              <CheckCircle2 size={32} color="#059669" style={{ margin: '0 auto 0.5rem auto' }} />
              <div style={{ fontWeight: 800, color: '#0f2920' }}>You're all caught up</div>
              <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>No further upcoming rides scheduled.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {nextRides.slice(0, 3).map((r) => (
                <div
                  key={r.id}
                  style={{
                    padding: '0.9rem 1rem',
                    borderRadius: '12px',
                    background: '#f8faf9',
                    border: '1.5px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f2920' }}>
                      {r.pickupTime?.slice(0, 5)} &bull; {r.pickupLocation} &rarr; {r.destination}
                    </div>
                    <div style={{ fontSize: '0.775rem', color: '#64748b', marginTop: '2px', fontWeight: 600 }}>
                      Passenger: {r.employeeName} &bull; #{r.bookingReference}
                    </div>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Shift Summary Cards */}
        <div
          style={{
            background: '#ffffff',
            border: '1.5px solid #e2e8f0',
            borderRadius: '18px',
            padding: '1.5rem',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f2920', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={18} color="#059669" />
              <span>Today's Shift Overview</span>
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1rem' }}>
              <div style={{ background: '#ecfdf5', padding: '1.1rem', borderRadius: '14px', border: '1.5px solid #a7f3d0' }}>
                <div style={{ fontSize: '0.72rem', color: '#059669', textTransform: 'uppercase', fontWeight: 800 }}>
                  Completed Today
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f2920', marginTop: '4px' }}>
                  {completedTodayCount}
                </div>
              </div>

              <div style={{ background: '#f8faf9', padding: '1.1rem', borderRadius: '14px', border: '1.5px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>
                  Total Today
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f2920', marginTop: '4px' }}>
                  {todayRides.length}
                </div>
              </div>
            </div>
          </div>

          <Link
            to="/driver/rides/history"
            style={{
              padding: '0.75rem',
              borderRadius: '10px',
              background: '#f8faf9',
              border: '1.5px solid #e2e8f0',
              color: '#0f2920',
              textDecoration: 'none',
              textAlign: 'center',
              fontSize: '0.85rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
            }}
          >
            <span>View Full Trip History</span>
            <ChevronRight size={16} />
          </Link>
        </div>
      </section>

      {/* MODAL: REJECT RIDE */}
      {rejectModalRide && (
        <div
          className="modal-overlay"
          onClick={() => setRejectModalRide(null)}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              border: '1.5px solid #e2e8f0',
              borderRadius: '20px',
              maxWidth: '460px',
              width: '100%',
              padding: '1.75rem',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.2)',
              color: '#0f2920',
            }}
          >
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f2920', margin: '0 0 0.5rem 0' }}>
              Reject Ride Assignment?
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem' }}>
              Please provide a reason for rejecting Ride #{rejectModalRide.bookingReference}. The Transport Manager will be notified immediately for reassignment.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
              {['Vehicle issue', 'Unable to reach pickup', 'Schedule conflict', 'Other'].map((r) => (
                <label
                  key={r}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    padding: '0.75rem 0.85rem',
                    borderRadius: '8px',
                    background: rejectReason === r ? '#fef2f2' : '#f8faf9',
                    border: `1.5px solid ${rejectReason === r ? '#ef4444' : '#e2e8f0'}`,
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    color: '#0f2920',
                  }}
                >
                  <input
                    type="radio"
                    name="rejectReason"
                    value={r}
                    checked={rejectReason === r}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>

            <textarea
              placeholder="Additional notes (optional)..."
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              rows={2}
              style={{
                width: '100%',
                background: '#ffffff',
                border: '1.5px solid #e2e8f0',
                borderRadius: '8px',
                padding: '0.65rem',
                color: '#0f172a',
                fontSize: '0.85rem',
                marginBottom: '1.25rem',
                resize: 'none',
                outline: 'none',
              }}
            />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setRejectModalRide(null)}
                style={{
                  padding: '0.65rem 1.25rem',
                  borderRadius: '8px',
                  background: '#ffffff',
                  color: '#64748b',
                  border: '1.5px solid #e2e8f0',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={actionLoading}
                style={{
                  padding: '0.65rem 1.5rem',
                  borderRadius: '8px',
                  background: 'linear-gradient(180deg, #ef4444 0%, #dc2626 100%)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)',
                }}
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EMPLOYEE VERIFICATION */}
      {verifyModalRide && (
        <div
          className="modal-overlay"
          onClick={() => setVerifyModalRide(null)}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              border: '1.5px solid #e2e8f0',
              borderRadius: '20px',
              maxWidth: '480px',
              width: '100%',
              padding: '1.75rem',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.2)',
              color: '#0f2920',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
              <ShieldCheck size={26} color="#059669" />
              <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0f2920', margin: 0 }}>
                Employee Identity Verification
              </h3>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem' }}>
              Ask the employee for their Corporate Employee ID, Name, or Email to verify they are authorized for this ride.
            </p>

            <div style={{ background: '#f8faf9', padding: '1rem', borderRadius: '12px', marginBottom: '1.25rem', border: '1.5px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>Expected Passenger</div>
              <div style={{ fontSize: '1rem', fontWeight: 900, color: '#0f2920', marginTop: '2px' }}>
                {verifyModalRide.employeeName}
              </div>
              <div style={{ fontSize: '0.825rem', color: '#2563eb', fontWeight: 600 }}>
                {verifyModalRide.employeeEmail}
              </div>
            </div>

            {verificationError && (
              <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', color: '#ef4444', padding: '0.65rem 0.85rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem', fontWeight: 700 }}>
                {verificationError}
              </div>
            )}

            {verificationSuccess && (
              <div style={{ background: '#ecfdf5', border: '1.5px solid #a7f3d0', color: '#059669', padding: '0.65rem 0.85rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <CheckCircle2 size={16} />
                <span>Employee Verified Successfully!</span>
              </div>
            )}

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>
                Enter Employee ID or Email
              </label>
              <input
                type="text"
                value={verificationInput}
                onChange={(e) => setVerificationInput(e.target.value)}
                placeholder="e.g. employee.acme@corporate.com or EMP-1024"
                style={{
                  width: '100%',
                  background: '#ffffff',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '0.75rem',
                  color: '#0f172a',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setVerifyModalRide(null)}
                style={{
                  padding: '0.65rem 1.25rem',
                  borderRadius: '8px',
                  background: '#ffffff',
                  color: '#64748b',
                  border: '1.5px solid #e2e8f0',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVerifyEmployee}
                disabled={actionLoading || verificationSuccess}
                style={{
                  padding: '0.65rem 1.5rem',
                  borderRadius: '8px',
                  background: 'linear-gradient(180deg, #184738 0%, #103327 100%)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(19, 56, 44, 0.25)',
                }}
              >
                {actionLoading ? 'Verifying...' : 'Validate & Verify'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: COMPLETE RIDE CONFIRMATION */}
      {completeModalRide && (
        <div
          className="modal-overlay"
          onClick={() => setCompleteModalRide(null)}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              border: '1.5px solid #e2e8f0',
              borderRadius: '20px',
              maxWidth: '460px',
              width: '100%',
              padding: '1.75rem',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.2)',
              color: '#0f2920',
            }}
          >
            <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0f2920', margin: '0 0 0.5rem 0' }}>
              Complete Ride?
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.25rem' }}>
              Are you sure the ride has safely reached its destination at <strong style={{ color: '#0f2920' }}>{completeModalRide.destination}</strong>?
            </p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setCompleteModalRide(null)}
                style={{
                  padding: '0.65rem 1.25rem',
                  borderRadius: '8px',
                  background: '#ffffff',
                  color: '#64748b',
                  border: '1.5px solid #e2e8f0',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCompleteRide}
                disabled={actionLoading}
                style={{
                  padding: '0.65rem 1.75rem',
                  borderRadius: '8px',
                  background: 'linear-gradient(180deg, #184738 0%, #103327 100%)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(19, 56, 44, 0.25)',
                }}
              >
                {actionLoading ? 'Completing...' : 'Yes, Complete Ride'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverDashboardPage;
