import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { TextInput, Button, Text, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, StudentTabScreens } from '../../types/navigation';
import { apiClient, setAuthToken, AuthResponse, StudentProfile } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';

type StudentLoginNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const StudentLogin = () => {
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<StudentLoginNavigationProp>();
  const { setStudentInfo, setIsLoggedIn } = useAuth();

  const handleLogin = async () => {
    setError('');
    setLoading(true);

    if (!studentId.trim() || !password.trim()) {
      setError('Please enter both student ID and password');
      setLoading(false);
      return;
    }

    try {
      // Validate student ID format (e.g., LIBR25001 or HANU25001)
      // Format is: 4 letters of library name + 2 digits of year + 3 digits sequence
      const studentIdRegex = /^[A-Z]{4}\d{5}$/;
      const formattedStudentId = studentId.trim().toUpperCase();
      
      // Validate the student ID format
      if (!studentIdRegex.test(formattedStudentId)) {
        throw new Error('Invalid student ID format. Example: LIBR25001 or HANU25001');
      }

      console.log('Debug - Searching for student ID:', formattedStudentId);

      // Use FastAPI to authenticate student
      const response = await apiClient.post<AuthResponse>('/auth/student/signin', {
        email: formattedStudentId, // Use student ID as email for now
        password: password
      });

      console.log('Debug - Login response:', response);
      console.log('Debug - is_first_login:', response.is_first_login);

      if (response.access_token) {
        // Store the auth token
        await setAuthToken(response.access_token);

        // Check if this is first login
        if (response.is_first_login) {
          console.log('First login detected, redirecting to password setup');
          
          // Store student information in AsyncStorage
          await Promise.all([
            AsyncStorage.setItem('userRole', 'student'),
            AsyncStorage.setItem('studentId', response.student_id || formattedStudentId),
            AsyncStorage.setItem('isFirstLogin', 'true'),
            AsyncStorage.setItem('userId', response.user_id || '')
          ]);

          // Update authentication context for first login
          await setStudentInfo(response.user_id || '', 'Student'); // Temporary name
          setIsLoggedIn(true);

          // Navigate to password setup screen
          navigation.navigate('StudentPasswordSetup', {
            studentId: response.student_id || formattedStudentId
          });
          return;
        }

        // Regular login - get student profile to get additional info
        const studentProfile = await apiClient.get<StudentProfile>('/student/profile');

        // Store student information in AsyncStorage
        await Promise.all([
          AsyncStorage.setItem('userRole', 'student'),
          AsyncStorage.setItem('studentId', studentProfile.student_id || formattedStudentId),
          AsyncStorage.setItem('studentName', studentProfile.name),
          AsyncStorage.setItem('userEmail', studentProfile.email),
          AsyncStorage.setItem('userId', studentProfile.auth_user_id),
          AsyncStorage.setItem('isFirstLogin', 'false')
        ]);

        // Update authentication context
        await setStudentInfo(studentProfile.auth_user_id, studentProfile.name);
        setIsLoggedIn(true);

        // Check if there was an attempted tab before login
        const lastAttemptedTab = await AsyncStorage.getItem('lastAttemptedTab') as StudentTabScreens | null;
        await AsyncStorage.removeItem('lastAttemptedTab'); // Clear the stored tab

        // Navigate to the attempted tab or student home with proper reset
        navigation.reset({
          index: 0,
          routes: [
            {
              name: 'StudentHome',
              params: {
                screen: lastAttemptedTab || 'StudentHomeTab'
              }
            }
          ]
        });
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigation.navigate('UseRole');
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleBack} style={styles.backButton}>
        <MaterialCommunityIcons name="arrow-left" size={24} color="#6200ee" />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <Surface style={styles.formContainer}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/favicon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text variant="headlineMedium" style={styles.title}>Student Login</Text>
        </View>

        <TextInput
          label="Student ID"
          value={studentId}
          onChangeText={setStudentId}
          mode="outlined"
          style={styles.input}
          autoCapitalize="characters"
          placeholder="Example: LIBR25001"
        />

        <TextInput
          label="Password (Mobile Number)"
          value={password}
          onChangeText={setPassword}
          mode="outlined"
          style={styles.input}
          secureTextEntry={!showPassword}
          keyboardType="numeric"
          maxLength={10}
          right={
            <TextInput.Icon
              icon={showPassword ? 'eye-off' : 'eye'}
              onPress={() => setShowPassword(!showPassword)}
            />
          }
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Button
          mode="contained"
          onPress={handleLogin}
          style={styles.loginButton}
          contentStyle={styles.loginButtonContent}
          loading={loading}
          disabled={loading}
        >
          Login
        </Button>

        <View style={styles.helpContainer}>
          <TouchableOpacity>
            <Text style={styles.helpText}>Forgot Password?</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.helpText}>Need Help?</Text>
          </TouchableOpacity>
        </View>
      </Surface>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backText: {
    marginLeft: 8,
    color: '#6200ee',
    fontSize: 16,
  },
  formContainer: {
    flex: 1,
    padding: 24,
    borderRadius: 12,
    elevation: 4,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  title: {
    color: '#6200ee',
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 16,
  },
  loginButton: {
    marginTop: 8,
  },
  loginButtonContent: {
    paddingVertical: 8,
  },
  errorText: {
    color: '#B00020',
    marginBottom: 16,
    textAlign: 'center',
  },
  helpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  helpText: {
    color: '#6200ee',
  },
});

export default StudentLogin;