import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { ReactNode } from 'react';
import { View } from 'react-native';
import { IconButton, Surface, Text, useTheme, Button } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  title?: string;
  username?: string;
  showWelcome?: boolean;
  onProfilePress?: () => void;
  onNotificationPress?: () => void;
  navigation?: NativeStackNavigationProp<any>;
  adminName?: string;
  rightComponent?: ReactNode;
  showBackButton?: boolean;
  onBackPress?: () => void;
  libraryName?: string;
  isAdminPage?: boolean;
  autoBackButton?: boolean; // New prop to automatically show back button
  hideBackButton?: boolean; // New prop to explicitly hide back button
  showBookSeatButton?: boolean; // New prop to show book seat button
  onBookSeatPress?: () => void; // New prop for book seat action
}

const Header: React.FC<HeaderProps> = ({
  title = "LibraryConneckto",
  username,
  showWelcome = true,
  onProfilePress,
  onNotificationPress,
  navigation,
  adminName,
  rightComponent,
  showBackButton = false,
  onBackPress,
  libraryName,
  isAdminPage = false,
  autoBackButton = true,
  hideBackButton = false,
  showBookSeatButton = false,
  onBookSeatPress
}) => {
  const theme = useTheme();
  const { isLoggedIn } = useAuth();
  const currentNavigation = useNavigation();


  // Get navigation state to determine if we can go back
  const navigationState = useNavigationState(state => state);
  const canGoBack = currentNavigation.canGoBack();

  // Determine if back button should be shown
  const shouldShowBackButton = !hideBackButton && (
    showBackButton ||
    (autoBackButton && canGoBack && !isHomePage())
  );

  // Function to determine if current page is a home/main page
  function isHomePage(): boolean {
    const routeName = navigationState?.routes[navigationState.index]?.name;
    const homeRoutes = [
      'UseRole',
      'StudentHome',
      'AdminDashboard',
      'MainDashboard',
      'StudentHomeTab',
      'Home',
      'Dashboard'
    ];
    return homeRoutes.includes(routeName || '');
  }

  // Function to get dynamic page title based on current route
  function getDynamicPageTitle(): string {
    const routeName = navigationState?.routes[navigationState.index]?.name;
    const pageTitleMap: { [key: string]: string } = {
      'Analytics': 'Admin Analytics',
      'StudentManagement': 'Student Management',
      'SeatManagementNew': 'Seat Management',
      'StudentAttendance': 'Student Attendance',
      'BookSeat': 'Book Seat',
      'StudentProfile': 'Student Profile',
      'StudentHome': 'Student Home',
      'AdminDashboard': 'Admin Dashboard',
      'StudentHomeTab': 'Student Home',
    };
    
    return pageTitleMap[routeName || ''] || title;
  }

  const displayTitle = isAdminPage && libraryName ? libraryName : getDynamicPageTitle();

  const handleProfilePress = () => {
    if (navigation) {
      navigation.navigate('StudentHome', {
        screen: 'StudentProfileTab'
      });
    } else if (onProfilePress) {
      onProfilePress();
    }
  };

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else if (currentNavigation.canGoBack()) {
      currentNavigation.goBack();
    }
  };

  const handleBookSeatPress = () => {
    if (onBookSeatPress) {
      onBookSeatPress();
    } else if (currentNavigation) {
      // Navigate to BookSeat screen
      (currentNavigation as any).navigate('BookSeat');
    }
  };

  return (
    <Surface style={{ elevation: 5 }}>
      <LinearGradient
        colors={['#1E3A8A', '#2563EB']} // Deep blue gradient
        style={{
          height: showWelcome ? 100 : 80, // Adjust height based on welcome message
          justifyContent: 'center',
          paddingTop: 10,
          paddingHorizontal: 16,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: showWelcome ? 8 : 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            {shouldShowBackButton && (
              <IconButton
                icon="arrow-left"
                iconColor="white"
                size={24}
                onPress={handleBackPress}
                style={{ marginRight: 8, marginLeft: -8 }}
              />
            )}
            <Text variant="titleLarge" style={{ color: 'white', flex: 1 }} numberOfLines={1}>
              {displayTitle}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {rightComponent}
            {showBookSeatButton && (
              <Button
                mode="contained"
                onPress={handleBookSeatPress}
                icon="seat"
                buttonColor="rgba(255, 255, 255, 0.2)"
                textColor="white"
                style={{ 
                  marginRight: 8,
                  borderRadius: 20,
                  height: 36
                }}
                labelStyle={{ fontSize: 12 }}
                compact
              >
                Book Seat
              </Button>
            )}
            {onNotificationPress && (
              <IconButton
                icon="bell"
                iconColor="white"
                size={24}
                onPress={onNotificationPress}
              />
            )}
            {onProfilePress && (
              <IconButton
                icon="account-circle"
                iconColor="white"
                size={24}
                onPress={handleProfilePress}
              />
            )}
          </View>
        </View>
        {showWelcome && (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text variant="titleMedium" style={{ color: 'white', opacity: 0.9, flex: 1 }}>
              {isLoggedIn && (username || adminName) ? `Welcome, ${username || adminName}` : username ? `Hello, ${username}` : ''}
            </Text>
            {showBookSeatButton && (
              <Button
                mode="text"
                onPress={handleBookSeatPress}
                textColor="white"
                style={{ marginLeft: 8 }}
                labelStyle={{ fontSize: 12 }}
                compact
              >
                Book Your Seat
              </Button>
            )}
          </View>
        )}
      </LinearGradient>
    </Surface>
  );
};

export default Header;
