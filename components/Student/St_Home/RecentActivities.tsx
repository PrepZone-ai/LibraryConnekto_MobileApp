import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Surface, Text, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const RecentActivities = () => {
  const activities = [
    {
      type: 'seat',
      title: 'Booked a study seat',
      location: 'Central Study Hub',
      time: '2 hours ago',
      color: '#4CAF50',
    },
    {
      type: 'attendance',
      title: 'Marked attendance',
      location: 'Knowledge Center',
      time: 'Today, 9:15 AM',
      color: '#2196F3',
    },
    {
      type: 'download',
      title: 'Downloaded study material',
      location: 'UCEM Library',
      time: 'Yesterday',
      color: '#9C27B0',
    },
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case 'seat':
        return 'seat';
      case 'attendance':
        return 'check-circle';
      case 'download':
        return 'download';
      default:
        return 'information';
    }
  };

  return (
    <Surface style={styles.container}>
      <Text variant="titleMedium" style={styles.title}>Recent Activities</Text>
      {activities.map((activity, index) => (
        <View key={index} style={styles.activityItem}>
          <Avatar.Icon 
            size={40} 
            icon={getIcon(activity.type)}
            style={{ backgroundColor: activity.color }}
          />
          <View style={styles.activityContent}>
            <Text variant="bodyLarge">{activity.title}</Text>
            <Text variant="bodySmall" style={styles.locationText}>{activity.location}</Text>
          </View>
          <Text variant="bodySmall" style={styles.timeText}>{activity.time}</Text>
        </View>
      ))}
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  title: {
    marginBottom: 16,
    color: '#1f2937',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  activityContent: {
    flex: 1,
    marginLeft: 12,
  },
  locationText: {
    color: '#6b7280',
    marginTop: 2,
  },
  timeText: {
    color: '#6b7280',
  },
});

export default RecentActivities;
