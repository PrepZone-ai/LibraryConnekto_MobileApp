import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface StatItem {
  id: number;
  title: string;
  count: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  trend: string;
}

interface QuickStatsProps {
  stats: StatItem[];
}

const colorGradients: readonly [string, string][] = [
  ['#FF6F61', '#DE4D4D'],
  ['#29B6F6', '#0277BD'],
  ['#66BB6A', '#2E7D32'],
  ['#FFA726', '#EF6C00'],
  ['#AB47BC', '#6A1B9A'],
] as const;

const QuickStats: React.FC<QuickStatsProps> = ({ stats }) => {
  const theme = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
      }}
    >
      {stats.map((stat, index) => (
        <Card
          key={stat.id}
          style={{
            marginRight: 16,
            width: 170,
            borderRadius: 12,
            overflow: 'hidden',
            elevation: 4,
            backgroundColor: theme.colors.surfaceVariant,
          }}
        >
          <LinearGradient
            colors={colorGradients[index % colorGradients.length]}
            style={styles.gradientContainer}
          >
            <MaterialIcons name={stat.icon} size={28} color="#fff" />
          </LinearGradient>

          <Card.Content style={{ paddingVertical: 12 }}>
            <Text
              variant="labelSmall"
              style={{
                color: stat.trend.includes('↑') ? '#4CAF50' : '#F44336',
                marginBottom: 6,
                fontWeight: 'bold',
              }}
            >
              {stat.trend}
            </Text>

            <Text
              variant="headlineMedium"
              style={{
                marginBottom: 6,
                color: theme.colors.onSurface,
                fontWeight: 'bold',
                textAlign: 'center',
              }}
            >
              {stat.count}
            </Text>

            <Text
              variant="bodyMedium"
              style={{
                color: theme.colors.onSurfaceVariant,
                textAlign: 'center',
              }}
            >
              {stat.title}
            </Text>
          </Card.Content>
        </Card>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  gradientContainer: {
    padding: 12,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    alignItems: 'center',
  },
});

export default QuickStats;
