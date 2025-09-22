import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Surface, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface DashboardCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  backgroundColor: string;
  textColor?: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  backgroundColor,
  textColor = '#ffffff'
}) => {
  return (
    <Surface style={[styles.container, { backgroundColor }]} elevation={2}>
      <View style={styles.content}>
        <MaterialCommunityIcons 
          name={icon} 
          size={24} 
          color={textColor} 
          style={styles.icon} 
        />
        <View style={styles.textContainer}>
          <Text style={[styles.value, { color: textColor }]}>{value}</Text>
          <Text style={[styles.subtitle, { color: textColor }]}>{subtitle}</Text>
        </View>
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 8,
    borderRadius: 12,
    minHeight: 100,
    maxWidth: '47%',
  },
  content: {
    padding: 16,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginBottom: 8,
  },
  textContainer: {
    alignItems: 'center',
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    opacity: 0.9,
    textAlign: 'center',
  },
});

export default DashboardCard;
