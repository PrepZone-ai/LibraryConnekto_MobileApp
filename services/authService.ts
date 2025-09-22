import { apiClient, setAuthToken, removeAuthToken, checkDatabaseConnection } from '../config/api';
import { AuthFormData, AuthError, AdminUser } from '../types/auth';
import { generateResetToken } from '../utils/auth';

export interface AdminSignUpData {
  email: string;
  password: string;
  library_name?: string;
  mobile_no?: string;
  address?: string;
  total_seats?: number;
}

export interface AdminDetails {
  admin_name: string;
  library_name: string;
  mobile_no: string;
  address: string;
  total_seats: number;
  has_shift_system: boolean;
  shift_timings?: string[];
  referral_code?: string;
  latitude?: number;
  longitude?: number;
}

export interface StudentCredentials {
  email: string;
  studentId: string;
  isFirstLogin?: boolean;
}

export const signInWithEmail = async ({ email, password }: AuthFormData) => {
  try {
    const response = await apiClient.post<{
      access_token: string;
      token_type: string;
    }>('/auth/admin/signin', {
      email,
      password,
    });

    await setAuthToken(response.access_token);

    // Get admin details to check if it's first login
    try {
      const adminDetails = await apiClient.get<AdminDetails>('/admin/details');
      return {
        user: { email },
        isFirstLogin: false,
        adminDetails
      };
    } catch (error: any) {
      // If admin details don't exist (404), it's first login
      if (error.message.includes('404') || error.message.includes('Admin details not found')) {
        return {
          user: { email },
          isFirstLogin: true,
          adminDetails: null
        };
      }
      // For other errors, re-throw
      throw error;
    }
  } catch (error: any) {
    throw new Error(error.message || 'Login failed');
  }
};

export const signUpAdmin = async ({ 
  email, 
  password, 
  library_name, 
  mobile_no, 
  address, 
  total_seats 
}: AdminSignUpData) => {
  try {
    // First check database connectivity
    const isConnected = await checkDatabaseConnection();
    if (!isConnected) {
      throw new Error('Unable to connect to the server. Please check your internet connection.');
    }

    const response = await apiClient.post<{
      user_id: string;
      email: string;
      user_type: string;
      is_first_login: boolean;
    }>('/auth/admin/signup', {
      email: email.toLowerCase(),
      password,
      library_name,
      mobile_no,
      address,
      total_seats,
    });

    return {
      user: {
        id: response.user_id,
        email: response.email,
      }
    };
  } catch (error: any) {
    console.error('Admin signup error:', error);
    throw new Error(error.message || 'Signup failed');
  }
};

export const signInAdmin = async (email: string, password: string) => {
  try {
    // Check database connectivity first
    const isConnected = await checkDatabaseConnection();
    if (!isConnected) {
      throw new Error('Unable to connect to the server. Please check your internet connection.');
    }

    const response = await apiClient.post<{
      access_token: string;
      token_type: string;
    }>('/auth/admin/signin', {
      email: email.toLowerCase(),
      password
    });

    await setAuthToken(response.access_token);

    // Check if admin details are complete
    try {
      const adminDetails = await apiClient.get<AdminDetails & { is_complete: boolean }>('/admin/details');
      return {
        user: { email },
        hasDetails: adminDetails.is_complete
      };
    } catch (error: any) {
      // If there's an error fetching admin details, assume details are incomplete
      console.error('Error fetching admin details:', error);
      return {
        user: { email },
        hasDetails: false
      };
    }
  } catch (error: any) {
    console.error('Admin sign in error:', error);
    throw new Error(error.message || 'Login failed');
  }
};

export const createStudentAuth = async (
  email: string, 
  adminId: string, 
  mobileNo: string
): Promise<StudentCredentials> => {
  try {
    // This function is now deprecated in favor of using addStudent directly
    // The admin_id will be obtained from the authenticated admin user
    throw new Error('This function is deprecated. Use addStudent from studentService instead.');
  } catch (error: any) {
    console.error('Error creating student auth:', error);
    throw new Error(error.message || 'Failed to create student account');
  }
};

export const signInStudent = async ({ email, password, studentId }: AuthFormData & { studentId: string }) => {
  try {
    const response = await apiClient.post<{
      access_token: string;
      token_type: string;
    }>('/auth/student/signin', {
      email,
      password,
    });

    await setAuthToken(response.access_token);

    return {
      user: { email }
    };
  } catch (error: any) {
    throw new Error(error.message || 'Login failed');
  }
};

export const resetStudentPassword = async (studentId: string): Promise<string | null> => {
  try {
    // This would need to be implemented in the backend
    // For now, return the mobile number as password
    const student = await apiClient.get<any>(`/admin/students/${studentId}`);
    return student.mobile_no;
  } catch (error: any) {
    console.error('Error resetting student password:', error);
    return null;
  }
};

export const changePassword = async (currentPassword: string, newPassword: string) => {
  try {
    await apiClient.put('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword
    });
  } catch (error: any) {
    console.error('Error changing password:', error);
    throw new Error(error.message || 'Failed to change password');
  }
};

export const saveAdminDetails = async (details: AdminDetails) => {
  try {
    // Try POST first (for new admin details), fallback to PUT (for updates)
    let response;
    try {
      response = await apiClient.post('/admin/details', details);
    } catch (error: any) {
      // If POST fails with "already exist" error, try PUT
      if (error.message.includes('already exist') || error.message.includes('400')) {
        response = await apiClient.put('/admin/details', details);
      } else {
        throw error;
      }
    }
    console.log('Admin details saved successfully:', response);
    return response;
  } catch (error: any) {
    console.error('Error in saveAdminDetails:', error);
    throw new Error(error.message || 'Failed to save admin details');
  }
};

export const getAdminDetails = async (userId: string) => {
  try {
    return await apiClient.get<AdminDetails>('/admin/details');
  } catch (error: any) {
    console.error('Error getting admin details:', error);
    throw new Error(error.message || 'Failed to get admin details');
  }
};

export const signOut = async () => {
  try {
    await removeAuthToken();
  } catch (error) {
    console.error('Error signing out:', error);
  }
};
