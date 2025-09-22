import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient, getAuthToken } from '../config/api';
import { useAuth } from './AuthContext';
import { debugAuthState } from '../utils/auth';

interface StudentData {
  id: string;
  student_id: string;
  name: string;
  email: string;
  mobile_no: string;
  admin_id: string;
  auth_user_id: string;
  address: string;
  subscription_start: string;
  subscription_end: string;
  subscription_status: string;
  is_shift_student: boolean;
  shift_time: string | null;
  status: string;
  last_visit: string | null;
  admin_details?: {
    id: string;
    library_name: string;
    mobile_no: string;
    address: string;
    total_seats: number;
  } | null;
}

interface StudentContextType {
  studentData: StudentData | null;
  loading: boolean;
  error: string | null;
  refreshStudentData: () => Promise<void>;
}

const StudentContext = createContext<StudentContextType>({
  studentData: null,
  loading: false,
  error: null,
  refreshStudentData: async () => {},
});

export const useStudent = () => useContext(StudentContext);

export const StudentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isLoggedIn, studentId } = useAuth();

  const fetchStudentData = async () => {
    // Don't attempt to fetch if not logged in
    if (!isLoggedIn) {
      // Skip fetching and clear any existing data
      setStudentData(null);
      setError(null); // Clear any existing errors
      setLoading(false);
      console.log('Student not logged in, skipping data fetch');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Debug authentication state
      console.log('=== DEBUGGING AUTH STATE ===');
      await debugAuthState();
      console.log('=== END DEBUG ===');

      // Check if we have a valid token before making the request
      const token = await getAuthToken();
      if (!token) {
        console.log('No auth token found, skipping data fetch');
        setStudentData(null);
        setError('Authentication token not found');
        setLoading(false);
        return;
      }

      console.log('Fetching student profile data...');

      // Fetch student profile using FastAPI
      const studentProfile = await apiClient.get<StudentData>('/student/profile');

      if (!studentProfile) {
        console.log('No student profile found');
        setStudentData(null);
        setError('Student profile not found');
        setLoading(false);
        return;
      }

      console.log('Student profile fetched successfully:', studentProfile);

      // The FastAPI endpoint should return the complete student data with admin details
      setStudentData(studentProfile);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching student data:', err);
      
      // Handle specific authentication errors
      if (err.message?.includes('401') || err.message?.includes('Unauthorized') || err.message?.includes('Could not validate credentials')) {
        setError('Authentication failed. Please log in again.');
        // Clear the token and force re-authentication
        setStudentData(null);
      } else {
        setError(err.message || 'Failed to fetch student data');
        setStudentData(null);
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when auth state changes
  useEffect(() => {
    if (isLoggedIn) {
      // User is authenticated, try to fetch student data
      fetchStudentData();
    } else {
      // No authenticated user, clear student data
      setStudentData(null);
      setError(null);
    }
  }, [isLoggedIn]);

  // Clear data when user logs out
  useEffect(() => {
    if (!isLoggedIn) {
      setStudentData(null);
      setError(null);
    }
  }, [isLoggedIn]);

  return (
    <StudentContext.Provider
      value={{
        studentData,
        loading,
        error,
        refreshStudentData: fetchStudentData,
      }}
    >
      {children}
    </StudentContext.Provider>
  );
};
