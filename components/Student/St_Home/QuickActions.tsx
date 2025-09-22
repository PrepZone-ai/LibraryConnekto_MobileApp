import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Surface, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

// Define the navigation routes
type RootStackParamList = {
  BookSeat: undefined;
  StudentChatTab: undefined;
  Schedule: undefined;
  Exams: undefined;
  StudentProfileTab: undefined;
  FindLibrary: undefined;
  Resources: undefined;
  StudentDashboardTab: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface QuickActionsProps {
  isLoggedIn: boolean;
  onLoginPress: () => void;
}

type ActionIcon = 'seat' | 'map-marker' | 'chat' | 'book' | 'view-dashboard';

interface Action {
  icon: ActionIcon;
  label: string;
  color: string;
  highlight: boolean;
  gradientColors?: string[];
  route?: keyof RootStackParamList;
}

const QuickActions: React.FC<QuickActionsProps> = ({ isLoggedIn, onLoginPress }) => {
  const navigation = useNavigation<NavigationProp>();

  const publicRoutes = ['BookSeat', 'FindLibrary'];

  const handleActionPress = (action: Action) => {
    if (action.route) {
      if (publicRoutes.includes(action.route)) {
        navigation.navigate(action.route);
      } else if (!isLoggedIn) {
        onLoginPress();
      } else {
        navigation.navigate(action.route);
      }
    }
  };

  const actions: Action[] = [
    {
      icon: 'seat',
      label: 'Book Seat',
      color: '#4f46e5',
      highlight: true,
      gradientColors: ['#4f46e5', '#6366f1'],
      route: 'BookSeat',
    },
    {
      icon: 'map-marker',
      label: 'Find Library',
      color: '#10b981',
      highlight: false,
      route: 'FindLibrary',
    },
    {
      icon: 'chat',
      label: 'Chat',
      color: '#f59e0b',
      highlight: false,
      route: 'StudentChatTab',
    },
    {
      icon: 'view-dashboard',
      label: 'Dashboard',
      color: '#3b82f6',
      highlight: false,
      route: 'StudentDashboardTab',
    },
  ];

  return (
    <View style={styles.actionsContainer}>
      {actions.map((action, index) => (
        <TouchableOpacity 
          key={index} 
          style={[
            styles.actionButton,
            action.highlight && styles.highlightedButton
          ]}
          onPress={() => handleActionPress(action)}
        >
          <Surface 
            style={[
              styles.actionIcon, 
              { backgroundColor: action.highlight ? '#6366f1' : action.color }
            ]}
          >
            <MaterialCommunityIcons 
              name={action.icon} 
              size={24} 
              color="white" 
            />
          </Surface>
          <Text style={[
            styles.actionLabel,
            action.highlight && styles.highlightedLabel
          ]}>
            {action.label}
          </Text>
          {action.highlight && (
            <Surface style={styles.highlightBadge}>
              <Text style={styles.highlightBadgeText}>Featured</Text>
            </Surface>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  actionButton: {
    alignItems: 'center',
    width: '45%',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 12,
    position: 'relative',
    elevation: 2,
  },
  highlightedButton: {
    backgroundColor: '#4f46e5',
    elevation: 4,
  },
  actionIcon: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  actionLabel: {
    color: '#4b5563',
    fontSize: 14,
    fontWeight: '500',
  },
  highlightedLabel: {
    color: 'white',
  },
  highlightBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  highlightBadgeText: {
    color: '#d97706',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default QuickActions;