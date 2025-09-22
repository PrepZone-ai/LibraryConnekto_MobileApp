import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Card, DataTable, Divider, IconButton, Surface, Text } from 'react-native-paper';
import { AdminStackParamList } from '../../../types/navigation';
import Header from '../../common/Header';
import { apiClient } from '../../../config/api';
import { useAuth } from '../../../contexts/AuthContext';

type Props = NativeStackScreenProps<AdminStackParamList, 'StudentAttendanceDetails'>;

interface Student {
  id: string;
  name: string;
  status: 'Present' | 'Absent';
  last_visit: string | null;
  auth_user_id?: string;
  entry_time?: string | null;
  exit_time?: string | null;
  total_duration?: string | null;
}

interface StudentData {
  id: string;
  name: string;
  auth_user_id?: string;
  student_id?: string;
  status?: 'Present' | 'Absent';
  last_visit?: string | null;
}

interface MonthlyAttendance {
  attendance_month: string;
  total_visits: number;
  first_visit: string;
  last_visit: string;
  month_number: number;
  year: number;
}

interface AttendanceRecord {
  id?: string;
  entry_time: string;
  exit_time: string | null;
  total_duration: string | null;
  date?: string;
}

const StudentAttendanceDetails: React.FC<Props> = ({ route, navigation }) => {
  const { studentId, studentName, authUserId, status, lastVisit } = route.params;
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<Student | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyAttendance[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedMonthData, setSelectedMonthData] = useState<AttendanceRecord[]>([]);
  const [groupedRecords, setGroupedRecords] = useState<Record<string, AttendanceRecord[]>>({});

  // Initialize student data from route params
  useEffect(() => {
    // Create initial student object from route params
    if (studentId && studentName) {
      setStudent({
        id: studentId,
        name: studentName,
        status: status || 'Absent',
        last_visit: lastVisit || null,
        auth_user_id: authUserId
      });

      // Only fetch data after setting the initial student state
      setTimeout(() => {
        fetchStudentData();
        fetchAttendanceData();
      }, 0);
    }
  }, [studentId, studentName, authUserId, status, lastVisit]);

  const fetchStudentData = async () => {
    try {
      // Skip if we don't have the student ID
      if (!studentId) return;

      // Try to get complete student data if not already available
      if (!student?.auth_user_id) {
        if (!user) {
          console.error('No authenticated user found');
          return;
        }

        try {
          // Get student details using FastAPI
          const studentData = await apiClient.get(`/admin/students/${studentId}`);
          
          if (studentData) {
            // Update student with database data
            setStudent(prevStudent => ({
              ...prevStudent || {
                id: studentId,
                name: studentName || 'Unknown',
                status: 'Absent',
                last_visit: null
              },
              ...studentData
            }));
          }
        } catch (error) {
          console.error('Error fetching student data:', error);
        }
      }

      // Get today's attendance if any
      const today = new Date().toISOString().split('T')[0];
      const userIdToQuery = authUserId || student?.auth_user_id;

      if (userIdToQuery) {
        try {
          const todayAttendance = await apiClient.get<AttendanceRecord[]>(`/admin/students/${studentId}/attendance/today`);
          
          if (todayAttendance && todayAttendance.length > 0) {
            // Update student with today's attendance data and set status based on exit_time
            const hasActiveAttendance = todayAttendance[0].entry_time && !todayAttendance[0].exit_time;

            if (student) {
              setStudent({
                ...student,
                entry_time: todayAttendance[0].entry_time,
                exit_time: todayAttendance[0].exit_time,
                total_duration: todayAttendance[0].total_duration,
                // If student has an entry time today but no exit time, they are present
                status: hasActiveAttendance ? 'Present' : (student.status || 'Absent'),
                // Update last_visit if it's not already set
                last_visit: student.last_visit || todayAttendance[0].entry_time
              });
            }
          }
        } catch (error) {
          console.error('Error fetching today\'s attendance:', error);
        }
      }
    } catch (error: any) {
      console.error('Error in fetchStudentData:', error.message);
      // Don't show alert here as we already have basic student data from route params
    }
  };

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);

      // First try to get monthly summary data
      try {
        if (!user) {
          console.error('No authenticated user found');
          return;
        }

        // Try to get data from monthly summary endpoint
        const monthlyData = await apiClient.get<MonthlyAttendance[]>(`/admin/students/${studentId}/attendance/monthly`);
        
        if (monthlyData) {
          setMonthlyData(monthlyData);
        }
      } catch (error: any) {
        console.error('Error with monthly summary:', error.message);
        // Continue execution even if monthly summary fails
      }

      // Get the auth_user_id either from route params or from student data
      const userIdToQuery = authUserId || student?.auth_user_id;

      // If we don't have auth_user_id yet, try to get it from the database
      if (!userIdToQuery) {
        if (!user) {
          console.error('No authenticated user found');
          setLoading(false);
          return;
        }

        try {
          // Get student details using FastAPI
          const studentData = await apiClient.get<StudentData>(`/admin/students/${studentId}`);
          
          if (studentData?.auth_user_id) {
            // Update student with auth_user_id
            if (student) {
              setStudent({
                ...student,
                auth_user_id: studentData.auth_user_id
              });
            } else {
              setStudent({
                id: studentId,
                name: studentName || 'Unknown',
                status: status || 'Absent',
                last_visit: lastVisit || null,
                auth_user_id: studentData.auth_user_id
              });
            }

            // Fetch attendance with the retrieved auth_user_id
            await fetchAttendanceWithUserId(studentData.auth_user_id);
            return;
          } else if (studentData?.student_id) {
            // Try using student_id if auth_user_id is not available
            await fetchAttendanceWithUserId(studentData.student_id);
            return;
          } else {
            console.error('Student auth_user_id not found');
            setLoading(false);
            return;
          }
        } catch (error) {
          console.error('Error fetching student auth_user_id:', error);
          setLoading(false);
          return;
        }
      } else {
        // We have the auth_user_id, so fetch attendance data
        await fetchAttendanceWithUserId(userIdToQuery);
      }
    } catch (error: any) {
      console.error('Error in fetchAttendanceData:', error.message);
      Alert.alert('Error', 'Failed to load attendance data');
      setLoading(false);
    }
  };

  const fetchAttendanceWithUserId = async (userId: string) => {
    try {
      const data = await apiClient.get(`/admin/students/${studentId}/attendance`);

      // Process the data to add date field and group by date
      const processedData = (data || []).map((record: any) => {
        const entryDate = new Date(record.entry_time);
        return {
          ...record,
          date: entryDate.toISOString().split('T')[0] // Format as YYYY-MM-DD
        };
      });

      // Group records by date
      const grouped = processedData.reduce((acc: Record<string, AttendanceRecord[]>, record: AttendanceRecord & { date: string }) => {
        if (!acc[record.date]) {
          acc[record.date] = [];
        }
        acc[record.date].push(record);
        return acc;
      }, {});

      setAttendanceRecords(processedData);
      setGroupedRecords(grouped);
    } catch (error: any) {
      console.error('Error in fetchAttendanceWithUserId:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewMonthDetails = async (month: string) => {
    try {
      setLoading(true);

      // Get the auth_user_id either from route params, student data, or fetch it
      let userIdToQuery = authUserId || student?.auth_user_id;

      if (!userIdToQuery) {
        if (!user) {
          console.error('No authenticated user found');
          Alert.alert('Error', 'Please login again');
          setLoading(false);
          return;
        }

        try {
          // Try to fetch auth_user_id if we don't have it
          const studentData = await apiClient.get(`/admin/students/${studentId}`);
          
          if (studentData?.auth_user_id) {
            userIdToQuery = studentData.auth_user_id;
            // Update student with auth_user_id
            if (student) {
              setStudent({
                ...student,
                auth_user_id: studentData.auth_user_id
              });
            } else {
              setStudent({
                id: studentId,
                name: studentName || 'Unknown',
                status: status || 'Absent',
                last_visit: lastVisit || null,
                auth_user_id: studentData.auth_user_id
              });
            }
          } else if (studentData?.student_id) {
            // Try using student_id if auth_user_id is not available
            userIdToQuery = studentData.student_id;
            if (student) {
              setStudent({
                ...student,
                auth_user_id: studentData.student_id
              });
            } else {
              setStudent({
                id: studentId,
                name: studentName || 'Unknown',
                status: status || 'Absent',
                last_visit: lastVisit || null,
                auth_user_id: studentData.student_id
              });
            }
          } else {
            console.error('Student auth_user_id not found');
            Alert.alert('Error', 'Student data not found');
            setLoading(false);
            return;
          }
        } catch (error) {
          console.error('Error fetching student auth_user_id:', error);
          Alert.alert('Error', 'Failed to load student data');
          setLoading(false);
          return;
        }
      }

      const monthStart = new Date(month);
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);

      try {
        const data = await apiClient.get(`/admin/students/${studentId}/attendance/monthly/${monthStart.toISOString().split('T')[0]}`);
        setSelectedMonthData(data || []);
        setSelectedMonth(month);
      } catch (error) {
        console.error('Error fetching daily attendance data:', error);
        Alert.alert('Error', 'Failed to load attendance details');
      }
    } catch (error: any) {
      console.error('Error in handleViewMonthDetails:', error.message);
      Alert.alert('Error', 'Failed to load daily attendance data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);
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
    if (!dateString) return 'N/A';

    const date = new Date(dateString);
    let hours = date.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // Convert 0 to 12
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return `${hours}:${minutes} ${ampm}`;
  };

  const formatMonthYear = (dateStr: string) => {
    const date = new Date(dateStr);
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const calculateTotalDuration = (records: AttendanceRecord[]) => {
    // This is a simplified calculation - in a real app you'd want to properly parse and add durations
    let totalMinutes = 0;

    records.forEach(record => {
      if (record.total_duration) {
        // Parse duration string like "2 hours 30 minutes"
        const durationStr = record.total_duration.toLowerCase();
        const hoursMatch = durationStr.match(/(\d+)\s*hour/i);
        const minutesMatch = durationStr.match(/(\d+)\s*min/i);

        if (hoursMatch) totalMinutes += parseInt(hoursMatch[1]) * 60;
        if (minutesMatch) totalMinutes += parseInt(minutesMatch[1]);
      } else if (record.entry_time && record.exit_time) {
        // Calculate duration from entry and exit times if total_duration is not available
        const entryTime = new Date(record.entry_time).getTime();
        const exitTime = new Date(record.exit_time).getTime();
        const durationMs = exitTime - entryTime;
        totalMinutes += Math.floor(durationMs / (1000 * 60));
      }
    });

    // Don't show "0 min" if there's no duration
    if (totalMinutes === 0) {
      // Check if there are any active sessions (entry but no exit)
      const hasActiveSession = records.some(record => record.entry_time && !record.exit_time);
      return hasActiveSession ? 'In progress' : 'No duration';
    }

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0 && minutes > 0) {
      return `${hours} hr ${minutes} min`;
    } else if (hours > 0) {
      return `${hours} hr`;
    } else {
      return `${minutes} min`;
    }
  };

  const handleChat = () => {
    if (!student) return;

    // Navigate to the Chat stack screen
    navigation.navigate('Chat', {
      studentId: student.id,
      studentName: student.name,
      fromAttendance: true
    });
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
        title={`Attendance - ${studentName}`}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView>
        {/* Student Info Card */}
        {student && (
          <Card style={styles.studentCard}>
            <Card.Content>
              <View style={styles.studentHeader}>
                <View>
                  <Text style={styles.studentName}>{student.name}</Text>
                  <View style={styles.statusContainer}>
                    <Text style={[styles.statusText,
                      student.status === 'Present' ? styles.presentText : styles.absentText]}>
                      {student.status}
                    </Text>
                  </View>
                </View>
                <IconButton
                  icon="chat"
                  size={24}
                  onPress={handleChat}
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
        )}

        {/* Monthly Summary Section */}
        {selectedMonth ? (
          <>
            <Button
              mode="outlined"
              onPress={() => setSelectedMonth(null)}
              style={styles.backButton}
            >
              Back to Monthly View
            </Button>

            <Text style={styles.monthTitle}>{formatMonthYear(selectedMonth)}</Text>

            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Entry Time</DataTable.Title>
                <DataTable.Title>Exit Time</DataTable.Title>
                <DataTable.Title>Duration</DataTable.Title>
              </DataTable.Header>

              {selectedMonthData.length > 0 ? (
                selectedMonthData.map((record, index) => (
                  <DataTable.Row key={index}>
                    <DataTable.Cell>{formatDate(record.entry_time)}</DataTable.Cell>
                    <DataTable.Cell>{record.exit_time ? formatDate(record.exit_time) : 'N/A'}</DataTable.Cell>
                    <DataTable.Cell>{record.total_duration || 'N/A'}</DataTable.Cell>
                  </DataTable.Row>
                ))
              ) : (
                <DataTable.Row>
                  <DataTable.Cell>No records found</DataTable.Cell>
                  <DataTable.Cell>-</DataTable.Cell>
                  <DataTable.Cell>-</DataTable.Cell>
                </DataTable.Row>
              )}
            </DataTable>
          </>
        ) : (
          <>
            {/* Monthly Summary Cards */}
            {monthlyData.length > 0 && (
              <View style={styles.monthlyCardsContainer}>
                <Text style={[styles.statsTitle, {marginLeft: 16, marginBottom: 12}]}>Monthly Summary</Text>
                {monthlyData.map((month) => (
                  <Card
                    key={month.attendance_month}
                    style={styles.monthCard}
                    onPress={() => handleViewMonthDetails(month.attendance_month)}
                  >
                    <Card.Content>
                      <View style={styles.monthCardHeader}>
                        <Text style={styles.monthCardTitle}>{formatMonthYear(month.attendance_month)}</Text>
                        <MaterialCommunityIcons name="chevron-right" size={24} color="#6366F1" />
                      </View>
                      <Divider style={styles.divider} />
                      <View style={styles.monthCardDetails}>
                        <View style={styles.monthCardItem}>
                          <Text style={styles.monthCardLabel}>Total Visits</Text>
                          <Text style={styles.monthCardValue}>{month.total_visits}</Text>
                        </View>
                        <View style={styles.monthCardItem}>
                          <Text style={styles.monthCardLabel}>First Visit</Text>
                          <Text style={styles.monthCardValue}>{formatDate(month.first_visit).split(',')[0]}</Text>
                        </View>
                        <View style={styles.monthCardItem}>
                          <Text style={styles.monthCardLabel}>Last Visit</Text>
                          <Text style={styles.monthCardValue}>{formatDate(month.last_visit).split(',')[0]}</Text>
                        </View>
                      </View>
                    </Card.Content>
                  </Card>
                ))}
              </View>
            )}

            {/* Daily Attendance Records */}
            <Surface style={styles.statsContainer}>
              <Text style={styles.statsTitle}>Daily Attendance</Text>
              <Text style={styles.statsSubtitle}>
                Total Records: {attendanceRecords.length}
              </Text>
            </Surface>

            {Object.keys(groupedRecords).length > 0 ? (
              Object.keys(groupedRecords).map(date => (
                <Surface key={date} style={styles.dateContainer}>
                  <View style={styles.dateHeader}>
                    <Text style={styles.dateText}>{formatDate(date).split(',')[0]}</Text>
                    <Text style={styles.totalDuration}>
                      Total: {calculateTotalDuration(groupedRecords[date])}
                    </Text>
                  </View>

                  <DataTable>
                    <DataTable.Header>
                      <DataTable.Title>Entry Time</DataTable.Title>
                      <DataTable.Title>Exit Time</DataTable.Title>
                      <DataTable.Title>Duration</DataTable.Title>
                    </DataTable.Header>

                    {groupedRecords[date].map(record => (
                      <DataTable.Row key={record.id || `${record.entry_time}-${Math.random()}`}>
                        <DataTable.Cell>{formatTime(record.entry_time)}</DataTable.Cell>
                        <DataTable.Cell>
                          {record.exit_time ? formatTime(record.exit_time) : 'Active'}
                        </DataTable.Cell>
                        <DataTable.Cell>
                          {record.total_duration || 'In progress'}
                        </DataTable.Cell>
                      </DataTable.Row>
                    ))}
                  </DataTable>
                </Surface>
              ))
            ) : (
              <Surface style={styles.emptyContainer}>
                <MaterialCommunityIcons name="calendar-blank" size={48} color="#9ca3af" />
                <Text style={styles.emptyText}>No attendance records found</Text>
              </Surface>
            )}
          </>
        )}
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
  studentCard: {
    margin: 16,
    borderRadius: 8,
    elevation: 4,
  },
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  studentName: {
    fontSize: 20,
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
  statsContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 8,
    elevation: 4,
    backgroundColor: 'white',
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1f2937',
  },
  statsSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  monthlyCardsContainer: {
    marginBottom: 16,
  },
  monthCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 8,
    elevation: 3,
  },
  monthCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  monthCardDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  monthCardItem: {
    width: '30%',
    marginVertical: 4,
  },
  monthCardLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  monthCardValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginTop: 2,
  },
  backButton: {
    margin: 16,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
    marginBottom: 8,
    color: '#1f2937',
  },
  dateContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
    backgroundColor: 'white',
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f3f4f6',
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  totalDuration: {
    fontSize: 14,
    color: '#4b5563',
  },
  emptyContainer: {
    margin: 16,
    padding: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
});

export default StudentAttendanceDetails;
