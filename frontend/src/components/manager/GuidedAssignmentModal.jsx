import React, { useState, useEffect } from 'react';
import {
  X,
  UserCheck,
  Car,
  User,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Clock,
  MapPin,
  Calendar,
  ShieldCheck,
  Search,
  Sparkles,
} from 'lucide-react';
import { rideService } from '../../services/rideService';
import { driverService } from '../../services/driverService';
import { vehicleService } from '../../services/vehicleService';

export const GuidedAssignmentModal = ({ isOpen, onClose, ride, onAssignmentSuccess }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [driverSearch, setDriverSearch] = useState('');
  const [vehicleSearch, setVehicleSearch] = useState('');

  // Load eligible drivers and vehicles
  useEffect(() => {
    if (isOpen && ride) {
      setCurrentStep(1);
      setSelectedDriver(null);
      setSelectedVehicle(null);
      setErrorMsg('');
      loadEligibleResources();
    }
  }, [isOpen, ride]);

  const loadEligibleResources = async () => {
    try {
      setLoadingOptions(true);
      setErrorMsg('');

      // Try fetching specific assignment options for this ride
      let eligibleDrivers = [];
      let eligibleVehicles = [];

      try {
        const options = await rideService.getAssignmentOptions(ride.id);
        eligibleDrivers = options?.eligibleDrivers || [];
        eligibleVehicles = options?.eligibleVehicles || [];
      } catch {
        // Fallback to searching all active & available drivers/vehicles
        const [drvList, vehList] = await Promise.all([
          driverService.searchDrivers({ status: 'ACTIVE', availability: 'AVAILABLE' }).catch(() => []),
          vehicleService.searchVehicles({ status: 'ACTIVE', availability: 'AVAILABLE' }).catch(() => []),
        ]);
        eligibleDrivers = drvList || [];
        eligibleVehicles = vehList || [];
      }

      setDrivers(eligibleDrivers);
      setVehicles(eligibleVehicles);
    } catch (err) {
      setErrorMsg('Failed to load eligible drivers and vehicles. Please try again.');
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleConfirmAssignment = async () => {
    if (!selectedDriver || !selectedVehicle) {
      setErrorMsg('Both a Driver and a Vehicle must be selected.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');

      const payload = {
        driverId: selectedDriver.id,
        vehicleId: selectedVehicle.id,
        assignmentNotes: `Assigned via Corporate Control Center on ${new Date().toLocaleTimeString()}`,
      };

      const updated = await rideService.assignRideResources(ride.id, payload);

      if (onAssignmentSuccess) {
        onAssignmentSuccess(updated);
      }
      onClose();
    } catch (err) {
      setErrorMsg(err?.message || 'Assignment failed. Check for schedule conflicts or resource availability.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !ride) return null;

  const filteredDrivers = drivers.filter(
    (d) =>
      d.user?.fullName?.toLowerCase().includes(driverSearch.toLowerCase()) ||
      d.fullName?.toLowerCase().includes(driverSearch.toLowerCase()) ||
      d.licenseNumber?.toLowerCase().includes(driverSearch.toLowerCase())
  );

  const filteredVehicles = vehicles.filter(
    (v) =>
      v.registrationNumber?.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
      v.makeModel?.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
      v.vehicleType?.toLowerCase().includes(vehicleSearch.toLowerCase())
  );

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
    >
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '740px',
          maxHeight: '90vh',
          background: '#ffffff',
          border: '1.5px solid #e2e8f0',
          borderRadius: '20px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#0f2920',
        }}
      >
        {/* Wizard Header with Progress Steps */}
        <div
          style={{
            padding: '1.5rem 1.75rem',
            borderBottom: '1.5px solid #e2e8f0',
            background: '#f8faf9',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 900, margin: 0, color: '#0f2920' }}>
                Guided Ride Assignment Center
              </h3>
              <div style={{ fontSize: '0.825rem', color: '#64748b' }}>
                Ride #{ride.bookingReference} &bull; Passenger: <strong style={{ color: '#0f2920' }}>{ride.employeeName || 'Employee'}</strong>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{ background: '#f1f5f9', border: 'none', color: '#64748b', cursor: 'pointer', padding: '6px', borderRadius: '8px' }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Stepper Tabs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
            {[
              { num: 1, label: '1. Ride Review' },
              { num: 2, label: '2. Select Driver' },
              { num: 3, label: '3. Select Vehicle' },
              { num: 4, label: '4. Confirmation' },
            ].map((step) => {
              const isActive = currentStep === step.num;
              const isCompleted = currentStep > step.num;
              return (
                <div
                  key={step.num}
                  style={{
                    padding: '0.5rem 0.5rem',
                    borderRadius: '8px',
                    background: isActive
                      ? 'linear-gradient(180deg, #184738 0%, #103327 100%)'
                      : isCompleted
                      ? '#ecfdf5'
                      : '#eef2ef',
                    border: `1.5px solid ${
                      isActive ? '#1f5643' : isCompleted ? '#a7f3d0' : '#e2e8f0'
                    }`,
                    color: isActive ? '#ffffff' : isCompleted ? '#059669' : '#64748b',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    textAlign: 'center',
                    transition: 'all 0.15s',
                    boxShadow: isActive ? '0 2px 8px rgba(19, 56, 44, 0.25)' : 'none',
                  }}
                >
                  {isCompleted ? `✓ ${step.label.split('. ')[1]}` : step.label}
                </div>
              );
            })}
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div
            style={{
              margin: '1rem 1.75rem 0',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              background: '#fef2f2',
              border: '1.5px solid #fecaca',
              color: '#ef4444',
              fontSize: '0.85rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <AlertTriangle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Dynamic Wizard Body */}
        <div style={{ flex: 1, padding: '1.5rem 1.75rem', overflowY: 'auto' }}>
          {/* STEP 1: RIDE SUMMARY */}
          {currentStep === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ padding: '1.25rem', borderRadius: '14px', background: '#f8faf9', border: '1.5px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                  Ride Requirement Details
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Passenger Employee</div>
                    <div style={{ fontSize: '1rem', fontWeight: 900, color: '#0f2920', marginTop: '2px' }}>{ride.employeeName || 'Rahul Kumar'}</div>
                    <div style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: 600 }}>{ride.employeeEmail}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Date & Pickup Time</div>
                    <div style={{ fontSize: '1rem', fontWeight: 900, color: '#0f2920', marginTop: '2px' }}>
                      {ride.bookingDate} at {ride.pickupTime || '08:30 AM'}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1.5px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                    <MapPin size={16} color="#059669" />
                    <span><strong style={{ color: '#0f2920' }}>Pickup:</strong> {ride.pickupLocation}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                    <MapPin size={16} color="#2563eb" />
                    <span><strong style={{ color: '#0f2920' }}>Destination:</strong> {ride.destination}</span>
                  </div>
                </div>
              </div>

              {ride.rejectionReason && (
                <div style={{ padding: '0.85rem 1rem', borderRadius: '10px', background: '#fffbeb', border: '1.5px solid #fde68a', color: '#d97706', fontSize: '0.825rem', fontWeight: 600 }}>
                  <strong>Note:</strong> Previous driver rejected this assignment. Reason: "{ride.rejectionReason}". Please reassign to another available driver below.
                </div>
              )}
            </div>
          )}

          {/* STEP 2: SELECT DRIVER */}
          {currentStep === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f2920' }}>
                  Select Available Driver ({filteredDrivers.length} Available)
                </div>

                <div style={{ position: 'relative', width: '220px' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#64748b' }} />
                  <input
                    type="text"
                    placeholder="Search driver..."
                    value={driverSearch}
                    onChange={(e) => setDriverSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.65rem 0.5rem 2rem',
                      borderRadius: '8px',
                      background: '#ffffff',
                      border: '1.5px solid #e2e8f0',
                      color: '#0f172a',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {loadingOptions ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  Loading eligible drivers...
                </div>
              ) : filteredDrivers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', background: '#f8faf9', borderRadius: '12px', color: '#64748b', fontSize: '0.875rem' }}>
                  No available drivers found for this time slot without conflicts.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '360px', overflowY: 'auto' }}>
                  {filteredDrivers.map((driver) => {
                    const isSelected = selectedDriver?.id === driver.id;
                    const driverName = driver.user?.fullName || driver.fullName || 'Corporate Driver';
                    const license = driver.licenseNumber || 'DL-VALID';
                    const badgeId = `DRV-${license.replace(/[^0-9A-Z]/g, '').slice(-4) || '1024'}`;

                    return (
                      <div
                        key={driver.id}
                        onClick={() => setSelectedDriver(driver)}
                        style={{
                          padding: '0.85rem 1.1rem',
                          borderRadius: '12px',
                          background: isSelected ? '#ecfdf5' : '#f8faf9',
                          border: `1.5px solid ${isSelected ? '#059669' : '#e2e8f0'}`,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'all 0.15s',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '50%',
                              background: isSelected ? 'linear-gradient(180deg, #184738 0%, #103327 100%)' : '#eef2ef',
                              color: isSelected ? '#ffffff' : '#0f2920',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '0.85rem',
                            }}
                          >
                            {driverName.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 900, color: '#0f2920', fontSize: '0.925rem' }}>{driverName}</div>
                            <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700 }}>
                              {badgeId} &bull; License: {license}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              padding: '0.2rem 0.55rem',
                              borderRadius: '9999px',
                              background: '#ecfdf5',
                              color: '#059669',
                              border: '1px solid #a7f3d0',
                            }}
                          >
                            ● AVAILABLE
                          </span>

                          <button
                            type="button"
                            style={{
                              padding: '0.4rem 0.85rem',
                              borderRadius: '6px',
                              background: isSelected ? 'linear-gradient(180deg, #184738 0%, #103327 100%)' : '#ffffff',
                              color: isSelected ? '#ffffff' : '#0f2920',
                              border: isSelected ? 'none' : '1.5px solid #e2e8f0',
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                            }}
                          >
                            {isSelected ? 'SELECTED ✓' : 'SELECT'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: SELECT VEHICLE */}
          {currentStep === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f2920' }}>
                  Select Available Vehicle ({filteredVehicles.length} Available)
                </div>

                <div style={{ position: 'relative', width: '220px' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#64748b' }} />
                  <input
                    type="text"
                    placeholder="Search vehicle..."
                    value={vehicleSearch}
                    onChange={(e) => setVehicleSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.65rem 0.5rem 2rem',
                      borderRadius: '8px',
                      background: '#ffffff',
                      border: '1.5px solid #e2e8f0',
                      color: '#0f172a',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {loadingOptions ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  Loading eligible vehicles...
                </div>
              ) : filteredVehicles.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', background: '#f8faf9', borderRadius: '12px', color: '#64748b', fontSize: '0.875rem' }}>
                  No available vehicles found for this schedule.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '360px', overflowY: 'auto' }}>
                  {filteredVehicles.map((vehicle) => {
                    const isSelected = selectedVehicle?.id === vehicle.id;
                    return (
                      <div
                        key={vehicle.id}
                        onClick={() => setSelectedVehicle(vehicle)}
                        style={{
                          padding: '0.85rem 1.1rem',
                          borderRadius: '12px',
                          background: isSelected ? '#eff6ff' : '#f8faf9',
                          border: `1.5px solid ${isSelected ? '#2563eb' : '#e2e8f0'}`,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'all 0.15s',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '10px',
                              background: isSelected ? '#2563eb' : '#eef2ef',
                              color: isSelected ? '#ffffff' : '#0f2920',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Car size={18} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 900, color: '#0f2920', fontSize: '0.925rem' }}>
                              {vehicle.makeModel || 'Toyota Innova'}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 700 }}>
                              Plate: {vehicle.registrationNumber} &bull; Capacity: {vehicle.seatingCapacity || 4} Seats &bull; {vehicle.vehicleType}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              padding: '0.2rem 0.55rem',
                              borderRadius: '9999px',
                              background: '#ecfdf5',
                              color: '#059669',
                              border: '1px solid #a7f3d0',
                            }}
                          >
                            ● AVAILABLE
                          </span>

                          <button
                            type="button"
                            style={{
                              padding: '0.4rem 0.85rem',
                              borderRadius: '6px',
                              background: isSelected ? 'linear-gradient(180deg, #184738 0%, #103327 100%)' : '#ffffff',
                              color: isSelected ? '#ffffff' : '#0f2920',
                              border: isSelected ? 'none' : '1.5px solid #e2e8f0',
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                            }}
                          >
                            {isSelected ? 'SELECTED ✓' : 'SELECT'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 4: ASSIGNMENT CONFIRMATION */}
          {currentStep === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: '#ecfdf5',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 0.75rem',
                  }}
                >
                  <Sparkles size={28} />
                </div>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f2920', margin: 0 }}>
                  Ready to Dispatch & Assign
                </h4>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0' }}>
                  Please review the complete assignment pairing before confirming.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                {/* Employee Card */}
                <div style={{ padding: '1rem', borderRadius: '12px', background: '#f8faf9', border: '1.5px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>Passenger</div>
                  <div style={{ fontWeight: 900, color: '#0f2920', marginTop: '4px' }}>{ride.employeeName || 'Employee'}</div>
                  <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '2px', fontWeight: 600 }}>{ride.bookingDate} &bull; {ride.pickupTime}</div>
                </div>

                {/* Driver Card */}
                <div style={{ padding: '1rem', borderRadius: '12px', background: '#ecfdf5', border: '1.5px solid #a7f3d0' }}>
                  <div style={{ fontSize: '0.7rem', color: '#059669', textTransform: 'uppercase', fontWeight: 800 }}>Driver</div>
                  <div style={{ fontWeight: 900, color: '#0f2920', marginTop: '4px' }}>
                    {selectedDriver?.user?.fullName || selectedDriver?.fullName || 'Driver'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '2px', fontWeight: 600 }}>
                    License: {selectedDriver?.licenseNumber || 'DL-VALID'}
                  </div>
                </div>

                {/* Vehicle Card */}
                <div style={{ padding: '1rem', borderRadius: '12px', background: '#eff6ff', border: '1.5px solid #bfdbfe' }}>
                  <div style={{ fontSize: '0.7rem', color: '#2563eb', textTransform: 'uppercase', fontWeight: 800 }}>Vehicle</div>
                  <div style={{ fontWeight: 900, color: '#0f2920', marginTop: '4px' }}>
                    {selectedVehicle?.makeModel || 'Toyota Innova'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#2563eb', marginTop: '2px', fontWeight: 600 }}>
                    Plate: {selectedVehicle?.registrationNumber}
                  </div>
                </div>
              </div>

              <div style={{ padding: '0.85rem 1rem', borderRadius: '10px', background: '#ecfdf5', border: '1.5px solid #a7f3d0', fontSize: '0.825rem', color: '#059669', fontWeight: 700 }}>
                ✓ Driver will receive instant in-app assignment notification. Vehicle reserved. Employee schedule updated.
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            borderTop: '1.5px solid #e2e8f0',
            background: '#f8faf9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(currentStep - 1)}
              style={{
                padding: '0.6rem 1.1rem',
                borderRadius: '8px',
                background: '#ffffff',
                border: '1.5px solid #e2e8f0',
                color: '#0f2920',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <ArrowLeft size={15} />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.6rem 1.1rem',
                borderRadius: '8px',
                background: '#ffffff',
                border: '1.5px solid #e2e8f0',
                color: '#64748b',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={() => {
                  if (currentStep === 2 && !selectedDriver) {
                    setErrorMsg('Please select a driver to proceed.');
                    return;
                  }
                  if (currentStep === 3 && !selectedVehicle) {
                    setErrorMsg('Please select a vehicle to proceed.');
                    return;
                  }
                  setErrorMsg('');
                  setCurrentStep(currentStep + 1);
                }}
                style={{
                  padding: '0.6rem 1.35rem',
                  borderRadius: '8px',
                  background: 'linear-gradient(180deg, #184738 0%, #103327 100%)',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 4px 12px rgba(19, 56, 44, 0.25)',
                }}
              >
                <span>Continue</span>
                <ArrowRight size={15} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConfirmAssignment}
                disabled={submitting}
                style={{
                  padding: '0.6rem 1.5rem',
                  borderRadius: '8px',
                  background: 'linear-gradient(180deg, #059669 0%, #047857 100%)',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 800,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 15px rgba(5, 150, 105, 0.25)',
                }}
              >
                {submitting ? 'Dispatching Assignment...' : 'Confirm & Dispatch Assignment'}
                <CheckCircle2 size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default GuidedAssignmentModal;
