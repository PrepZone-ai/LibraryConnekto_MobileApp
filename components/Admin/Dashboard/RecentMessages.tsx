import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Surface, Text } from 'react-native-paper';
import { AdminStackParamList } from '../../../types/navigation';
import StudentMessages from './StudentMessages';

const RecentMessages: React.FC = () => {
  const navigation = useNavigation<NavigationProp<AdminStackParamList>>();

  const handleViewAll = () => {
    navigation.navigate('StudentMessages', { isRecentMessages: false });
  };

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.headerContainer}>
        <View>
          <Text style={styles.sectionTitle}>Messages from Students</Text>
          <Text style={styles.sectionSubtitle}>Recent messages from your students</Text>
        </View>
        <TouchableOpacity onPress={handleViewAll} style={styles.viewAllButton}>
          <Text style={styles.viewAllText}>View All</Text>
          <MaterialCommunityIcons name="chevron-right" size={16} color="#6366F1" />
        </TouchableOpacity>
      </View>
      <Surface style={styles.container}>
        <StudentMessages
          isRecentMessages={true}
          containerStyle={styles.messageContainer}
        />
      </Surface>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 0,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  viewAllText: {
    color: '#6366F1',
    fontWeight: '500',
    marginRight: 4,
    fontSize: 14,
  },
  container: {
    borderRadius: 8,
    elevation: 4, // Increased elevation for more prominence
    overflow: 'hidden',
    minHeight: 300, // Increased minimum height
    maxHeight: 400, // Increased maximum height
    borderLeftWidth: 4,
    borderLeftColor: '#6366F1', // Add a colored accent
    backgroundColor: 'white',
  },
  messageContainer: {
    backgroundColor: 'white',
    flex: 1,
    height: '100%',
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#6b7280',
    fontSize: 14,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 8,
    color: '#6b7280',
    fontSize: 14,
    textAlign: 'center',
  }
});

export default RecentMessages;
