import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api/v1';

// Token management
export const getAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('auth_token');
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

export const setAuthToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem('auth_token', token);
  } catch (error) {
    console.error('Error setting auth token:', error);
  }
};

export const removeAuthToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem('auth_token');
  } catch (error) {
    console.error('Error removing auth token:', error);
  }
};

// API Client class
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async getHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const token = await getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = await this.getHeaders();

    const config: RequestInit = {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch (parseError) {
          // If we can't parse JSON, use the status text
          errorMessage = response.statusText || errorMessage;
        }
        
        // Handle specific status codes
        if (response.status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else if (response.status === 403) {
          errorMessage = 'Access denied. You do not have permission to perform this action.';
        } else if (response.status === 404) {
          errorMessage = 'Resource not found.';
        } else if (response.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        }
        
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // GET request
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  // POST request
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT request
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // PATCH request
  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // Download file with authentication
  async download(endpoint: string): Promise<Blob> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = await this.getHeaders();

    // Remove Content-Type for file downloads
    const downloadHeaders = { ...headers };
    delete downloadHeaders['Content-Type'];

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: downloadHeaders,
      });
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('File download failed:', error);
      throw error;
    }
  }
}

// Create and export API client instance
export const apiClient = new ApiClient(API_BASE_URL);

// Database connection check
export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    // Use the health endpoint that exists at /api/v1/health
    await apiClient.get('/health');
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
};

// API Response Types
export interface AuthResponse {
  access_token: string;
  token_type: string;
  user_id?: string;
  is_first_login?: boolean;
  student_id?: string;
  message?: string;
}

export interface StudentProfile {
  id: string;
  student_id: string;
  auth_user_id: string;
  admin_id: string;
  name: string;
  email: string;
  mobile_no: string;
  address: string;
  subscription_start: string;
  subscription_end: string;
  subscription_status: 'Active' | 'Expired';
  is_shift_student: boolean;
  shift_time: string | null;
  status?: 'Present' | 'Absent';
  last_visit: string | null;
  created_at: string;
  updated_at: string;
}

// Export types for compatibility
export interface StudentDetails {
  id?: string;
  student_id?: string;
  auth_user_id: string;
  admin_id: string;
  name: string;
  email: string;
  mobile_no: string;
  address: string;
  subscription_start: string;
  subscription_end: string;
  subscription_status?: 'Active' | 'Expired';
  is_shift_student: boolean;
  shift_time: string | null;
  status?: 'Present' | 'Absent';
  last_visit: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AdminDetails {
  id: string;
  user_id: string;
  admin_name: string;
  library_name: string;
  mobile_no: string;
  address: string;
  total_seats: number;
  latitude?: number;
  longitude?: number;
  has_shift_system: boolean;
  shift_timings?: string[];
  referral_code?: string;
  created_at: string;
  updated_at: string;
}

// Dashboard Stats Interfaces
export interface LibraryStats {
  total_students: number;
  present_students: number;
  total_seats: number;
  available_seats: number;
  pending_bookings: number;
  total_revenue: number;
}

export interface DashboardAnalytics {
  library_stats: LibraryStats;
  recent_messages: number;
  monthly_revenue: number;
  growth_percentage: number;
}

// Message Interfaces
export interface MessageResponse {
  id: string;
  student_id: string;
  admin_id: string;
  message: string;
  student_name: string;
  admin_name?: string;
  sender_type: 'student' | 'admin';
  read: boolean;
  is_broadcast: boolean;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

// Analytics Interfaces
export interface AttendanceTrend {
  date: string;
  count: number;
}

export interface RevenueTrend {
  month: string;
  revenue: number;
}

// Admin API Functions
export const adminAPI = {
  // Get admin profile
  getProfile: async (): Promise<AdminDetails> => {
    return apiClient.get<AdminDetails>('/admin/details');
  },

  // Update admin profile
  updateProfile: async (data: Partial<AdminDetails>): Promise<AdminDetails> => {
    return apiClient.put<AdminDetails>('/admin/details', data);
  },

  // Get basic dashboard stats
  getStats: async () => {
    return apiClient.get('/admin/stats');
  },

  // Get comprehensive dashboard analytics
  getDashboardAnalytics: async () => {
    return apiClient.get('/admin/analytics/dashboard');
  },

  // Get attendance trends
  getAttendanceTrends: async (days: number = 30) => {
    return apiClient.get(`/admin/analytics/attendance-trends?days=${days}`);
  },

  // Get revenue trends
  getRevenueTrends: async (months: number = 12) => {
    return apiClient.get(`/admin/analytics/revenue-trends?months=${months}`);
  },

  // Get all students for admin
  getStudents: async (params?: { limit?: number; order?: string }): Promise<StudentProfile[]> => {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.order) queryParams.append('order', params.order);

    const url = `/admin/students${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return apiClient.get<StudentProfile[]>(url);
  },

  // Remove student
  removeStudent: async (studentId: string): Promise<void> => {
    return apiClient.delete(`/admin/students/${studentId}`);
  },

  // Update student
  updateStudent: async (studentId: string, data: Partial<StudentProfile>): Promise<StudentProfile> => {
    return apiClient.put<StudentProfile>(`/admin/students/${studentId}`, data);
  },

  // Get admin messages
  getMessages: async (params?: { student_id?: string; skip?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.student_id) queryParams.append('student_id', params.student_id);
    if (params?.skip) queryParams.append('skip', params.skip.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const url = `/messaging/admin/messages${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return apiClient.get(url);
  },

  // Mark message as read
  markMessageAsRead: async (messageId: string) => {
    return apiClient.put(`/messaging/admin/messages/${messageId}/read`);
  },

  // Send admin message
  sendMessage: async (data: { student_id?: string; message: string; is_broadcast?: boolean; image_url?: string }) => {
    return apiClient.post('/messaging/admin/send-message', data);
  },

  // Get pending bookings (placeholder for future implementation)
  getPendingBookings: async () => {
    // TODO: Implement when booking endpoints are available
    return [];
  },

  // Approve booking (placeholder for future implementation)
  approveBooking: async (bookingId: string) => {
    // TODO: Implement when booking endpoints are available
    return apiClient.put(`/admin/bookings/${bookingId}/approve`);
  },

  // Reject booking (placeholder for future implementation)
  rejectBooking: async (bookingId: string) => {
    // TODO: Implement when booking endpoints are available
    return apiClient.put(`/admin/bookings/${bookingId}/reject`);
  }
};

// Real-time placeholder (to be implemented with WebSockets)
export interface RealtimePayload<T> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T;
  old: T;
}
