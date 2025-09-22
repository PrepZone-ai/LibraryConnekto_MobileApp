import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { TextInput, Button, Text, Surface, HelperText, Switch, IconButton } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { saveAdminDetails } from '../../services/authService';
import { getAuthToken } from '../../config/api';
import * as Location from 'expo-location';
import { generateReferralCode } from '../../utils/referral';
import Header from '../common/Header';

interface FormData {
  admin_name: string;
  library_name: string;
  mobile_no: string;
  address: string;
  total_seats: string;
  latitude: number | null;
  longitude: number | null;
  has_shift_system: boolean;
  shift_timings: string[];
}

interface FormErrors {
  [key: string]: string;
}

interface AdminDetails {
  admin_name: string;
  library_name: string;
  mobile_no: string;
  address: string;
  total_seats: number;
  latitude?: number;
  longitude?: number;
  referral_code?: string;
  has_shift_system: boolean;
  shift_timings?: string[];
}

const AdminDetails: React.FC<NativeStackScreenProps<RootStackParamList, 'AdminDetails'>> = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    admin_name: '',
    library_name: '',
    mobile_no: '',
    address: '',
    total_seats: '',
    latitude: null,
    longitude: null,
    has_shift_system: false,
    shift_timings: ['9:00 AM - 1:00 PM', '2:00 PM - 6:00 PM'],
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      setLocationLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setFormData(prev => ({
          ...prev,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        }));
      } else {
        Alert.alert(
          'Location Permission',
          'Please enable location services to help students find your library.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert(
        'Location Error',
        'Failed to get current location. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLocationLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.admin_name) {
      errors.admin_name = 'Admin name is required';
    }

    if (!formData.library_name) {
      errors.library_name = 'Library name is required';
    }

    if (!formData.mobile_no) {
      errors.mobile_no = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(formData.mobile_no)) {
      errors.mobile_no = 'Mobile number must be 10 digits';
    }

    if (!formData.address) {
      errors.address = 'Address is required';
    }

    if (!formData.total_seats) {
      errors.total_seats = 'Total seats is required';
    } else if (!/^\d+$/.test(formData.total_seats)) {
      errors.total_seats = 'Total seats must be a number';
    } else if (parseInt(formData.total_seats) <= 0) {
      errors.total_seats = 'Total seats must be greater than 0';
    }

    if (!formData.latitude || !formData.longitude) {
      errors.location = 'Location is required. Please enable location services.';
    }

    if (formData.has_shift_system && (!formData.shift_timings || formData.shift_timings.length === 0)) {
      errors.shift_timings = 'At least one shift timing is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      // Check if user is authenticated by checking for auth token
      const token = await getAuthToken();
      if (!token) {
        throw new Error('No authenticated user found');
      }

      // Save admin details first (without referral code)
      const adminDetails: AdminDetails = {
        admin_name: formData.admin_name,
        library_name: formData.library_name,
        mobile_no: formData.mobile_no,
        address: formData.address,
        total_seats: parseInt(formData.total_seats),
        latitude: formData.latitude || undefined,
        longitude: formData.longitude || undefined,
        referral_code: undefined, // Will be set after generation
        has_shift_system: formData.has_shift_system,
        shift_timings: formData.has_shift_system ? formData.shift_timings : undefined,
      };

      await saveAdminDetails(adminDetails);

      // Generate referral code after admin details are saved
      try {
        const referralCode = await generateReferralCode('admin', formData.admin_name, formData.library_name);
        
        // Update admin details with the referral code
        const updatedAdminDetails: AdminDetails = {
          ...adminDetails,
          referral_code: referralCode,
        };
        
        await saveAdminDetails(updatedAdminDetails);
      } catch (referralError: any) {
        console.warn('Failed to generate referral code:', referralError);
        // Continue without referral code - it can be generated later
      }

      // Automatically redirect to admin dashboard after successful submission
      navigation.replace('AdminDashboard', { screen: 'Home' });

      Alert.alert(
        'Success',
        'Library details saved successfully!'
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const addShiftTiming = () => {
    setFormData(prev => ({
      ...prev,
      shift_timings: [...prev.shift_timings, '9:00 AM - 1:00 PM']
    }));
  };

  const removeShiftTiming = (index: number) => {
    setFormData(prev => ({
      ...prev,
      shift_timings: prev.shift_timings.filter((_, i) => i !== index)
    }));
  };

  const updateShiftTiming = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      shift_timings: prev.shift_timings.map((time, i) => i === index ? value : time)
    }));
  };

  return (
    <ScrollView style={styles.container}>
      <Header 
        title="Admin Details"
        showBackButton
        onBackPress={() => navigation.goBack()}
        libraryName={formData.library_name}
        isAdminPage={true}
      />
      <Surface style={styles.surface}>
        <Text style={styles.title}>Library Details</Text>
        
        <TextInput
          label="Admin Name"
          value={formData.admin_name}
          onChangeText={(text) => setFormData({ ...formData, admin_name: text })}
          style={styles.input}
          error={!!formErrors.admin_name}
        />
        <HelperText type="error" visible={!!formErrors.admin_name}>
          {formErrors.admin_name}
        </HelperText>

        <TextInput
          label="Library Name"
          value={formData.library_name}
          onChangeText={(text) => setFormData({ ...formData, library_name: text })}
          style={styles.input}
          error={!!formErrors.library_name}
        />
        <HelperText type="error" visible={!!formErrors.library_name}>
          {formErrors.library_name}
        </HelperText>

        <TextInput
          label="Mobile Number"
          value={formData.mobile_no}
          onChangeText={(text) => setFormData({ ...formData, mobile_no: text })}
          keyboardType="phone-pad"
          style={styles.input}
          error={!!formErrors.mobile_no}
        />
        <HelperText type="error" visible={!!formErrors.mobile_no}>
          {formErrors.mobile_no}
        </HelperText>

        <TextInput
          label="Address"
          value={formData.address}
          onChangeText={(text) => setFormData({ ...formData, address: text })}
          style={styles.input}
          multiline
          numberOfLines={3}
          error={!!formErrors.address}
        />
        <HelperText type="error" visible={!!formErrors.address}>
          {formErrors.address}
        </HelperText>

        <TextInput
          label="Total Seats"
          value={formData.total_seats}
          onChangeText={(text) => setFormData({ ...formData, total_seats: text })}
          keyboardType="numeric"
          style={styles.input}
          error={!!formErrors.total_seats}
        />
        <HelperText type="error" visible={!!formErrors.total_seats}>
          {formErrors.total_seats}
        </HelperText>

        <View style={styles.locationContainer}>
          <Text>Location: </Text>
          {locationLoading ? (
            <Text>Getting location...</Text>
          ) : formData.latitude && formData.longitude ? (
            <Text>
              {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
            </Text>
          ) : (
            <Button onPress={requestLocationPermission}>Get Location</Button>
          )}
        </View>
        <HelperText type="error" visible={!!formErrors.location}>
          {formErrors.location}
        </HelperText>

        <View style={styles.shiftContainer}>
          <View style={styles.shiftHeader}>
            <Text>Do you operate in shifts?</Text>
            <Switch
              value={formData.has_shift_system}
              onValueChange={(value) => setFormData({ ...formData, has_shift_system: value })}
            />
          </View>

          {formData.has_shift_system && (
            <View style={styles.shiftTimings}>
              <Text style={styles.shiftTitle}>Shift Timings:</Text>
              {formData.shift_timings.map((time, index) => (
                <View key={index} style={styles.shiftRow}>
                  <TextInput
                    label={`Shift ${index + 1}`}
                    value={time}
                    onChangeText={(text) => updateShiftTiming(index, text)}
                    style={styles.shiftInput}
                  />
                  <IconButton
                    icon="delete"
                    size={20}
                    onPress={() => removeShiftTiming(index)}
                  />
                </View>
              ))}
              <Button
                mode="outlined"
                onPress={addShiftTiming}
                style={styles.addShiftButton}
              >
                Add Shift
              </Button>
            </View>
          )}
        </View>

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={loading}
          disabled={loading}
          style={styles.submitButton}
        >
          Save Details
        </Button>
      </Surface>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  surface: {
    margin: 16,
    padding: 16,
    borderRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  submitButton: {
    marginTop: 16,
  },
  shiftContainer: {
    marginTop: 16,
  },
  shiftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  shiftTimings: {
    marginTop: 8,
  },
  shiftTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  shiftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  shiftInput: {
    flex: 1,
    marginRight: 8,
  },
  addShiftButton: {
    marginTop: 8,
  },
});

export default AdminDetails;
