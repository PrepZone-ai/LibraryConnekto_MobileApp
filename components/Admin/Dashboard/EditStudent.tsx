import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, HelperText, Surface, Switch, Text, TextInput } from 'react-native-paper';
import { apiClient } from '../../../config/api';
import { AdminStackScreenProps } from '../../../types/navigation';
import Header from '../../common/Header';

type Props = AdminStackScreenProps<'EditStudent'>;

interface Student {
  id: string;
  name: string;
  email: string;
  mobile_no: string;
  address: string;
  is_shift_student: boolean;
  shift_time: string | null;
  subscription_time: number;
  subscription_status: 'Active' | 'Expired';
  status: 'Present' | 'Absent';
}

const EditStudent: React.FC<Props> = ({ navigation, route }) => {
  const studentId = route.params?.studentId;
  const [student, setStudent] = useState<Student | null>(null);
  const [updating, setUpdating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [editedStudent, setEditedStudent] = useState<Partial<Student>>({});

  useEffect(() => {
    loadStudentData();
  }, [studentId]);

  const loadStudentData = async () => {
    if (!studentId) return;

    try {
      const data = await apiClient.get<Student>(`/admin/students/${studentId}`);
      
      if (data) {
        setStudent(data);
        setEditedStudent({
          name: data.name,
          email: data.email,
          mobile_no: data.mobile_no,
          address: data.address,
          is_shift_student: data.is_shift_student,
          shift_time: data.shift_time,
          subscription_time: data.subscription_time,
        });
      }
    } catch (error) {
      console.error('Error loading student:', error);
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

    if (editedStudent.subscription_time === undefined || editedStudent.subscription_time < 1) {
      newErrors.subscription_time = 'Subscription time must be at least 1 month';
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

      await apiClient.put(`/admin/students/${studentId}`, editedStudent);
      
      navigation.goBack();
    } catch (error) {
      console.error('Error updating student:', error);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Edit Student Details"
        showWelcome={false}
        rightComponent={
          <Button
            mode="text"
            onPress={() => navigation.goBack()}
            labelStyle={{ color: 'white' }}
          >
            Cancel
          </Button>
        }
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

          <TextInput
            label="Subscription Time (months)"
            value={editedStudent.subscription_time?.toString()}
            onChangeText={(text) => setEditedStudent(prev => ({ ...prev, subscription_time: parseInt(text) || 0 }))}
            style={styles.input}
            error={!!errors.subscription_time}
            keyboardType="numeric"
          />
          <HelperText type="error" visible={!!errors.subscription_time}>
            {errors.subscription_time}
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
        </Surface>
      </ScrollView>
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
});

export default EditStudent;
