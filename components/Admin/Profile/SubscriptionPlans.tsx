import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Surface, Text, Button, TextInput, IconButton, Portal, Dialog } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { apiClient } from '../../../config/api';
import { SubscriptionPlan } from './types';
import { useFocusEffect } from '@react-navigation/native';
import { NavigationProp } from '@react-navigation/native';
import { AdminStackParamList } from '../../../types/navigation';

interface SubscriptionPlansProps {
  libraryId: string;
  onUpdate: () => void;
  navigation: NavigationProp<AdminStackParamList>;
}

const DEFAULT_MONTHS = [1, 3, 6, 9];

const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({ libraryId, onUpdate, navigation }) => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlans();
  }, [libraryId]);

  const loadPlans = async () => {
    try {
      setLoading(true);
      // Optionally filter by libraryId if needed, or filter in frontend
      const data = await apiClient.get(`/subscription/plans?active_only=false`) as SubscriptionPlan[];
      // If you want to filter by libraryId, do it here:
      const filtered = data.filter((plan) => plan.library_id === libraryId);
      setPlans(filtered || []);
    } catch (error: any) {
      console.error('Error loading plans:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleDeleteConfirm = async (planId: string) => {
    setDeletingPlanId(planId);
    setShowConfirmDialog(true);
  };

  const handleDelete = async (planId: string) => {
    setShowConfirmDialog(false);
    setDeletingPlanId(null);
    try {
      await apiClient.delete(`/subscription/plans/${planId}`);
      loadPlans();
      onUpdate();
    } catch (error: any) {
      console.error('Error deleting plan:', error.message);
    }
  };

  // Set up focus effect to reload plans when returning from AddSubscriptionPlan
  useFocusEffect(
    React.useCallback(() => {
      loadPlans();
      onUpdate();
    }, [loadPlans, onUpdate])
  );

  const handleAddPlan = () => {
    navigation.navigate('AddSubscriptionPlan', { libraryId });
  };

  return (
    <Surface style={styles.container}>
      <View style={styles.header}>
        <Text variant="titleMedium">Subscription Plans</Text>
        <Button
          mode="contained"
          onPress={handleAddPlan}
        >
          Add Plan
        </Button>
      </View>

      <ScrollView contentContainerStyle={styles.plansGrid}>
        {plans.map((plan) => (
          <Surface key={plan.id} style={styles.planCard}>
            <View style={styles.planHeader}>
              <View style={styles.durationBadge}>
                <Text style={styles.durationText}>{plan.months} Month{plan.months > 1 ? 's' : ''}</Text>
              </View>
              {plan.is_custom && (
                <View style={styles.customBadge}>
                  <Text style={styles.customBadgeText}>Custom</Text>
                </View>
              )}
            </View>
            <View style={styles.planInfo}>
              <Text variant="titleLarge" style={styles.amount}>₹{plan.amount}</Text>
              {plan.discounted_amount && (
                <View style={styles.discountContainer}>
                  <Text variant="bodyMedium" style={styles.originalAmount}>₹{plan.amount}</Text>
                  <Text variant="titleMedium" style={styles.discountedAmount}>
                    ₹{plan.discounted_amount}
                  </Text>
                  <Text variant="bodySmall" style={styles.savingsText}>
                    Save ₹{plan.amount - plan.discounted_amount}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.planActions}>
              <Button
                mode="outlined"
                icon="pencil"
                onPress={() => {
                  navigation.navigate('AddSubscriptionPlan', { libraryId, editingPlan: plan });
                }}
                style={styles.actionButton}
              >
                Edit
              </Button>
              <Button
                mode="outlined"
                icon="delete"
                onPress={() => handleDeleteConfirm(plan.id)}
                style={[styles.actionButton, styles.deleteButton]}
                textColor="#DC2626"
              >
                Delete
              </Button>
            </View>
          </Surface>
        ))}
      </ScrollView>

      {/* Confirmation Dialog */}
      <Portal>
        <Dialog visible={showConfirmDialog} onDismiss={() => setShowConfirmDialog(false)}>
          <Dialog.Title>Delete Plan</Dialog.Title>
          <Dialog.Content>
            <Text>Are you sure you want to delete this subscription plan?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowConfirmDialog(false)}>Cancel</Button>
            <Button 
              onPress={() => deletingPlanId && handleDelete(deletingPlanId)}
              textColor="#DC2626"
            >
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </Surface>
  );
};

const styles = StyleSheet.create({
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  durationBadge: {
    backgroundColor: '#818CF8',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  durationText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  customBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  customBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  plansGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  container: {
    marginTop: 16,
    padding: 16,
    borderRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  plansList: {
    maxHeight: 300,
  },
  planCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    elevation: 1,
  },
  planInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  amount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  discountContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  originalAmount: {
    textDecorationLine: 'line-through',
    color: '#6B7280',
  },
  discountedAmount: {
    color: '#059669',
    fontWeight: 'bold',
  },
  savingsText: {
    color: '#059669',
    marginTop: 4,
  },
  planActions: {
    flexDirection: 'column',
    gap: 8,
  },
  actionButton: {
    width: '100%',
  },
  deleteButton: {
    borderColor: '#DC2626',
  },
  discountText: {
    color: '#10B981',
  },
  customText: {
    color: '#6B7280',
    fontStyle: 'italic',
  },
});

export default SubscriptionPlans;
