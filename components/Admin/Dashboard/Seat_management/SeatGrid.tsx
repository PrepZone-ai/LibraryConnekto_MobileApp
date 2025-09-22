import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Chip, Surface, Text } from 'react-native-paper';
import { SeatData, SeatGridProps } from './types';

const SeatGrid: React.FC<SeatGridProps> = ({ seats, onSeatPress }) => {
  const renderSeat = (seat: SeatData) => {
    const isOccupied = seat.isOccupied;
    const student = seat.student;

    return (
      <TouchableOpacity
        key={seat.seatNumber}
        onPress={() => onSeatPress(seat)}
        style={styles.seatWrapper}
      >
        <Surface style={[
          styles.seat,
          isOccupied ? styles.occupiedSeat : styles.availableSeat
        ]}>
          <MaterialCommunityIcons
            name={isOccupied ? 'seat' : 'seat-outline'}
            size={24}
            color={isOccupied ? '#FFF' : '#FFF'}
          />
          <Text style={[
            styles.seatNumber,
            isOccupied ? styles.occupiedText : styles.availableText
          ]}>
            {seat.seatNumber}
          </Text>
          {isOccupied && student && (
            <>
              <Text style={styles.studentId} numberOfLines={1}>
                {student.student_id}
              </Text>
              <Chip
                style={[
                  styles.statusChip,
                  {
                    backgroundColor: student.subscription_status === 'Active'
                      ? '#E8F5E9'
                      : '#FFEBEE',
                    opacity: 0.9
                  }
                ]}
                textStyle={{
                  color: student.subscription_status === 'Active'
                    ? '#4CAF50'
                    : '#F44336',
                  fontSize: 8,
                  fontWeight: 'bold'
                }}
              >
                {student.subscription_status}
              </Chip>
            </>
          )}
        </Surface>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {seats.map((seat) => renderSeat(seat))}
      </View>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <Surface style={[styles.legendSeat, styles.availableSeat]}>
            <MaterialCommunityIcons name="seat-outline" size={20} color="#FFF" />
          </Surface>
          <Text>Available</Text>
        </View>
        <View style={styles.legendItem}>
          <Surface style={[styles.legendSeat, styles.occupiedSeat]}>
            <MaterialCommunityIcons name="seat" size={20} color="#FFF" />
          </Surface>
          <Text>Occupied</Text>
        </View>
        <View style={styles.legendItem}>
          <Chip
            style={[styles.legendChip, { backgroundColor: '#E8F5E9' }]}
            textStyle={{ color: '#4CAF50', fontSize: 10 }}
          >
            Active
          </Chip>
          <Text>Active Subscription</Text>
        </View>
        <View style={styles.legendItem}>
          <Chip
            style={[styles.legendChip, { backgroundColor: '#FFEBEE' }]}
            textStyle={{ color: '#F44336', fontSize: 10 }}
          >
            Expired
          </Chip>
          <Text>Expired Subscription</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  seatWrapper: {
    margin: 4,
  },
  seat: {
    width: 80,
    height: 80,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  availableSeat: {
    backgroundColor: '#FF5252',
  },
  occupiedSeat: {
    backgroundColor: '#4CAF50',
  },
  seatNumber: {
    fontSize: 12,
    marginTop: 4,
  },
  availableText: {
    color: '#FFF',
  },
  occupiedText: {
    color: '#FFF',
  },
  studentId: {
    fontSize: 10,
    color: '#FFF',
    marginTop: 2,
    maxWidth: 70,
  },
  statusChip: {
    marginTop: 2,
    height: 16,
    borderRadius: 8,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 20,
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendSeat: {
    width: 32,
    height: 32,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legendChip: {
    height: 20,
    borderRadius: 10,
  },
});

export default SeatGrid;
