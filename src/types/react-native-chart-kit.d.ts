declare module 'react-native-chart-kit' {
  import { ViewStyle } from 'react-native';

  interface Dataset {
    data: number[];
    color?: string | ((opacity: number) => string);
    strokeWidth?: number;
  }

  interface ChartData {
    labels: string[];
    datasets: Dataset[];
  }

  interface ChartConfig {
    backgroundColor?: string;
    backgroundGradientFrom?: string;
    backgroundGradientTo?: string;
    decimalPlaces?: number;
    color?: (opacity: number) => string;
    labelColor?: (opacity: number) => string;
    style?: ViewStyle;
    propsForDots?: {
      r: string;
      strokeWidth: string;
      stroke: string;
    };
  }

  interface AbstractChartProps {
    width: number;
    height: number;
    chartConfig: ChartConfig;
    style?: ViewStyle;
  }

  interface LineChartProps extends AbstractChartProps {
    data: ChartData;
    bezier?: boolean;
  }

  interface BarChartProps extends AbstractChartProps {
    data: ChartData;
    yAxisLabel?: string;
    yAxisSuffix: string;
    showValuesOnTopOfBars?: boolean;
    fromZero?: boolean;
  }

  interface PieChartProps extends AbstractChartProps {
    data: Array<{
      name: string;
      population: number;
      color: string;
      legendFontColor: string;
      legendFontSize: number;
    }>;
    accessor: string;
    backgroundColor: string;
    paddingLeft: string;
  }

  export class LineChart extends React.Component<LineChartProps> {}
  export class BarChart extends React.Component<BarChartProps> {}
  export class PieChart extends React.Component<PieChartProps> {}
}
