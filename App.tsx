import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { NavigationProp } from '@react-navigation/native';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { MD3LightTheme, PaperProvider, Text } from 'react-native-paper';
import TabIcon from './components/common/TabIcon';
import { AuthProvider, useAuth as useAuthContext } from './contexts/AuthContext';
import { StudentProvider } from './contexts/StudentContext';
import { checkNotifications, registerBackgroundTasks, unregisterBackgroundTasks } from './services/backgroundTaskService';

// Import screens
import AdminDetails from './components/Admin/Admin_Details';
import AdminLogin from './components/Admin/Adminlogin';
import Chat from './components/Admin/Chat_Fixed';
import Analytics from './components/Admin/Dashboard/Analytics';
import Dashboard from './components/Admin/Dashboard/dashboard';
import EditStudent from './components/Admin/Dashboard/EditStudent_fixed';
import { SeatManagementNew } from './components/Admin/Dashboard/Seat_management';

import StudentAttendance from './components/Admin/Dashboard/St_Attendance';
import StudentManagement from './components/Admin/Dashboard/St_management';
import StudentAttendanceDetails from './components/Admin/Dashboard/StudentAttendanceDetails';
import Home from './components/Admin/Home';
import AddSubscriptionPlan from './components/Admin/Profile/AddSubscriptionPlan';
import Profile from './components/Admin/Profile/Profile';
import Refer from './components/Admin/Refer/Refer';
import BulkStudentUpload from './components/Admin/StudentRegistration/BulkStudentUpload';
import SingleStudentRegistration from './components/Admin/StudentRegistration/SingleStudentRegistration';
import StudentDetails from './components/Admin/StudentRegistration/StudentDetails';
import BookSeat from './components/Student/Book_Seat/BookSeat';
import FindLibrary from './components/Student/Book_Seat/FindLibrary';
import AttendanceDetails from './components/Student/St_Dashboard/AttendanceDetails';
import StudentDashboard from './components/Student/St_Dashboard/Stu_Dashboard';
import StudentChat from './components/Student/Stud_Chat_Fixed';
import StudentProfile from './components/Student/Stud_Profile';
import StudentHome from './components/Student/Student_Home';
import StudentLogin from './components/Student/Student_Login';
import UseRole from './components/UseRole';

// Import types
import {
    AdminStackParamList,
    AdminTabParamList,
    RootStackParamList,
    StudentTabParamList
} from './types/navigation';

// Define navigation types
type StudentNavigationProp = NavigationProp<RootStackParamList>;

const Stack = createNativeStackNavigator<RootStackParamList>();
const AdminStack = createNativeStackNavigator<AdminStackParamList>();
const AdminTab = createBottomTabNavigator<AdminTabParamList>();
const StudentTab = createBottomTabNavigator<StudentTabParamList>();


// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoggedIn } = useAuthContext();
  return isLoggedIn ? <>{children}</> : null;
};

// Student Tab Navigator
const StudentTabNavigator: React.FC = () => {
  const { isLoggedIn } = useAuthContext();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const handleProtectedPress = () => {
    if (!isLoggedIn) {
      navigation.navigate('StudentLogin');
    }
  };

  // Define different tab navigators based on authentication status
  if (isLoggedIn) {
    // Authenticated student tabs
    return (
      <StudentTab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#4F46E5',
          tabBarInactiveTintColor: '#6B7280',
          headerShown: false // Hide the header to prevent duplicate headers
        }}
      >
        <StudentTab.Screen
          name="StudentHomeTab"
          component={StudentHome}
          options={{
            tabBarIcon: ({ color, size }) => (
              <TabIcon name="home" size={size} color={color} />
            ),
            title: 'Home'
          }}
        />
        <StudentTab.Screen
          name="StudentChatTab"
          component={StudentChat}
          options={{
            tabBarIcon: ({ color, size }) => (
              <TabIcon name="chat" size={size} color={color} />
            ),
            title: 'Chat'
          }}
        />
        <StudentTab.Screen
          name="StudentDashboardTab"
          component={StudentDashboard}
          options={{
            tabBarIcon: ({ color, size }) => (
              <TabIcon name="view-dashboard" size={size} color={color} />
            ),
            title: 'Dashboard'
          }}
        />
        <StudentTab.Screen
          name="StudentProfileTab"
          component={StudentProfile}
          options={{
            tabBarIcon: ({ color, size }) => (
              <TabIcon name="account" size={size} color={color} />
            ),
            title: 'Profile'
          }}
        />
      </StudentTab.Navigator>
    );
  } else {
    // Unauthenticated student tabs
    return (
      <StudentTab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#4F46E5',
          tabBarInactiveTintColor: '#6B7280',
          headerShown: false // Hide the header to prevent duplicate headers
        }}
      >
        <StudentTab.Screen
          name="StudentHomeTab"
          component={StudentHome}
          options={{
            tabBarIcon: ({ color, size }) => (
              <TabIcon name="home" size={size} color={color} />
            ),
            title: 'Home'
          }}
        />
        <StudentTab.Screen
          name="FindLibraryTab"
          component={FindLibrary}
          options={{
            tabBarIcon: ({ color, size }) => (
              <TabIcon name="library" size={size} color={color} />
            ),
            title: 'Find Library'
          }}
        />
        <StudentTab.Screen
          name="BookSeatTab"
          component={BookSeat}
          options={{
            tabBarIcon: ({ color, size }) => (
              <TabIcon name="seat" size={size} color={color} />
            ),
            title: 'Book Seat'
          }}
        />
      </StudentTab.Navigator>
    );
  }
};

