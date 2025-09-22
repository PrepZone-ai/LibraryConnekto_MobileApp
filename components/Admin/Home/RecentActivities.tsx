import React from 'react';
import { ScrollView } from 'react-native';
import { Card, Text, useTheme, Surface } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';

interface Activity {
  id: number;
  type: 'registration' | 'system' | 'admin' | 'notification';
  time: string;
  desc: string;
}

interface RecentActivitiesProps {
  activities?: Activity[];
}

const defaultActivities: Activity[] = [
  {
    id: 1,
    type: 'registration',
    time: '10:45 AM',
    desc: 'New student Emily Panel registered'
  },
  {
    id: 2,
    type: 'system',
    time: '10:30 AM',
    desc: 'System maintenance completed'
  },
  {
    id: 3,
    type: 'admin',
    time: '10:15 AM',
    desc: 'Library hours updated for holidays'
  },
  {
    id: 4,
    type: 'notification',
    time: '10:00 AM',
    desc: 'New books added to collection'
  }
];

const getActivityIcon = (type: Activity['type']): keyof typeof MaterialIcons.glyphMap => {
  switch (type) {
    case 'registration':
      return 'person-add';
    case 'system':
      return 'settings-system-daydream';
    case 'admin':
      return 'admin-panel-settings';
    case 'notification':
      return 'notifications';
    default:
      return 'info';
  }
};

const getActivityColor = (type: Activity['type']): { bg: string; text: string } => {
  switch (type) {
    case 'registration':
      return { bg: '#EBF5FF', text: '#2563EB' };
    case 'system':
      return { bg: '#F3E8FF', text: '#7C3AED' };
    case 'admin':
      return { bg: '#DCFCE7', text: '#16A34A' };
    case 'notification':
      return { bg: '#FEF3C7', text: '#D97706' };
    default:
      return { bg: '#F3F4F6', text: '#4B5563' };
  }
};

const RecentActivities: React.FC<RecentActivitiesProps> = ({ 
  activities = defaultActivities 
}) => {
  const theme = useTheme();

  return (
    <Card style={{ margin: 16, padding: 16 }}>
      <Text variant="titleLarge" style={{ marginBottom: 16 }}>Recent Activities</Text>
      {activities.map((activity) => {
        const iconName = getActivityIcon(activity.type);
        const colors = getActivityColor(activity.type);
        
        return (
          <Surface
            key={activity.id}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 16,
              padding: 8,
              borderRadius: 8,
            }}
          >
            <Surface
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.bg,
                alignItems: 'center',
                justifyContent: 'center',
                elevation: 0,
              }}
            >
              <MaterialIcons name={iconName} size={20} color={colors.text} />
            </Surface>
            <Surface
              style={{
                marginLeft: 12,
                flex: 1,
                backgroundColor: 'transparent',
                elevation: 0,
              }}
            >
              <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
                {activity.desc}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {activity.time}
              </Text>
            </Surface>
          </Surface>
        );
      })}
    </Card>
  );
};

export default RecentActivities;
