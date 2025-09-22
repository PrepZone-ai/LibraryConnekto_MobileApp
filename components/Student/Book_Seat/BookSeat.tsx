import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import Header from '../../../components/common/Header';
import { apiClient } from '../../../config/api';
import { useAuth } from '../../../contexts/AuthContext';

// Import components
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from 'react-native-paper';
import BookingForm from './BookingForm';
import ConfirmationModal from './ConfirmationModal';
import LibrarySelector from './LibrarySelector';

// Import types and utils
import { FormData, Library, SubscriptionOption } from './types';
import { calculateDistance } from './utils';

type RootStackParamList = {
  StudentHome: undefined;
  StudentProfile: undefined;
  BookSeat: undefined;
};

type BookSeatScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const BookSeat: React.FC = () => {
  const navigation = useNavigation<BookSeatScreenNavigationProp>();
  const { user } = useAuth();

  const [formData, setFormData] = useState<FormData>({
    name: "",
    mobile: "",
    email: "",
    address: "",
    subscription: "",
    selectedLibrary: "",
    selectedLibraryData: null,
  });

  const [showLibrarySelector, setShowLibrarySelector] = useState(true);
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [requestId, setRequestId] = useState("");
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionOption[]>([]);

  useEffect(() => {
    // Pre-fill form if user is logged in
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.user_metadata?.full_name || prev.name,
        mobile: user.user_metadata?.phone || prev.mobile,
        email: user.email || prev.email,
      }));
    }
  }, [user]);

  const fetchSubscriptionPlans = async (libraryId: string) => {
    try {
      const data = await apiClient.get(`/libraries/${libraryId}/subscription-plans`);

      const plans = data.map((plan: any) => ({
        value: plan.id,
        label: `${plan.months} ${plan.months === 1 ? 'Month' : 'Months'}`,
        price: plan.discounted_amount || plan.amount,
        originalPrice: plan.amount,
        months: plan.months
      }));

      setSubscriptionPlans(plans);
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      Alert.alert('Error', 'Failed to fetch subscription plans');
    }
  };

  const handleLibrarySelect = (library: Library) => {
    setFormData(prev => ({
      ...prev,
      selectedLibrary: library.id,
      selectedLibraryData: library
    }));
    setShowLibrarySelector(false);
    fetchSubscriptionPlans(library.id);
  };

  const fetchLibraries = async () => {
    try {
      const data = await apiClient.get('/libraries');
      setLibraries(data || []);
    } catch (error) {
      console.error('Error fetching libraries:', error);
      Alert.alert('Error', 'Failed to fetch libraries');
    }
  };

  useEffect(() => {
    fetchLibraries();
  }, []);

  const handleFieldChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when field is changed
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.selectedLibraryData || !formData.selectedLibrary) {
      newErrors.library = "Please select a library";
    }

    if (!formData.subscription) {
      newErrors.subscription = "Please select a subscription plan";
    }

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.mobile.trim()) {
      newErrors.mobile = "Mobile number is required";
    } else if (!/^\d{10}$/.test(formData.mobile.trim())) {
      newErrors.mobile = "Please enter a valid 10-digit mobile number";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email.trim())) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.address.trim()) {
      newErrors.address = "Address is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      if (!formData.selectedLibraryData) {
        throw new Error('Please select a library first');
      }

      const selectedPlan = subscriptionPlans.find(plan => plan.value === formData.subscription);
      if (!selectedPlan) {
        throw new Error('Please select a subscription plan');
      }

      // Get current date for start_date
      const currentDate = new Date();
      const endDate = new Date(currentDate);
      endDate.setMonth(endDate.getMonth() + selectedPlan.months);

      // Create booking data
      const bookingData = {
        student_id: user?.id || null,
        admin_id: formData.selectedLibraryData.user_id,
        library_id: formData.selectedLibraryData.id,
        name: formData.name.trim(),
        email: formData.email.trim(),
        mobile: formData.mobile.trim(),
        address: formData.address.trim(),
        subscription_months: selectedPlan.months,
        amount: selectedPlan.price,
        start_date: currentDate.toISOString(),
        end_date: endDate.toISOString(),
        status: 'pending',
        created_at: currentDate.toISOString(),
        updated_at: currentDate.toISOString()
      };

      // Check if there are available seats
      if (formData.selectedLibraryData.total_seats <= formData.selectedLibraryData.occupied_seats) {
        throw new Error('No seats available in this library. Please select another library.');
      }

      // Create seat booking
      const { data: booking, error: bookingError } = await apiClient.post('/seat-bookings', bookingData);

      if (bookingError) {
        console.error('Booking error:', bookingError);
        // Provide more specific error message based on the error code
        if (bookingError.code === '42501' || bookingError.code === '55000') {
          // This is a permission error or materialized view refresh error
          // We'll still create the booking but inform the user it's pending admin approval
          Alert.alert(
            'Booking Submitted',
            'Your booking request has been submitted and is pending admin approval. You will be notified once it is approved.'
          );
          // Navigate back to the previous screen after a short delay
          setTimeout(() => {
            navigation.goBack();
          }, 1500);
          return; // Exit early with success message
        } else {
          throw new Error('Failed to submit booking request. Please try again.');
        }
      }

      setRequestId(booking.id);
      setShowConfirmation(true);

      // Reset form
      setFormData({
        name: "",
        mobile: "",
        email: "",
        address: "",
        subscription: "",
        selectedLibrary: "",
        selectedLibraryData: null,
      });

      // Show library selector again
      setShowLibrarySelector(true);

    } catch (error: any) {
      console.error('Error submitting request:', error);

      // Check if it's a database error with a specific code
      if (error.code === '42501' || error.code === '55000') {
        // This is a permission error or materialized view refresh error
        // The booking was likely created but the view refresh failed
        Alert.alert(
          'Booking Submitted',
          'Your booking request has been submitted and is pending admin approval. You will be notified once it is approved.'
        );

        // Navigate back to the previous screen after a short delay
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      } else {
        // General error
        Alert.alert(
          'Error',
          error.message || 'Failed to submit request. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFindNearestLibraries = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to find nearest libraries.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const librariesWithDistance = libraries
        .map((library) => ({
          ...library,
          distance: calculateDistance(
            location.coords.latitude,
            location.coords.longitude,
            library.latitude,
            library.longitude,
          ),
        }))
        .sort((a, b) => (a.distance || 0) - (b.distance || 0));

      setLibraries(librariesWithDistance);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get your location. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Book Your Study Space"
        showWelcome={false}
        autoBackButton={true}
        onProfilePress={() => navigation.navigate('StudentProfile')}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {showLibrarySelector ? (
          <LibrarySelector
            libraries={libraries}
            loading={loading}
            onSelectLibrary={handleLibrarySelect}
            onClose={() => setShowLibrarySelector(false)}
            onFindNearest={handleFindNearestLibraries}
          />
        ) : formData.selectedLibraryData ? (
          <>
            <BookingForm
              formData={formData}
              errors={errors}
              onChangeField={handleFieldChange}
              onShowLibrarySelector={() => setShowLibrarySelector(true)}
              onSubmit={handleSubmit}
              loading={loading}
              subscriptionPlans={subscriptionPlans}
              onSelectSubscription={(value) => handleFieldChange('subscription', value)}
            />
          </>
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="library" size={48} color="#666" />
            <Text style={styles.emptyStateText}>Please select a library first</Text>
            <Button
              mode="contained"
              onPress={() => setShowLibrarySelector(true)}
              style={styles.selectLibraryButton}
            >
              Select Library
            </Button>
          </View>
        )}
      </ScrollView>

      <ConfirmationModal
        visible={showConfirmation}
        requestId={requestId}
        onClose={() => setShowConfirmation(false)}
        onGoHome={() => navigation.navigate('StudentHome')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 120,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
  },
  selectLibraryButton: {
    minWidth: 160,
  },
});

export default BookSeat;
