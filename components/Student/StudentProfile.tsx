import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Surface, Avatar, Button, Divider, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../config/api';
import Header from '../common/Header';
import BottomTabNavigator from '../common/BottomTabNavigator';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type StudentProfileNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface StudentData {
  id: string;
  name: string;
  email: string;
  mobile_no: string;
  subscription_status: string;
  library_name: string;
  admin_name: string;
  created_at: string;
  total_hours: number;
}

const StudentProfile: React.FC = () => {
  const navigation = useNavigation<StudentProfileNavigationProp>();
  const { isLoggedIn } = useAuth();
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    if (!isLoggedIn) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'StudentLogin' }]
      });
      return;
    }

    fetchStudentData();
  }, [isLoggedIn, navigation]);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      
      // Get student profile using FastAPI
      const data = await apiClient.get<StudentData>('/students/profile');
      setStudentData(data);
    } catch (error: any) {
      console.error('Error fetching student data:', error);
      Alert.alert('Error', error.message || 'Failed to load student data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: string) => {
    switch (tab) {
      case 'home':
        navigation.navigate('StudentHome', { screen: 'StudentHomeTab' });
        break;
      case 'dashboard':
        navigation.navigate('StudentHome', { screen: 'StudentDashboardTab' });
        break;
      case 'chat':
        navigation.navigate('StudentHome', { screen: 'StudentChatTab' });
        break;
      case 'profile':
        // Already on profile
        break;
    }
  };

  if (!isLoggedIn) return null;

  return (
    <View style={styles.container}>
      <Header
        title="Student Profile"
        username={studentData?.name}
        showWelcome={true}
        autoBackButton={true}
      />
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      ) : (
        <ScrollView style={styles.scrollView}>
          <Surface style={styles.content} elevation={1}>
            <View style={styles.profileContainer}>
              <View style={styles.avatarContainer}>
                <Avatar.Text 
                  size={80} 
                  label={studentData?.name?.substring(0, 2)?.toUpperCase() || 'ST'}
                  style={styles.avatar}
                />
                <Text variant="titleLarge" style={styles.name}>
                  {studentData?.name}
                </Text>
                <View style={styles.libraryContainer}>
                  <MaterialCommunityIcons name="library" size={20} color="#6366F1" />
                  <Text style={styles.libraryName}>
                    {studentData?.library_name || 'Not Available'}
                  </Text>
                </View>
              </View>
              <Divider style={styles.divider} />
              <View style={styles.infoContainer}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Profile Information
                </Text>
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="email" size={24} color="#6366F1" />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Email</Text>
                    <Text style={styles.infoValue}>{studentData?.email}</Text>
                  </View>
                </View>
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="phone" size={24} color="#6366F1" />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Phone</Text>
                    <Text style={styles.infoValue}>{studentData?.mobile_no || 'Not provided'}</Text>
                  </View>
                </View>
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="clock" size={24} color="#6366F1" />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Total Study Hours</Text>
                    <Text style={styles.infoValue}>{studentData?.total_hours || 0} hours</Text>
                  </View>
                </View>
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="account-supervisor" size={24} color="#6366F1" />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Library Admin</Text>
                    <Text style={styles.infoValue}>{studentData?.admin_name}</Text>
                  </View>
                </View>
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="calendar-check" size={24} color="#6366F1" />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Member Since</Text>
                    <Text style={styles.infoValue}>
                      {new Date(studentData?.created_at || '').toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <View style={[styles.infoRow, styles.statusRow]}>
                  <MaterialCommunityIcons 
                    name="badge-account" 
                    size={24} 
                    color={studentData?.subscription_status === 'Active' ? '#10B981' : '#EF4444'} 
                  />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Subscription Status</Text>
                    <Text style={[styles.infoValue, 
                      { color: studentData?.subscription_status === 'Active' ? '#10B981' : '#EF4444' }
                    ]}>
                      {studentData?.subscription_status}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </Surface>
        </ScrollView>
      )}
      <BottomTabNavigator 
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'white',
  },
  profileContainer: {
    flex: 1,
  },
  avatarContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatar: {
    backgroundColor: '#6366F1',
  },
  name: {
    marginTop: 16,
    fontWeight: '600',
    color: '#1F2937',
    fontSize: 24,
  },
  libraryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  libraryName: {
    marginLeft: 8,
    color: '#6366F1',
    fontSize: 16,
    fontWeight: '500',
  },
  divider: {
    marginVertical: 16,
    backgroundColor: '#E5E7EB',
  },
  infoContainer: {
    padding: 16,
  },
  sectionTitle: {
    marginBottom: 24,
    fontWeight: '600',
    color: '#1F2937',
    fontSize: 18,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  infoTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  infoLabel: {
    color: '#6B7280',
    fontSize: 14,
    marginBottom: 4,
  },
  infoValue: {
    color: '#1F2937',
    fontSize: 16,
    fontWeight: '500',
  },
  statusRow: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
});

export default StudentProfile;
