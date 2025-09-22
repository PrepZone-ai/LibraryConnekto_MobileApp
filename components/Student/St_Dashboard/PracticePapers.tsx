import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Surface, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const PracticePapers: React.FC = () => {
  return (
    <Surface style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Past 10 Years Practice Papers</Text>
        <Text style={styles.comingSoon}>Coming Soon</Text>
      </View>
      
      <View style={styles.content}>
        <MaterialCommunityIcons 
          name="clock-outline" 
          size={48} 
          color="#6b7280" 
        />
        <Text style={styles.stayTuned}>Stay Tuned!</Text>
        <Text style={styles.description}>
          We're preparing comprehensive practice papers for you
        </Text>
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'white',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  comingSoon: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '500',
  },
  content: {
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    padding: 24,
    borderRadius: 8,
  },
  stayTuned: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4b5563',
    marginTop: 16,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});

export default PracticePapers;
