import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

// Admin Tab Navigator Params
export type AdminTabParamList = {
  Home: undefined;
  Dashboard: undefined;
  Chat: undefined;
  Profile: undefined;
};

// Student Tab Navigator Params
export type StudentTabParamList = {
  StudentHomeTab: undefined;
  BookSeatTab: undefined;
  StudentDashboardTab: undefined;
  StudentChatTab: undefined;
  StudentProfileTab: undefined;
  FindLibraryTab: undefined;
};

// Student Tab Screen Names (for navigation)
export type StudentTabScreens = keyof StudentTabParamList;

// Admin Stack Navigator Params
export type AdminStackParamList = {
  MainDashboard: undefined;
  StudentManagement: {
    refresh?: boolean;
    studentId?: string;
    selectForChat?: boolean;
  };
  SeatManagement: {
    dashboardStats: {
      total_seats: number;
      total_students: number;
      active_students: number;
      occupied_seats: number;
    };
    libraryName: string;
  };
  SeatManagementNew: {
    dashboardStats: {
      total_seats: number;
      total_students: number;
      active_students: number;
      occupied_seats: number;
    };
    libraryName: string;
  };
  StudentAttendance: undefined;
  StudentAttendanceDetails: {
    studentId: string;
    studentName: string;
    authUserId?: string;
    status?: 'Present' | 'Absent';
    lastVisit?: string | null;
  };
  PendingBookings: undefined;
  Analytics: undefined;
  Chat: {
    studentId?: string;
    studentUserId?: string;
    studentName?: string;
    fromAttendance?: boolean;
  };
  AdminChatSelector: undefined;
  EditStudent: { studentId: string };
  Refer: {
    userType: 'admin' | 'student';
    userName?: string;
    libraryName?: string;
  };
  StudentDetails: { studentId: string };
  StudentMessages: { isRecentMessages?: boolean };
  AddSubscriptionPlan: {
    libraryId: string;
    editingPlan?: {
      id: string;
      library_id: string;
      months: number;
      amount: number;
      discounted_amount: number | null;
      is_custom: boolean;
      created_at: string;
      updated_at: string;
    };
  };
  BulkStudentUpload: undefined;
  SingleStudentRegistration: undefined;
  BulkRegistration: undefined;
  SingleRegistration: undefined;
  Profile: undefined;
};

// Root Stack Navigator Params
export type RootStackParamList = {
  UseRole: undefined;
  AdminLogin: undefined;
  AdminDashboard: NavigatorScreenParams<AdminTabParamList>;
  StudentLogin: undefined;
  StudentPasswordSetup: { studentId: string };
  StudentHome: NavigatorScreenParams<StudentTabParamList>;
  AdminDetails: undefined;
  FindLibrary: undefined;
  BookSeat: undefined;
  Refer: { userType: 'admin' | 'student'; userName?: string; libraryName?: string; };
  StudentChat: undefined;
  StudentProfile: undefined;
  StudentDashboard: undefined;
  AttendanceDetails: { studentId: string };
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type AdminStackScreenProps<T extends keyof AdminStackParamList> =
  NativeStackScreenProps<AdminStackParamList, T>;

export type AdminTabScreenProps<T extends keyof AdminTabParamList> =
  BottomTabScreenProps<AdminTabParamList, T>;

export type StudentTabScreenProps<T extends keyof StudentTabParamList> =
  BottomTabScreenProps<StudentTabParamList, T>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
