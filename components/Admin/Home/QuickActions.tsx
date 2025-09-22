import React from 'react';
import { View } from 'react-native';
import { Card, Text, TouchableRipple } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';

interface ActionItem {
  id: number;
  title: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
  bgColor: string;
}

interface QuickActionsProps {
  actions?: ActionItem[];
  onActionPress?: (action: ActionItem) => void;
}

const defaultActions: ActionItem[] = [
  {
    id: 1,
    title: 'Analytics',
    icon: 'analytics',
    color: '#7e22ce',
    bgColor: '#f3e8ff'
  },
  {
    id: 2,
    title: 'Schedule',
    icon: 'event',
    color: '#1d4ed8',
    bgColor: '#dbeafe'
  },
  {
    id: 3,
    title: 'Tasks',
    icon: 'assignment',
    color: '#047857',
    bgColor: '#d1fae5'
  },
  {
    id: 4,
    title: 'Settings',
    icon: 'settings',
    color: '#c2410c',
    bgColor: '#ffedd5'
  }
];

const QuickActions: React.FC<QuickActionsProps> = ({ 
  actions = defaultActions,
  onActionPress = () => {} 
}) => {
  return (
    <View style={{ marginTop: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12, paddingHorizontal: 16 }}>
        Quick Access
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16 }}>
        {actions.map((action) => (
          <TouchableRipple
            key={action.id}
            onPress={() => onActionPress(action)}
            rippleColor="rgba(0, 0, 0, 0.1)"
            style={{ width: '50%', padding: 8 }}
          >
            <Card style={{ backgroundColor: action.bgColor, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View>
                <Text style={{ color: action.color, fontWeight: '500' }}>{action.title}</Text>
                <Text style={{ color: action.color, opacity: 0.75, fontSize: 12, marginTop: 4 }}>View Details</Text>
              </View>
              <MaterialIcons name={action.icon} size={24} color={action.color} />
            </Card>
          </TouchableRipple>
        ))}
      </View>
    </View>
  );
};

export default QuickActions;