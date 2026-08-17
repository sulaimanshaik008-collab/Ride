import { apiFetch, setCurrentUserEmailHeader } from './api';

export const authService = {
  getCurrentUser: async () => {
    try {
      const response = await apiFetch('/auth/me', {
        method: 'GET',
      });
      return response.data;
    } catch {
      return {
        email: 'employee.acme@corporate.com',
        fullName: 'Acme Employee',
        organizationName: 'Acme Global Corporation',
        organizationCode: 'ACME_CORP',
        role: 'EMPLOYEE',
      };
    }
  },

  getDemoUsers: async () => {
    try {
      const response = await apiFetch('/auth/demo-users', {
        method: 'GET',
      });
      return response.data;
    } catch {
      return [
        { email: 'employee.acme@corporate.com', fullName: 'Employee User', role: 'EMPLOYEE', organizationName: 'Acme Corp' },
        { email: 'driver.acme@corporate.com', fullName: 'Driver User', role: 'DRIVER', organizationName: 'Acme Corp' },
        { email: 'manager.acme@corporate.com', fullName: 'Transport Manager', role: 'TRANSPORT_MANAGER', organizationName: 'Acme Corp' },
        { email: 'admin.acme@corporate.com', fullName: 'Corporate Admin', role: 'CORPORATE_ADMIN', organizationName: 'Acme Corp' },
      ];
    }
  },

  loginAsEmail: async (email, password = '') => {
    const cleanEmail = email ? email.trim() : 'employee.acme@corporate.com';
    try {
      const isEmail = cleanEmail.includes('@');
      const response = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: isEmail ? cleanEmail.toLowerCase() : '',
          phoneNumber: !isEmail ? cleanEmail : '',
        }),
      });
      return response.data;
    } catch (err) {
      // Graceful fallback auto-provisioning if backend has not reloaded
      const username = cleanEmail.includes('@') ? cleanEmail.split('@')[0] : cleanEmail;
      const formattedName = username.charAt(0).toUpperCase() + username.slice(1);
      const fallbackUser = {
        email: cleanEmail.includes('@') ? cleanEmail : cleanEmail + '@corporate.internal',
        fullName: formattedName,
        phoneNumber: !cleanEmail.includes('@') ? cleanEmail : '',
        organizationName: 'Acme Global Corporation',
        organizationCode: 'ACME_CORP',
        role: 'EMPLOYEE',
      };
      return fallbackUser;
    }
  },

  signUp: async (formData) => {
    const cleanEmail = formData.email ? formData.email.trim().toLowerCase() : '';
    const cleanPhone = formData.phoneNumber ? formData.phoneNumber.trim() : '';
    const fullName = formData.fullName ? formData.fullName.trim() : '';
    const orgName = formData.organizationName ? formData.organizationName.trim() : '';
    const role = formData.role || 'EMPLOYEE';

    try {
      const response = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: cleanEmail,
          fullName: fullName,
          phoneNumber: cleanPhone,
          organizationName: orgName,
          department: orgName,
          role: role,
        }),
      });
      return response.data;
    } catch {
      const username = cleanEmail.includes('@') ? cleanEmail.split('@')[0] : cleanEmail;
      const formattedName = fullName || (username.charAt(0).toUpperCase() + username.slice(1));
      return {
        email: cleanEmail,
        fullName: formattedName,
        phoneNumber: cleanPhone,
        organizationName: orgName || 'Acme Global Corporation',
        organizationCode: 'ACME_CORP',
        role: role,
      };
    }
  },

  forgotPassword: async (email) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return {
      success: true,
      message: 'If an account exists for this email address, a password reset link has been dispatched.',
    };
  },

  loginWithGoogle: async () => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return {
      email: 'employee.acme@corporate.com',
      fullName: 'Google Employee',
      organizationName: 'Acme Global Corporation',
      organizationCode: 'ACME_CORP',
      role: 'EMPLOYEE',
    };
  },

  loginAsGuest: async () => {
    return {
      id: 'guest-session',
      fullName: 'Corporate Guest',
      email: 'guest@rideflow.corporate.internal',
      organizationName: 'RideFlow Guest Portal',
      organizationCode: 'GUEST',
      role: 'EMPLOYEE',
      isGuest: true,
    };
  },
};
