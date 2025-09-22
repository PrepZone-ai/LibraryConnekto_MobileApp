import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Card, Surface, Text } from 'react-native-paper';
import { apiClient } from '../../../config/api';

interface BookingRequest {
  id: string;
  name: string;
  email: string;
  mobile: string;
  created_at: string;
  status: string;
}

const PendingRequests = () => {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const navigation = useNavigation();

  useEffect(() => {
    fetchPendingBookings();
  }, []);

  const fetchPendingBookings = async () => {
    try {
      setLoading(true);
      
      // Get pending bookings using FastAPI
      const data = await apiClient.get<BookingRequest[]>('/admin/bookings/pending?limit=3');
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching pending bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleViewAll = () => {
    // @ts-ignore - Navigation typing issue
    navigation.navigate('PendingBookings');
  };

  if (loading) {
    return (
      <Card style={styles.container}>
        <Text variant="titleLarge" style={styles.title}>Pending Seat Requests</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#6366F1" />
        </View>
      </Card>
    );
  }

  return (
    <Card style={styles.container}>
      <View style={styles.headerContainer}>
        <Text variant="titleLarge" style={styles.title}>Pending Seat Requests</Text>
        <Text variant="titleMedium" style={styles.count}>{bookings.length}</Text>
      </View>

      {bookings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="event-seat" size={24} color="#9CA3AF" />
          <Text style={styles.emptyText}>No pending seat requests</Text>
        </View>
      ) : (
        <>
          {bookings.map((booking) => (
            <Surface key={booking.id} style={styles.bookingItem}>
              <View style={styles.bookingInfo}>
                <Text style={styles.nameText}>{booking.name}</Text>
                <Text style={styles.emailText}>{booking.email}</Text>
                <Text style={styles.dateText}>{formatDate(booking.created_at)}</Text>
              </View>
            </Surface>
          ))}

          <Button
            mode="outlined"
            onPress={handleViewAll}
            style={styles.viewAllButton}
          >
            View All Requests
          </Button>
        </>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
    padding: 16,
    borderRadius: 8,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontWeight: 'bold',
  },
  count: {
    color: '#6366F1',
    fontWeight: 'bold',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 8,
    color: '#6B7280',
  },
  bookingItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
  },
  bookingInfo: {
    flex: 1,
  },
  nameText: {
    fontWeight: '500',
    fontSize: 16,
  },
  emailText: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: 2,
  },
  dateText: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 4,
  },
  viewAllButton: {
    marginTop: 8,
    borderColor: '#6366F1',
  },
});

export default PendingRequests;
