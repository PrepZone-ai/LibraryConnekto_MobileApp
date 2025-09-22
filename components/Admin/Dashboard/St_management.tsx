import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, DataTable, Modal, Portal, Searchbar, Surface, Text } from 'react-native-paper';
import { adminAPI, StudentProfile } from '../../../config/api';
import { useAuth } from '../../../contexts/AuthContext';
import { AdminStackScreenProps } from '../../../types/navigation';
import Header from '../../common/Header';

type Props = AdminStackScreenProps<'StudentManagement'>;

// Use StudentProfile from API types
type Student = StudentProfile;

const StudentManagement: React.FC<Props> = ({ navigation, route }) => {
  const { adminName, libraryName } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [studentsPerPage] = useState(10);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const isSelectingForChat = route.params?.selectForChat || false;

  const loadStudents = useCallback(async () => {
    try {
      setLoading(true);

      // Get all students using FastAPI
      const students = await adminAPI.getStudents();
      console.log('Students data:', students);

      setStudents(students || []);
    } catch (error: any) {
      console.error('Error loading students:', error.message);
      // Show an alert to the user
      Alert.alert('Error', 'Unable to fetch registered student data');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const setupPolling = useCallback(() => {
    // Set up polling to refresh data every 30 seconds
    const interval = setInterval(() => {
      loadStudents();
    }, 30000);

    setRefreshInterval(interval);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [loadStudents]);

  useEffect(() => {
    loadStudents();
    const cleanup = setupPolling();

    return cleanup;
  }, [loadStudents, setupPolling]);

  // Handle refresh flag from BulkStudentUpload
  useEffect(() => {
    if (route.params?.refresh) {
      loadStudents();
      // Clear the refresh flag
      navigation.setParams({ refresh: undefined });
    }
  }, [route.params?.refresh, loadStudents, navigation]);

  // Filter students based on search query
  const filteredStudents = students.filter(student => {
    const searchLower = searchQuery.toLowerCase();
    return (
      student.name.toLowerCase().includes(searchLower) ||
      student.email.toLowerCase().includes(searchLower) ||
      student.student_id.toLowerCase().includes(searchLower) ||
      student.mobile_no.includes(searchQuery)
    );
  });

  // Calculate pagination
  const from = page * studentsPerPage;
  const to = Math.min((page + 1) * studentsPerPage, filteredStudents.length);
  const paginatedStudents = filteredStudents.slice(from, to);

  // Stats calculations
  const totalStudents = students.length;
  const activeStudents = students.filter(student => student.subscription_status === 'Active').length;
  const presentStudents = students.filter(student => student.status === 'Present').length;

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleEditStudent = (student: Student) => {
    setModalVisible(false);
    // EditStudent screen expects studentId in route params
    navigation.navigate('EditStudent', { studentId: student.id.toString() });
  };

  const handleRemoveStudent = async () => {
    if (!selectedStudent) return;

    try {
      setRemoving(true);

      // Delete the student record using FastAPI
      await adminAPI.removeStudent(selectedStudent.id);

      // Update local state by removing the deleted student
      setStudents(prev => prev.filter(student => student.id !== selectedStudent.id));

      Alert.alert('Success', 'Student has been removed successfully');
      setShowRemoveDialog(false);
      setModalVisible(false);
      setSelectedStudent(null);
    } catch (error: any) {
      console.error('Error removing student:', error);
      Alert.alert('Error', `Failed to remove student: ${error.message}`);
    } finally {
      setRemoving(false);
    }
  };

  const handleChatWithStudent = (student: Student) => {
    setModalVisible(false);
    setSelectedStudent(null);
    navigation.navigate('Chat', {
      studentId: student.id,
      studentUserId: student.auth_user_id,
      studentName: student.name,
      fromAttendance: false
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title={isSelectingForChat ? "Select Student for Chat" : "Student Management"}
        showBackButton
        onBackPress={() => navigation.goBack()}
        libraryName={libraryName === null ? undefined : libraryName}
        isAdminPage={true}
      />

      <View style={styles.statsContainer}>
        <Surface style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
          <Text style={styles.statNumber}>{totalStudents}</Text>
          <Text style={styles.statLabel}>Total Students</Text>
        </Surface>
        <Surface style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
          <Text style={styles.statNumber}>{activeStudents}</Text>
          <Text style={styles.statLabel}>Active Subscriptions</Text>
        </Surface>
        <Surface style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
          <Text style={styles.statNumber}>{presentStudents}</Text>
          <Text style={styles.statLabel}>Present Today</Text>
        </Surface>
      </View>

      <Searchbar
        placeholder="Search students..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />

      <DataTable>
        <DataTable.Header>
          <DataTable.Title>ID</DataTable.Title>
          <DataTable.Title>Name</DataTable.Title>
          <DataTable.Title>Status</DataTable.Title>
          <DataTable.Title>Subscription</DataTable.Title>
          <DataTable.Title>Actions</DataTable.Title>
        </DataTable.Header>

        {paginatedStudents.map((student) => (
          <DataTable.Row key={student.id}>
            <DataTable.Cell>{student.student_id}</DataTable.Cell>
            <DataTable.Cell>{student.name}</DataTable.Cell>
            <DataTable.Cell>
              <Surface style={[
                styles.statusBadge,
                { backgroundColor: student.status === 'Present' ? '#4CAF50' : '#FF9800' }
              ]}>
                <Text style={styles.statusText}>{student.status}</Text>
              </Surface>
            </DataTable.Cell>
            <DataTable.Cell>
              <Surface style={[
                styles.statusBadge,
                { backgroundColor: student.subscription_status === 'Active' ? '#2196F3' : '#F44336' }
              ]}>
                <Text style={styles.statusText}>{student.subscription_status}</Text>
              </Surface>
            </DataTable.Cell>
            <DataTable.Cell>
              <Button
                mode="text"
                onPress={() => {
                  if (isSelectingForChat) {
                    handleChatWithStudent(student);
                  } else {
                    setSelectedStudent(student);
                    setModalVisible(true);
                  }
                }}
                style={styles.actionButton}
              >
                {isSelectingForChat ? "Select for Chat" : "View Details"}
              </Button>
            </DataTable.Cell>
          </DataTable.Row>
        ))}

        <DataTable.Pagination
          page={page}
          numberOfPages={Math.ceil(filteredStudents.length / studentsPerPage)}
          onPageChange={setPage}
          label={`${from + 1}-${to} of ${filteredStudents.length}`}
        />
      </DataTable>

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => {
            setModalVisible(false);
            setSelectedStudent(null);
          }}
          contentContainerStyle={styles.modalContainer}
        >
          {selectedStudent && (
            <Surface style={styles.modalContent}>
              <Text style={styles.modalTitle}>Student Details</Text>

              {/* Show a success message when student is updated */}
              {selectedStudent.updated_at && (
                <Text style={styles.lastUpdated}>
                  Last updated: {formatDate(selectedStudent.updated_at)}
                </Text>
              )}

              <ScrollView style={styles.detailsScroll}>
                <View style={styles.detailsContainer}>
                  <View style={styles.detailRow}>
                    <Text style={styles.label}>Student ID:</Text>
                    <Text style={styles.value}>{selectedStudent.student_id}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.label}>Name:</Text>
                    <Text style={styles.value}>{selectedStudent.name}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.label}>Email:</Text>
                    <Text style={styles.value}>{selectedStudent.email}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.label}>Mobile:</Text>
                    <Text style={styles.value}>{selectedStudent.mobile_no}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.label}>Address:</Text>
                    <Text style={styles.value}>{selectedStudent.address}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.label}>Subscription Period:</Text>
                    <Text style={styles.value}>{formatDate(selectedStudent.subscription_start)} - {formatDate(selectedStudent.subscription_end)}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.label}>Subscription Status:</Text>
                    <Text style={[
                      styles.value,
                      { color: selectedStudent.subscription_status === 'Active' ? '#4CAF50' : '#F44336' }
                    ]}>
                      {selectedStudent.subscription_status}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.label}>Shift Student:</Text>
                    <Text style={styles.value}>{selectedStudent.is_shift_student ? 'Yes' : 'No'}</Text>
                  </View>
                  {selectedStudent.is_shift_student && (
                    <View style={styles.detailRow}>
                      <Text style={styles.label}>Shift Time:</Text>
                      <Text style={styles.value}>{selectedStudent.shift_time || 'Not set'}</Text>
                    </View>
                  )}
                  <View style={styles.detailRow}>
                    <Text style={styles.label}>Status:</Text>
                    <Text style={[
                      styles.value,
                      { color: selectedStudent.status === 'Present' ? '#4CAF50' : '#FF9800' }
                    ]}>
                      {selectedStudent.status}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.label}>Last Visit:</Text>
                    <Text style={styles.value}>{formatDate(selectedStudent.last_visit || undefined)}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.label}>Member Since:</Text>
                    <Text style={styles.value}>{formatDate(selectedStudent.created_at)}</Text>
                  </View>
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <Button
                  mode="contained"
                  onPress={() => handleChatWithStudent(selectedStudent)}
                  style={[styles.modalButton, { backgroundColor: '#4F46E5' }]}
                  icon="chat"
                >
                  Chat
                </Button>
                <Button
                  mode="contained"
                  onPress={() => handleEditStudent(selectedStudent)}
                  style={[styles.modalButton, { backgroundColor: '#2196F3' }]}
                >
                  Edit Details
                </Button>
                <Button
                  mode="contained"
                  onPress={() => setShowRemoveDialog(true)}
                  style={[styles.modalButton, { backgroundColor: '#F44336' }]}
                >
                  Remove Student
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setModalVisible(false);
                    setSelectedStudent(null);
                  }}
                  style={styles.modalButton}
                >
                  Close
                </Button>
              </View>
            </Surface>
          )}
        </Modal>
        <Modal
          visible={showRemoveDialog}
          onDismiss={() => setShowRemoveDialog(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Surface style={styles.modalContent}>
            <Text style={styles.modalTitle}>Remove Student</Text>
            <Text style={{ marginBottom: 20 }}>Are you sure you want to remove this student? This action cannot be undone.</Text>

            <View style={styles.modalActions}>
              <Button
                mode="outlined"
                onPress={() => setShowRemoveDialog(false)}
                style={styles.modalButton}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleRemoveStudent}
                style={[styles.modalButton, { backgroundColor: '#F44336' }]}
                loading={removing}
                disabled={removing}
              >
                Remove
              </Button>
            </View>
          </Surface>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
  },
  statCard: {
    padding: 16,
    borderRadius: 8,
    elevation: 2,
    flex: 1,
    marginHorizontal: 8,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  searchBar: {
    margin: 16,
    elevation: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionButton: {
    marginHorizontal: 4,
  },
  modalContainer: {
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  detailsScroll: {
    maxHeight: '80%',
  },
  detailsContainer: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  value: {
    flex: 2,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 8,
  },
  modalButton: {
    minWidth: 100,
    marginBottom: 8,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 16,
    textAlign: 'center',
  },
});

export default StudentManagement;
