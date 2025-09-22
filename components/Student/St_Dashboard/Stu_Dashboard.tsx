import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { apiClient } from '../../../config/api';
import { useAuth } from '../../../contexts/AuthContext';
import { RootStackParamList } from '../../../types/navigation';
import Header from '../../common/Header';
import AdminMessages from './AdminMessages';
import ExamDetails from './ExamDetails_new';
import PracticePapers from './PracticePapers';
import StudyTimeCard from './StudyTimeCard';
import TasksCompletedCard from './TasksCompletedCard';
import TodaySchedule from './TodaySchedule';
import WeeklyStudyChart from './WeeklyStudyChart';

type NavigationProp = StackNavigationProp<RootStackParamList>;

const mockWeeklyData = [2, 1.5, 3, 2.5, 4, 3.5, 2];
const mockSchedule = [
  { id: '1', title: 'IELTS Reading Practice', time: '09:00 AM', completed: true },
  { id: '2', title: 'GRE Vocabulary Session', time: '11:00 AM' },
  { id: '3', title: 'Mock Test Practice', time: '02:30 PM' },
  { id: '4', title: 'Review Session', time: '04:30 PM' },
];
const mockMessages = [
  {
    id: '1',
    text: 'Your query regarding GRE exam pattern has been resolved.',
    time: '2 hours ago',
    type: 'info' as const,
  },
  {
    id: '2',
    text: 'New study materials have been added to your IELTS course.',
    time: 'Yesterday',
    type: 'success' as const,
  },
  {
    id: '3',
    text: 'Important announcement: Mock test schedule updated for next week.',
    time: '2 days ago',
    type: 'warning' as const,
  },
];

