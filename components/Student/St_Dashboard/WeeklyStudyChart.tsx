import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { ActivityIndicator, Button, Surface, Text } from 'react-native-paper';
import { RootStackParamList } from '../../../types/navigation';

interface WeeklyStudyChartProps {
  data: number[];
  studentId: string | null;
  isLoading?: boolean;
}

type NavigationProp = StackNavigationProp<RootStackParamList>;

const WeeklyStudyChart: React.FC<WeeklyStudyChartProps> = ({ data, studentId, isLoading = false }) => {
  const navigation = useNavigation<NavigationProp>();

  const chartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      data,
    }],
  };

  const handleViewAllPress = () => {
    if (studentId) {
      // Navigate to the attendance details screen
      navigation.navigate('AttendanceDetails', { studentId });
    }
  };

  return (
    <Surface style={styles.container}>
      <View style={styles.headerContainer}>
        <Text variant="titleMedium" style={styles.title}>Weekly Study Hours</Text>
        <Button
          mode="text"
          onPress={handleViewAllPress}
          disabled={!studentId || isLoading}
          style={styles.viewAllButton}
          labelStyle={styles.viewAllButtonLabel}
          icon={({size, color}) => (
            <MaterialCommunityIcons name="calendar-clock" size={size} color={color} />
          )}
        >
          View All
        </Button>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6200ee" />
          <Text style={styles.loadingText}>Loading study data...</Text>
        </View>
      ) : (
        <BarChart
          data={chartData}
          width={Dimensions.get('window').width - 48}
          height={220}
          yAxisLabel=""
          yAxisSuffix=" hrs"
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 1,
            color: (opacity = 1) => `rgba(98, 0, 238, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForBackgroundLines: {
              strokeWidth: 1,
              stroke: '#e5e7eb',
            },
            propsForLabels: {
              fontSize: 12,
            },
          }}
          style={styles.chart}
          showValuesOnTopOfBars={true}
          fromZero={true}
        />
      )}
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
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    color: '#1f2937',
  },
  viewAllButton: {
    marginRight: -8,
  },
  viewAllButtonLabel: {
    fontSize: 12,
    color: '#6200ee',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  loadingContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
    fontSize: 14,
  },
});

export default WeeklyStudyChart;
