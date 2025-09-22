import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Dialog, HelperText, Portal, Surface, Switch, Text, TextInput } from 'react-native-paper';
import { adminAPI, apiClient } from '../../../config/api';
import { AdminStackScreenProps } from '../../../types/navigation';
import Header from '../../common/Header';

type Props = AdminStackScreenProps<'EditStudent'>;

interface Student {
  id: string;
  student_id: string;
  auth_user_id: string;
  admin_id: string;
  name: string;
  email: string;
  mobile_no: string;
  address: string;
  subscription_start: string;
  subscription_end: string;
  subscription_status: 'Active' | 'Expired';
  is_shift_student: boolean;
  shift_time: string | null;
  status: 'Present' | 'Absent';
  last_visit: string | null;
  created_at: string;
  updated_at: string;
}

const EditStudent: React.FC<Props> = ({ navigation, route }) => {
  const studentId = route.params?.studentId;
  const [student, setStudent] = useState<Student | null>(null);
  const [updating, setUpdating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [editedStudent, setEditedStudent] = useState<Partial<Student>>({});
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    loadStudentData();
  }, [studentId]);

  const loadStudentData = async () => {
    if (!studentId) return;
    
    try {
      // Get student data using FastAPI
      const students = await adminAPI.getStudents();
      const studentData = students.find(s => s.id === studentId);

      if (!studentData) {
        Alert.alert('Error', 'Student not found');
        return;
      }

      setStudent({
        ...studentData,
        status: studentData.status || 'Absent'
      } as Student);
      setEditedStudent({
        name: studentData.name,
        email: studentData.email,
        mobile_no: studentData.mobile_no,
        address: studentData.address,
        is_shift_student: studentData.is_shift_student,
        shift_time: studentData.shift_time,
        subscription_end: studentData.subscription_end,
      });
    } catch (error: any) {
      console.error('Error in loadStudentData:', error);
      Alert.alert('Error', `An unexpected error occurred: ${error.message}`);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string | undefined> = {};

    if (!editedStudent.name?.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!editedStudent.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(editedStudent.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!editedStudent.mobile_no?.trim()) {
      newErrors.mobile_no = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(editedStudent.mobile_no.replace(/[^0-9]/g, ''))) {
      newErrors.mobile_no = 'Please enter a valid 10-digit mobile number';
    }

    if (!editedStudent.address?.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!editedStudent.subscription_end) {
      newErrors.subscription_end = 'Subscription end date is required';
    }

    if (editedStudent.is_shift_student && !editedStudent.shift_time?.trim()) {
      newErrors.shift_time = 'Shift time is required for shift students';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveChanges = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setUpdating(true);

      // Calculate subscription status based on end date
      const endDate = new Date(editedStudent.subscription_end || '');
      const now = new Date();
      const subscriptionStatus = endDate > now ? 'Active' : 'Expired';

      const response = await apiClient.put(`/admin/students/${studentId}`, {
        name: editedStudent.name?.trim(),
        email: editedStudent.email?.trim(),
        mobile_no: editedStudent.mobile_no?.trim(),
        address: editedStudent.address?.trim(),
        is_shift_student: editedStudent.is_shift_student ?? false,
        shift_time: editedStudent.shift_time?.trim() || null,
        subscription_end: editedStudent.subscription_end,
        subscription_status: subscriptionStatus,
        updated_at: new Date().toISOString()
      });

      // Check if the response indicates success
      if (response) {
        console.log('Student updated successfully');
      }

      Alert.alert('Success', 'Student details updated successfully');
      // Return to StudentManagement screen after successful update
      navigation.goBack();
    } catch (error: any) {
      console.error('Error updating student:', error.message);
      setErrors({ submit: 'An unexpected error occurred. Please try again.' });
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveStudent = async () => {
    try {
      setRemoving(true);
      
      // Delete the student record
      const response = await apiClient.delete(`/admin/students/${studentId}`);
      
      // Check if the response indicates success
      if (response) {
        console.log('Student deleted successfully');
      }
      
      Alert.alert('Success', 'Student has been removed successfully');
      navigation.goBack();
    } catch (error: any) {
      console.error('Error removing student:', error);
      Alert.alert('Error', `Failed to remove student: ${error.message}`);
    } finally {
      setRemoving(false);
      setShowRemoveDialog(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  };

  return (
    <View style={styles.container}>
      <Header 
        title="Edit Student Details"
        showWelcome={false}
        autoBackButton={true}
      />
      
      <ScrollView style={styles.content}>
        <Surface style={styles.form}>
          {student && (
            <View style={styles.studentIdContainer}>
              <Text style={styles.studentIdLabel}>Student ID:</Text>
              <Text style={styles.studentIdValue}>{student.student_id}</Text>
            </View>
          )}

          <TextInput
            label="Name"
            value={editedStudent.name}
            onChangeText={(text) => setEditedStudent(prev => ({ ...prev, name: text }))}
            style={styles.input}
            error={!!errors.name}
          />
          <HelperText type="error" visible={!!errors.name}>
            {errors.name}
          </HelperText>

          <TextInput
            label="Email"
            value={editedStudent.email}
            onChangeText={(text) => setEditedStudent(prev => ({ ...prev, email: text }))}
            style={styles.input}
            error={!!errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <HelperText type="error" visible={!!errors.email}>
            {errors.email}
          </HelperText>

          <TextInput
            label="Mobile Number"
            value={editedStudent.mobile_no}
            onChangeText={(text) => setEditedStudent(prev => ({ ...prev, mobile_no: text }))}
            style={styles.input}
            error={!!errors.mobile_no}
            keyboardType="phone-pad"
          />
          <HelperText type="error" visible={!!errors.mobile_no}>
            {errors.mobile_no}
          </HelperText>

          <TextInput
            label="Address"
            value={editedStudent.address}
            onChangeText={(text) => setEditedStudent(prev => ({ ...prev, address: text }))}
            style={styles.input}
            error={!!errors.address}
            multiline
          />
          <HelperText type="error" visible={!!errors.address}>
            {errors.address}
          </HelperText>

          {student && (
            <View style={styles.subscriptionContainer}>
              <Text style={styles.subscriptionLabel}>Subscription Start:</Text>
              <Text style={styles.subscriptionValue}>
                {formatDate(student.subscription_start)}
              </Text>
            </View>
          )}

          <TextInput
            label="Subscription End Date"
            value={editedStudent.subscription_end ? formatDate(editedStudent.subscription_end) : ''}
            onChangeText={(text) => setEditedStudent(prev => ({ ...prev, subscription_end: text }))}
            style={styles.input}
            error={!!errors.subscription_end}
            placeholder="YYYY-MM-DD"
          />
          <HelperText type="error" visible={!!errors.subscription_end}>
            {errors.subscription_end}
          </HelperText>
          <HelperText type="info" visible={true}>
            You can extend the subscription end date to renew the subscription.
          </HelperText>

          <View style={styles.switchContainer}>
            <Text>Shift Student</Text>
            <Switch
              value={editedStudent.is_shift_student}
              onValueChange={(value) => {
                setEditedStudent(prev => ({ ...prev, is_shift_student: value }));
                if (!value) {
                  setEditedStudent(prev => ({ ...prev, shift_time: '' }));
                }
              }}
            />
          </View>

          {editedStudent.is_shift_student && (
            <>
              <TextInput
                label="Shift Time"
                value={editedStudent.shift_time || ''}
                onChangeText={(text) => setEditedStudent(prev => ({ ...prev, shift_time: text }))}
                style={styles.input}
                error={!!errors.shift_time}
              />
              <HelperText type="error" visible={!!errors.shift_time}>
                {errors.shift_time}
              </HelperText>
            </>
          )}

          {errors.submit && (
            <HelperText type="error" visible={!!errors.submit}>
              {errors.submit}
            </HelperText>
          )}

          <Button
            mode="contained"
            onPress={handleSaveChanges}
            style={[styles.saveButton, { backgroundColor: '#4CAF50' }]}
            loading={updating}
            disabled={updating}
          >
            Save Changes
          </Button>

          <Button
            mode="outlined"
            onPress={() => setShowRemoveDialog(true)}
            style={styles.removeButton}
            color="#F44336"
          >
            Remove Student
          </Button>
        </Surface>
      </ScrollView>

      <Portal>
        <Dialog visible={showRemoveDialog} onDismiss={() => setShowRemoveDialog(false)}>
          <Dialog.Title>Remove Student</Dialog.Title>
          <Dialog.Content>
            <Text>Are you sure you want to remove this student? This action cannot be undone.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowRemoveDialog(false)}>Cancel</Button>
            <Button 
              onPress={handleRemoveStudent} 
              color="#F44336"
              loading={removing}
              disabled={removing}
            >
              Remove
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  form: {
    padding: 16,
    borderRadius: 8,
    elevation: 2,
  },
  studentIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  studentIdLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginRight: 8,
  },
  studentIdValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  subscriptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  subscriptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginRight: 8,
  },
  subscriptionValue: {
    fontSize: 14,
    color: '#333',
  },
  input: {
    marginBottom: 4,
    backgroundColor: 'white',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  saveButton: {
    marginTop: 24,
  },
  removeButton: {
    marginTop: 12,
    borderColor: '#F44336',
  },
});

export default EditStudent;
