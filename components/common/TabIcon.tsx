import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleProp, ViewStyle } from 'react-native';

interface TabIconProps {
  name: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  size: number;
  style?: StyleProp<ViewStyle>;
}

const TabIcon = ({ name, color, size, style }: TabIconProps) => {
  return (
    <MaterialCommunityIcons
      name={name}
      size={size}
      color={color}
      style={style}
    />
  );
};

export default TabIcon;
