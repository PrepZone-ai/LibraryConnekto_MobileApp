import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, DataTable, Surface, Text } from 'react-native-paper';
import { apiClient } from '../../../config/api';
import { RootStackParamList } from '../../../types/navigation';
import Header from '../../common/Header';

interface AttendanceDetailsProps {
  route: {
    params: {
      studentId: string;
    };
  };
}

interface AttendanceRecord {
  id: string;
  entry_time: string;
  exit_time: string | null;
  total_duration: string | null;
  date: string;
}

type NavigationProp = StackNavigationProp<RootStackParamList>;

const AttendanceDetails: React.FC<AttendanceDetailsProps> = ({ route }) => {
  const { studentId } = route.params;
  const navigation = useNavigation<NavigationProp>();
  const [loading, setLoading] = useState(true);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [groupedRecords, setGroupedRecords] = useState<Record<string, AttendanceRecord[]>>({});

  useEffect(() => {
    fetchAttendanceData();
  }, [studentId]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);

      // Fetch attendance records for the student using FastAPI
      const data = await apiClient.get(`/students/${studentId}/attendance`);

      // Process the data to add date field and group by date
      const processedData = data.map((record: any) => {
        const entryDate = new Date(record.entry_time);
        return {
          ...record,
          date: entryDate.toISOString().split('T')[0] // Format as YYYY-MM-DD
        };
      });

      // Group records by date
      const grouped = processedData.reduce((acc: Record<string, AttendanceRecord[]>, record: AttendanceRecord) => {
        if (!acc[record.date]) {
          acc[record.date] = [];
        }
        acc[record.date].push(record);
        return acc;
      }, {});

      setAttendanceRecords(processedData);
      setGroupedRecords(grouped);
    } catch (error) {
      console.error('Error in fetchAttendanceData:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (duration: string | null) => {
    if (!duration) return 'N/A';

    // Parse the PostgreSQL interval format (e.g., "02:30:00")
    const parts = duration.split(':');
    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);

    if (hours === 0) {
      return `${minutes} min`;
    } else if (minutes === 0) {
      return `${hours} hr${hours !== 1 ? 's' : ''}`;
    } else {
      return `${hours} hr${hours !== 1 ? 's' : ''} ${minutes} min`;
    }
  };

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return 'N/A';

    const date = new Date(timeStr);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateTotalDuration = (records: AttendanceRecord[]) => {
    let totalMinutes = 0;

    records.forEach(record => {
      if (record.total_duration) {
        const parts = record.total_duration.split(':');
        const hours = parseInt(parts[0]);
        const minutes = parseInt(parts[1]);
        totalMinutes += (hours * 60) + minutes;
      }
    });

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours === 0) {
      return `${minutes} min`;
    } else if (minutes === 0) {
      return `${hours} hr${hours !== 1 ? 's' : ''}`;
    } else {
      return `${hours} hr${hours !== 1 ? 's' : ''} ${minutes} min`;
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Attendance Details"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6200ee" />
            <Text style={styles.loadingText}>Loading attendance records...</Text>
          </View>
        ) : attendanceRecords.length === 0 ? (
          <Surface style={styles.emptyContainer}>
            <MaterialCommunityIcons name="calendar-blank" size={48} color="#9ca3af" />
            <Text style={styles.emptyText}>No attendance records found</Text>
          </Surface>
        ) : (
          <View>
            {Object.keys(groupedRecords).map(date => (
              <Surface key={date} style={styles.dateContainer}>
                <View style={styles.dateHeader}>
                  <Text style={styles.dateText}>{formatDate(date)}</Text>
                  <Text style={styles.totalDuration}>
                    Total: {calculateTotalDuration(groupedRecords[date])}
                  </Text>
                </View>

                <DataTable>
                  <DataTable.Header>
                    <DataTable.Title>Entry Time</DataTable.Title>
                    <DataTable.Title>Exit Time</DataTable.Title>
                    <DataTable.Title numeric>Duration</DataTable.Title>
                  </DataTable.Header>

                  {groupedRecords[date].map(record => (
                    <DataTable.Row key={record.id}>
                      <DataTable.Cell>{formatTime(record.entry_time)}</DataTable.Cell>
                      <DataTable.Cell>
                        {record.exit_time ? formatTime(record.exit_time) : 'Active'}
                      </DataTable.Cell>
                      <DataTable.Cell numeric>
                        {record.total_duration ? formatDuration(record.total_duration) : 'In progress'}
                      </DataTable.Cell>
                    </DataTable.Row>
                  ))}
                </DataTable>
              </Surface>
            ))}
          </View>
        )}
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
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
    fontSize: 14,
  },
  emptyContainer: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 16,
    color: '#6b7280',
    fontSize: 16,
  },
  dateContainer: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f5f3ff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4b5563',
  },
  totalDuration: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6200ee',
  },
});

export default AttendanceDetails;
