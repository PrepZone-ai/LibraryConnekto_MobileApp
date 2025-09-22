import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Surface, Text } from 'react-native-paper';
import { apiClient } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';
import { RootStackParamList } from '../../types/navigation';
import Header from '../common/Header';
import NearbyLibraries from './St_Home/NearbyLibraries';
import QuickActions from './St_Home/QuickActions';
import RecentActivities from './St_Home/RecentActivities';
import StatisticsCards from './St_Home/StatisticsCards';
import StudyTimeStatistics from './St_Home/StudyTimeStatistics';

type NavigationProp = StackNavigationProp<RootStackParamList>;

const StudentHome: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { isLoggedIn, studentName } = useAuth();
  const [loading, setLoading] = useState(false);
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [locationPermission, setLocationPermission] = useState(false);

  useEffect(() => {
    checkLocationPermission();
    checkCurrentAttendance();
  }, []);

  const checkLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
      
      if (status === 'granted') {
        getCurrentLocation();
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setCurrentLocation(location);
      console.log('Current location:', location);
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const checkCurrentAttendance = async () => {
    try {
      const response = await apiClient.get('/student/attendance?limit=1');
      if (response && Array.isArray(response) && response.length > 0) {
        const latestAttendance = response[0];
        setAttendanceMarked(!latestAttendance.exit_time);
      }
    } catch (error) {
      console.error('Error checking attendance:', error);
    }
  };

  const handleCheckIn = async () => {
    if (!locationPermission) {
      Alert.alert(
        'Location Permission Required',
        'Please enable location services to check in to the library.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Enable', onPress: checkLocationPermission }
        ]
      );
      return;
    }

    if (!currentLocation) {
      Alert.alert('Location Error', 'Unable to get your current location. Please try again.');
      await getCurrentLocation();
      return;
    }

    setLoading(true);

    try {
      if (attendanceMarked) {
        // Check out
        await apiClient.post('/student/attendance/checkout');
        setAttendanceMarked(false);
        Alert.alert('Success', 'Successfully checked out from library!');
      } else {
        // Check in with location
        const response = await apiClient.post('/student/attendance/checkin', {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude
        });

        if (response) {
          setAttendanceMarked(true);
          Alert.alert('Success', 'Successfully checked in to library!');
        }
      }
    } catch (error: any) {
      console.error('Attendance error:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to update attendance';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginPress = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'StudentLogin' }]
    });
  };


  return (
    <View style={styles.container}>
      <Header
        title={isLoggedIn ? `Welcome ${studentName || 'Student'}` : 'Library Connekto'}
        showBackButton={false}
        showBookSeatButton={!isLoggedIn} // Show book seat button for non-logged in users
        onBookSeatPress={() => navigation.navigate('BookSeat')}
        rightComponent={
          isLoggedIn ? (
            <Button
              mode="text"
              onPress={() => {
                // Handle logout
              }}
              style={styles.logoutButton}
            >
              Logout
            </Button>
          ) : null
        }
        showWelcome={!isLoggedIn}
        username={!isLoggedIn ? 'Students' : undefined}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Check-in Button at the top */}
        {isLoggedIn && (
          <Surface style={styles.checkInCard}>
            <Text variant="titleMedium" style={styles.checkInTitle}>
              Library Attendance
            </Text>
            <Text variant="bodyMedium" style={styles.checkInSubtitle}>
              {attendanceMarked ? 'You are currently checked in' : 'Check in to start your study session'}
            </Text>
            <Button
              mode="contained"
              onPress={handleCheckIn}
              loading={loading}
              disabled={loading}
              style={styles.checkInButton}
              icon={attendanceMarked ? "logout" : "login"}
              buttonColor={attendanceMarked ? "#DC2626" : "#10B981"}
            >
              {attendanceMarked ? 'Check Out' : 'Check In'}
            </Button>
            {!locationPermission && (
              <Text variant="bodySmall" style={styles.warningText}>
                ⚠️ Location permission required for check-in
              </Text>
            )}
          </Surface>
        )}

        <Surface style={styles.welcomeCard}>
          <Text variant="titleMedium" style={styles.welcomeText}>
            {isLoggedIn ? 'Welcome to Library Connekto' : 'Login Required'}
          </Text>
          <Text variant="bodyMedium" style={styles.welcomeDescription}>
            {isLoggedIn
              ? 'Mark your presence to start your study session'
              : 'Please login to access library features'}
          </Text>
          {!isLoggedIn && (
            <Button
              mode="contained"
              onPress={handleLoginPress}
              style={styles.loginButton}
              icon="login"
            >
              Login to Access
            </Button>
          )}
        </Surface>

        <StatisticsCards />
        <QuickActions isLoggedIn={isLoggedIn} onLoginPress={handleLoginPress} />
        <StudyTimeStatistics />
        <NearbyLibraries isLoggedIn={isLoggedIn} onLoginPress={handleLoginPress} />
        <RecentActivities />
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
    flexGrow: 1,
    paddingBottom: 80, // Add padding for bottom navigation
  },
  checkInCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'white',
    elevation: 2,
  },
  checkInTitle: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  checkInSubtitle: {
    textAlign: 'center',
    color: '#6B7280',
    marginBottom: 16,
  },
  checkInButton: {
    marginBottom: 8,
  },
  warningText: {
    textAlign: 'center',
    color: '#DC2626',
    marginTop: 8,
    fontStyle: 'italic',
  },
  welcomeCard: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  welcomeText: {
    marginBottom: 8,
    color: '#1E3A8A',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  welcomeDescription: {
    marginBottom: 16,
    color: '#4B5563',
    opacity: 0.8,
    textAlign: 'center',
  },
  loginButton: {
    marginTop: 12,
    width: '100%',
    backgroundColor: '#1E3A8A',
  },
  logoutButton: {
    marginRight: 16,
  },
});

export default StudentHome;
