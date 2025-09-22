import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Surface, Text } from 'react-native-paper';

const StudyTimeStatistics = () => {
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = [4, 4, 3, 2, 1, 0.5, 0];

  return (
    <Surface style={styles.container} elevation={4}>
      <Text variant="titleMedium" style={styles.title}>Study Time Statistics</Text>

      {/* Added margin to prevent overlap */}
      <Text variant="titleSmall" style={styles.subtitle}>Weekly Progress</Text>

      <View style={styles.chartContainer}>
        {weekDays.map((day, index) => (
          <View key={day} style={styles.barContainer}>
            <View 
              style={[
                styles.bar, 
                { 
                  height: `${(hours[index] / 4) * 100}%`,
                  backgroundColor: index === 6 ? '#d1d5db' : '#2563eb',
                }
              ]} 
            />
            <Text style={styles.dayLabel}>{day}</Text>
          </View>
        ))}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text variant="titleLarge">24.5h</Text>
          <Text style={styles.statLabel}>Total Hours</Text>
          <Text style={styles.trend}>↑ +2h from last week</Text>
        </View>
        <View style={styles.statItem}>
          <Text variant="titleLarge">85%</Text>
          <Text style={styles.statLabel}>Productivity</Text>
          <Text style={styles.trend}>↑ +5% from last week</Text>
        </View>
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  title: {
    marginBottom: 12,
    color: '#1f2937',
    fontWeight: '600',
    textAlign: 'center',
  },
  subtitle: {
    color: '#4b5563',
    marginBottom: 20, // Increased margin to avoid overlap
    textAlign: 'center',
  },
  chartContainer: {
    flexDirection: 'row',
    height: 140,
    alignItems: 'flex-end',
    justifyContent: 'space-around', // Better spacing for bars
    marginBottom: 24,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 20, // Slightly reduced width for better spacing
    borderRadius: 6,
    marginBottom: 8,
  },
  dayLabel: {
    color: '#6b7280',
    fontSize: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    color: '#6b7280',
    marginTop: 4,
    fontSize: 12,
  },
  trend: {
    color: '#10b981',
    marginTop: 2,
    fontSize: 12,
    fontWeight: '500',
  },
});

export default StudyTimeStatistics;
