import React from 'react';
import { StyleSheet } from 'react-native';
import { BottomNavigation as PaperBottomNavigation } from 'react-native-paper';
import { AdminTabParamList } from '../../types/navigation';

interface BottomNavigationProps {
  activeTab: keyof AdminTabParamList;
  onTabChange: (tab: keyof AdminTabParamList) => void;
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: 'white',
    elevation: 8,
    height: 64,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0'
  }
});

const routes = [
  { 
    key: 'home',
    title: 'Home',
    focusedIcon: 'home',
    unfocusedIcon: 'home-outline'
  },
  { 
    key: 'dashboard',
    title: 'Dashboard',
    focusedIcon: 'view-dashboard',
    unfocusedIcon: 'view-dashboard-outline'
  },
  { 
    key: 'chat',
    title: 'Chat',
    focusedIcon: 'chat',
    unfocusedIcon: 'chat-outline'
  },
  { 
    key: 'profile',
    title: 'Profile',
    focusedIcon: 'account',
    unfocusedIcon: 'account-outline'
  }
];

const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab, onTabChange }) => {
  const handleIndexChange = (index: number) => {
    const newTab = routes[index].key as keyof AdminTabParamList;
    onTabChange(newTab);
  };

  const currentIndex = React.useMemo(() => 
    routes.findIndex(route => route.key === activeTab.toLowerCase()),
    [activeTab]
  );

  return (
    <PaperBottomNavigation
      navigationState={{ index: currentIndex, routes }}
      onIndexChange={handleIndexChange}
      renderScene={() => null}
      shifting={true}
      compact={true}
      barStyle={styles.bar}
      activeColor="#6200ee"
      inactiveColor="#757575"
      labeled={true}
    />
  );
};

export default BottomNavigation;
