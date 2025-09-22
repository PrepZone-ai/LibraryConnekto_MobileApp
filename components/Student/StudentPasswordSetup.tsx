import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { TextInput, Button, Text, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { apiClient, setAuthToken } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';

type StudentPasswordSetupNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface RouteParams {
  studentId: string;
}

const StudentPasswordSetup = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const navigation = useNavigation<StudentPasswordSetupNavigationProp>();
  const route = useRoute();
  const { studentId } = route.params as RouteParams;
  const { setStudentInfo, setIsLoggedIn } = useAuth();

  const handlePasswordSetup = async () => {
    setError('');
    setLoading(true);

    console.log('Starting password setup for student:', studentId);

    if (!newPassword.trim() || !confirmPassword.trim()) {
      setError('Please enter both passwords');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      // Set password using student ID (first login)
      const response = await apiClient.post<{success: boolean}>('/student/set-password', {
        student_id: studentId,
        new_password: newPassword
      });

      console.log('Password setup response:', response);

      if (response.success) {
        setSuccess(true);
        
        // Get student profile to get additional info
        const studentProfile = await apiClient.get<{name: string; email: string; auth_user_id: string}>('/student/profile');
        console.log('Student profile retrieved:', studentProfile);

        // Store complete student information in AsyncStorage
        await Promise.all([
          AsyncStorage.setItem('studentName', studentProfile.name),
          AsyncStorage.setItem('userEmail', studentProfile.email),
          AsyncStorage.setItem('userId', studentProfile.auth_user_id),
          AsyncStorage.setItem('isFirstLogin', 'false')
        ]);

        console.log('AsyncStorage updated with student info');

        // Update authentication context
        await setStudentInfo(studentProfile.auth_user_id, studentProfile.name);
        setIsLoggedIn(true);

        console.log('Authentication context updated');

        // Show success message for 2 seconds, then navigate
        setTimeout(() => {
          console.log('Navigating to student home...');
          // Navigate to student home with proper tab structure
          navigation.reset({
            index: 0,
            routes: [
              {
                name: 'StudentHome',
                params: {
                  screen: 'StudentHomeTab'
                }
              }
            ]
          });
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Password setup failed. Please try again.');
      console.error('Password setup error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigation.navigate('StudentLogin');
  };

  if (success) {
    return (
      <View style={styles.container}>
        <Surface style={styles.formContainer}>
          <View style={styles.successContainer}>
            <MaterialCommunityIcons name="check-circle" size={64} color="#4CAF50" />
            <Text variant="headlineSmall" style={styles.successTitle}>Password Set Successfully!</Text>
            <Text style={styles.successText}>
              Your password has been updated. You will be redirected to your dashboard shortly.
            </Text>
          </View>
        </Surface>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleBack} style={styles.backButton}>
        <MaterialCommunityIcons name="arrow-left" size={24} color="#6200ee" />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <Surface style={styles.formContainer}>
        <View style={styles.headerContainer}>
          <MaterialCommunityIcons name="lock-reset" size={48} color="#6200ee" />
          <Text variant="headlineMedium" style={styles.title}>Set Your Password</Text>
          <Text style={styles.subtitle}>
            Welcome! Please set a secure password for your account.
          </Text>
        </View>

        <Text style={styles.studentIdText}>
          Student ID: <Text style={styles.studentIdValue}>{studentId}</Text>
        </Text>

        <TextInput
          label="New Password"
          value={newPassword}
          onChangeText={setNewPassword}
          mode="outlined"
          style={styles.input}
          secureTextEntry={!showPassword}
          right={
            <TextInput.Icon
              icon={showPassword ? 'eye-off' : 'eye'}
              onPress={() => setShowPassword(!showPassword)}
            />
          }
        />

        <TextInput
          label="Confirm New Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          mode="outlined"
          style={styles.input}
          secureTextEntry={!showConfirmPassword}
          right={
            <TextInput.Icon
              icon={showConfirmPassword ? 'eye-off' : 'eye'}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            />
          }
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Button
          mode="contained"
          onPress={handlePasswordSetup}
          style={styles.setupButton}
          contentStyle={styles.setupButtonContent}
          loading={loading}
          disabled={loading}
        >
          Set Password
        </Button>

        <Text style={styles.infoText}>
          Your password must be at least 6 characters long.
        </Text>
      </Surface>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  backText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#6200ee',
  },
  formContainer: {
    flex: 1,
    margin: 16,
    padding: 24,
    borderRadius: 12,
    elevation: 4,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    marginTop: 16,
    marginBottom: 8,
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    lineHeight: 24,
  },
  studentIdText: {
    textAlign: 'center',
    marginBottom: 24,
    fontSize: 16,
    color: '#333',
  },
  studentIdValue: {
    fontWeight: 'bold',
    color: '#6200ee',
  },
  input: {
    marginBottom: 16,
  },
  errorText: {
    color: '#d32f2f',
    marginBottom: 16,
    textAlign: 'center',
  },
  setupButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  setupButtonContent: {
    paddingVertical: 8,
  },
  infoText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
  },
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  successTitle: {
    marginTop: 16,
    marginBottom: 16,
    color: '#4CAF50',
    textAlign: 'center',
  },
  successText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    lineHeight: 24,
  },
});

export default StudentPasswordSetup; 