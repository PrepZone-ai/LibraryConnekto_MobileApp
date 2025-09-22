import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Surface, Text, TextInput, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FormData, Library, SubscriptionOption } from './types';

interface BookingFormProps {
  formData: FormData;
  errors: { [key: string]: string };
  onChangeField: (field: keyof FormData, value: string) => void;
  onShowLibrarySelector: () => void;
  onSubmit: () => Promise<void>;
  loading: boolean;
  subscriptionPlans: SubscriptionOption[];
  onSelectSubscription: (value: string) => void;
}

const BookingForm: React.FC<BookingFormProps> = ({
  formData,
  errors,
  onChangeField,
  onShowLibrarySelector,
  onSubmit,
  loading,
  subscriptionPlans,
  onSelectSubscription,
}) => {
  return (
    <Surface style={styles.container}>
      <TouchableOpacity
        style={[styles.librarySelector, formData.selectedLibraryData && styles.selectedLibrary]}
        onPress={onShowLibrarySelector}
      >
        {formData.selectedLibraryData ? (
          <View>
            <Text style={styles.libraryName}>{formData.selectedLibraryData.library_name}</Text>
            <Text style={styles.libraryAddress}>{formData.selectedLibraryData.address}</Text>
            <View style={styles.libraryDetails}>
              <View style={styles.detailItem}>
                <MaterialCommunityIcons name="map-marker-distance" size={16} color="#666" />
                <Text style={styles.detailText}>{formData.selectedLibraryData.distance?.toFixed(1)} km away</Text>
              </View>
              <View style={styles.detailItem}>
                <MaterialCommunityIcons name="seat" size={16} color="#666" />
                <Text style={styles.detailText}>{formData.selectedLibraryData.total_seats - formData.selectedLibraryData.occupied_seats} seats available</Text>
              </View>
            </View>
          </View>
        ) : (
          <Text style={styles.placeholder}>Select a Library</Text>
        )}
        {errors.library && <Text style={styles.errorText}>{errors.library}</Text>}
      </TouchableOpacity>

      {formData.selectedLibraryData && (
        <>
          <View style={styles.subscriptionContainer}>
            <Text style={styles.subscriptionTitle}>Select Subscription Plan</Text>
            <View style={styles.subscriptionOptions}>
              {subscriptionPlans.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.subscriptionOption,
                    formData.subscription === option.value && styles.selectedSubscription
                  ]}
                  onPress={() => onSelectSubscription(option.value)}
                >
                  <View style={styles.optionContent}>
                    <Text style={styles.optionDuration}>{option.label}</Text>
                    <Text style={styles.optionPrice}>₹{option.price}</Text>
                    {option.value !== '1' && (
                      <View style={styles.savingsBadge}>
                        <Text style={styles.savingsText}>
                          Save {Math.round((1 - (option.price / parseInt(option.value)) / 999) * 100)}%
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TextInput
            mode="outlined"
            label="Full Name"
            value={formData.name}
            onChangeText={(value) => onChangeField('name', value)}
            error={!!errors.name}
            style={styles.input}
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

          <TextInput
            mode="outlined"
            label="Mobile Number"
            value={formData.mobile}
            onChangeText={(value) => onChangeField('mobile', value)}
            keyboardType="phone-pad"
            error={!!errors.mobile}
            style={styles.input}
          />
          {errors.mobile && <Text style={styles.errorText}>{errors.mobile}</Text>}

          <TextInput
            mode="outlined"
            label="Email"
            value={formData.email}
            onChangeText={(value) => onChangeField('email', value)}
            keyboardType="email-address"
            autoCapitalize="none"
            error={!!errors.email}
            style={styles.input}
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

          <TextInput
            mode="outlined"
            label="Address"
            value={formData.address}
            onChangeText={(value) => onChangeField('address', value)}
            multiline
            numberOfLines={3}
            error={!!errors.address}
            style={styles.input}
          />
          {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}

          <Button
            mode="contained"
            onPress={onSubmit}
            loading={loading}
            disabled={loading}
            style={styles.submitButton}
          >
            Request Seat
          </Button>
        </>
      )}
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    elevation: 4,
  },
  librarySelector: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: 16,
  },
  selectedLibrary: {
    borderColor: '#0066cc',
    backgroundColor: '#e6f0ff',
  },
  libraryName: {
    fontSize: 16,
    fontWeight: '600',
  },
  libraryAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  libraryDetails: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
  },
  placeholder: {
    color: '#666',
  },
  input: {
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 12,
    marginTop: -4,
    marginBottom: 8,
  },
  submitButton: {
    marginTop: 16,
  },
  subscriptionContainer: {
    marginTop: 16,
    marginBottom: 16,
  },
  subscriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  subscriptionOptions: {
    gap: 8,
  },
  subscriptionOption: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  selectedSubscription: {
    borderColor: '#0066cc',
    backgroundColor: '#f0f7ff',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionDuration: {
    fontSize: 16,
    fontWeight: '500',
  },
  optionPrice: {
    fontSize: 14,
    color: '#666',
  },
  savingsBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  savingsText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default BookingForm;
