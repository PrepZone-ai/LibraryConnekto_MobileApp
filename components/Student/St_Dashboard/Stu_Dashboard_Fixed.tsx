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
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayStudyTime = async (studentId: string) => {
    try {
      // Get today's attendance using FastAPI
      const attendanceData = await apiClient.get('/student/attendance?limit=5');
      
      if (attendanceData && attendanceData.length > 0) {
        const todayRecord = attendanceData[0]; // Most recent record
        const entryTime = new Date(todayRecord.entry_time);
        const exitTime = todayRecord.exit_time ? new Date(todayRecord.exit_time) : new Date();
        
        // Calculate study hours
        const durationMs = exitTime.getTime() - entryTime.getTime();
        const durationHours = durationMs / (1000 * 60 * 60);
        const roundedHours = Math.round(durationHours * 10) / 10;
        
        setStudyHours(roundedHours);
        setActiveSession(!todayRecord.exit_time);
        
        // Format entry time for display
        const formattedEntryTime = entryTime.toLocaleString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
          timeZone: 'Asia/Kolkata',
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
        setTodayEntryTime(formattedEntryTime);
      } else {
        setStudyHours(0);
        setActiveSession(false);
        setTodayEntryTime(null);
      }
    } catch (error) {
      console.error('Error in fetchTodayStudyTime:', error);
    }
  };

  const fetchLastDayStudyTime = async (studentId: string) => {
    try {
      // Get yesterday's attendance using FastAPI
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      const attendanceData = await apiClient.get(`/student/attendance?date=${yesterdayStr}`);
      
      if (attendanceData && attendanceData.length > 0) {
        let totalHours = 0;
        attendanceData.forEach((record: any) => {
          if (record.entry_time && record.exit_time) {
            const entryTime = new Date(record.entry_time);
            const exitTime = new Date(record.exit_time);
            const durationMs = exitTime.getTime() - entryTime.getTime();
            const durationHours = durationMs / (1000 * 60 * 60);
            totalHours += durationHours;
          }
        });
        
        setLastDayStudyHours(Math.round(totalHours * 10) / 10);
      } else {
        setLastDayStudyHours(0);
      }
    } catch (error) {
      console.error('Error in fetchLastDayStudyTime:', error);
      setLastDayStudyHours(0);
    }
  };

  const fetchWeeklyStudyHours = async (studentId: string) => {
    try {
      setWeeklyDataLoading(true);
      
      // Get weekly attendance data using FastAPI
      const weeklyData = await apiClient.get('/student/attendance/weekly');
      
      if (weeklyData) {
        setWeeklyStudyData(weeklyData);
      } else {
        setWeeklyStudyData(mockWeeklyData);
      }
    } catch (error) {
      console.error('Error in fetchWeeklyStudyHours:', error);
      setWeeklyStudyData(mockWeeklyData);
    } finally {
      setWeeklyDataLoading(false);
    }
  };

  const fetchTasksCompleted = async (studentId: string) => {
    try {
      // Get tasks data using FastAPI
      const tasksData = await apiClient.get('/student/tasks');
      
      if (tasksData) {
        setTasksCompleted(tasksData.completed || 0);
        setTotalTasks(tasksData.total || 0);
      } else {
        setTasksCompleted(0);
        setTotalTasks(0);
      }
    } catch (error) {
      console.error('Error in fetchTasksCompleted:', error);
      setTasksCompleted(0);
      setTotalTasks(0);
    }
  };

  const handleTabChange = (tab: string) => {
    setSelectedExam(tab);
  };

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle schedule submission
    setShowScheduleModal(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Student Dashboard"
        showBackButton={false}
        showWelcome={true}
        username={studentName || 'Student'}
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <StudyTimeCard
          studyHours={studyHours}
          activeSession={activeSession}
          entryTime={todayEntryTime}
          lastDayHours={lastDayStudyHours}
        />
        
        <TasksCompletedCard
          completed={tasksCompleted}
          total={totalTasks}
        />
        
        <WeeklyStudyChart
          data={weeklyStudyData}
          loading={weeklyDataLoading}
        />
        
        <TodaySchedule
          schedule={mockSchedule}
          onScheduleSubmit={handleScheduleSubmit}
        />
        
        <AdminMessages />
        
        <ExamDetails
          selectedExam={selectedExam}
          onTabChange={handleTabChange}
        />
        
        <PracticePapers />
      </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
});

export default Stu_Dashboard; 