import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>User & Access Management</h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
            Manage employee access, administrative roles, and account security statuses ({totalElements} total users)
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/admin" className="btn btn-secondary">
            ← Admin Dashboard
          </Link>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            ➕ Onboard New User
          </button>
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

      {/* Filter & Search Bar */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <div style={{ flex: '1 1 200px' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search by name, email, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ width: '180px' }}>
            <select className="form-control" value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
              <option value="">All Roles</option>
              <option value="EMPLOYEE">Employee</option>
              <option value="DRIVER">Driver</option>
              <option value="TRANSPORT_MANAGER">Transport Manager</option>
              <option value="CORPORATE_ADMIN">Corporate Admin</option>
            </select>
          </div>

          <div style={{ width: '160px' }}>
            <select className="form-control" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="INVITED">Invited</option>
              <option value="DEACTIVATED">Deactivated</option>
            </select>
          </div>

          <button type="submit" className="btn btn-secondary">
            Search
          </button>
        </form>
      </div>

      {/* Users Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
            <p style={{ color: 'var(--text-muted)' }}>Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No users match the selected search or filter criteria.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '0.875rem 1.25rem', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>NAME & EMAIL</th>
                  <th style={{ padding: '0.875rem 1.25rem', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>DEPARTMENT</th>
                  <th style={{ padding: '0.875rem 1.25rem', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>ROLE</th>
                  <th style={{ padding: '0.875rem 1.25rem', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>VERIFICATION</th>
                  <th style={{ padding: '0.875rem 1.25rem', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>ACCOUNT STATUS</th>
                  <th style={{ padding: '0.875rem 1.25rem', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ fontWeight: 600 }}>{u.fullName}</div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{u.email}</div>
                      {u.phoneNumber && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📱 {u.phoneNumber}</div>}
                    </td>

                    <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem' }}>
                      {u.department || '—'}
                    </td>

                    <td style={{ padding: '1rem 1.25rem' }}>
                      <select
                        className="form-control"
                        style={{ padding: '0.35rem 0.5rem', fontSize: '0.8125rem', width: 'auto' }}
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
                      <span className={`badge ${u.verificationStatus === 'VERIFIED' ? 'badge-success' : 'badge-warning'}`}>
                        {u.verificationStatus || 'VERIFIED'}
                      </span>
                    </td>

                    <td style={{ padding: '1rem 1.25rem' }}>
                      <span className={`badge ${
                        u.status === 'ACTIVE' ? 'badge-success' :
                        u.status === 'SUSPENDED' ? 'badge-warning' : 'badge-danger'
                      }`}>
                        {u.status}
                      </span>
                    </td>

                    <td style={{ padding: '1rem 1.25rem' }}>
                      {u.status === 'ACTIVE' ? (
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', color: 'var(--warning)' }}
                          onClick={() => handleStatusChange(u.id, 'SUSPENDED')}
                        >
                          Suspend
                        </button>
                      ) : (
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', color: 'var(--success)' }}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderTop: '1px solid var(--border)' }}>
            <button
              className="btn btn-secondary"
              disabled={currentPage === 0}
              onClick={() => loadUsers(currentPage - 1)}
            >
              Previous
            </button>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Page {currentPage + 1} of {totalPages}
            </span>
            <button
              className="btn btn-secondary"
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
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: '520px', width: '100%', padding: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem' }}>Onboard New Organization User</h2>
            <form onSubmit={handleCreateUser}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={newUser.fullName}
                  onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                  placeholder="e.g. Sarah Jenkins"
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  className="form-control"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="name@company.com"
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Phone Number (E.164 format for SMS)</label>
                <input
                  type="tel"
                  className="form-control"
                  value={newUser.phoneNumber}
                  onChange={(e) => setNewUser({ ...newUser, phoneNumber: e.target.value })}
                  placeholder="+1 (555) 019-2834"
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Department</label>
                <input
                  type="text"
                  className="form-control"
                  value={newUser.department}
                  onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                  placeholder="e.g. Operations / Logistics"
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Platform Role *</label>
                <select
                  className="form-control"
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
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
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
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