// Create a custom theme
const styles = StyleSheet.create({
  disabledTab: {
    opacity: 0.5
  }
});

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6200ee',
    secondary: '#03dac6',
    error: '#b00020',
  },
};

const AdminStackNavigator = () => {
  return (
    <AdminStack.Navigator
      initialRouteName="MainDashboard"
      screenOptions={{ headerShown: false }}
    >
      <AdminStack.Screen name="MainDashboard" component={AdminTabNavigator} />
      <AdminStack.Screen
        name="StudentManagement"
        component={StudentManagement}
        options={{ headerShown: false }}
      />
      <AdminStack.Screen
        name="EditStudent"
        component={EditStudent}
        options={{ headerShown: false }}
      />
      <AdminStack.Screen
        name="PendingBookings"
        component={require('./components/Admin/Dashboard/BookingRequests').default}
        options={{ headerShown: false }}
      />

      <AdminStack.Screen
        name="SeatManagementNew"
        component={SeatManagementNew}
        options={({ route }) => ({
          title: 'Seat Management',
          headerShown: false
        })}
      />
      <AdminStack.Screen name="StudentAttendance" component={StudentAttendance} />
      <AdminStack.Screen
        name="StudentAttendanceDetails"
        component={StudentAttendanceDetails}
        options={{
          headerShown: false,
          animation: 'slide_from_right'
        }}
      />
      <AdminStack.Screen name="Analytics" component={Analytics} />
      <AdminStack.Screen
        name="Refer"
        component={Refer}
        options={{ headerShown: false }}
      />
      <AdminStack.Screen
        name="SingleStudentRegistration"
        component={SingleStudentRegistration}
        options={{ headerShown: false }}
      />
      <AdminStack.Screen
        name="BulkStudentUpload"
        component={BulkStudentUpload}
        options={{ headerShown: false }}
      />
      <AdminStack.Screen
        name="StudentDetails"
        component={StudentDetails}
        options={{
          headerShown: true,
          title: 'Student Details',
          animation: 'slide_from_right'
        }}
      />
      <AdminStack.Screen
        name="Chat"
        component={require('./components/Admin/Chat_Fixed').default}
        options={{
          headerShown: false,
          animation: 'slide_from_right'
        }}
      />
      <AdminStack.Screen
        name="AdminChatSelector"
        component={require('./components/Admin/AdminChatSelector').default}
        options={{
          headerShown: false,
          animation: 'slide_from_right'
        }}
      />
      <AdminStack.Screen
        name="StudentMessages"
        component={require('./components/Admin/Dashboard/StudentMessages').default}
        initialParams={{ isRecentMessages: false }}
        options={{
          headerShown: true,
          title: 'All Messages',
          animation: 'slide_from_right'
        }}
      />
      <AdminStack.Screen
        name="AddSubscriptionPlan"
        component={AddSubscriptionPlan}
        options={{
          headerShown: true,
          title: 'Subscription Plan',
          animation: 'slide_from_right'
        }}
      />
      <AdminStack.Screen
        name="Profile"
        component={Profile}
        options={{
          headerShown: true,
          title: 'Profile',
          animation: 'slide_from_right'
        }}
      />
    </AdminStack.Navigator>
  );
};

