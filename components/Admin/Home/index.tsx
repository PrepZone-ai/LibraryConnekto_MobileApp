import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import Header from '../../common/Header';
import Facilities from './Facilities';
import PendingRequestsFixed from './PendingRequestsFixed';
import QuickActions from './QuickActions';
import QuickStats from './QuickStats';
import RecentActivities from './RecentActivities';
import Statistics from './Statistics';
import StudySpace from './StudySpace';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6'
  },
  content: {
    flexGrow: 1,
    paddingBottom: 80 // Add padding for bottom navigation
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingHorizontal: 16,
    marginTop: 16
  }
});

const Home: React.FC = () => {
  const stats: Array<{
    id: number;
    title: string;
    count: string;
    icon: keyof typeof MaterialIcons.glyphMap;
    trend: string;
  }> = [
    { id: 1, title: 'Total Students', count: '2,456', icon: 'people', trend: '+12%' },
    { id: 2, title: 'Active Today', count: '1,873', icon: 'trending-up', trend: '76%' },
    { id: 3, title: 'New Joined', count: '245', icon: 'person-add', trend: '82%' },
    { id: 4, title: 'Total Books', count: '2,180', icon: 'library-books', trend: '89%' }
  ];

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <StudySpace />
        <Text style={styles.sectionTitle}>
          Quick Stats
        </Text>
        <QuickStats stats={stats} />
        <QuickActions />
        <PendingRequestsFixed />
        <Statistics />
        <Facilities facilities={[
          {
            id: 1,
            title: "Study Rooms",
            items: ["4 Individual Rooms", "2 Group Rooms", "Quiet Zones"],
            icon: "meeting-room",
            colors: {
              from: "#e0f2fe",
              to: "#bae6fd",
              iconBg: "#bae6fd",
              iconColor: "#0284c7",
              border: "#7dd3fc"
            }
          },
          {
            id: 2,
            title: "Resources",
            items: ["E-books", "Online Journals", "Digital Archives"],
            icon: "computer",
            colors: {
              from: "#fef3c7",
              to: "#fde68a",
              iconBg: "#fde68a",
              iconColor: "#d97706",
              border: "#fcd34d"
            }
          },
          {
            id: 3,
            title: "Print Services",
            items: ["Color Printing", "Scanning", "Photocopying"],
            icon: "print",
            colors: {
              from: "#dcfce7",
              to: "#bbf7d0",
              iconBg: "#bbf7d0",
              iconColor: "#16a34a",
              border: "#86efac"
            }
          },
          {
            id: 4,
            title: "Special Collections",
            items: ["Rare Books", "Manuscripts", "Local History"],
            icon: "auto-stories",
            colors: {
              from: "#fae8ff",
              to: "#f5d0fe",
              iconBg: "#f5d0fe",
              iconColor: "#a21caf",
              border: "#e879f9"
            }
          }
        ]} />
        <RecentActivities />
      </ScrollView>
    </View>
  );
};

export default Home;
