import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import React, { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { FAB, Portal, Text } from 'react-native-paper';
import { adminAPI, LibraryStats, MessageResponse } from '../../../config/api';
import { AdminStackParamList } from '../../../types/navigation';
import Header from '../../common/Header';
import ActionButton from './ActionButton';
import DashboardCard from './DashboardCard';
import RecentActivity from './RecentActivity';
import RecentMessages from './RecentMessages';


interface AdminDetails {
  id: string;
  library_name: string;
  total_seats: number;
}

type NavigationProps = NavigationProp<AdminStackParamList>;

interface DashboardStats {
  totalSeats: number;
  occupiedSeats: number;
  totalStudents: number;
  activeStudents: number;
  expiredStudents: number;
  presentStudents: number;
  availableSeats: number;
  pendingBookings: number;
  totalRevenue: number;
  monthlyRevenue: number;
  recentMessages: number;
  growthPercentage: number;
}

interface Activity {
  id: number;
  type: string;
  name: string;
  details: string;
  time: string;
  status: 'completed' | 'pending' | 'cancelled';
}



interface StudentMessage {
  id: number;
  student_name: string;
  message: string;
  timestamp: string;
  read: boolean;
  status: string;
}

// Helper function to calculate duration between two timestamps
const calculateDuration = (startTime: string, endTime: string): string => {
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  const durationMs = end - start;

  if (durationMs < 0) return 'Invalid duration';

  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};

const Dashboard: React.FC = () => {
  const navigation = useNavigation<NavigationProps>();
  const [loading, setLoading] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [libraryName, setLibraryName] = useState('');
  const [fabOpen, setFabOpen] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalSeats: 0,
    occupiedSeats: 0,
    totalStudents: 0,
    activeStudents: 0,
    expiredStudents: 0,
    presentStudents: 0,
    availableSeats: 0,
    pendingBookings: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    recentMessages: 0,
    growthPercentage: 0
  });

  const updateStats = useCallback((newStats: Partial<DashboardStats>) => {
    setStats(prevStats => {
      // Check if any values have actually changed
      const hasChanges = Object.keys(newStats).some(key => {
        const typedKey = key as keyof DashboardStats;
        return prevStats[typedKey] !== newStats[typedKey];
      });
      
      // Only update if there are actual changes
      if (hasChanges) {
        return {
          ...prevStats,
          ...newStats
        };
      }
      return prevStats;
    });
  }, []);

  // Memoize the dashboard stats object to prevent unnecessary re-renders
  const dashboardStatsForNavigation = React.useMemo(() => ({
    total_seats: typeof stats.totalSeats === 'number' ? stats.totalSeats : 0,
    total_students: typeof stats.totalStudents === 'number' ? stats.totalStudents : 0,
    active_students: typeof stats.activeStudents === 'number' ? stats.activeStudents : 0,
    occupied_seats: typeof stats.occupiedSeats === 'number' ? stats.occupiedSeats : 0
  }), [stats.totalSeats, stats.totalStudents, stats.activeStudents, stats.occupiedSeats]);

  const [activities, setActivities] = useState<Activity[]>([]);
  const [messages, setMessages] = useState<StudentMessage[]>([]);

  useEffect(() => {
    loadDashboardData();
    loadStudentMessages();

    // Set up polling for data updates instead of realtime subscriptions
    const dataPolling = setInterval(() => {
      loadDashboardData();
      loadStudentMessages();
    }, 30000); // Poll every 30 seconds

    return () => {
      clearInterval(dataPolling);
    };
  }, []);

  const loadStudentMessages = async () => {
    try {
      // Get student messages
      const messagesResponse = await adminAPI.getMessages({
        limit: 5
      });

      if (messagesResponse && Array.isArray(messagesResponse)) {
        const formattedMessages: StudentMessage[] = messagesResponse.map((msg: MessageResponse) => ({
          id: Number(msg.id),
          student_name: msg.student_name || 'Unknown Student',
          message: msg.message,
          timestamp: new Date(msg.created_at).toLocaleString(),
          read: msg.read,
          status: 'unknown' // This would need to be fetched separately if needed
        }));
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Error loading student messages:', error);
    }
  };



  const markMessageAsRead = async (messageId: number) => {
    try {
      await adminAPI.markMessageAsRead(messageId.toString());

      // Update the local state to reflect the change
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === messageId ? { ...msg, read: true } : msg
        )
      );
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Debug: Check authentication token
      const { getAuthToken } = await import('../../../config/api');
      const token = await getAuthToken();
      console.log('Dashboard - Auth token exists:', !!token);
      console.log('Dashboard - Token preview:', token ? `${token.substring(0, 20)}...` : 'None');

      // Get comprehensive dashboard analytics
      console.log('Dashboard - Calling getDashboardAnalytics...');
      const analyticsResponse = await adminAPI.getDashboardAnalytics();
      console.log('Dashboard - Analytics response:', analyticsResponse);
      const analytics = analyticsResponse;

      // Get admin profile for library name
      const profileResponse = await adminAPI.getProfile();
      const adminProfile = profileResponse;

      // Use the stats from API
      setAdminName(adminProfile?.admin_name || 'Admin');
      setLibraryName(adminProfile?.library_name || '');

      // Safely extract analytics data with fallbacks
      const libraryStats = (analytics as any)?.library_stats || {};
      const totalSeats = libraryStats.total_seats || 0;
      const availableSeats = libraryStats.available_seats || 0;
      const totalStudents = libraryStats.total_students || 0;
      const presentStudents = libraryStats.present_students || 0;
      const pendingBookings = libraryStats.pending_bookings || 0;
      const totalRevenue = libraryStats.total_revenue || 0;
      const monthlyRevenue = (analytics as any)?.monthly_revenue || 0;
      const recentMessages = (analytics as any)?.recent_messages || 0;
      const growthPercentage = (analytics as any)?.growth_percentage || 0;

      updateStats({
        totalSeats,
        occupiedSeats: totalStudents, // Use totalStudents as registered students
        totalStudents,
        activeStudents: totalStudents, // Assuming all students are active for now
        expiredStudents: 0, // This would need to be calculated separately
        presentStudents,
        availableSeats,
        pendingBookings,
        totalRevenue,
        monthlyRevenue: Number(monthlyRevenue),
        recentMessages: Number(recentMessages),
        growthPercentage: Number(growthPercentage)
      });

      // Create a simplified approach to get recent activities
      const recentActivities: Activity[] = [];
      let activityId = 1;

      try {
        // 1. Get recent student registrations
        const newStudents = await adminAPI.getStudents({
          limit: 5,
          order: 'created_at:desc'
        });

        if (newStudents && Array.isArray(newStudents) && newStudents.length > 0) {
          // Add student registrations to activities
          newStudents.forEach(student => {
            // New registrations
            recentActivities.push({
              id: activityId++,
              type: 'New Registration',
              name: student.name || 'Unknown Student',
              details: `Student ID: ${student.student_id || 'N/A'}, Status: ${student.subscription_status || 'N/A'}`,
              time: student.created_at || new Date().toISOString(),
              status: 'completed'
            });

            // Add status activities if student has a status
            if (student.status) {
              recentActivities.push({
                id: activityId++,
                type: student.status === 'Present' ? 'Check In' : 'Check Out',
                name: student.name || 'Unknown Student',
                details: `Status: ${student.status}, Last visit: ${student.last_visit ? new Date(student.last_visit).toLocaleDateString() : 'Not available'}`,
                time: student.last_visit || student.updated_at || new Date().toISOString(),
                status: 'completed'
              });
            }

            // Add subscription activities if student has subscription info
            if (student.subscription_status) {
              recentActivities.push({
                id: activityId++,
                type: 'Subscription',
                name: student.name || 'Unknown Student',
                details: `Status: ${student.subscription_status}, End date: ${student.subscription_end ? new Date(student.subscription_end).toLocaleDateString() : 'Not available'}`,
                time: student.updated_at || new Date().toISOString(),
                status: student.subscription_status.toLowerCase() === 'active' ? 'completed' : 'cancelled'
              });
            }
          });
        }

        // 2. Get recent messages as activities
        const recentMessagesResponse = await adminAPI.getMessages({
          limit: 5
        });

        if (recentMessagesResponse && Array.isArray(recentMessagesResponse)) {
          recentMessagesResponse.forEach((message: MessageResponse) => {
            recentActivities.push({
              id: activityId++,
              type: message.sender_type === 'student' ? 'New Message' : 'Response Sent',
              name: message.student_name || 'Unknown Student',
              details: message.message.length > 50 ? `${message.message.substring(0, 50)}...` : message.message,
              time: message.created_at || new Date().toISOString(),
              status: message.read ? 'completed' : 'pending'
            });
          });
        }

        // Sort all activities by time (most recent first)
        recentActivities.sort((a, b) => {
          return new Date(b.time).getTime() - new Date(a.time).getTime();
        });

        // Limit to 5 most recent activities
        setActivities(recentActivities.slice(0, 5));
      } catch (error) {
        console.error('Error generating activities:', error);
        // Set a default empty activities array
        setActivities([]);
      }

      console.log('Dashboard Stats:', {
        library_name: adminProfile?.library_name || 'Unknown Library',
        stats: analytics || 'No stats available',
        activities: recentActivities.length
      });
    } catch (error: any) {
      console.error('Error loading dashboard data:', error.message);
      console.error('Error details:', error);
      
      // Set default values on error
      updateStats({
        totalSeats: 0,
        occupiedSeats: 0,
        totalStudents: 0,
        activeStudents: 0,
        expiredStudents: 0,
        presentStudents: 0,
        availableSeats: 0,
        pendingBookings: 0,
        totalRevenue: 0,
        monthlyRevenue: 0,
        recentMessages: 0,
        growthPercentage: 0
      });
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Dashboard"
        username={adminName}
        libraryName={libraryName}
        showWelcome={true}
        hideBackButton={true}
        showBookSeatButton={true}
        onBookSeatPress={() => navigation.navigate('PendingBookings')}
        onProfilePress={() => navigation.navigate('Profile')}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6366F1" />
            </View>
          ) : (
            <>
              <DashboardCard
                title="Seats"
                value={`${stats.totalStudents}/${stats.totalSeats}`}
                subtitle="Registered/Total Seats"
                icon="seat"
                backgroundColor="#6366F1"
                textColor="#ffffff"
              />
              <DashboardCard
                title="Students"
                value={`${stats.presentStudents}/${stats.totalStudents}`}
                subtitle="Present/Total Students"
                icon="account-group"
                backgroundColor="#10B981"
                textColor="#ffffff"
              />
            </>
          )}
        </View>

        <View style={styles.actionsContainer}>
          <View style={styles.actionRow}>
            <ActionButton
              icon="chart-line"
              label="Analytics"
              onPress={() => navigation.navigate('Analytics')}
              backgroundColor="#EEF2FF"
            />
            <ActionButton
              icon="seat"
              label="Seat Manager"
              onPress={() => navigation.navigate('SeatManagementNew', {
                dashboardStats: dashboardStatsForNavigation,
                libraryName: libraryName || 'Admin'
              })}
              backgroundColor="#FEE2E2"
            />
          </View>
          <View style={styles.actionRow}>
            <ActionButton
              icon="account-multiple"
              label="Student Management"
              onPress={() => navigation.navigate('StudentManagement', { refresh: false })}
              backgroundColor="#ECFDF5"
            />
            <ActionButton
              icon="calendar-check"
              label="Student Attendance"
              onPress={() => navigation.navigate('StudentAttendance')}
              backgroundColor="#E0F2FE"
            />
          </View>

        </View>

        {/* Student Messages Section */}
        <RecentMessages />

        {/* Recent Activity Section */}
        <RecentActivity activities={activities} />
      </ScrollView>

      <Portal>
        <FAB.Group
          open={fabOpen}
          visible
          icon={fabOpen ? 'close' : 'account-plus'}
          actions={[
            {
              icon: 'account-plus',
              label: 'Add Single Student',
              onPress: () => navigation.navigate('SingleStudentRegistration'),
            },
            {
              icon: 'file-upload',
              label: 'Bulk Upload Students',
              onPress: () => navigation.navigate('BulkStudentUpload'),
            },
          ]}
          onStateChange={({ open }) => setFabOpen(open)}
          style={styles.fab}
        />
      </Portal>
      

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Add padding at bottom for FAB
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    gap: 16,
  },
  actionsContainer: {
    padding: 16,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 70,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  sectionContainer: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
});

export default Dashboard;
