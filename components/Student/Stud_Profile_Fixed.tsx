import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Avatar, Button, Divider, Surface, Text } from 'react-native-paper';
import { apiClient } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';
import { RootStackParamList } from '../../types/navigation';
import Header from '../common/Header';

interface StudentProfile {
  name: string;
  email: string;
  student_id: string;
  mobile_no: string;
  address: string;
  library_name: string;
  subscription_start: string;
  subscription_end: string;
  shift: string;
}

const Stud_Profile: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { isLoggedIn, studentName, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<StudentProfile>({
    name: studentName || '',
    email: '',
    student_id: '',
    mobile_no: '',
    address: '',
    library_name: '',
    subscription_start: '',
    subscription_end: '',
    shift: '',
  });

  useEffect(() => {
    if (!isLoggedIn) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'StudentLogin' }]
      });
      return;
    }
    fetchStudentProfile();
  }, [isLoggedIn]);

  const fetchStudentProfile = async () => {
    try {
      setLoading(true);

      // Get student profile using FastAPI
      const studentData = await apiClient.get('/student/profile');

      if (!studentData) {
        console.error('No student data found');
        return;
      }

      // Get admin details using FastAPI
      const adminData = await apiClient.get('/admin/details');

      let libraryName = adminData?.library_name || 'Unknown Library';

      // Update profile with fetched data
      setProfile({
        name: studentData.name || studentName || '',
        email: studentData.email || '',
        student_id: studentData.student_id || '',
        mobile_no: studentData.mobile_no || '',
        address: studentData.address || '',
        library_name: libraryName,
        subscription_start: studentData.subscription_start || '',
        subscription_end: studentData.subscription_end || '',
        shift: studentData.shift || '',
      });

    } catch (error) {
      console.error('Error fetching student profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigation.reset({
        index: 0,
        routes: [{ name: 'StudentLogin' }]
      });
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const handleRefer = () => {
    // Navigate to referral page
    navigation.navigate('StudentHome', {
      screen: 'StudentHomeTab'
    });
  };

  const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || 'Not available'}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Student Profile"
        showBackButton={false}
        showWelcome={true}
        username={studentName || 'Student'}
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Surface style={styles.profileCard}>
          <View style={styles.avatarSection}>
            <Avatar.Text 
              size={80} 
              label={profile.name.substring(0, 2).toUpperCase()} 
              style={styles.avatar}
            />
            <Text variant="headlineSmall" style={styles.name}>{profile.name}</Text>
            <Text variant="bodyMedium" style={styles.studentId}>{profile.student_id}</Text>
          </View>
        </Surface>

        <Surface style={styles.infoCard}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Personal Information</Text>
          <Divider style={styles.divider} />
          
          <InfoRow label="Email" value={profile.email} />
          <InfoRow label="Mobile Number" value={profile.mobile_no} />
          <InfoRow label="Address" value={profile.address} />
          <InfoRow label="Shift" value={profile.shift} />
        </Surface>

        <Surface style={styles.infoCard}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Library Information</Text>
          <Divider style={styles.divider} />
          
          <InfoRow label="Library Name" value={profile.library_name} />
          <InfoRow label="Subscription Start" value={profile.subscription_start} />
          <InfoRow label="Subscription End" value={profile.subscription_end} />
        </Surface>

        <Surface style={styles.actionsCard}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Actions</Text>
          <Divider style={styles.divider} />
          
          <Button
            mode="contained"
            onPress={handleRefer}
            style={styles.actionButton}
            icon="share-variant"
          >
            Refer Friends
          </Button>
          
          <Button
            mode="outlined"
            onPress={handleLogout}
            style={styles.actionButton}
            icon="logout"
            textColor="#EF4444"
          >
            Logout
          </Button>
        </Surface>
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
    backgroundColor: '#f3f4f6',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  profileCard: {
    padding: 20,
    marginBottom: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  avatarSection: {
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: '#4F46E5',
    marginBottom: 12,
  },
  name: {
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  studentId: {
    color: '#6B7280',
    fontSize: 14,
  },
  infoCard: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: 'white',
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  divider: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontWeight: '500',
    color: '#374151',
    flex: 1,
  },
  infoValue: {
    color: '#6B7280',
    flex: 2,
    textAlign: 'right',
  },
  actionsCard: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: 'white',
  },
  actionButton: {
    marginVertical: 8,
  },
});

export default Stud_Profile; 