const Stu_Dashboard: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user, studentName } = useAuth();
  const [loading, setLoading] = useState(true);
  const [studyHours, setStudyHours] = useState(0);
  const [activeSession, setActiveSession] = useState(false);
  const [lastDayStudyHours, setLastDayStudyHours] = useState(0);
  const [todayEntryTime, setTodayEntryTime] = useState<string | null>(null);
  const [tasksCompleted, setTasksCompleted] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [weeklyStudyData, setWeeklyStudyData] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [weeklyDataLoading, setWeeklyDataLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedExam, setSelectedExam] = useState("");
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduleTask, setScheduleTask] = useState("");
  const [examDate, setExamDate] = useState("");

  useEffect(() => {
    if (user) {
      fetchStudentData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchStudentData = async () => {
    try {
      setLoading(true);

      // Get student profile using FastAPI
      const studentData = await apiClient.get('/student/profile');

      if (!studentData) {
        console.error('Error fetching student profile');
        setLoading(false);
        return;
      }

      setStudentId(studentData.id);

      // Fetch today's study time and entry time
      await fetchTodayStudyTime(studentData.id);

      // Fetch last day's study time
      await fetchLastDayStudyTime(studentData.id);

      // Fetch weekly study hours
      await fetchWeeklyStudyHours(studentData.id);

      // Fetch tasks completed
      await fetchTasksCompleted(studentData.id);

    } catch (error) {
      console.error('Error fetching student data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayStudyTime = async (studentId: string) => {
    try {
      // Get today's date in IST (Indian Standard Time) - using a simpler approach
      const now = new Date();

      // First, check for any active attendance records (with entry_time but no exit_time)
      try {
        const activeAttendance = await apiClient.get(`/students/${studentId}/attendance/active`);
        
        if (activeAttendance && activeAttendance.length > 0) {
          console.log('Found active attendance record:', JSON.stringify(activeAttendance[0]));

          // We have an active session, calculate study time from entry until now
          const entryTime = new Date(activeAttendance[0].entry_time);
          const currentTime = new Date();

          // Format entry time for display in IST
          const entryTimeOptions = {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: 'Asia/Kolkata',
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          };
          const formattedEntryTime = entryTime.toLocaleString('en-IN', entryTimeOptions);
          console.log('Setting today\'s entry time:', formattedEntryTime);
          setTodayEntryTime(formattedEntryTime);

          // Calculate duration in milliseconds
          const durationMs = currentTime.getTime() - entryTime.getTime();

          // Convert to hours and round to 1 decimal place
          const durationHours = durationMs / (1000 * 60 * 60);
          const roundedHours = Math.round(durationHours * 10) / 10;

          console.log(`Active session duration: ${roundedHours} hours`);
          setStudyHours(roundedHours);
          setActiveSession(true);
          return; // Exit early since we've calculated the study time
        }
      } catch (error) {
        console.error('Error checking active attendance:', error);
      }

      // If no active session, proceed with fetching today's attendance records
      // Format the date as YYYY-MM-DD in local timezone
      const todayStr = now.toISOString().split('T')[0];

      // For logging, format the date in Indian format
      const options = { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Kolkata' };
      const istDateStr = now.toLocaleDateString('en-IN', options);

      console.log('Fetching attendance for IST date:', istDateStr);

      // Fetch attendance records for today
      try {
        const attendanceData = await apiClient.get(`/students/${studentId}/attendance/today`);
        
        if (!attendanceData) {
          console.error('Error fetching attendance');
          return;
        }

        console.log('Attendance records found:', attendanceData?.length || 0);

        // Calculate total study hours for today
        let totalHours = 0;
        const currentTime = new Date();

        if (attendanceData && attendanceData.length > 0) {
          // Get the most recent entry time for display
          const mostRecentRecord = attendanceData[0]; // Since we ordered by entry_time descending
          if (mostRecentRecord && mostRecentRecord.entry_time) {
            const entryTime = new Date(mostRecentRecord.entry_time);

            // Format entry time for display in IST
            const entryTimeOptions = {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
              timeZone: 'Asia/Kolkata',
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            };
            const formattedEntryTime = entryTime.toLocaleString('en-IN', entryTimeOptions);
            console.log('Setting today\'s entry time (from completed session):', formattedEntryTime);
            setTodayEntryTime(formattedEntryTime);
          }

          // Calculate total study time
          attendanceData.forEach(record => {
            if (record.entry_time) {
              // Parse entry time
              const entryTime = new Date(record.entry_time);

              // Format for display in IST (for logging)
              const entryTimeOptions = {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
                timeZone: 'Asia/Kolkata',
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              };
              const formattedEntryTime = entryTime.toLocaleString('en-IN', entryTimeOptions);
              console.log('Processing record with entry time:', formattedEntryTime);

              if (record.exit_time) {
                // Calculate duration for completed session
                const exitTime = new Date(record.exit_time);
                const durationMs = exitTime.getTime() - entryTime.getTime();
                const durationHours = durationMs / (1000 * 60 * 60);
                totalHours += durationHours;

                console.log(`Completed session: ${durationHours.toFixed(2)} hours`);
              } else {
                // For incomplete session, calculate until current time
                const durationMs = currentTime.getTime() - entryTime.getTime();
                const durationHours = durationMs / (1000 * 60 * 60);
                totalHours += durationHours;

                console.log(`Incomplete session: ${durationHours.toFixed(2)} hours`);
              }
            }
          });

          // Round to 1 decimal place
          const roundedTotalHours = Math.round(totalHours * 10) / 10;
          console.log(`Total study hours for today: ${roundedTotalHours}`);
          setStudyHours(roundedTotalHours);
        } else {
          console.log('No attendance records found for today');
          setStudyHours(0);
        }
      } catch (error) {
        console.error('Error fetching attendance data:', error);
        setStudyHours(0);
      }
    } catch (error) {
      console.error('Error in fetchTodayStudyTime:', error);
      setStudyHours(0);
    }
  };

  const fetchLastDayStudyTime = async (studentId: string) => {
    try {
      // Get yesterday's date
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);

      // Format as YYYY-MM-DD
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      const todayStr = now.toISOString().split('T')[0];

      // For logging, format the date in Indian format
      const options = { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Kolkata' };
      const istDateStr = yesterday.toLocaleDateString('en-IN', options);

      console.log('Fetching last day attendance for date:', istDateStr);

      // Fetch attendance records for yesterday using FastAPI
      const attendanceData = await apiClient.get(`/students/${studentId}/attendance/yesterday`);
      
      if (!attendanceData) {
        console.error('Error fetching last day attendance');
        return;
      }

      console.log('Last day attendance records found:', attendanceData?.length || 0);

      // Calculate total study hours for yesterday
      let totalHours = 0;

      if (attendanceData && attendanceData.length > 0) {
        attendanceData.forEach(record => {
          if (record.entry_time) {
            // Parse entry time
            const entryTime = new Date(record.entry_time);

            let exitTime;

            if (record.exit_time) {
              // If exit time exists, use it
              exitTime = new Date(record.exit_time);
            } else {
              // If no exit time, use end of day
              exitTime = new Date(entryTime);
              exitTime.setHours(23, 59, 59, 999);
            }

            // Calculate duration in milliseconds
            const durationMs = exitTime.getTime() - entryTime.getTime();

            // Convert to hours
            const durationHours = durationMs / (1000 * 60 * 60);

            // Add to total
            totalHours += durationHours;
            console.log(`Last day duration: ${durationHours.toFixed(2)} hours`);
          }
        });
      }

      // Round to 1 decimal place
      const roundedHours = Math.round(totalHours * 10) / 10;
      console.log(`Total study time last day: ${roundedHours} hours`);
      setLastDayStudyHours(roundedHours);
    } catch (error) {
      console.error('Error calculating last day study time:', error);
      setLastDayStudyHours(0);
    }
  };

  const fetchWeeklyStudyHours = async (studentId: string) => {
    try {
      setWeeklyDataLoading(true);

      // Get current date
      const now = new Date();

      // Calculate the start of the current week (Monday)
      const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, ...
      const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1; // Adjust for Monday as first day

      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - daysFromMonday);
      startOfWeek.setHours(0, 0, 0, 0);

      // Format as ISO string for database query
      const startOfWeekStr = startOfWeek.toISOString();

      console.log('Fetching weekly study hours from:', startOfWeekStr);

      // Fetch weekly attendance data using FastAPI
      const weeklyData = await apiClient.get(`/students/${studentId}/attendance/weekly`);
      
      if (!weeklyData) {
        console.error('Error fetching weekly study data');
        return;
      }

      console.log('Weekly attendance records found:', weeklyData?.length || 0);

      // Initialize array for each day of the week (Monday to Sunday)
      const weeklyHours = [0, 0, 0, 0, 0, 0, 0];

      if (weeklyData && weeklyData.length > 0) {
        weeklyData.forEach(record => {
          if (record.entry_time) {
            // Get the day of the week (0 = Monday in our array)
            const entryDate = new Date(record.entry_time);
            const dayOfWeek = entryDate.getDay() === 0 ? 6 : entryDate.getDay() - 1;

            let durationHours = 0;

            if (record.total_duration) {
              // Parse the interval string (e.g., "02:30:00" to hours)
              const durationParts = record.total_duration.split(':');
              const hours = parseInt(durationParts[0]);
              const minutes = parseInt(durationParts[1]);
              durationHours = hours + (minutes / 60);
            } else if (record.entry_time && record.exit_time) {
              // Calculate duration from entry and exit times
              const exitTime = new Date(record.exit_time);
              const durationMs = exitTime.getTime() - entryDate.getTime();
              durationHours = durationMs / (1000 * 60 * 60);
            } else if (record.entry_time && !record.exit_time) {
              // For active sessions, calculate time from entry until now
              const durationMs = now.getTime() - entryDate.getTime();
              durationHours = durationMs / (1000 * 60 * 60);
            }

            // Add to the appropriate day
            weeklyHours[dayOfWeek] += durationHours;
          }
        });
      }

      // Round each day's hours to 1 decimal place
      const roundedWeeklyHours = weeklyHours.map(hours => Math.round(hours * 10) / 10);

      console.log('Weekly study hours:', roundedWeeklyHours);
      setWeeklyStudyData(roundedWeeklyHours);
    } catch (error) {
      console.error('Error calculating weekly study hours:', error);
      setWeeklyStudyData([0, 0, 0, 0, 0, 0, 0]);
    } finally {
      setWeeklyDataLoading(false);
    }
  };

  const fetchTasksCompleted = async (studentId: string) => {
    try {
      // Get today's date in local timezone
      const now = new Date();

      // Format the date as YYYY-MM-DD in local timezone
      const todayStr = now.toISOString().split('T')[0];

      // For logging, format the date in Indian format
      const options = { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Kolkata' };
      const istDateStr = now.toLocaleDateString('en-IN', options);

      console.log('Fetching tasks for IST date:', todayStr);

      // Fetch tasks for today using FastAPI
      const tasksData = await apiClient.get(`/students/${studentId}/tasks/today`);
      
      if (!tasksData) {
        console.error('Error fetching tasks');
        return;
      }

      if (tasksData) {
        const completed = tasksData.filter(task => task.completed).length;
        console.log(`Tasks completed today (IST): ${completed} of ${tasksData.length}`);
        setTasksCompleted(completed);
        setTotalTasks(tasksData.length);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasksCompleted(0);
      setTotalTasks(0);
    }
  };

  const handleTabChange = (tab: string) => {
    switch (tab) {
      case 'home':
        navigation.navigate('StudentHome', { screen: 'StudentHomeTab' });
        break;
      case 'dashboard':
        // Already on dashboard
        break;
      case 'chat':
        navigation.navigate('StudentHome', { screen: 'StudentChatTab' });
        break;
      case 'profile':
        navigation.navigate('StudentHome', { screen: 'StudentProfileTab' });
        break;
    }
  };

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowScheduleModal(false);
  };

  return (
    <View style={styles.container}>
      <Header
        title="Dashboard"
        username={studentName || undefined}
        showWelcome={true}
        hideBackButton={true}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text variant="titleLarge" style={styles.welcomeText}>
          Welcome back, {studentName}!
        </Text>
        <Text variant="bodyMedium" style={styles.subText}>
          Track your exam preparation progress
        </Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingText}>Loading your dashboard...</Text>
          </View>
        ) : (
          <>
            <View style={styles.statsContainer}>
              <StudyTimeCard
                hours={studyHours}
                isActive={activeSession}
                lastDayHours={lastDayStudyHours}
                entryTime={todayEntryTime}
              />
              <TasksCompletedCard
                completed={tasksCompleted}
                total={totalTasks}
                entryTime={todayEntryTime}
              />
            </View>

            <WeeklyStudyChart
              data={weeklyStudyData}
              studentId={studentId}
              isLoading={weeklyDataLoading}
            />
            <TodaySchedule schedule={mockSchedule} />
            <ExamDetails />
            <AdminMessages/>
            <PracticePapers />
          </>
        )}
      </ScrollView>

      {/* BottomTabNavigator is already provided by the StudentTabNavigator in App.tsx */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  welcomeText: {
    color: '#1f2937',
    marginBottom: 4,
  },
  subText: {
    color: '#6b7280',
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
    fontSize: 14,
  },
});

export default Stu_Dashboard;
