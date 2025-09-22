import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Surface, Text } from 'react-native-paper';

interface TasksCompletedCardProps {
  completed: number;
  total: number;
  entryTime?: string | null;
}

const TasksCompletedCard: React.FC<TasksCompletedCardProps> = ({ completed, total, entryTime = null }) => {
  return (
    <Surface style={styles.container}>
      {entryTime && (
        <View style={styles.entryTimeContainer}>
          <View style={styles.entryTimeHeader}>
            <MaterialCommunityIcons name="login" size={14} color="#075985" />
            <Text style={styles.entryTimeLabel}>Today's Entry</Text>
          </View>
          <Text style={styles.entryTimeText}>{entryTime}</Text>
        </View>
      )}
      <View style={styles.content}>
        <View>
          <Text style={styles.label}>Tasks Completed Today (IST)</Text>
          <Text style={styles.value}>{completed}/{total}</Text>
        </View>
        <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={24} color="#0ea5e9" />
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f0f9ff',
    elevation: 2,
  },
  entryTimeContainer: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#0ea5e9',
  },
  entryTimeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  entryTimeLabel: {
    fontSize: 12,
    color: '#075985',
    marginLeft: 4,
    fontWeight: '600',
  },
  entryTimeText: {
    fontSize: 14,
    color: '#0284c7',
    fontWeight: '700',
    marginLeft: 18, // Align with the label text
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    color: '#075985',
    marginBottom: 4,
  },
  value: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0284c7',
  },
});

export default TasksCompletedCard;
