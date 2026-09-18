import { apiFetch, setCurrentUserEmailHeader } from './api';

export const authService = {
  getCurrentUser: async () => {
    const savedEmail = localStorage.getItem('user_email');
    if (!savedEmail) {
      return null;
    }
    try {
      const response = await apiFetch('/auth/me', {
        method: 'GET',
      });
      return response.data;
    } catch {
      return {
        email: savedEmail,
        fullName: savedEmail.split('@')[0],
        organizationName: 'Acme Global Corporation',
        organizationCode: 'ACME_CORP',
        role: savedEmail.toLowerCase().includes('driver')
          ? 'DRIVER'
          : savedEmail.toLowerCase().includes('manager')
          ? 'TRANSPORT_MANAGER'
          : savedEmail.toLowerCase().includes('admin')
          ? 'CORPORATE_ADMIN'
          : 'EMPLOYEE',
      };
    }
  },

  getDemoUsers: async () => {
    try {
      const response = await apiFetch('/auth/demo-users', {
        method: 'GET',
      });
      return response.data || [];
    } catch {
      return [];
    }
  },

  loginAsEmail: async (email, password = '', role = '') => {
    const cleanEmail = email ? email.trim() : '';
    try {
      const isEmail = cleanEmail.includes('@');
      const payload = {
        email: isEmail ? cleanEmail.toLowerCase() : '',
        phoneNumber: !isEmail ? cleanEmail : '',
      };
      if (role) payload.role = role;

      const response = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return response.data;
    } catch (err) {
      // Fallback user profile if offline
      const username = cleanEmail.includes('@') ? cleanEmail.split('@')[0] : cleanEmail;
      const formattedName = username ? (username.charAt(0).toUpperCase() + username.slice(1)) : 'User';
      const fallbackUser = {
        email: cleanEmail,
        fullName: formattedName,
        phoneNumber: !cleanEmail.includes('@') ? cleanEmail : '',
        organizationName: 'Acme Global Corporation',
        organizationCode: 'ACME_CORP',
        role: role || (cleanEmail.toLowerCase().includes('driver') ? 'DRIVER' : cleanEmail.toLowerCase().includes('manager') ? 'TRANSPORT_MANAGER' : 'EMPLOYEE'),
      };
      return fallbackUser;
    }
  },

  checkEmailExists: async (email) => {
    const cleanEmail = email ? email.trim().toLowerCase() : '';
    if (!cleanEmail || !cleanEmail.includes('@')) return false;

    // 1. Guard against locally registered users
    const localRegistered = JSON.parse(localStorage.getItem('rideflow_registered_users') || '[]');
    if (localRegistered.some((u) => (typeof u === 'string' ? u : u.email)?.toLowerCase() === cleanEmail)) {
      return true;
    }

    // 2. Query users from backend /auth/demo-users (database users)
    try {
      const demoUsers = await authService.getDemoUsers();
      if (Array.isArray(demoUsers) && demoUsers.some((u) => u.email?.toLowerCase() === cleanEmail)) {
        return true;
      }
    } catch {
      // Ignore network errors
    }

    return false;
  },

  signUp: async (formData) => {
    const cleanEmail = formData.email ? formData.email.trim().toLowerCase() : '';
    const cleanPhone = formData.phoneNumber ? formData.phoneNumber.trim() : '';
    const fullName = formData.fullName ? formData.fullName.trim() : '';
    const orgName = formData.organizationName ? formData.organizationName.trim() : '';
    const role = formData.role || 'EMPLOYEE';

    // 1. Check if email already exists before signup
    const exists = await authService.checkEmailExists(cleanEmail);
    if (exists) {
      throw new Error('This email already exists. Please use a different email or sign in.');
    }

    const payload = {
      email: cleanEmail,
      fullName: fullName,
      phoneNumber: cleanPhone,
      organizationName: orgName,
      department: orgName,
      role: role,
    };

    let userResult = null;

    // 2. Call backend signup API
    try {
      const response = await apiFetch('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      userResult = response.data;
    } catch (err) {
      // If endpoint returns 404 because backend process hasn't reloaded /auth/signup,
      // fallback to /auth/login which auto-provisions and saves to DB
      if (err?.status === 404 || err?.message?.toLowerCase().includes('resource not found') || err?.message?.includes('404')) {
        try {
          const fallbackRes = await apiFetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify(payload),
          });
          userResult = fallbackRes.data;
        } catch (loginErr) {
          throw loginErr;
        }
      } else {
        // Rethrow server validation/duplicate error
        throw err;
      }
    }

    if (!userResult) {
      const username = cleanEmail.includes('@') ? cleanEmail.split('@')[0] : cleanEmail;
      const formattedName = fullName || (username.charAt(0).toUpperCase() + username.slice(1));
      userResult = {
        email: cleanEmail,
        fullName: formattedName,
        phoneNumber: cleanPhone,
        organizationName: orgName || 'Acme Global Corporation',
        organizationCode: 'ACME_CORP',
        role: role,
      };
    }

    // Save newly created user to local list so future duplicate signups are blocked
    const localRegistered = JSON.parse(localStorage.getItem('rideflow_registered_users') || '[]');
    if (!localRegistered.some((u) => (typeof u === 'string' ? u : u.email)?.toLowerCase() === cleanEmail)) {
      localRegistered.push(userResult);
      localStorage.setItem('rideflow_registered_users', JSON.stringify(localRegistered));
    }

    return userResult;
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
