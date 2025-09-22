import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Snackbar, Surface, Text, TextInput } from 'react-native-paper';
import Header from '../../../components/common/Header';
import { adminAPI, AdminDetails } from '../../../config/api';
import { useAuth } from '../../../contexts/AuthContext';
import { AdminStackScreenProps, AdminTabScreenProps, RootStackScreenProps } from '../../../types/navigation';
import SubscriptionPlans from './SubscriptionPlans';

// Use AdminDetails as LibraryProfile
type LibraryProfile = AdminDetails;

const Profile: React.FC<AdminTabScreenProps<'Profile'>> = ({ navigation }) => {
  const adminStackNavigation = useNavigation<AdminStackScreenProps<'AddSubscriptionPlan'>['navigation']>();
  const rootNavigation = useNavigation<RootStackScreenProps<'UseRole'>['navigation']>();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<LibraryProfile | null>(null);
  const [editedProfile, setEditedProfile] = useState<LibraryProfile | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const { signOut } = useAuth();

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      if (!isMounted) return;
      await loadProfile();
      if (isMounted) {
        setupPolling();
      }
    };

    init();

    return () => {
      isMounted = false;
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, []);

  const setupPolling = () => {
    // Set up polling to refresh profile data every 60 seconds
    const interval = setInterval(() => {
      if (!isEditing) {
        loadProfile();
      }
    }, 60000);

    setRefreshInterval(interval);
  };

  const loadProfile = async () => {
    try {
      // Only set loading on first load
      if (!profile) {
        setLoading(true);
      }

      const profileData = await adminAPI.getProfile();

      if (profileData) {
        setProfile(profileData);
        setEditedProfile(profileData);
      } else {
        showSnackbar('No profile data found. Please set up your profile.');
      }
    } catch (error: any) {
      console.error('Error loading profile:', error.message);
      showSnackbar('Error loading profile');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedProfile(profile);
  };

  const handleSave = async () => {
    if (!editedProfile || !profile) return;

    try {
      const updatedProfile = await adminAPI.updateProfile({
        library_name: editedProfile.library_name,
        mobile_no: editedProfile.mobile_no,
        total_seats: editedProfile.total_seats,
        address: editedProfile.address
      });

      setProfile(updatedProfile);
      setIsEditing(false);
      showSnackbar('Profile updated successfully');
    } catch (error: any) {
      console.error('Error updating profile:', error.message);
      showSnackbar('Error updating profile');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedProfile(profile);
  };

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const handleLogout = async () => {
    try {
      // First call auth context signOut which handles AsyncStorage cleanup
      await signOut();

      // Additional cleanup for any profile-specific storage items
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userRole');

      // Reset navigation state AFTER signOut is complete
      rootNavigation.reset({
        index: 0,
        routes: [{ name: 'UseRole' }]
      });
    } catch (error: any) {
      console.error('Error logging out:', error.message);
      showSnackbar('Error logging out');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Profile" />
        <View style={styles.loadingContainer}>
          <Text>Loading profile...</Text>
        </View>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.container}>
        <Header title="Profile" />
        <View style={styles.loadingContainer}>
          <Text>No profile data found. Please try again.</Text>
          <Button mode="contained" onPress={loadProfile} style={{ marginTop: 16 }}>
            Retry
          </Button>
        </View>
      </View>
    );
  }

  const memberSince = new Date(profile.created_at).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric'
  });

  return (
    <View style={styles.container}>
      <Header
        title="Profile"
        username={profile.library_name}
        showWelcome={false}
        hideBackButton={true}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <Surface style={styles.referralCard}>
          <Button
            mode="contained"
            icon="share-variant"
            onPress={() => adminStackNavigation.navigate('Refer')}
            style={styles.referButton}
          >
            Refer Library Owner Friend
          </Button>
        </Surface>
        <Surface style={styles.profileCard}>
          <View style={styles.cardContent}>
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                <MaterialCommunityIcons name="account-tie" size={32} color="white" />
              </View>
              <View style={styles.profileInfo}>
                <Text variant="titleLarge">{profile.library_name}</Text>
                <Text variant="bodyMedium" style={styles.roleText}>Library Administrator</Text>
                <View style={styles.activeStatus}>
                  <MaterialCommunityIcons name="clock" size={14} color="#666" />
                  <Text variant="bodySmall" style={styles.statusText}>
                    Member since {memberSince}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.editButton}
                onPress={isEditing ? handleSave : handleEdit}
              >
                <MaterialCommunityIcons
                  name={isEditing ? "content-save" : "pencil"}
                  size={24}
                  color="#6200ee"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.detailsSection}>
              <View style={styles.detailRow}>
                <Text variant="bodyMedium" style={styles.label}>Library Name</Text>
                {isEditing ? (
                  <TextInput
                    value={editedProfile?.library_name}
                    onChangeText={(text) => setEditedProfile(prev => prev ? {...prev, library_name: text} : null)}
                    style={styles.input}
                  />
                ) : (
                  <Text variant="bodyLarge">{profile.library_name}</Text>
                )}
              </View>

              <View style={styles.detailRow}>
                <Text variant="bodyMedium" style={styles.label}>Mobile Number</Text>
                {isEditing ? (
                  <TextInput
                    value={editedProfile?.mobile_no}
                    onChangeText={(text) => setEditedProfile(prev => prev ? {...prev, mobile_no: text} : null)}
                    keyboardType="phone-pad"
                    style={styles.input}
                  />
                ) : (
                  <Text variant="bodyLarge">{profile.mobile_no}</Text>
                )}
              </View>

              <View style={styles.detailRow}>
                <Text variant="bodyMedium" style={styles.label}>Total Seats</Text>
                {isEditing ? (
                  <TextInput
                    value={editedProfile?.total_seats.toString()}
                    onChangeText={(text) => setEditedProfile(prev => prev ? {...prev, total_seats: parseInt(text) || 0} : null)}
                    keyboardType="numeric"
                    style={styles.input}
                  />
                ) : (
                  <Text variant="bodyLarge">{profile.total_seats}</Text>
                )}
              </View>

              <View style={styles.detailRow}>
                <Text variant="bodyMedium" style={styles.label}>Address</Text>
                {isEditing ? (
                  <TextInput
                    value={editedProfile?.address}
                    onChangeText={(text) => setEditedProfile(prev => prev ? {...prev, address: text} : null)}
                    style={[styles.input, styles.multilineInput]}
                    multiline
                  />
                ) : (
                  <Text variant="bodyLarge">{profile.address}</Text>
                )}
              </View>
            </View>

            {/* Subscription Plans Section */}
            {!isEditing && (
              <View style={styles.subscriptionSection}>
                <SubscriptionPlans
                  libraryId={profile.id}
                  onUpdate={loadProfile}
                  navigation={adminStackNavigation}
                />
              </View>
            )}
          </View>
        </Surface>

        <Surface style={styles.logoutCard}>
          <Button
            mode="outlined"
            icon="logout"
            onPress={handleLogout}
            style={{ marginVertical: 8, marginHorizontal: 8, borderColor: '#EF4444', borderWidth: 1 }}
            textColor="#EF4444"
          >
            Logout
          </Button>
        </Surface>
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  referralCard: {
    margin: 16,
    padding: 12,
    borderRadius: 8,
    elevation: 2,
  },
  referButton: {
    borderRadius: 24,
  },
  subscriptionSection: {
    marginTop: 16,
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },
  profileCard: {
    borderRadius: 12,
    elevation: 2,
    marginBottom: 16,
  },
  cardContent: {
    padding: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6200ee',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  roleText: {
    color: '#666',
    marginTop: 4,
  },
  activeStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusText: {
    marginLeft: 4,
    color: '#666',
  },
  editButton: {
    padding: 8,
  },
  detailsSection: {
    marginTop: 16,
  },
  detailRow: {
    marginBottom: 16,
  },
  label: {
    color: '#666',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#fff',
  },
  multilineInput: {
    minHeight: 80,
  },
  logoutCard: {
    borderRadius: 12,
    elevation: 2,
    marginBottom: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  logoutText: {
    color: '#EF4444',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default Profile;
