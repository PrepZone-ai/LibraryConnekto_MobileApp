import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Surface, Title, ActivityIndicator, Snackbar } from 'react-native-paper';
import { apiClient } from '../../../config/api';
import { AdminStackScreenProps } from '../../../types/navigation';

type Props = AdminStackScreenProps<'StudentDetails'>;

interface StudentData {
  id: string;
  student_id: string;
  admin_id: string;
  name: string;
  email: string;
  mobile_no: string;
  address: string;
  subscription_time: number;
  subscription_status: 'Active' | 'Expired';
  is_shift_student: boolean;
  shift_time: string | null;
  status: 'Present' | 'Absent';
  last_visit: string | null;
  created_at: string;
  updated_at: string;
}

interface LibraryDetails {
  library_name: string;
  total_seats: number;
}

const formatDate = (dateString: string) => {
  if (!dateString) return 'Not available';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const StudentDetails: React.FC<Props> = ({ navigation, route }) => {
  const [student, setStudent] = useState<StudentData | null>(null);
  const [libraryDetails, setLibraryDetails] = useState<LibraryDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    loadStudentData();
  }, [route.params?.studentId]);

  const loadStudentData = async () => {
    if (!route.params?.studentId) return;

    try {
      const data = await apiClient.get<StudentData>(`/admin/students/${route.params.studentId}`);
      setStudent(data);
      
      // Load library details
      const libraryData = await apiClient.get<LibraryDetails>('/admin/library-details');
      setLibraryDetails(libraryData);
    } catch (err: any) {
      setError(err.message);
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading student details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={loadStudentData} style={styles.retryButton}>
          Retry
        </Button>
        <Button mode="outlined" onPress={() => navigation.goBack()} style={styles.retryButton}>
          Go Back
        </Button>
      </View>
    );
  }

  if (!student || !libraryDetails) {
    return (
      <View style={styles.container}>
        <Text>No student details available</Text>
        <Button mode="contained" onPress={() => navigation.goBack()}>
          Close
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Surface style={styles.card}>
          <Title style={styles.title}>Student Information</Title>
          
          <View style={styles.detailRow}>
            <Text style={styles.label}>Student ID:</Text>
            <Text style={styles.value}>{student.student_id}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{student.name}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{student.email}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.label}>Mobile:</Text>
            <Text style={styles.value}>{student.mobile_no}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.label}>Address:</Text>
            <Text style={styles.value}>{student.address}</Text>
          </View>
        </Surface>

        <Surface style={styles.card}>
          <Title style={styles.title}>Library Status</Title>
          
          <View style={styles.detailRow}>
            <Text style={styles.label}>Library:</Text>
            <Text style={styles.value}>{libraryDetails.library_name}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Subscription:</Text>
            <Text 
              style={[
                styles.value,
                student.subscription_status === 'Active' ? styles.activeStatus : styles.expiredStatus
              ]}
            >
              {student.subscription_status}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Subscription Time:</Text>
            <Text style={styles.value}>{student.subscription_time} month(s)</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Current Status:</Text>
            <Text 
              style={[
                styles.value,
                student.status === 'Present' ? styles.activeStatus : styles.expiredStatus
              ]}
            >
              {student.status}
            </Text>
          </View>

          {student.is_shift_student && (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Shift Time:</Text>
              <Text style={styles.value}>{student.shift_time || 'Not set'}</Text>
            </View>
          )}

          {student.last_visit && (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Last Visit:</Text>
              <Text style={styles.value}>{formatDate(student.last_visit)}</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.label}>Member Since:</Text>
            <Text style={styles.value}>{formatDate(student.created_at)}</Text>
          </View>
        </Surface>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <Button 
          mode="contained" 
          onPress={() => navigation.goBack()}
          style={styles.button}
        >
          Back
        </Button>
      </View>

      <Snackbar
        visible={showError}
        onDismiss={() => setShowError(false)}
        action={{
          label: 'Dismiss',
          onPress: () => setShowError(false),
        }}
      >
        {error}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    color: '#f44336',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
  },
  scrollView: {
    flex: 1,
    marginBottom: 80, // Account for bottom button
  },
  card: {
    padding: 16,
    marginVertical: 8,
    elevation: 4,
    borderRadius: 8,
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center',
  },
  label: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  value: {
    flex: 2,
    fontSize: 16,
  },
  activeStatus: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  expiredStatus: {
    color: '#f44336',
    fontWeight: 'bold',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  button: {
    marginVertical: 8,
  },
});

export default StudentDetails;
