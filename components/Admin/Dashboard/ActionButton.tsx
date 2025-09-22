import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Surface, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface ActionButtonProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  onPress: () => void;
  backgroundColor?: string;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  icon,
  label,
  onPress,
  backgroundColor = '#F3F4F6'
}) => {
  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Surface style={[styles.button, { backgroundColor }]} elevation={1}>
        <MaterialCommunityIcons name={icon} size={24} color="#374151" />
        <Text style={styles.label}>{label}</Text>
      </Surface>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: '45%',
    maxWidth: '45%',
    margin: 8,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
  },
  label: {
    marginTop: 8,
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
  },
});

export default ActionButton;
