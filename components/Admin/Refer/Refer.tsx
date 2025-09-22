import React, { useState, useEffect } from "react";
import { View, ScrollView, Share, StyleSheet, Dimensions, Image } from "react-native";
import { Text, Button, TextInput, Surface, IconButton, Snackbar, Modal, Portal, Chip } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Header from '../../common/Header';
import * as Clipboard from 'expo-clipboard';
import { generateReferralCode, validateReferralCode, createReferral, getReferrals, getReferralCodes, getTestReferralData, getTestAuthData } from '../../../services/referralService';
import { useAuth } from '../../../contexts/AuthContext';
import { AdminStackScreenProps } from '../../../types/navigation';

type ReferProps = AdminStackScreenProps<'Refer'>;

interface RecentReferral {
  name: string;
  date: string;
  status: string;
}

interface RewardStats {
  totalPoints: number;
  totalReferrals: number;
  recentReferrals: RecentReferral[];
}

const Refer: React.FC<ReferProps> = ({ navigation, route }) => {
  const { isLoggedIn, selectedRole, adminName, libraryName } = useAuth();
  const [referralCode, setReferralCode] = useState<string>("");
  const [myCode, setMyCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [showError, setShowError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showCopied, setShowCopied] = useState<boolean>(false);
  const [showAllReferrals, setShowAllReferrals] = useState<boolean>(false);
  const [userDetails, setUserDetails] = useState<{
    userType: 'admin' | 'student';
    userName: string;
    libraryName?: string;
  } | null>(null);
  const [rewardStats, setRewardStats] = useState<RewardStats>({
    totalPoints: 0,
    totalReferrals: 0,
    recentReferrals: []
  });
  const [allReferrals, setAllReferrals] = useState<RecentReferral[]>([]);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        if (isLoggedIn && selectedRole === 'admin') {
          setUserDetails({
            userType: 'admin',
            userName: adminName || 'Admin User',
            libraryName: libraryName || 'My Library'
          });
        } else {
          // For testing purposes, set default admin details
          setUserDetails({
            userType: 'admin',
            userName: 'Admin User',
            libraryName: 'My Library'
          });
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
        setErrorMessage("Failed to load user details");
        setShowError(true);
      }
    };

    fetchUserDetails();
  }, [isLoggedIn, selectedRole, adminName, libraryName]);

  useEffect(() => {
    const initializeReferralCode = async () => {
      try {
        if (!userDetails?.userName) {
          return; // Wait for user details to be loaded
        }

        // For development, we'll use the test data from the database
        try {
          // Test the connection first
          const testData = await getTestReferralData();
          console.log('Backend connection test:', testData);

          // Get test auth data
          const authData = await getTestAuthData();
          console.log('Test auth data:', authData);

          // Set the test referral code from our database
          setMyCode("ADMTES123456789");

          // Fetch real referral data from database
          // Since we don't have authentication set up, we'll simulate the data
          // In a real app, this would come from getReferrals()
          const mockReferrals = [
            {
              referred_name: "John Doe",
              created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
              status: "completed"
            },
            {
              referred_name: "Jane Smith",
              created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
              status: "pending"
            },
            {
              referred_name: "Bob Johnson",
              created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
              status: "completed"
            },
            {
              referred_name: "Alice Brown",
              created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
              status: "pending"
            },
            {
              referred_name: "Charlie Wilson",
              created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
              status: "completed"
            },
            {
              referred_name: "David Miller",
              created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              status: "completed"
            },
            {
              referred_name: "Emma Davis",
              created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
              status: "pending"
            },
            {
              referred_name: "Frank Wilson",
              created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
              status: "completed"
            },
            {
              referred_name: "Grace Taylor",
              created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
              status: "completed"
            },
            {
              referred_name: "Henry Anderson",
              created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
              status: "pending"
            }
          ];

          const completedReferrals = mockReferrals.filter(ref => ref.status === "completed").length;
          
          // Set all referrals for the "See All" section
          setAllReferrals(mockReferrals.map(ref => ({
            name: ref.referred_name,
            date: new Date(ref.created_at).toLocaleDateString(),
            status: ref.status
          })));
          
          setRewardStats({
            totalPoints: completedReferrals * 100,
            totalReferrals: mockReferrals.length,
            recentReferrals: mockReferrals.slice(0, 5).map(ref => ({
              name: ref.referred_name,
              date: new Date(ref.created_at).toLocaleDateString(),
              status: ref.status
            }))
          });

        } catch (error) {
          console.error("Error fetching real data:", error);
          // Fallback to mock data if API fails
          const mockCode = generateMockReferralCode(userDetails.userType, userDetails.userName, userDetails.libraryName);
          setMyCode(mockCode);
          
          setRewardStats({
            totalPoints: 0,
            totalReferrals: 0,
            recentReferrals: []
          });
          setAllReferrals([]);
        }

      } catch (error) {
        console.error("Error initializing referral code:", error);
        setErrorMessage("Failed to generate referral code. Please try again later.");
        setShowError(true);
      }
    };

    if (userDetails) {
      initializeReferralCode();
    }
  }, [userDetails]);

  // Mock function to generate referral codes for testing (fallback)
  const generateMockReferralCode = (type: 'admin' | 'student', name: string, libraryName?: string): string => {
    const prefix = type === 'admin' ? 'ADM' : 'STU';
    const namePart = name.substring(0, 3).toUpperCase();
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    const timestamp = Date.now().toString().slice(-3);
    return `${prefix}${namePart}${randomPart}${timestamp}`;
  };

  const handleCopyCode = async () => {
    try {
      await Clipboard.setStringAsync(myCode);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    } catch (error) {
      console.error("Error copying code:", error);
      setErrorMessage("Failed to copy referral code");
      setShowError(true);
    }
  };

  const handleShare = async () => {
    const shareText = `🎉 Hey fellow library owner! I'm using Library Conneckto to streamline study library operations. It's a game-changer for managing everything from inventory to student records! Join me using my referral code: ${myCode} and get special perks. Let's digitize our libraries together! 📚✨`;
    
    try {
      await Share.share({
        message: shareText,
        title: 'Join Library Conneckto'
      });
    } catch (error) {
      console.error("Error sharing:", error);
      setErrorMessage("Failed to share referral code");
      setShowError(true);
    }
  };

  const handleReferral = async () => {
    try {
      setIsLoading(true);
      
      if (!referralCode.trim()) {
        setErrorMessage("Please enter a referral code");
        setShowError(true);
        return;
      }

      // For development, we'll simulate the validation
      if (referralCode.length < 8) {
        setErrorMessage("Invalid referral code format");
        setShowError(true);
        return;
      }

      // Simulate successful referral submission
      setShowSuccess(true);
      setReferralCode("");
      
      // Update stats with new referral
      const newReferral = {
        name: "New Referral",
        date: new Date().toLocaleDateString(),
        status: "pending"
      };
      
      setRewardStats(prev => ({
        ...prev,
        totalReferrals: prev.totalReferrals + 1,
        recentReferrals: [newReferral, ...prev.recentReferrals.slice(0, 4)]
      }));

      // Add to all referrals
      setAllReferrals(prev => [newReferral, ...prev]);

    } catch (error) {
      console.error("Error processing referral:", error);
      setErrorMessage("Failed to process referral. Please try again.");
      setShowError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      default:
        return '#757575';
    }
  };

  const getStatusBackground = (status: string) => {
    switch (status) {
      case 'completed':
        return '#E8F5E9';
      case 'pending':
        return '#FFF3E0';
      default:
        return '#F5F5F5';
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Refer Library Owners" />
      
      <ScrollView style={styles.content}>
        <Surface style={styles.heroSection}>
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: "https://public.readdy.ai/ai/img_res/a813856c833064c9f390a136daf5ef8d.jpg" }}
              style={styles.libraryImage}
            />
            <MaterialCommunityIcons name="arrow-right" size={24} color="#6200ee" />
            <Image
              source={{ uri: "https://public.readdy.ai/ai/img_res/6d32af8cc1a8f05d742f23db4737ce9e.jpg" }}
              style={styles.libraryImage}
            />
          </View>
          <Text variant="headlineSmall" style={styles.title}>
            Transform Libraries Digital
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Help fellow library owners upgrade from traditional to digital operations.
          </Text>
          <Text variant="bodyMedium" style={styles.reward}>
            {userDetails?.userType === 'admin' 
              ? 'Get 100 points for each library owner you refer!'
              : 'Help your library grow! Get 100 points for referring library owners.'}
          </Text>
        </Surface>

        <Surface style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.headerLeft}>
              <MaterialCommunityIcons name="share-variant" size={24} color="#6200ee" />
              <Text variant="titleMedium" style={styles.cardTitle}>Share Your Code</Text>
            </View>
            {showCopied && (
              <Text variant="bodySmall" style={styles.copiedText}>Copied!</Text>
            )}
          </View>

          <View style={styles.codeContainer}>
            <View>
              <Text variant="bodySmall">Your Referral Code</Text>
              <Text variant="headlineSmall" style={styles.referralCode}>{myCode}</Text>
            </View>
            <Button
              mode="contained"
              onPress={handleCopyCode}
              icon="content-copy"
            >
              Copy
            </Button>
          </View>

          <Button
            mode="contained"
            onPress={handleShare}
            icon="share-variant"
            style={styles.shareButton}
          >
            Share Code
          </Button>
        </Surface>

        <Surface style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="gift" size={24} color="#6200ee" />
            <Text variant="titleMedium" style={styles.cardTitle}>How it works</Text>
          </View>

          <View style={styles.stepsList}>
            {[
              "Share Library Conneckto with other study library owners",
              "They register as library owners and start digitizing their operations",
              "You get 100 points when a library owner uses your code",
              "They get 100 points when they register with your code"
            ].map((step, index) => (
              <View key={index} style={styles.step}>
                <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" />
                <Text variant="bodyMedium" style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>
        </Surface>

        <Surface style={styles.card}>
          <Text variant="titleMedium" style={styles.inputLabel}>Enter Library Owner's Referral Code</Text>
          <TextInput
            value={referralCode}
            onChangeText={setReferralCode}
            mode="outlined"
            placeholder="Enter code here"
            style={styles.input}
            error={!!errorMessage}
          />
          <Button
            mode="contained"
            onPress={handleReferral}
            loading={isLoading}
            style={styles.submitButton}
          >
            Submit Code
          </Button>
        </Surface>

        <Surface style={styles.card}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Your Rewards</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text variant="displaySmall" style={styles.statValue}>{rewardStats.totalPoints}</Text>
              <Text variant="bodyMedium">Total Points</Text>
            </View>
            <View style={styles.statCard}>
              <Text variant="displaySmall" style={styles.statValue}>{rewardStats.totalReferrals}</Text>
              <Text variant="bodyMedium">Referrals</Text>
            </View>
          </View>

          <View style={styles.activityHeader}>
            <Text variant="titleMedium" style={styles.activityTitle}>
              Recent Activity
            </Text>
            <Button
              mode="text"
              onPress={() => setShowAllReferrals(true)}
              icon="arrow-right"
              style={styles.seeAllButton}
            >
              See All
            </Button>
          </View>
          
          <View style={styles.activityList}>
            {rewardStats.recentReferrals.map((referral, index) => (
              <View key={index} style={styles.activityItem}>
                <View>
                  <Text variant="bodyLarge">{referral.name}</Text>
                  <Text variant="bodySmall" style={styles.date}>{referral.date}</Text>
                </View>
                <Chip
                  mode="outlined"
                  textStyle={{ color: getStatusColor(referral.status) }}
                  style={[styles.statusChip, { backgroundColor: getStatusBackground(referral.status) }]}
                >
                  {referral.status}
                </Chip>
              </View>
            ))}
            {rewardStats.recentReferrals.length === 0 && (
              <Text variant="bodyMedium" style={styles.noActivity}>No recent activity</Text>
            )}
          </View>
        </Surface>
      </ScrollView>

      {/* All Referrals Modal */}
      <Portal>
        <Modal
          visible={showAllReferrals}
          onDismiss={() => setShowAllReferrals(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={styles.modalHeader}>
            <Text variant="headlineSmall" style={styles.modalTitle}>All Referrals</Text>
            <IconButton
              icon="close"
              size={24}
              onPress={() => setShowAllReferrals(false)}
            />
          </View>
          
          <ScrollView style={styles.modalContent}>
            {allReferrals.length > 0 ? (
              allReferrals.map((referral, index) => (
                <Surface key={index} style={styles.modalItem}>
                  <View style={styles.modalItemContent}>
                    <View>
                      <Text variant="titleMedium" style={styles.modalItemName}>{referral.name}</Text>
                      <Text variant="bodySmall" style={styles.modalItemDate}>{referral.date}</Text>
                    </View>
                    <Chip
                      mode="outlined"
                      textStyle={{ color: getStatusColor(referral.status) }}
                      style={[styles.statusChip, { backgroundColor: getStatusBackground(referral.status) }]}
                    >
                      {referral.status}
                    </Chip>
                  </View>
                </Surface>
              ))
            ) : (
              <Text variant="bodyMedium" style={styles.noActivity}>No referrals found</Text>
            )}
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <Text variant="bodySmall" style={styles.modalSummary}>
              Total Referrals: {allReferrals.length} | 
              Completed: {allReferrals.filter(r => r.status === 'completed').length} | 
              Pending: {allReferrals.filter(r => r.status === 'pending').length}
            </Text>
          </View>
        </Modal>
      </Portal>

      <Snackbar
        visible={showSuccess}
        onDismiss={() => setShowSuccess(false)}
        duration={3000}
        style={styles.successSnackbar}
      >
        Referral code submitted successfully! Points will be awarded when the library owner completes registration.
      </Snackbar>

      <Snackbar
        visible={showError}
        onDismiss={() => setShowError(false)}
        duration={3000}
        style={styles.errorSnackbar}
      >
        {errorMessage}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  heroSection: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
  },
  imageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 16,
  },
  libraryImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  title: {
    textAlign: 'center',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    color: '#666666',
    marginBottom: 4,
  },
  reward: {
    textAlign: 'center',
    color: '#6200ee',
    fontWeight: '500',
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardTitle: {
    marginLeft: 12,
    color: '#1a1a1a',
  },
  copiedText: {
    color: '#4CAF50',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  codeContainer: {
    backgroundColor: '#F3E5F5',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  referralCode: {
    color: '#6200ee',
    marginTop: 4,
  },
  shareButton: {
    marginTop: 8,
  },
  stepsList: {
    gap: 12,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepText: {
    flex: 1,
    color: '#666666',
  },
  inputLabel: {
    marginBottom: 8,
  },
  input: {
    marginBottom: 16,
  },
  submitButton: {
    marginBottom: 8,
  },
  sectionTitle: {
    marginBottom: 16,
    color: '#1a1a1a',
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  activityTitle: {
    color: '#1a1a1a',
  },
  seeAllButton: {
    marginLeft: 'auto',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F3E5F5',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  statValue: {
    color: '#6200ee',
    marginBottom: 4,
  },
  activityList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  date: {
    color: '#666666',
    marginTop: 2,
  },
  statusChip: {
    borderColor: 'transparent',
  },
  noActivity: {
    textAlign: 'center',
    color: '#666666',
    fontStyle: 'italic',
  },
  // Modal styles
  modalContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    color: '#1a1a1a',
    fontWeight: '600',
  },
  modalContent: {
    padding: 16,
  },
  modalItem: {
    marginBottom: 12,
    borderRadius: 8,
    elevation: 1,
  },
  modalItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  modalItemName: {
    color: '#1a1a1a',
    fontWeight: '500',
  },
  modalItemDate: {
    color: '#666666',
    marginTop: 2,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#f9f9f9',
  },
  modalSummary: {
    textAlign: 'center',
    color: '#666666',
  },
  successSnackbar: {
    backgroundColor: '#4CAF50',
  },
  errorSnackbar: {
    backgroundColor: '#F44336',
  },
});

export default Refer;
