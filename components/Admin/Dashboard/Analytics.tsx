import React, { useState, useEffect } from 'react';
import { View, ScrollView, Dimensions, StyleSheet } from 'react-native';
import { Text, Card, SegmentedButtons, ActivityIndicator } from 'react-native-paper';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { adminAPI, DashboardAnalytics, AttendanceTrend, RevenueTrend } from '../../../config/api';
import Header from '../../common/Header';

const screenWidth = Dimensions.get('window').width;

type TimePeriod = 'day' | 'week' | 'month' | 'year';

const Analytics: React.FC = () => {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('week');
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardAnalytics | null>(null);
  const [attendanceData, setAttendanceData] = useState<AttendanceTrend[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueTrend[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [dashboardResponse, attendanceResponse, revenueResponse] = await Promise.all([
          adminAPI.getDashboardAnalytics(),
          adminAPI.getAttendanceTrends(30),
          adminAPI.getRevenueTrends(12)
        ]);

        if (dashboardResponse && typeof dashboardResponse === 'object') {
          setDashboardData(dashboardResponse as DashboardAnalytics);
        }
        if (Array.isArray(attendanceResponse)) {
          setAttendanceData(attendanceResponse as AttendanceTrend[]);
        }
        if (Array.isArray(revenueResponse)) {
          setRevenueData(revenueResponse as RevenueTrend[]);
        }
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Function to get data based on selected time period
  const getDataForPeriod = (period: TimePeriod) => {
    if (!attendanceData || attendanceData.length === 0) {
      // Fallback data if API data is not available
      switch (period) {
        case 'day':
          return {
            labels: ['9AM', '11AM', '1PM', '3PM', '5PM', '7PM'],
            datasets: [{ data: [65, 75, 85, 80, 70, 60] }]
          };
        case 'week':
          return {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{ data: [85, 78, 90, 82, 88, 70, 75] }]
          };
        case 'month':
          return {
            labels: ['W1', 'W2', 'W3', 'W4'],
            datasets: [{ data: [82, 85, 88, 80] }]
          };
        case 'year':
          return {
            labels: ['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov'],
            datasets: [{ data: [75, 80, 85, 88, 82, 78] }]
          };
      }
    }

    // Use real API data
    const labels = attendanceData.map(item => {
      const date = new Date(item.date);
      switch (period) {
        case 'day':
          return date.toLocaleTimeString([], { hour: '2-digit' });
        case 'week':
          return date.toLocaleDateString([], { weekday: 'short' });
        case 'month':
          return `W${Math.ceil(date.getDate() / 7)}`;
        case 'year':
          return date.toLocaleDateString([], { month: 'short' });
        default:
          return date.toLocaleDateString();
      }
    });

    const data = attendanceData.map(item => item.count);

    return {
      labels: labels.slice(0, 7), // Limit to 7 data points for better visualization
      datasets: [{ data: data.slice(0, 7) }]
    };
  };

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
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
    propsForVerticalLabels: {
      fontSize: 12,
    },
    propsForHorizontalLabels: {
      fontSize: 12,
    },
    propsForGrid: {
      strokeWidth: 1,
      stroke: '#e5e7eb',
    },
    propsForAxes: {
      strokeWidth: 1,
      stroke: '#e5e7eb',
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#2196F3',
      onStartShouldSetResponder: () => false,
      onResponderGrant: () => false,
      onResponderRelease: () => false,
    }
  };

  const seatOccupancyData = {
    labels: timePeriod === 'day' ? ['Morning', 'Afternoon', 'Evening'] :
           timePeriod === 'week' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] :
           timePeriod === 'month' ? ['W1', 'W2', 'W3', 'W4'] :
           ['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov'],
    datasets: [{
      data: timePeriod === 'day' ? [65, 80, 70] :
            timePeriod === 'week' ? [75, 82, 88, 70, 78] :
            timePeriod === 'month' ? [80, 85, 82, 78] :
            [70, 75, 85, 88, 82, 75]
    }]
  };

  const subscriptionData = [
    {
      name: 'Monthly',
      population: 45,
      color: '#2196F3',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12
    },
    {
      name: 'Quarterly',
      population: 30,
      color: '#4CAF50',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12
    },
    {
      name: 'Yearly',
      population: 25,
      color: '#FFC107',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12
    }
  ];

  return (
    <View style={styles.container}>
      <Header
        title="Analytics"
        showWelcome={false}
        autoBackButton={true}
      />
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.periodSelector}>
          <SegmentedButtons
            value={timePeriod}
            onValueChange={value => setTimePeriod(value as TimePeriod)}
            buttons={[
              { value: 'day', label: 'Day' },
              { value: 'week', label: 'Week' },
              { value: 'month', label: 'Month' },
              { value: 'year', label: 'Year' },
            ]}
          />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366F1" />
            <Text style={styles.loadingText}>Loading analytics...</Text>
          </View>
        ) : (
          <View style={styles.cardsContainer}>
            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleMedium">Total Students</Text>
                <Text variant="displaySmall">{dashboardData?.library_stats.total_students || 0}</Text>
              </Card.Content>
            </Card>

            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleMedium">Present Students</Text>
                <Text variant="displaySmall">{dashboardData?.library_stats.present_students || 0}</Text>
              </Card.Content>
            </Card>

            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleMedium">Seat Utilization</Text>
                <Text variant="displaySmall">
                  {dashboardData?.library_stats.total_seats
                    ? Math.round(((dashboardData.library_stats.total_seats - dashboardData.library_stats.available_seats) / dashboardData.library_stats.total_seats) * 100)
                    : 0}%
                </Text>
              </Card.Content>
            </Card>
          </View>
        )}

        {!loading && (
          <View style={styles.chartContainer}>
            <Text variant="titleLarge" style={styles.chartTitle}>Attendance Trends</Text>
            <LineChart
              data={getDataForPeriod(timePeriod)}
              width={screenWidth - 32}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </View>
        )}

        {!loading && (
          <View style={styles.chartContainer}>
            <Text variant="titleLarge" style={styles.chartTitle}>Seat Occupancy</Text>
            <BarChart
              data={seatOccupancyData}
              width={screenWidth - 32}
              height={220}
              yAxisLabel=""
              yAxisSuffix="%"
              chartConfig={chartConfig}
              style={styles.chart}
              showValuesOnTopOfBars={true}
              fromZero={true}
            />
          </View>
        )}

        {!loading && (
          <View style={[styles.chartContainer, styles.lastChart]}>
            <Text variant="titleLarge" style={styles.chartTitle}>Revenue Overview</Text>
            <PieChart
              data={subscriptionData}
              width={screenWidth - 32}
              height={220}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              style={styles.chart}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  scrollView: {
    flex: 1
  },
  periodSelector: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8
  },
  cardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff'
  },
  card: {
    width: '31%',
    elevation: 2
  },
  chartContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 8
  },
  chartTitle: {
    marginBottom: 16,
    color: '#1976D2'
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16
  },
  lastChart: {
    marginBottom: 16
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff'
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280'
  }
});

export default Analytics;
