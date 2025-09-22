import { apiClient } from '../config/api';

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

export interface StudentRegistrationResponse {
  user_id: string;
  email: string;
  user_type: string;
  is_first_login: boolean;
  student_id: string;
}

export interface LibraryStats {
  total_students: number;
  present_students: number;
  total_seats: number;
  available_seats: number;
  pending_bookings: number;
  total_revenue: number;
}

export const addStudent = async (details: Omit<StudentDetails, 'admin_id' | 'student_id'>): Promise<StudentRegistrationResponse> => {
  try {
    // Validate required fields
    if (!details.name || !details.email || !details.mobile_no || !details.address || 
        !details.subscription_start || !details.subscription_end) {
      throw new Error('All required fields must be provided');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(details.email)) {
      throw new Error('Invalid email format');
    }

    // Validate mobile number (10 digits)
    const mobileRegex = /^\d{10}$/;
    if (!mobileRegex.test(details.mobile_no)) {
      throw new Error('Mobile number must be 10 digits');
    }

    // Validate shift time if student is shift student
    if (details.is_shift_student && !details.shift_time) {
      throw new Error('Shift time is required for shift students');
    }

    const response = await apiClient.post<StudentRegistrationResponse>('/auth/admin/student/signup', {
      ...details,
    });

    return response;
  } catch (error: any) {
    console.error('Error adding student:', error);
    throw new Error(error.message || 'Failed to add student');
  }
};

export const getLibraryStats = async (adminId: string): Promise<LibraryStats> => {
  try {
    return await apiClient.get<LibraryStats>('/admin/stats');
  } catch (error: any) {
    console.error('Error getting library stats:', error);
    throw new Error(error.message || 'Failed to get library stats');
  }
};

export const getStudentsByAdmin = async (adminId: string): Promise<StudentDetails[]> => {
  try {
    return await apiClient.get<StudentDetails[]>('/admin/students');
  } catch (error: any) {
    console.error('Error getting students:', error);
    throw new Error(error.message || 'Failed to get students');
  }
};

export const updateStudent = async (studentId: string, updates: Partial<StudentDetails>): Promise<StudentDetails> => {
  try {
    return await apiClient.put<StudentDetails>(`/admin/students/${studentId}`, updates);
  } catch (error: any) {
    console.error('Error updating student:', error);
    throw new Error(error.message || 'Failed to update student');
  }
};

export const getStudentProfile = async (): Promise<StudentDetails> => {
  try {
    return await apiClient.get<StudentDetails>('/student/profile');
  } catch (error: any) {
    console.error('Error getting student profile:', error);
    throw new Error(error.message || 'Failed to get student profile');
  }
};

export const updateStudentProfile = async (updates: Partial<StudentDetails>): Promise<StudentDetails> => {
  try {
    return await apiClient.put<StudentDetails>('/student/profile', updates);
  } catch (error: any) {
    console.error('Error updating student profile:', error);
    throw new Error(error.message || 'Failed to update student profile');
  }
};

// Attendance functions
export const checkInStudent = async (latitude?: number, longitude?: number) => {
  try {
    return await apiClient.post('/student/attendance/checkin', {
      latitude,
      longitude
    });
  } catch (error: any) {
    console.error('Error checking in student:', error);
    throw new Error(error.message || 'Failed to check in');
  }
};

export const checkOutStudent = async () => {
  try {
    return await apiClient.post('/student/attendance/checkout');
  } catch (error: any) {
    console.error('Error checking out student:', error);
    throw new Error(error.message || 'Failed to check out');
  }
};

export const getStudentAttendance = async (skip: number = 0, limit: number = 100) => {
  try {
    return await apiClient.get(`/student/attendance?skip=${skip}&limit=${limit}`);
  } catch (error: any) {
    console.error('Error getting student attendance:', error);
    throw new Error(error.message || 'Failed to get attendance');
  }
};

// Task functions
export const createTask = async (taskData: {
  title: string;
  description?: string;
  due_date?: string;
  priority?: string;
}) => {
  try {
    return await apiClient.post('/student/tasks', taskData);
  } catch (error: any) {
    console.error('Error creating task:', error);
    throw new Error(error.message || 'Failed to create task');
  }
};

export const getTasks = async (completed?: boolean, skip: number = 0, limit: number = 100) => {
  try {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    });
    
    if (completed !== undefined) {
      params.append('completed', completed.toString());
    }
    
    return await apiClient.get(`/student/tasks?${params.toString()}`);
  } catch (error: any) {
    console.error('Error getting tasks:', error);
    throw new Error(error.message || 'Failed to get tasks');
  }
};

export const updateTask = async (taskId: string, updates: {
  title?: string;
  description?: string;
  due_date?: string;
  completed?: boolean;
  priority?: string;
}) => {
  try {
    return await apiClient.put(`/student/tasks/${taskId}`, updates);
  } catch (error: any) {
    console.error('Error updating task:', error);
    throw new Error(error.message || 'Failed to update task');
  }
};

export const deleteTask = async (taskId: string) => {
  try {
    return await apiClient.delete(`/student/tasks/${taskId}`);
  } catch (error: any) {
    console.error('Error deleting task:', error);
    throw new Error(error.message || 'Failed to delete task');
  }
};

// Exam functions
export const createExam = async (examData: {
  exam_name: string;
  exam_date: string;
  notes?: string;
}) => {
  try {
    return await apiClient.post('/student/exams', examData);
  } catch (error: any) {
    console.error('Error creating exam:', error);
    throw new Error(error.message || 'Failed to create exam');
  }
};

export const getExams = async (skip: number = 0, limit: number = 100) => {
  try {
    return await apiClient.get(`/student/exams?skip=${skip}&limit=${limit}`);
  } catch (error: any) {
    console.error('Error getting exams:', error);
    throw new Error(error.message || 'Failed to get exams');
  }
};

export const updateExam = async (examId: string, updates: {
  exam_name?: string;
  exam_date?: string;
  notes?: string;
  is_completed?: boolean;
}) => {
  try {
    return await apiClient.put(`/student/exams/${examId}`, updates);
  } catch (error: any) {
    console.error('Error updating exam:', error);
    throw new Error(error.message || 'Failed to update exam');
  }
};

export const deleteExam = async (examId: string) => {
  try {
    return await apiClient.delete(`/student/exams/${examId}`);
  } catch (error: any) {
    console.error('Error deleting exam:', error);
    throw new Error(error.message || 'Failed to delete exam');
  }
};
