import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient, getAuthToken, removeAuthToken } from '../config/api';

type Role = 'admin' | 'student' | null;

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  selectedRole: Role;
  isLoggedIn: boolean;
  showHome: boolean;
  studentId: string | null;
  studentName: string | null;
  adminName: string | null;
  adminId: string | null;
  libraryName: string | null;
  signOut: () => Promise<void>;
  setSelectedRole: (role: Role) => void;
  setIsLoggedIn: (value: boolean) => void;
  setShowHome: (value: boolean) => void;
  setStudentInfo: (id: string, name: string) => Promise<void>;
  setAdminName: (name: string | null) => void;
  setAdminId: (id: string | null) => void;
  setLibraryName: (name: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<Omit<AuthContextType, 'signOut' | 'setSelectedRole' | 'setIsLoggedIn' | 'setShowHome' | 'setStudentInfo' | 'setAdminName' | 'setAdminId' | 'setLibraryName'>>({
    user: null,
    loading: true,
    selectedRole: null,
    isLoggedIn: false,
    showHome: false,
    studentId: null,
    studentName: null,
    adminName: null,
    adminId: null,
    libraryName: null,
  });

  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log('Starting auth initialization...');

        // Check if we have a stored auth token
        const token = await getAuthToken();
        console.log('Token retrieved:', token ? 'Yes' : 'No');
        
        if (token) {
          console.log('Token length:', token.length);
          console.log('Token starts with:', token.substring(0, 20) + '...');
        }

        // Always set loading to false at the end, regardless of what happens
        let newState: Partial<Omit<AuthContextType, 'signOut' | 'setSelectedRole' | 'setIsLoggedIn' | 'setShowHome' | 'setStudentInfo' | 'setAdminName' | 'setAdminId' | 'setLibraryName'>> = { loading: false };

        if (token) {
          try {
            // Load user info from AsyncStorage
            const studentId = await AsyncStorage.getItem('studentId').catch(() => null);
            const studentName = await AsyncStorage.getItem('studentName').catch(() => null);
            const adminName = await AsyncStorage.getItem('adminName').catch(() => null);
            const userRole = await AsyncStorage.getItem('userRole').catch(() => null);
            const userEmail = await AsyncStorage.getItem('userEmail').catch(() => null);
            const userId = await AsyncStorage.getItem('userId').catch(() => null);

            console.log('Auth init - User role:', userRole);

            // Determine if this is a student or admin user
            const isStudentUser = userRole === 'student';
            const isAdminUser = userRole === 'admin';

            // Validate studentId if it exists
            let validatedStudentId = null;
            if (studentId) {
              // For student ID in UUID format (auth user ID)
              const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
              // For student ID in format LIBR12345
              const studentIdRegex = /^[A-Z]{4}\d{5}$/;

              if (uuidRegex.test(studentId) || studentIdRegex.test(studentId)) {
                validatedStudentId = studentId;
              } else {
                console.error('Invalid student ID format in AsyncStorage:', studentId);
                // Remove invalid studentId from AsyncStorage
                await AsyncStorage.removeItem('studentId').catch(err => {
                  console.error('Failed to remove invalid studentId:', err);
                });
              }
            }

            // Safely fetch admin data if admin user
            let adminData: any = null;
            if (isAdminUser) {
              try {
                adminData = await apiClient.get('/admin/details');
              } catch (dbError) {
                console.error('Failed to fetch admin data:', dbError);
              }
            }

            const user = userEmail && userId ? { id: userId, email: userEmail } : null;

            newState = {
              ...newState,
              user,
              selectedRole: userRole as Role || null,
              studentId: validatedStudentId,
              studentName: validatedStudentId ? studentName : null,
              adminName: isAdminUser ? adminName : null,
              libraryName: adminData?.library_name || null,
              isLoggedIn: !!token && ((isStudentUser && (!!validatedStudentId || !!userId)) || isAdminUser),
            };
            
            console.log('Auth state set:', {
              isLoggedIn: newState.isLoggedIn,
              selectedRole: newState.selectedRole,
              studentId: newState.studentId,
              studentName: newState.studentName,
              token: !!token
            });
            
            console.log('Auth state set:', {
              isLoggedIn: newState.isLoggedIn,
              selectedRole: newState.selectedRole,
              studentId: newState.studentId,
              studentName: newState.studentName
            });
          } catch (innerError) {
            console.error('Error processing auth data:', innerError);
            newState = {
              ...newState,
              user: null,
              isLoggedIn: false,
            };
          }
        } else {
          newState = {
            ...newState,
            user: null,
            studentId: null,
            studentName: null,
            adminName: null,
            libraryName: null,
            isLoggedIn: false,
          };
        }

        setState(prev => ({ ...prev, ...newState }));
        console.log('Auth initialization completed');
      } catch (error) {
        console.error('Auth initialization error:', error);
        setState(prev => ({
          ...prev,
          loading: false,
          user: null,
          isLoggedIn: false
        }));
      }
    };

    initAuth();

    // No need for auth state change listeners with FastAPI
    // Auth state is managed through token storage and manual updates
  }, []);

  const signOut = async () => {
    try {
      // First update the state to prevent any components from trying to access user data
      setState(prev => ({
        ...prev,
        user: null,
        selectedRole: null,
        isLoggedIn: false,
        studentId: null,
        studentName: null,
        adminName: null,
        libraryName: null,
      }));

      // Then clean up all storage and remove auth token
      await Promise.all([
        AsyncStorage.removeItem('studentId'),
        AsyncStorage.removeItem('studentName'),
        AsyncStorage.removeItem('adminName'),
        AsyncStorage.removeItem('studentToken'),
        AsyncStorage.removeItem('adminId'),
        AsyncStorage.removeItem('userRole'),
        AsyncStorage.removeItem('userEmail'),
        AsyncStorage.removeItem('userId'),
        removeAuthToken()
      ]);

      console.log('Sign out completed successfully');
    } catch (error) {
      console.error('Sign out error:', error);
      // Even if there's an error, we want to make sure the state is reset
      setState(prev => ({
        ...prev,
        user: null,
        selectedRole: null,
        isLoggedIn: false,
        studentId: null,
        studentName: null,
        adminName: null,
        libraryName: null,
      }));
    }
  };

  const setSelectedRole = (role: Role) => {
    setState(prev => ({ ...prev, selectedRole: role }));
  };

  const setIsLoggedIn = (value: boolean) => {
    setState(prev => ({ ...prev, isLoggedIn: value }));
  };

  const setStudentInfo = async (id: string, name: string) => {
    // Validate that id is a valid UUID before storing it
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    // Also accept student ID format like LIBR25001
    const studentIdRegex = /^[A-Z]{4}\d{5}$/;
    
    if (id && !uuidRegex.test(id) && !studentIdRegex.test(id)) {
      console.error('Invalid student ID format:', id);
      return;
    }

    if (id && name) {
      await AsyncStorage.setItem('studentId', id);
      await AsyncStorage.setItem('studentName', name);
    }
    setState(prev => ({
      ...prev,
      studentId: id,
      studentName: name,
      isLoggedIn: !!id && !!prev.user
    }));
  };

  const setAdminName = async (name: string | null) => {
    if (name) {
      await AsyncStorage.setItem('adminName', name);
    } else {
      await AsyncStorage.removeItem('adminName');
    }
    setState(prev => ({ ...prev, adminName: name }));
  };

  const setAdminId = async (id: string | null) => {
    if (id) {
      await AsyncStorage.setItem('adminId', id);
    } else {
      await AsyncStorage.removeItem('adminId');
    }
    setState(prev => ({ ...prev, adminId: id }));
  };

  const setLibraryName = (name: string | null) => {
    setState(prev => ({ ...prev, libraryName: name }));
  };

  const setShowHome = (value: boolean) => {
    setState(prev => ({ ...prev, showHome: value }));
  };

  const loadAdminInfo = async () => {
    try {
      const [savedAdminName, savedAdminId] = await Promise.all([
        AsyncStorage.getItem('adminName'),
        AsyncStorage.getItem('adminId')
      ]);

      if (savedAdminName) {
        setState(prev => ({ ...prev, adminName: savedAdminName }));
      }

      if (savedAdminId) {
        setState(prev => ({ ...prev, adminId: savedAdminId }));
      }
    } catch (error) {
      console.error('Error loading admin info:', error);
    }
  };

  useEffect(() => {
    loadAdminInfo();
  }, []);

  const value = {
    ...state,
    signOut,
    setSelectedRole,
    setIsLoggedIn,
    setShowHome,
    setStudentInfo,
    setAdminName,
    setAdminId,
    setLibraryName,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
