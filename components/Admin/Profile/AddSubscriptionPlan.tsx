import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Surface, Text, Button, TextInput, Menu, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { apiClient } from '../../../config/api';
import { SubscriptionPlan } from './types';
import { useNavigation, useRoute } from '@react-navigation/native';
import Header from '../../../components/common/Header';

interface RouteParams {
  libraryId: string;
  editingPlan?: {
    id: string;
    library_id: string;
    months: number;
    amount: number;
    discounted_amount: number | null;
    is_custom: boolean;
    created_at: string;
    updated_at: string;
  };
}

const DEFAULT_MONTHS = [1, 3, 6, 9];

const AddSubscriptionPlan: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { libraryId, editingPlan } = route.params as RouteParams;

  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState<number>(editingPlan?.months || 1);
  const [isCustomMonth, setIsCustomMonth] = useState(false);
  const [customMonths, setCustomMonths] = useState<string>(editingPlan?.months.toString() || '');
  const [amount, setAmount] = useState<string>(editingPlan?.amount.toString() || '');
  const [discountedAmount, setDiscountedAmount] = useState<string>(editingPlan?.discounted_amount?.toString() || '');
  const [error, setError] = useState<string>('');

  const handleSave = async () => {
    try {
      // Check if a plan with the same duration exists
      let existingPlan = null;
      try {
        existingPlan = await apiClient.get(`/subscription/plans/check-duration/${libraryId}/${isCustomMonth ? parseInt(customMonths) : selectedMonths}`);
      } catch (e) {
        // handle error if needed
      }

      if (existingPlan && typeof existingPlan === 'object' && 'id' in existingPlan && (!editingPlan || existingPlan.id !== editingPlan.id)) {
        setError('A subscription plan with this duration already exists');
        return;
      }

      // Validate inputs
      const months = isCustomMonth ? parseInt(customMonths) : selectedMonths;
      const amountValue = parseFloat(amount);

      if (!months || months < 1 || months > 12) {
        setError('Please enter valid months (1-12)');
        return;
      }

      if (isCustomMonth && DEFAULT_MONTHS.includes(months as number)) {
        setError('Please select a different month than the default options');
        return;
      }

      if (!amountValue || amountValue <= 0) {
        setError('Please enter a valid amount');
        return;
      }

      if (discountedAmount && parseFloat(discountedAmount) >= amountValue) {
        setError('Discounted amount must be less than the regular amount');
        return;
      }

      const planData = {
        library_id: libraryId,
        months,
        amount: amountValue,
        discounted_amount: discountedAmount ? parseFloat(discountedAmount) : null,
        is_custom: isCustomMonth
      };

      if (editingPlan) {
        await apiClient.put(`/subscription/plans/${editingPlan.id}`, planData);
      } else {
        await apiClient.post('/subscription/plans', planData);
      }

      navigation.goBack();
    } catch (error: any) {
      console.error('Error saving plan:', error.message);
      setError(error.message);
    }
  };

  const handleMonthSelect = (months: number) => {
    setSelectedMonths(months);
    setIsCustomMonth(false);
    setMenuVisible(false);
  };

  const handleCustomSelect = () => {
    setIsCustomMonth(true);
    setMenuVisible(false);
  };

  return (
    <View style={styles.container}>
      <Header 
        title={editingPlan ? 'Edit Subscription Plan' : 'Add New Plan'} 
        showBackButton 
        onBackPress={() => navigation.goBack()} 
      />
      <ScrollView style={styles.content}>
        <Surface style={styles.formCard}>
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Duration</Text>
            <View style={styles.durationContainer}>
              {DEFAULT_MONTHS.map((month) => (
                <Button
                  key={month}
                  mode={selectedMonths === month ? 'contained' : 'outlined'}
                  onPress={() => handleMonthSelect(month)}
                  style={styles.durationButton}
                  labelStyle={styles.durationButtonLabel}
                >
                  {month} Month{month > 1 ? 's' : ''}
                </Button>
              ))}
            </View>
            <Button
              mode={isCustomMonth ? 'contained' : 'outlined'}
              onPress={handleCustomSelect}
              icon="calendar-edit"
              style={[styles.durationButton, styles.customButton]}
            >
              Custom Duration
            </Button>
          </View>

          {isCustomMonth && (
            <View style={styles.section}>
              <Text variant="bodyMedium">Custom Months (1-12)</Text>
              <TextInput
                mode="outlined"
                keyboardType="numeric"
                value={customMonths}
                onChangeText={(value) => {
                  const months = parseInt(value) || 0;
                  if (months <= 12) {
                    setCustomMonths(value);
                  }
                }}
                error={error.includes('months')}
                right={<TextInput.Affix text="Months" />}
              />
            </View>
          )}

          <View style={styles.section}>
            <Text variant="bodyMedium">Amount (₹)</Text>
            <TextInput
              mode="outlined"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              error={error.includes('amount')}
            />
          </View>

          <View style={styles.section}>
            <Text variant="bodyMedium">Discounted Amount (Optional)</Text>
            <TextInput
              mode="outlined"
              keyboardType="numeric"
              value={discountedAmount}
              onChangeText={setDiscountedAmount}
              error={error.includes('Discounted')}
            />
          </View>

          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}

          <View style={styles.buttonContainer}>
            <Button
              mode="outlined"
              onPress={() => navigation.goBack()}
              style={styles.button}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSave}
              style={styles.button}
            >
              Save
            </Button>
          </View>
        </Surface>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  durationContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  durationButton: {
    width: '48%',
    marginBottom: 8,
  },
  durationButtonLabel: {
    fontSize: 14,
  },
  customButton: {
    width: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  formCard: {
    padding: 16,
    borderRadius: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  monthButton: {
    height: 48,
  },
  menu: {
    marginTop: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  button: {
    marginLeft: 8,
  },
  errorText: {
    color: '#DC2626',
    marginBottom: 16,
  },
});

export default AddSubscriptionPlan;
