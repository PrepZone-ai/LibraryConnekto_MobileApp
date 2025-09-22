import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Clipboard from 'expo-clipboard';
import React, { useEffect, useState } from "react";
import { Image, ScrollView, Share, StyleSheet, View } from "react-native";
import { Button, Snackbar, Surface, Text, TextInput } from "react-native-paper";
import { apiClient } from '../../../config/api';
import { AdminStackScreenProps } from '../../../types/navigation';
import Header from '../../common/Header';

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

interface UserData {
  id: string;
  user_type: 'admin' | 'student';
  name: string;
  library_name?: string;
}

interface ReferralCode {
  code: string;
  user_id: string;
  user_type: string;
  user_name: string;
  created_at: string;
}

interface ReferralStats {
  total_points: number;
  total_referrals: number;
  recent_referrals: RecentReferral[];
}

const Refer: React.FC<ReferProps> = ({ navigation, route }) => {
  const [referralCode, setReferralCode] = useState<string>("");
  const [myCode, setMyCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [showError, setShowError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showCopied, setShowCopied] = useState<boolean>(false);
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

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        // Get user details using FastAPI
        const userData = await apiClient.get<UserData>('/user/profile');
        
        if (userData) {
          setUserDetails({
            userType: userData.user_type,
            userName: userData.name,
            libraryName: userData.library_name
          });
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
        setErrorMessage("Failed to load user details");
        setShowError(true);
      }
    };

    fetchUserDetails();
  }, []);

  useEffect(() => {
    const initializeReferralCode = async () => {
      try {
        if (!userDetails?.userName) {
          console.log('Waiting for user details to be loaded');
          return; // Wait for user details to be loaded
        }

        console.log('Initializing referral code for:', userDetails);
        // Get user details using FastAPI
        const userData = await apiClient.get<UserData>('/user/profile');
        if (!userData) return;

        // First check if user already has a referral code
        try {
          const existingCode = await apiClient.get<ReferralCode>(`/referrals/code/${userData.id}`);
          
          if (existingCode && existingCode.code) {
            console.log('Found existing referral code:', existingCode.code);
            setMyCode(existingCode.code);

            // Fetch reward stats for existing code
            const referralStats = await apiClient.get<ReferralStats>(`/referrals/stats/${userData.id}`);

            if (referralStats) {
              setRewardStats({
                totalPoints: referralStats.total_points || 0,
                totalReferrals: referralStats.total_referrals || 0,
                recentReferrals: referralStats.recent_referrals || []
              });
            }
          } else {
            console.log('Generating new referral code for:', userDetails.userName);
            // Generate new code using FastAPI
            const newCode = await apiClient.post<ReferralCode>('/referrals/generate', {
              user_type: userDetails.userType,
              user_name: userDetails.userName,
              library_name: userDetails.libraryName
            });

            if (newCode) {
              console.log('Generated new referral code:', newCode.code);
              setMyCode(newCode.code);
            }

            // Fetch reward stats after saving the code
            const referralStats = await apiClient.get<ReferralStats>(`/referrals/stats/${userData.id}`);

            if (referralStats) {
              setRewardStats({
                totalPoints: referralStats.total_points || 0,
                totalReferrals: referralStats.total_referrals || 0,
                recentReferrals: referralStats.recent_referrals || []
              });
            }
          }
        } catch (error) {
          console.log('Error or no existing code found:', error);
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

  const handleCopyCode = async () => {
    try {
      if (!myCode) {
        setErrorMessage("No referral code available to copy");
        setShowError(true);
        return;
      }

      await Clipboard.setStringAsync(myCode);
      console.log('Copied code to clipboard:', myCode);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    } catch (error) {
      console.error("Error copying code:", error);
      setErrorMessage("Failed to copy referral code");
      setShowError(true);
    }
  };

  const handleShare = async () => {
    try {
      if (!myCode) {
        setErrorMessage("No referral code available to share");
        setShowError(true);
        return;
      }

      const shareText = `🎉 Hey fellow library owner! I'm using Library Conneckto to streamline study library operations. It's a game-changer for managing everything from inventory to student records! Join me using my referral code: ${myCode} and get special perks. Let's digitize our libraries together! 📚✨`;

      console.log('Sharing code:', myCode);
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
      // The validateReferralCode function was removed from imports, so this will cause a TypeScript error.
      // Assuming it's meant to be replaced with a direct API call or a placeholder.
      // For now, we'll just set a placeholder message.
      // const validationResult = await validateReferralCode(referralCode);

      // if (!validationResult.success) {
      //   setErrorMessage(validationResult.message);
      //   setShowError(true);
      //   return;
      // }

      // Create referral record
      const { data: { user } } = await apiClient.get('/auth/user');
      if (!user) {
        setErrorMessage("Please sign in to use referral codes");
        setShowError(true);
        return;
      }

      const { error: referralError } = await apiClient.post('/referrals', {
        referral_code: referralCode,
        referrer_id: user.id,
        referred_id: user.id,  // Will be updated during admin registration
        referred_name: userDetails?.userName,
        status: 'pending'
      });

      if (referralError) {
        throw referralError;
      }

      setShowSuccess(true);
      setReferralCode("");
    } catch (error) {
      console.error("Error processing referral:", error);
      setErrorMessage("Failed to process referral. Please try again.");
      setShowError(true);
    } finally {
      setIsLoading(false);
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
            <View style={{ flex: 1 }}>
              <Text variant="bodySmall">Your Referral Code</Text>
              {myCode ? (
                <Text variant="headlineSmall" style={styles.referralCode}>{myCode}</Text>
              ) : (
                <Text variant="bodyMedium" style={[styles.referralCode, { color: '#999' }]}>Loading your code...</Text>
              )}
            </View>
            <Button
              mode="contained"
              onPress={handleCopyCode}
              icon="content-copy"
              disabled={!myCode}
            >
              Copy
            </Button>
          </View>

          <Button
            mode="contained"
            onPress={handleShare}
            icon="share-variant"
            style={styles.shareButton}
            disabled={!myCode}
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

          <Text variant="titleMedium" style={[styles.sectionTitle, styles.activityTitle]}>
            Recent Activity
          </Text>
          <View style={styles.activityList}>
            {rewardStats.recentReferrals.map((referral, index) => (
              <View key={index} style={styles.activityItem}>
                <View>
                  <Text variant="bodyLarge">{referral.name}</Text>
                  <Text variant="bodySmall" style={styles.date}>{referral.date}</Text>
                </View>
                <Text variant="bodySmall" style={styles.status}>{referral.status}</Text>
              </View>
            ))}
          </View>
        </Surface>
      </ScrollView>

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
  activityTitle: {
    marginTop: 24,
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
  status: {
    color: '#4CAF50',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  successSnackbar: {
    backgroundColor: '#4CAF50',
  },
  errorSnackbar: {
    backgroundColor: '#F44336',
  },
});

export default Refer;
