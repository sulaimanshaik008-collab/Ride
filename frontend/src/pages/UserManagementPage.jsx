import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, UserPlus, Search, Filter, ShieldCheck, CheckCircle2, AlertCircle, ArrowLeft, RefreshCw, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { organizationService } from '../services/organizationService';

export default function UserManagementPage() {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    fullName: '',
    phoneNumber: '',
    department: '',
    role: 'EMPLOYEE',
  });
  const [submitting, setSubmitting] = useState(false);

  const loadUsers = async (page = 0) => {
    try {
      setLoading(true);
      const data = await organizationService.getOrganizationUsers({
        role: filterRole,
        status: filterStatus,
        search: searchTerm,
        page,
        size: 15,
      });
      setUsers(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
      setCurrentPage(page);
    } catch (err) {
      setMessage({ type: 'danger', text: err.message || 'Failed to fetch users' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers(0);
  }, [currentUser, filterRole, filterStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadUsers(0);
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      setMessage({ type: '', text: '' });
      await organizationService.updateUserRole(userId, newRole);
      setMessage({ type: 'success', text: 'User role successfully updated!' });
      loadUsers(currentPage);
    } catch (err) {
      setMessage({ type: 'danger', text: err.message || 'Failed to update user role' });
    }
  };

  const handleStatusChange = async (userId, newStatus) => {
    try {
      setMessage({ type: '', text: '' });
      await organizationService.updateUserStatus(userId, newStatus);
      setMessage({ type: 'success', text: `User account status set to ${newStatus}!` });
      loadUsers(currentPage);
    } catch (err) {
      setMessage({ type: 'danger', text: err.message || 'Failed to update user status' });
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setMessage({ type: '', text: '' });
      await organizationService.createOrganizationUser(newUser);
      setMessage({ type: 'success', text: `User ${newUser.email} successfully onboarded!` });
      setShowCreateModal(false);
      setNewUser({ email: '', fullName: '', phoneNumber: '', department: '', role: 'EMPLOYEE' });
      loadUsers(0);
    } catch (err) {
      setMessage({ type: 'danger', text: err.message || 'Failed to create user' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 900, color: '#0f2920', margin: 0, display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Users size={28} color="#059669" />
            <span>User & Access Management</span>
          </h1>
          <p style={{ color: '#64748b', margin: '0.35rem 0 0', fontSize: '0.9rem', fontWeight: 500 }}>
            Manage employee access, administrative roles, and account security statuses (<strong style={{ color: '#0f2920' }}>{totalElements} total users</strong>)
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link
            to="/admin"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: '#ffffff',
              border: '1.5px solid #e2e8f0',
              color: '#0f2920',
              padding: '0.65rem 1.25rem',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.875rem',
              textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            }}
          >
            <ArrowLeft size={16} />
            <span>Admin Center</span>
          </Link>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'linear-gradient(180deg, #184738 0%, #103327 100%)',
              color: '#ffffff',
              border: 'none',
              padding: '0.65rem 1.25rem',
              borderRadius: '10px',
              fontWeight: 800,
              fontSize: '0.875rem',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(19, 56, 44, 0.25)',
            }}
          >
            <UserPlus size={16} />
            <span>Onboard New User</span>
          </button>
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
              placeholder="Search by name, email, or department..."
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

          <div style={{ width: '180px' }}>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
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
              <option value="">All Roles</option>
              <option value="EMPLOYEE">Employee</option>
              <option value="DRIVER">Driver</option>
              <option value="TRANSPORT_MANAGER">Transport Manager</option>
              <option value="CORPORATE_ADMIN">Corporate Admin</option>
            </select>
          </div>

          <div style={{ width: '160px' }}>
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
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="INVITED">Invited</option>
              <option value="DEACTIVATED">Deactivated</option>
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

      {/* Users Table */}
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
            <p style={{ color: '#64748b', fontWeight: 600 }}>Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div style={{ padding: '4rem 1.5rem', textAlign: 'center', color: '#64748b' }}>
            <Users size={36} color="#059669" style={{ margin: '0 auto 0.75rem' }} />
            <div style={{ fontWeight: 800, color: '#0f2920', fontSize: '1.1rem' }}>No users match the criteria</div>
            <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>Try adjusting your search query or role filter.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8faf9', borderBottom: '1.5px solid #e2e8f0' }}>
                  <th style={{ padding: '0.9rem 1.25rem', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>NAME & EMAIL</th>
                  <th style={{ padding: '0.9rem 1.25rem', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>DEPARTMENT</th>
                  <th style={{ padding: '0.9rem 1.25rem', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>ROLE</th>
                  <th style={{ padding: '0.9rem 1.25rem', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>VERIFICATION</th>
                  <th style={{ padding: '0.9rem 1.25rem', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>ACCOUNT STATUS</th>
                  <th style={{ padding: '0.9rem 1.25rem', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1.5px solid #f1f5f9' }}>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ fontWeight: 900, color: '#0f2920', fontSize: '0.95rem' }}>{u.fullName}</div>
                      <div style={{ fontSize: '0.825rem', color: '#2563eb', fontWeight: 600 }}>{u.email}</div>
                      {u.phoneNumber && <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>📱 {u.phoneNumber}</div>}
                    </td>

                    <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', fontWeight: 600, color: '#0f2920' }}>
                      {u.department || '—'}
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
                        value={u.role}
                        disabled={u.role === 'SYSTEM_ADMIN'}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      >
                        <option value="EMPLOYEE">Employee</option>
                        <option value="DRIVER">Driver</option>
                        <option value="TRANSPORT_MANAGER">Transport Manager</option>
                        <option value="CORPORATE_ADMIN">Corporate Admin</option>
                      </select>
                    </td>

                    <td style={{ padding: '1rem 1.25rem' }}>
                      <span
                        style={{
                          padding: '0.3rem 0.65rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          background: u.verificationStatus === 'VERIFIED' ? '#ecfdf5' : '#fffbeb',
                          color: u.verificationStatus === 'VERIFIED' ? '#059669' : '#d97706',
                          border: `1px solid ${u.verificationStatus === 'VERIFIED' ? '#a7f3d0' : '#fde68a'}`,
                        }}
                      >
                        {u.verificationStatus || 'VERIFIED'}
                      </span>
                    </td>

                    <td style={{ padding: '1rem 1.25rem' }}>
                      <span
                        style={{
                          padding: '0.3rem 0.65rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          background: u.status === 'ACTIVE' ? '#ecfdf5' : u.status === 'SUSPENDED' ? '#fffbeb' : '#fef2f2',
                          color: u.status === 'ACTIVE' ? '#059669' : u.status === 'SUSPENDED' ? '#d97706' : '#ef4444',
                          border: `1px solid ${u.status === 'ACTIVE' ? '#a7f3d0' : u.status === 'SUSPENDED' ? '#fde68a' : '#fecaca'}`,
                        }}
                      >
                        {u.status}
                      </span>
                    </td>

                    <td style={{ padding: '1rem 1.25rem' }}>
                      {u.status === 'ACTIVE' ? (
                        <button
                          type="button"
                          style={{
                            padding: '0.4rem 0.75rem',
                            fontSize: '0.8rem',
                            fontWeight: 800,
                            color: '#d97706',
                            background: '#fffbeb',
                            border: '1px solid #fde68a',
                            borderRadius: '8px',
                            cursor: 'pointer',
                          }}
                          onClick={() => handleStatusChange(u.id, 'SUSPENDED')}
                        >
                          Suspend
                        </button>
                      ) : (
                        <button
                          type="button"
                          style={{
                            padding: '0.4rem 0.75rem',
                            fontSize: '0.8rem',
                            fontWeight: 800,
                            color: '#059669',
                            background: '#ecfdf5',
                            border: '1px solid #a7f3d0',
                            borderRadius: '8px',
                            cursor: 'pointer',
                          }}
                          onClick={() => handleStatusChange(u.id, 'ACTIVE')}
                        >
                          Activate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
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
              onClick={() => loadUsers(currentPage - 1)}
            >
              Previous
            </button>
            <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 600 }}>
              Page {currentPage + 1} of {totalPages}
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
                cursor: currentPage >= totalPages - 1 ? 'not-allowed' : 'pointer',
                opacity: currentPage >= totalPages - 1 ? 0.5 : 1,
              }}
              disabled={currentPage >= totalPages - 1}
              onClick={() => loadUsers(currentPage + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Onboard User Modal */}
      {showCreateModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '520px',
              width: '100%',
              background: '#ffffff',
              border: '1.5px solid #e2e8f0',
              borderRadius: '20px',
              padding: '2rem',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.2)',
              color: '#0f2920',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f2920', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserPlus size={22} color="#059669" />
                <span>Onboard New User</span>
              </h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateUser}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>Full Name *</label>
                <input
                  type="text"
                  required
                  value={newUser.fullName}
                  onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                  placeholder="e.g. Sarah Jenkins"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#ffffff',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '8px',
                    color: '#0f172a',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>Email Address *</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="name@company.com"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#ffffff',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '8px',
                    color: '#0f172a',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>Phone Number</label>
                <input
                  type="tel"
                  value={newUser.phoneNumber}
                  onChange={(e) => setNewUser({ ...newUser, phoneNumber: e.target.value })}
                  placeholder="+91 98765 43210"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#ffffff',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '8px',
                    color: '#0f172a',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>Department</label>
                <input
                  type="text"
                  value={newUser.department}
                  onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                  placeholder="e.g. Operations / Logistics"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#ffffff',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '8px',
                    color: '#0f172a',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>Platform Role *</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#ffffff',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '8px',
                    color: '#0f172a',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    outline: 'none',
                  }}
                >
                  <option value="EMPLOYEE">Employee (Ride Booker)</option>
                  <option value="DRIVER">Driver</option>
                  <option value="TRANSPORT_MANAGER">Transport Manager</option>
                  <option value="CORPORATE_ADMIN">Corporate Admin</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
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
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '0.65rem 1.5rem',
                    borderRadius: '8px',
                    background: 'linear-gradient(180deg, #184738 0%, #103327 100%)',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(19, 56, 44, 0.25)',
                  }}
                >
                  {submitting ? 'Creating User...' : 'Onboard User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
