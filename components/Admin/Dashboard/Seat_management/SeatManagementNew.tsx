import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, Alert } from 'react-native';
import { ActivityIndicator, Surface, Text, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { adminAPI, StudentProfile } from '../../../../config/api';
import { useAuth } from '../../../../contexts/AuthContext';
import { AdminStackParamList } from '../../../../types/navigation';
import Header from '../../../common/Header';


type Props = NativeStackScreenProps<AdminStackParamList, 'SeatManagementNew'>;

interface SeatData {
  seatNumber: number;
  isOccupied: boolean;
  student?: StudentProfile;
}

const SeatManagementNew: React.FC<Props> = ({ route, navigation }) => {
  const { dashboardStats, libraryName } = route.params || {};
  const { user, isLoggedIn } = useAuth();
  const [seats, setSeats] = useState<SeatData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  console.log('SeatManagementNew - Component rendered');
  console.log('SeatManagementNew - Dashboard stats:', dashboardStats);

  // Initialize seats immediately
  useEffect(() => {
    if (dashboardStats && dashboardStats.total_seats > 0) {
      console.log('SeatManagementNew - Creating seats:', dashboardStats.total_seats);
      
      // Create empty seats immediately
      const emptySeats: SeatData[] = Array.from(
        { length: dashboardStats.total_seats },
        (_, index) => ({
          seatNumber: index + 1,
          isOccupied: false,
        })
      );
      
      setSeats(emptySeats);
      
      // Load students in background
      loadStudents();
    }
  }, [dashboardStats]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      console.log('SeatManagementNew - Loading students...');

      if (!user || !isLoggedIn) {
        console.log('SeatManagementNew - User not authenticated');
        return;
      }

      const students = await adminAPI.getStudents();
      console.log('SeatManagementNew - Students loaded:', students?.length || 0);

      if (students && Array.isArray(students) && dashboardStats) {
        setSeats(prevSeats => {
          const updatedSeats = [...prevSeats];
          
          students.forEach((student: StudentProfile) => {
            if (!student.student_id) return;

            // Simple seat assignment based on student ID
            let seatNumber: number;
            const idMatch = student.student_id.match(/\d+$/);
            if (idMatch) {
              const idNumber = parseInt(idMatch[0]);
              seatNumber = ((idNumber - 1) % dashboardStats.total_seats) + 1;
            } else {
              const hash = student.student_id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
              seatNumber = (hash % dashboardStats.total_seats) + 1;
            }

            if (seatNumber <= dashboardStats.total_seats) {
              updatedSeats[seatNumber - 1] = {
                seatNumber,
                isOccupied: true,
                student,
              };
            }
          });
          
          return updatedSeats;
        });
      }
    } catch (error) {
      console.error('SeatManagementNew - Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeatPress = (seat: SeatData) => {
    if (seat.isOccupied && seat.student) {
      setSelectedStudent(seat.student);
      setModalVisible(true);
    } else {
      Alert.alert('Available Seat', `Seat ${seat.seatNumber} is available. Seats are automatically assigned based on student ID numbers.`);
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    try {
      if (!selectedStudent) return;

      Alert.alert(
        'Remove Student',
        `Are you sure you want to remove ${selectedStudent.name} (${selectedStudent.student_id})?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: async () => {
              await adminAPI.removeStudent(studentId);
              Alert.alert('Success', `Student ${selectedStudent.name} has been removed successfully.`);
              setModalVisible(false);
              setSelectedStudent(null);
              loadStudents(); // Reload students
            }
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', `Failed to remove student: ${error.message}`);
    }
  };

  const renderSeat = (seat: SeatData) => {
    const isOccupied = seat.isOccupied;
    const student = seat.student;

    return (
      <TouchableOpacity
        key={seat.seatNumber}
        onPress={() => handleSeatPress(seat)}
        style={styles.seatWrapper}
      >
        <Surface style={[
          styles.seat,
          isOccupied ? styles.occupiedSeat : styles.availableSeat
        ]}>
          <MaterialCommunityIcons
            name={isOccupied ? 'seat' : 'seat-outline'}
            size={24}
            color="#FFF"
          />
          <Text style={styles.seatNumber}>
            {seat.seatNumber}
          </Text>
          {isOccupied && student && (
            <>
              <Text style={styles.studentId} numberOfLines={1}>
                {student.student_id}
              </Text>
              <Text style={styles.studentName} numberOfLines={1}>
                {student.name}
              </Text>
            </>
          )}
        </Surface>
      </TouchableOpacity>
    );
  };

  const renderStudentModal = () => {
    if (!selectedStudent) return null;

    return (
      <View style={styles.modalOverlay}>
        <Surface style={styles.modal}>
          <Text style={styles.modalTitle}>Student Details</Text>
          <Text style={styles.modalText}>Name: {selectedStudent.name}</Text>
          <Text style={styles.modalText}>ID: {selectedStudent.student_id}</Text>
          <Text style={styles.modalText}>Email: {selectedStudent.email}</Text>
          <Text style={styles.modalText}>Status: {selectedStudent.subscription_status}</Text>
          
          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={() => setModalVisible(false)}
              style={styles.modalButton}
            >
              Close
            </Button>
            <Button
              mode="contained"
              onPress={() => {
                setModalVisible(false);
                navigation.navigate('Chat', {
                  studentId: selectedStudent.id,
                  studentUserId: selectedStudent.auth_user_id,
                  studentName: selectedStudent.name,
                  fromAttendance: false
                });
              }}
              style={[styles.modalButton, styles.chatButton]}
              icon="chat"
            >
              Chat
            </Button>
            <Button
              mode="contained"
              onPress={() => handleRemoveStudent(selectedStudent.id)}
              style={[styles.modalButton, styles.removeButton]}
            >
              Remove Student
            </Button>
          </View>
        </Surface>
      </View>
    );
  };

  if (!dashboardStats || !dashboardStats.total_seats) {
    return (
      <View style={styles.container}>
        <Header
          title="Library Seat Management"
          username={libraryName}
          showWelcome={false}
          autoBackButton={true}
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No seat configuration found</Text>
          <Text style={styles.errorSubtext}>Please check your library settings</Text>
          <Button
            mode="contained"
            onPress={() => navigation.goBack()}
            style={styles.retryButton}
          >
            Go Back
          </Button>
        </View>
      </View>
    );
  }

  const occupiedSeats = seats.filter(seat => seat.isOccupied).length;
  const availableSeats = seats.filter(seat => !seat.isOccupied).length;

  return (
    <View style={styles.container}>
      <Header
        title="Library Seat Management"
        username={libraryName}
        showWelcome={false}
        autoBackButton={true}
        onBackPress={() => navigation.goBack()}
      />
      
      <ScrollView style={styles.content}>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color="#6200ee" />
            <Text style={styles.loadingText}>Updating student data...</Text>
          </View>
        )}

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <Surface style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
            <Text style={styles.statTitle}>Total Seats</Text>
            <Text style={[styles.statValue, { color: '#1976D2' }]}>
              {dashboardStats.total_seats}
            </Text>
          </Surface>
          <Surface style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
            <Text style={styles.statTitle}>Occupied</Text>
            <Text style={[styles.statValue, { color: '#4CAF50' }]}>
              {occupiedSeats}
            </Text>
          </Surface>
          <Surface style={[styles.statCard, { backgroundColor: '#FFEBEE' }]}>
            <Text style={styles.statTitle}>Available</Text>
            <Text style={[styles.statValue, { color: '#FF5252' }]}>
              {availableSeats}
            </Text>
          </Surface>
        </View>

        {/* Seat Grid */}
        <View style={styles.seatGridContainer}>
          <Text style={styles.sectionTitle}>Seat Layout</Text>
          <View style={styles.seatGrid}>
            {seats.map(renderSeat)}
          </View>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <Surface style={[styles.legendSeat, styles.availableSeat]}>
              <MaterialCommunityIcons name="seat-outline" size={20} color="#FFF" />
            </Surface>
            <Text>Available</Text>
          </View>
          <View style={styles.legendItem}>
            <Surface style={[styles.legendSeat, styles.occupiedSeat]}>
              <MaterialCommunityIcons name="seat" size={20} color="#FFF" />
            </Surface>
            <Text>Occupied</Text>
          </View>
        </View>

        {/* Refresh Button */}
        <Button
          mode="contained"
          onPress={loadStudents}
          loading={loading}
          style={styles.refreshButton}
          icon="refresh"
        >
          Refresh Data
        </Button>
      </ScrollView>

      {/* Student Modal */}
      {modalVisible && renderStudentModal()}
      

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 16,
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    color: '#666666',
    fontSize: 14,
    marginTop: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  errorSubtext: {
    color: '#666666',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  retryButton: {
    marginTop: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    elevation: 3,
  },
  statTitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  seatGridContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  seatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  seatWrapper: {
    margin: 4,
  },
  seat: {
    width: 80,
    height: 80,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  availableSeat: {
    backgroundColor: '#FF5252',
  },
  occupiedSeat: {
    backgroundColor: '#4CAF50',
  },
  seatNumber: {
    fontSize: 12,
    color: '#FFF',
    marginTop: 4,
  },
  studentId: {
    fontSize: 8,
    color: '#FFF',
    marginTop: 2,
    maxWidth: 70,
  },
  studentName: {
    fontSize: 8,
    color: '#FFF',
    marginTop: 1,
    maxWidth: 70,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendSeat: {
    width: 32,
    height: 32,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButton: {
    margin: 16,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  modal: {
    padding: 20,
    borderRadius: 12,
    margin: 20,
    minWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 14,
    marginBottom: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    gap: 8,
  },
  modalButton: {
    flex: 1,
  },
  removeButton: {
    backgroundColor: '#F44336',
  },
  chatButton: {
    backgroundColor: '#4F46E5',
  },
});

export default SeatManagementNew; 