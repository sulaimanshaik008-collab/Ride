import React from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle, Calendar } from 'lucide-react';

const statusConfig = {
  PENDING_APPROVAL: { label: 'Pending Approval', icon: Clock, className: 'PENDING_APPROVAL' },
  APPROVED: { label: 'Approved', icon: CheckCircle, className: 'APPROVED' },
  SCHEDULED: { label: 'Scheduled', icon: Calendar, className: 'SCHEDULED' },
  COMPLETED: { label: 'Completed', icon: CheckCircle, className: 'COMPLETED' },
  CANCELLED: { label: 'Cancelled', icon: XCircle, className: 'CANCELLED' },
  REJECTED: { label: 'Rejected', icon: AlertCircle, className: 'REJECTED' },
};

export const StatusBadge = ({ status }) => {
  const config = statusConfig[status] || { label: status, icon: Clock, className: 'PENDING_APPROVAL' };
  const Icon = config.icon;

  return (
    <span className={`status-badge ${config.className}`}>
      <Icon size={12} />
      {config.label}
    </span>
  );
};