const AdminTabNavigator = () => {
  return (
    <AdminTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'white',
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          height: 60,
          paddingBottom: 8,
        }
      }}
    >
      <AdminTab.Screen
        name="Home"
        component={Home}
        options={{
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="home" size={size} color={color} />
          ),
        }}
      />
      <AdminTab.Screen
        name="Dashboard"
        component={Dashboard}
        options={{
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="view-dashboard" size={size} color={color} />
          ),
        }}
      />
      <AdminTab.Screen
        name="Chat"
        component={require('./components/Admin/AdminChatSelector').default}
        options={{
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="chat" size={size} color={color} />
          ),
        }}
      />
      <AdminTab.Screen
        name="Profile"
        component={Profile}
        options={{
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="account" size={size} color={color} />
          ),
        }}
      />
    </AdminTab.Navigator>
  );
};



// Error boundary component to catch rendering errors
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI when an error occurs
      return (
        <PaperProvider theme={theme}>
          <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>Library Connekto</Text>
            <Text style={{ fontSize: 16, textAlign: 'center', marginBottom: 20 }}>
              We're experiencing some technical difficulties. Please try again later.
            </Text>
            <Text style={{ fontSize: 14, color: '#666' }}>Version 2.0.0</Text>
          </SafeAreaView>
        </PaperProvider>
      );
    }

    return this.props.children;
  }
}

const App = () => {
  // State to track if the app is ready
  const [isAppReady, setIsAppReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Register background tasks and do an initial check for notifications when the app starts
  useEffect(() => {
    const setupApp = async () => {
      try {
        console.log('Setting up app...');
        // Setup background tasks
        try {
          await registerBackgroundTasks();
          await checkNotifications();
          console.log('Background tasks and notifications setup completed');
        } catch (taskError) {
          console.error('Failed to setup background tasks:', taskError);
          // Continue even if background tasks fail
        }

        // Mark app as ready
        setIsAppReady(true);
      } catch (error) {
        console.error('App setup error:', error);
        setError(error instanceof Error ? error : new Error('Unknown error during app setup'));
        // Still mark as ready so we can show an error screen instead of hanging
        setIsAppReady(true);
      }
    };

    setupApp();

    // Clean up when the app is closed
    return () => {
      try {
        unregisterBackgroundTasks();
      } catch (error) {
        console.error('Error unregistering background tasks:', error);
      }
    };
  }, []);

  // Show a loading screen while the app is initializing
  if (!isAppReady) {
    return (
      <PaperProvider theme={theme}>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Loading Library Connekto...</Text>
        </SafeAreaView>
      </PaperProvider>
    );
  }

  // Show an error screen if there was an error during setup
  if (error) {
    return (
      <PaperProvider theme={theme}>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>Library Connekto</Text>
          <Text style={{ fontSize: 16, textAlign: 'center', marginBottom: 20 }}>
            We encountered an error while starting the app. Please try again later.
          </Text>
          <Text style={{ fontSize: 14, color: '#666' }}>Version 2.0.0</Text>
        </SafeAreaView>
      </PaperProvider>
    );
  }

  // Main app rendering
  return (
    <ErrorBoundary>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <StudentProvider>
            <NavigationContainer fallback={<Text>Loading...</Text>}>
              <Stack.Navigator
                initialRouteName="UseRole"
                screenOptions={{ headerShown: false }}
              >
                <Stack.Screen name="UseRole" component={UseRole} />
                <Stack.Screen name="AdminLogin" component={AdminLogin} />
                <Stack.Screen name="AdminDetails" component={AdminDetails} />
                <Stack.Screen name="AdminDashboard" component={AdminStackNavigator} />
                <Stack.Screen name="StudentLogin" component={StudentLogin} />
                <Stack.Screen name="StudentPasswordSetup" component={require('./components/Student/StudentPasswordSetup').default} />
                <Stack.Screen name="StudentHome" component={StudentTabNavigator} />
                <Stack.Screen name="FindLibrary" component={FindLibrary} />
                <Stack.Screen name="BookSeat" component={BookSeat} />
                <Stack.Screen name="Refer" component={Refer} options={{ headerShown: false }} />
                <Stack.Screen name="AttendanceDetails" component={AttendanceDetails} options={{ headerShown: false }} />
              </Stack.Navigator>
            </NavigationContainer>
          </StudentProvider>
        </AuthProvider>
      </PaperProvider>
    </ErrorBoundary>
  );
};

export default App;
