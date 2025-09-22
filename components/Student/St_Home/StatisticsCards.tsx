import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Surface, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const StatisticsCards = () => {
  const stats = [
    {
      title: 'Total Students',
      value: '12,458',
      trend: '+5% from last month',
      icon: 'account-group' as const,
      color: '#8b5cf6',
      bgColor: '#f5f3ff',
    },
    {
      title: 'Study Libraries',
      value: '284',
      trend: '+8 this month',
      icon: 'library' as const,
      color: '#ec4899',
      bgColor: '#fdf2f8',
    },
  ];

  return (
    <View style={styles.container}>
      {stats.map((stat, index) => (
        <Surface key={index} style={[styles.card, { backgroundColor: stat.bgColor }]}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name={stat.icon} size={24} color={stat.color} />
          </View>
          <View style={styles.textContainer}>
            <Text variant="titleLarge" style={styles.value}>{stat.value}</Text>
            <Text variant="bodySmall" style={styles.title}>{stat.title}</Text>
            <Text variant="bodySmall" style={[styles.trend, { color: stat.color }]}>
              {stat.trend}
            </Text>
          </View>
        </Surface>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  card: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  value: {
    fontWeight: '600',
    color: '#1f2937',
  },
  title: {
    color: '#6b7280',
    marginTop: 2,
  },
  trend: {
    marginTop: 4,
    fontWeight: '500',
  },
});

export default StatisticsCards;
