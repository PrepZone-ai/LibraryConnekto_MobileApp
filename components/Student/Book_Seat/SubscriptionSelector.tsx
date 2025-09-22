import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Surface, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SubscriptionOption } from './types';

interface SubscriptionSelectorProps {
  plans: SubscriptionOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
}

const SubscriptionSelector: React.FC<SubscriptionSelectorProps> = ({
  plans,
  selectedValue,
  onSelect,
}) => {
  const calculateDiscount = (original: number, discounted: number) => {
    return Math.round(((original - discounted) / original) * 100);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Surface style={styles.container}>
      <Text style={styles.title}>Select Subscription Plan</Text>
      <View style={styles.plansContainer}>
        {plans.map((plan) => (
          <TouchableOpacity
            key={plan.value}
            style={[
              styles.planCard,
              selectedValue === plan.value && styles.selectedPlan,
            ]}
            onPress={() => onSelect(plan.value)}
          >
            <View style={styles.planHeader}>
              <Text style={styles.planLabel}>{plan.label}</Text>
              {plan.price !== plan.originalPrice && (
                <View style={styles.discountBadge}>
                  <MaterialCommunityIcons name="tag" size={14} color="#fff" />
                  <Text style={styles.discountText}>
                    {calculateDiscount(plan.originalPrice, plan.price)}% OFF
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.priceContainer}>
              {plan.price !== plan.originalPrice && (
                <Text style={styles.originalPrice}>
                  {formatPrice(plan.originalPrice)}
                </Text>
              )}
              <Text style={styles.price}>{formatPrice(plan.price)}</Text>
            </View>

            <View style={styles.perMonthContainer}>
              <Text style={styles.perMonthPrice}>
                {formatPrice(plan.price / plan.months)}
              </Text>
              <Text style={styles.perMonthLabel}>/month</Text>
            </View>

            {selectedValue === plan.value && (
              <View style={styles.selectedIndicator}>
                <MaterialCommunityIcons name="check-circle" size={24} color="#0066cc" />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  plansContainer: {
    gap: 12,
  },
  planCard: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    position: 'relative',
  },
  selectedPlan: {
    borderColor: '#0066cc',
    backgroundColor: '#e6f0ff',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  planLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  discountBadge: {
    backgroundColor: '#2ecc71',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  discountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0066cc',
  },
  originalPrice: {
    fontSize: 16,
    textDecorationLine: 'line-through',
    color: '#666',
  },
  perMonthContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  perMonthPrice: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2ecc71',
  },
  perMonthLabel: {
    fontSize: 14,
    color: '#666',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
});

export default SubscriptionSelector;
