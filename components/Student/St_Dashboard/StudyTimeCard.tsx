import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Surface, Text } from 'react-native-paper';

interface StudyTimeCardProps {
  hours: number;
  isActive?: boolean;
  lastDayHours?: number;
  entryTime?: string | null;
}

const StudyTimeCard: React.FC<StudyTimeCardProps> = ({ hours, isActive = false, lastDayHours = 0, entryTime = null }) => {
  // Format hours into hours and minutes
  const formatStudyTime = (totalHours: number) => {
    const wholeHours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - wholeHours) * 60);

    if (wholeHours === 0) {
      return `${minutes} min`;
    } else if (minutes === 0) {
      return `${wholeHours} hr${wholeHours !== 1 ? 's' : ''}`;
    } else {
      return `${wholeHours} hr${wholeHours !== 1 ? 's' : ''} ${minutes} min`;
    }
  };

  return (
    <Surface style={styles.container}>
      {entryTime && (
        <View style={styles.entryTimeContainer}>
          <View style={styles.entryTimeHeader}>
            <MaterialCommunityIcons name="login" size={14} color="#6b21a8" />
            <Text style={styles.entryTimeLabel}>Today's Entry</Text>
          </View>
          <Text style={styles.entryTimeText}>{entryTime}</Text>
        </View>
      )}
      <View style={styles.content}>
        <View>
          <Text style={styles.label}>Last Day's Study Time (IST)</Text>
          <View style={styles.valueContainer}>
            <Text style={styles.value}>{formatStudyTime(lastDayHours)}</Text>
          </View>
          {isActive && (
            <View style={styles.currentSessionContainer}>
              <Text style={styles.currentSessionLabel}>Current Session:</Text>
              <View style={styles.currentSessionValue}>
                <Text style={styles.currentSessionTime}>{formatStudyTime(hours)}</Text>
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>ACTIVE</Text>
                </View>
              </View>
            </View>
          )}
        </View>
        <MaterialCommunityIcons
          name={isActive ? "clock-fast" : "clock-outline"}
          size={24}
          color={isActive ? "#10b981" : "#a855f7"}
        />
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f5f3ff',
    elevation: 2,
  },
  entryTimeContainer: {
    backgroundColor: '#ede9fe',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#a855f7',
  },
  entryTimeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  entryTimeLabel: {
    fontSize: 12,
    color: '#6b21a8',
    marginLeft: 4,
    fontWeight: '600',
  },
  entryTimeText: {
    fontSize: 14,
    color: '#7c3aed',
    fontWeight: '700',
    marginLeft: 18, // Align with the label text
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  label: {
    fontSize: 12,
    color: '#6b21a8',
    marginBottom: 4,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  value: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#7c3aed',
  },
  currentSessionContainer: {
    marginTop: 8,
    backgroundColor: '#e0f2fe',
    padding: 8,
    borderRadius: 8,
  },
  currentSessionLabel: {
    fontSize: 11,
    color: '#0369a1',
    marginBottom: 2,
  },
  currentSessionValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentSessionTime: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0284c7',
  },
  activeBadge: {
    backgroundColor: '#10b981',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  activeBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default StudyTimeCard;
