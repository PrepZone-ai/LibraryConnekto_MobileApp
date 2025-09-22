import React from "react";
import { View, Dimensions } from "react-native";
import { BarChart, LineChart } from "react-native-chart-kit";
import { Card, Text } from "react-native-paper";

interface StatisticsProps {
  studyData?: { x: string; y: number }[];
  registrationData?: { x: string; y: number }[];
}

const defaultStudyData = [
  { x: "Jan", y: 7 },
  { x: "Feb", y: 8 },
  { x: "Mar", y: 9 },
  { x: "Apr", y: 10 },
  { x: "May", y: 10 },
  { x: "Jun", y: 12 },
];

const defaultRegistrationData = [
  { x: "Jan", y: 1800 },
  { x: "Feb", y: 1950 },
  { x: "Mar", y: 2100 },
  { x: "Apr", y: 2250 },
  { x: "May", y: 2350 },
  { x: "Jun", y: 2456 },
];

const Statistics: React.FC<StatisticsProps> = ({
  studyData = defaultStudyData,
  registrationData = defaultRegistrationData,
}) => {
  const screenWidth = Dimensions.get("window").width - 32;

  const chartConfig = {
    backgroundGradientFrom: "#fff",
    backgroundGradientTo: "#fff",
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    style: {
      borderRadius: 16,
    },
    propsForLabels: {
      fontSize: 12,
    },
  };

  return (
    <View style={{ marginTop: 24, paddingHorizontal: 16 }}>
      <Text variant="titleMedium" style={{ fontWeight: "bold", marginBottom: 12 }}>
        Statistics
      </Text>

      <Card style={{ marginBottom: 16, padding: 16 }} mode="outlined">
        <Text variant="titleSmall" style={{ marginBottom: 8 }}>
          Average Study Hours
        </Text>
        <LineChart
          data={{
            labels: studyData.map((d) => d.x),
            datasets: [
              {
                data: studyData.map((d) => d.y),
              },
            ],
          }}
          width={screenWidth - 32}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={{
            marginVertical: 8,
            borderRadius: 16,
          }}
          yAxisLabel=""
          yAxisSuffix="h"
        />
      </Card>

      <Card style={{ marginBottom: 16, padding: 16 }} mode="outlined">
        <Text variant="titleSmall" style={{ marginBottom: 8 }}>
          Student Registrations
        </Text>
        <BarChart
          data={{
            labels: registrationData.map((d) => d.x),
            datasets: [
              {
                data: registrationData.map((d) => d.y),
              },
            ],
          }}
          width={screenWidth - 32}
          height={220}
          chartConfig={chartConfig}
          style={{
            marginVertical: 8,
            borderRadius: 16,
          }}
          yAxisLabel=""
          yAxisSuffix=""
          showValuesOnTopOfBars
        />
      </Card>
    </View>
  );
};

export default Statistics;