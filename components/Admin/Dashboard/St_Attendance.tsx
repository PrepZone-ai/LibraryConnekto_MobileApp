
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Card, Divider, IconButton, Searchbar, Surface, Text } from 'react-native-paper';
import { apiClient } from '../../../config/api';
import { AdminStackParamList } from '../../../types/navigation';
import Header from '../../common/Header';
// Custom date formatting function instead of using date-fns

interface Student {
  id: string;
  student_id: string;
  auth_user_id: string;
  name: string;
  status: 'Present' | 'Absent';
  last_visit: string | null;
  subscription_status: 'Active' | 'Expired';
  total_visits?: number;
  entry_time?: string | null;
  exit_time?: string | null;
  total_duration?: string | null;
}



type Props = {
  navigation: NativeStackNavigationProp<AdminStackParamList, 'StudentAttendance'>;
};

const StudentAttendance: React.FC<Props> = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [studentsPerPage] = useState(10);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Calculate present and absent counts
  const presentCount = students.filter(s => s.status === 'Present').length;
  const absentCount = students.length - presentCount;

  // Filter students based on search query
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate pagination
  const from = page * studentsPerPage;
  const to = Math.min((page + 1) * studentsPerPage, filteredStudents.length);

  // Function to update student statuses based on attendance records
  const updateStudentStatuses = async () => {
    try {
      // Get current user
      const userResponse = await apiClient.get('/auth/me');
      if (!userResponse.data?.user) return;

      // Get all students with their auth_user_id
      const studentsResponse = await apiClient.get('/admin/students', {
        params: { fields: 'id,auth_user_id' }
      });

      if (!studentsResponse.data?.students || studentsResponse.data.students.length === 0) return;

      // Get today's date in ISO format (YYYY-MM-DD)
      const today = new Date().toISOString().split('T')[0];

      // For each student, check if they have an active attendance record
      for (const student of studentsResponse.data.students) {
        if (!student.auth_user_id) continue;

        try {
          // Check for attendance records today
          const attendanceResponse = await apiClient.get('/admin/attendance', {
            params: {
              student_id: student.auth_user_id,
              date: today,
              fields: 'entry_time,exit_time'
            }
          });

          // Determine status based on attendance records
          let newStatus = 'Absent';
          if (attendanceResponse.data?.attendance && attendanceResponse.data.attendance.length > 0) {
            // If there's an entry today with no exit, student is present
            if (attendanceResponse.data.attendance.some(record => record.entry_time && !record.exit_time)) {
              newStatus = 'Present';
            }
          }

          // Update student status
          await apiClient.put(`/admin/students/${student.id}`, {
            status: newStatus
          });

        } catch (attendanceError) {
          console.error(`Error checking attendance for student ${student.id}:`, attendanceError);
          continue;
        }
      }
    } catch (error: any) {
      console.error('Error updating student statuses:', error.message);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Get current user
        const userResponse = await apiClient.get('/auth/me');
        if (!userResponse.data?.user) throw new Error('No user found');

        // Get dashboard stats
        const dashboardResponse = await apiClient.get('/admin/dashboard/stats');
        const dashboardStats = dashboardResponse.data;

        // Get all students from library_students view
        const studentsResponse = await apiClient.get('/admin/students', {
          params: {
            fields: 'id,student_id,auth_user_id,name,status,last_visit,subscription_status,admin_id,admin_user_id',
            order: 'name:asc'
          }
        });

        const libraryStudents = studentsResponse.data?.students;

        if (!libraryStudents || libraryStudents.length === 0) {
          setStudents([]);
          return;
        }

        console.log('Students data:', libraryStudents.map(s => ({
          id: s.id,
          name: s.name,
          status: s.status,
          last_visit: s.last_visit,
          subscription_status: s.subscription_status
        })));

        // Try to get attendance data from student_monthly_summary
        let visitCountMap = new Map<string, number>();
        try {
          const studentIds = libraryStudents.map(s => s.id);

          // Get monthly summary data for all students
          const attendanceResponse = await apiClient.get('/admin/attendance/monthly-summary', {
            params: {
              student_ids: studentIds.join(','),
              fields: 'student_id,total_visits',
              order: 'attendance_month:desc'
            }
          });

          const attendanceData = attendanceResponse.data?.summaries;

          // Create a map of student_id to total_visits
          if (attendanceData && attendanceData.length > 0) {
            attendanceData.forEach(record => {
              // If multiple months exist for a student, sum up the total visits
              const currentTotal = visitCountMap.get(record.student_id) || 0;
              visitCountMap.set(record.student_id, currentTotal + record.total_visits);
            });
          }
        } catch (attendanceError) {
          console.error('Error processing attendance data:', attendanceError);
          // Continue execution even if there's an error
        }

        // Get today's date in ISO format (YYYY-MM-DD)
        const today = new Date().toISOString().split('T')[0];

        // Create an array to store the transformed students with attendance data
        const transformedStudents: Student[] = [];

        // Process each student and fetch their attendance data
        for (const student of libraryStudents) {
          // Skip if no auth_user_id
          if (!student.auth_user_id) {
            transformedStudents.push({
              id: student.id,
              student_id: student.student_id,
              auth_user_id: student.auth_user_id || '',
              name: student.name || 'Unknown',
              status: 'Absent' as 'Present' | 'Absent',
              last_visit: student.last_visit,
              subscription_status: (student.subscription_status?.toLowerCase() === 'active' ? 'Active' : 'Expired') as 'Active' | 'Expired',
              total_visits: visitCountMap.get(student.id) || 0
            });
            continue;
          }

          try {
            // Fetch today's attendance records for this student
            const attendanceResponse = await apiClient.get('/admin/attendance', {
              params: {
                student_id: student.auth_user_id,
                date: today,
                fields: 'entry_time,exit_time,total_duration',
                order: 'entry_time:desc'
              }
            });

            const attendanceData = attendanceResponse.data?.attendance;

            // Check if student has an active attendance record (entry but no exit)
            const hasActiveAttendance = attendanceData && attendanceData.length > 0 &&
              attendanceData[0].entry_time && !attendanceData[0].exit_time;

            // Add the student with attendance data
            transformedStudents.push({
              id: student.id,
              student_id: student.student_id,
              auth_user_id: student.auth_user_id,
              name: student.name || 'Unknown',
              status: hasActiveAttendance ? 'Present' : 'Absent',
              last_visit: student.last_visit,
              subscription_status: (student.subscription_status?.toLowerCase() === 'active' ? 'Active' : 'Expired') as 'Active' | 'Expired',
              total_visits: visitCountMap.get(student.id) || 0,
              entry_time: attendanceData && attendanceData.length > 0 ? attendanceData[0].entry_time : null,
              exit_time: attendanceData && attendanceData.length > 0 ? attendanceData[0].exit_time : null,
              total_duration: attendanceData && attendanceData.length > 0 ? attendanceData[0].total_duration : null
            });
          } catch (attendanceError) {
            console.error(`Error fetching attendance for student ${student.id}:`, attendanceError);

            // Add student without attendance data
            transformedStudents.push({
              id: student.id,
              student_id: student.student_id,
              auth_user_id: student.auth_user_id,
              name: student.name || 'Unknown',
              status: 'Absent' as 'Present' | 'Absent',
              last_visit: student.last_visit,
              subscription_status: (student.subscription_status?.toLowerCase() === 'active' ? 'Active' : 'Expired') as 'Active' | 'Expired',
              total_visits: visitCountMap.get(student.id) || 0,
              entry_time: null,
              exit_time: null,
              total_duration: null
            });
          }
        }

        setStudents(transformedStudents);
      } catch (error: any) {
        console.error('Error:', error.message);
        Alert.alert('Error', 'Failed to load student attendance data');
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Update student statuses based on attendance records
    updateStudentStatuses();

    // Set up an interval to update statuses every 5 minutes
    const statusInterval = setInterval(() => {
      updateStudentStatuses();
    }, 5 * 60 * 1000);

    // Set up polling for student status changes instead of realtime subscription
    const dataPolling = setInterval(() => {
      fetchData(); // Refresh all student data
    }, 10000); // Poll every 10 seconds

    return () => {
      clearInterval(dataPolling);
      clearInterval(statusInterval);
    };
  }, []);

  const handleViewAttendanceDetails = (student: Student) => {
    // Navigate to StudentAttendanceDetails screen with more complete data
    navigation.navigate('StudentAttendanceDetails', {
      studentId: student.id,
      studentName: student.name,
      authUserId: student.auth_user_id,
      status: student.status,
      lastVisit: student.last_visit
    });
  };

  const handleChat = (student: Student, e?: any) => {
    // Prevent event propagation to the card
    if (e) {
      e.stopPropagation();
    }

    navigation.navigate('Chat', {
      studentId: student.id, // Use the student.id which is the UUID from the students table
      studentUserId: student.auth_user_id, // Pass the auth_user_id for authentication purposes
      studentName: student.name,
      fromAttendance: true
    });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);

    // Custom date formatting without date-fns
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();

    let hours = date.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // Convert 0 to 12
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return `${month} ${day}, ${year} ${hours}:${minutes} ${ampm}`;
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return 'Not recorded';

    const date = new Date(dateString);
    let hours = date.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // Convert 0 to 12
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return `${hours}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Student Attendance"
        showWelcome={false}
        autoBackButton={true}
      />
      <ScrollView>
        <Surface style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Present</Text>
            <Text style={styles.statValue}>{presentCount}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Absent</Text>
            <Text style={styles.statValue}>{absentCount}</Text>
          </View>
        </Surface>

        <Searchbar
          placeholder="Search students..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />

        <View style={styles.cardsContainer}>
          {filteredStudents.slice(from, to).map((student) => {
            // Check if student has active attendance (entry but no exit)
            const hasActiveAttendance = student.entry_time && !student.exit_time;
            // Determine status based on attendance records
            const displayStatus = hasActiveAttendance ? 'Present' : student.status;

            return (
              <Card
                key={student.id}
                style={styles.studentCard}
                onPress={() => handleViewAttendanceDetails(student)}
              >
                <Card.Content>
                  <View style={styles.studentHeader}>
                    <View>
                      <Text style={styles.studentName}>{student.name}</Text>
                      <View style={styles.statusContainer}>
                        <Text style={[styles.statusText,
                          displayStatus === 'Present' ? styles.presentText : styles.absentText]}>
                          {displayStatus}
                        </Text>
                      </View>
                    </View>
                    <IconButton
                      icon="chat"
                      size={24}
                      onPress={(e) => handleChat(student, e)}
                      style={styles.chatButton}
                    />
                  </View>

                  <Divider style={styles.divider} />

                  <View style={styles.attendanceInfo}>
                    <View style={styles.infoRow}>
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Today's Entry:</Text>
                        <Text style={styles.infoValue}>
                          {student.entry_time ? formatTime(student.entry_time) : 'Not recorded'}
                        </Text>
                      </View>
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Today's Exit:</Text>
                        <Text style={styles.infoValue}>
                          {student.exit_time ? formatTime(student.exit_time) : 'Not recorded'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.infoRow}>
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Last Visit:</Text>
                        <Text style={styles.infoValue}>
                          {student.last_visit ? formatDate(student.last_visit).split(',')[0] : '-'}
                        </Text>
                      </View>
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Duration Today:</Text>
                        <Text style={styles.infoValue}>
                          {student.total_duration || (student.entry_time && !student.exit_time ? 'In progress' : '-')}
                        </Text>
                      </View>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            );
          })}

          <View style={styles.paginationContainer}>
            <Text style={styles.paginationText}>{`${from + 1}-${to} of ${filteredStudents.length}`}</Text>
            <View style={styles.paginationButtons}>
              <IconButton
                icon="chevron-left"
                size={24}
                onPress={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
              />
              <IconButton
                icon="chevron-right"
                size={24}
                onPress={() => setPage(Math.min(Math.ceil(filteredStudents.length / studentsPerPage) - 1, page + 1))}
                disabled={page >= Math.ceil(filteredStudents.length / studentsPerPage) - 1}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    elevation: 4,
    backgroundColor: 'white',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 16,
    color: '#666',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  searchBar: {
    margin: 16,
  },
  cardsContainer: {
    padding: 8,
  },
  studentCard: {
    margin: 8,
    borderRadius: 8,
    elevation: 4,
  },
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  studentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statusContainer: {
    marginTop: 4,
  },
  statusText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  presentText: {
    color: '#4CAF50',
  },
  absentText: {
    color: '#F44336',
  },
  chatButton: {
    margin: 0,
  },
  divider: {
    marginVertical: 12,
  },
  attendanceInfo: {
    flexDirection: 'column',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoItem: {
    marginVertical: 4,
    width: '48%',
  },
  infoLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    margin: 16,
    elevation: 2,
  },
  paginationText: {
    fontSize: 14,
    color: '#4b5563',
  },
  paginationButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default StudentAttendance;
