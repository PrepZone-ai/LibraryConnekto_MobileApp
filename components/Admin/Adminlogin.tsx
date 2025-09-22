import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { TextInput, Button, Text, Surface, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NavigatorScreenParams } from '@react-navigation/native';
import { RootStackParamList, AdminStackParamList, AdminTabParamList } from '../../types/navigation';
import { signUpAdmin, signInAdmin } from '../../services/authService';
import { checkDatabaseConnection } from '../../config/api';

type AdminLoginNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const { setIsLoggedIn, setAdminName, setAdminId } = useAuth();
  const navigation = useNavigation<AdminLoginNavigationProp>();
  const theme = useTheme();

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    const connected = await checkDatabaseConnection();
    setIsConnected(connected);
    if (!connected) {
      Alert.alert(
        'Connection Error',
        'Unable to connect to the server. Please check your internet connection.',
        [{ text: 'Retry', onPress: checkConnection }]
      );
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const handleSignUp = async () => {
    if (!isConnected) {
      Alert.alert('Error', 'No internet connection. Please check your connection and try again.');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (!validatePassword(password)) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    try {
      setLoading(true);

      await signUpAdmin({
        email,
        password
      });

      // Automatically redirect to sign-in page after successful signup
      setIsSignUp(false);
      setEmail('');
      setPassword('');

      Alert.alert(
        'Success',
        'Account created successfully! Please sign in.'
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
      if (error.message.includes('network') || error.message.includes('connect')) {
        setIsConnected(false);
        checkConnection();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!isConnected) {
      Alert.alert('Error', 'No internet connection. Please check your connection and try again.');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (!validatePassword(password)) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    try {
      setLoading(true);
      console.log('Attempting admin login with:', email);
      const { hasDetails } = await signInAdmin(email, password);
      console.log('Login successful, hasDetails:', hasDetails);
      
      // Navigate based on whether admin details exist
      if (hasDetails) {
        // Navigate to AdminDashboard with Home tab
        navigation.navigate('AdminDashboard', {
          screen: 'Home'
        });
      } else {
        navigation.navigate('AdminDetails');
      }
    } catch (error: any) {
      console.error('Admin login error:', error);
      Alert.alert('Error', error.message);
      if (error.message.includes('network') || error.message.includes('connect')) {
        setIsConnected(false);
        checkConnection();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigation.navigate('UseRole');
  };

  return (
    <View style={styles.container}>
      <Surface style={styles.surface}>
        <Text variant="headlineMedium" style={styles.title}>
          {isSignUp ? 'Admin Sign Up' : 'Admin Login'}
        </Text>

        {!isConnected && (
          <Text style={styles.errorText}>
            No connection to server. Please check your internet.
          </Text>
        )}

        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
          disabled={loading || !isConnected}
        />

        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          right={
            <TextInput.Icon
              icon={showPassword ? 'eye-off' : 'eye'}
              onPress={() => setShowPassword(!showPassword)}
            />
          }
          style={styles.input}
          disabled={loading || !isConnected}
        />

        <Button
          mode="contained"
          onPress={isSignUp ? handleSignUp : handleSignIn}
          style={styles.button}
          disabled={loading || !isConnected}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.surface} />
          ) : (
            isSignUp ? 'Sign Up' : 'Sign In'
          )}
        </Button>

        <Button
          mode="text"
          onPress={() => {
            setIsSignUp(!isSignUp);
            setEmail('');
            setPassword('');
          }}
          style={styles.switchButton}
          disabled={loading || !isConnected}
        >
          {isSignUp
            ? 'Already have an account? Sign In'
            : "Don't have an account? Sign Up"}
        </Button>

        <Button
          mode="text"
          onPress={handleBack}
          style={styles.backButton}
        >
          Back to Role Selection
        </Button>

        {!isConnected && (
          <Button
            mode="text"
            onPress={checkConnection}
            style={styles.retryButton}
          >
            Retry Connection
          </Button>
        )}
      </Surface>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  surface: {
    padding: 20,
    borderRadius: 10,
    elevation: 4,
  },
  title: {
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    paddingVertical: 6,
  },
  switchButton: {
    marginTop: 16,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    marginTop: 8,
  },
  backButton: {
    marginTop: 8,
  },
});

export default AdminLogin;
