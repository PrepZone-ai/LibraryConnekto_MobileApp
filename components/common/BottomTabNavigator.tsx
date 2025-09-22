import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';

interface TabItem {
  value: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  screen: string;
}

interface BottomTabNavigatorProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isAuthenticated?: boolean;
}

const BottomTabNavigator: React.FC<BottomTabNavigatorProps> = ({
  activeTab,
  onTabChange,
  isAuthenticated: propIsAuthenticated,
}) => {
  const navigation = useNavigation();
  const { isLoggedIn } = useAuth();

  // Use the prop if provided, otherwise use the context value
  const isAuthenticated = propIsAuthenticated !== undefined ? propIsAuthenticated : isLoggedIn;

  // Define the tabs based on authentication status
  const tabs: TabItem[] = isAuthenticated ? [
    // Authenticated tabs
    { value: 'home', icon: 'home', label: 'Home', screen: 'StudentHomeTab' },
    { value: 'dashboard', icon: 'view-dashboard', label: 'Dashboard', screen: 'StudentDashboardTab' },
    { value: 'chat', icon: 'chat', label: 'Chat', screen: 'StudentChatTab' },
    { value: 'profile', icon: 'account', label: 'Profile', screen: 'StudentProfileTab' },
  ] : [
    // Public tabs
    { value: 'home', icon: 'home', label: 'Home', screen: 'StudentHomeTab' },
    { value: 'findLibrary', icon: 'magnify', label: 'Find Library', screen: 'FindLibraryTab' },
    { value: 'bookSeat', icon: 'seat', label: 'Book Seat', screen: 'BookSeatTab' },
  ];

  const handleTabPress = async (tabValue: string, screen: string) => {
    if (!isAuthenticated && screen !== 'StudentHomeTab' && screen !== 'FindLibraryTab' && screen !== 'BookSeatTab') {
      Alert.alert(
        'Authentication Required',
        'Please log in to access this feature',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Login',
            onPress: () => {
              // Store the attempted tab for redirection after login
              AsyncStorage.setItem('lastAttemptedTab', screen);
              // Navigate to login
              navigation.navigate('StudentLogin');
            }
          }
        ]
      );
      return;
    }

    onTabChange(tabValue);
    // @ts-ignore - Navigation typing issue
    navigation.navigate(screen);
  };

  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.value}
          style={styles.tab}
          onPress={() => handleTabPress(tab.value, tab.screen)}
        >
          <MaterialCommunityIcons
            name={tab.icon}
            size={24}
            color={activeTab === tab.value ? '#6366f1' : '#9ca3af'}
          />
          <Text
            style={[
              styles.tabLabel,
              { color: activeTab === tab.value ? '#6366f1' : '#9ca3af' },
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
});

export default BottomTabNavigator;
