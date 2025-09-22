import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Chip, Surface, Text } from 'react-native-paper';

interface Activity {
  id: number;
  type: string;
  name: string;
  details: string;
  time: string;
  status: 'completed' | 'pending' | 'cancelled';
}

interface RecentActivityProps {
  activities: Activity[];
}

const getStatusColor = (status: Activity['status']) => {
  switch (status) {
    case 'completed':
      return '#10B981';
    case 'pending':
      return '#F59E0B';
    case 'cancelled':
      return '#EF4444';
    default:
      return '#6B7280';
  }
};

const getActivityIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'check in':
      return 'login';
    case 'check out':
      return 'logout';
    case 'new registration':
      return 'account-plus';
    case 'payment':
      return 'cash';
    case 'subscription update':
      return 'calendar-clock';
    case 'seat booking':
      return 'seat';
    case 'active':
      return 'account-check';
    case 'expired':
      return 'account-cancel';
    default:
      return 'information';
  }
};

const RecentActivity: React.FC<RecentActivityProps> = ({ activities }) => {
  const [expanded, setExpanded] = useState<number | null>(null);

  const toggleExpand = (id: number) => {
    setExpanded(expanded === id ? null : id);
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return 'Unknown time';

    try {
      const date = new Date(timeString);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }

      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 60) {
        return diffMins <= 1 ? 'Just now' : `${diffMins} mins ago`;
      } else if (diffHours < 24) {
        return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
      } else if (diffDays < 7) {
        return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
      } else {
        return date.toLocaleDateString();
      }
    } catch (e) {
      console.error('Error formatting time:', e, timeString);
      return 'Unknown time';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Recent Activity</Text>
        <Text style={styles.subtitle}>{activities?.length || 0} activities</Text>
      </View>
      <Surface style={styles.activityList} elevation={1}>
        {activities && activities.length > 0 ? (
          activities.map((activity) => (
            <View key={activity.id}>
              <View
                style={[styles.activityItem, expanded === activity.id && styles.expandedItem]}
                onTouchEnd={() => toggleExpand(activity.id)}
              >
                <View style={[styles.iconContainer, { backgroundColor: `${getStatusColor(activity.status)}15` }]}>
                  <MaterialCommunityIcons
                    name={getActivityIcon(activity.type)}
                    size={24}
                    color={getStatusColor(activity.status)}
                  />
                </View>
                <View style={styles.activityContent}>
                  <View style={styles.activityHeader}>
                    <Text style={styles.activityType}>{activity.type}</Text>
                    <Text style={styles.activityTime}>{formatTime(activity.time)}</Text>
                  </View>
                  <Text style={styles.activityName}>{activity.name}</Text>
                  {expanded === activity.id && (
                    <Text style={styles.activityDetails}>{activity.details}</Text>
                  )}
                  <View style={styles.activityFooter}>
                    <MaterialCommunityIcons
                      name={expanded === activity.id ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color="#6B7280"
                    />
                    <Chip
                      style={[
                        styles.statusChip,
                        { backgroundColor: `${getStatusColor(activity.status)}20` }
                      ]}
                      textStyle={{
                        color: getStatusColor(activity.status),
                        fontSize: 12
                      }}
                    >
                      {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                    </Chip>
                  </View>
                </View>
              </View>
              {activity.id !== activities[activities.length - 1].id && (
                <View style={styles.divider} />
              )}
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="history" size={24} color="#9CA3AF" />
            <Text style={styles.emptyText}>No recent activities</Text>
          </View>
        )}
      </Surface>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  activityList: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
  },
  activityItem: {
    flexDirection: 'row',
    padding: 16,
  },
  expandedItem: {
    backgroundColor: '#F9FAFB',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginLeft: 68,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  activityType: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  activityTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  activityName: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  activityFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  activityDetails: {
    fontSize: 12,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
    marginBottom: 8,
  },
  statusChip: {
    height: 24,
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: '#9CA3AF',
  },
});

export default RecentActivity;
