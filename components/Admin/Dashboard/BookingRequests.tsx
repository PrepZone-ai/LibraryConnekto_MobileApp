import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, DataTable, IconButton, Searchbar, Surface, Text } from 'react-native-paper';
import { apiClient } from '../../../config/api';
import Header from '../../common/Header';

const BookingRequests = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [bookingsPerPage] = useState(10);
  const [processingBookingId, setProcessingBookingId] = useState(null);

  // Filter bookings based on search query
  const filteredBookings = bookings.filter(booking =>
    booking.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    booking.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    booking.mobile?.includes(searchQuery)
  );

  // Pagination
  const from = page * bookingsPerPage;
  const to = Math.min((page + 1) * bookingsPerPage, filteredBookings.length);

  useEffect(() => {
    fetchPendingBookings();
  }, []);

  const fetchPendingBookings = async () => {
    try {
      setLoading(true);
      
      // Get pending bookings using FastAPI
      const data = await apiClient.get('/admin/bookings/pending');
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching pending bookings:', error);
      Alert.alert('Error', 'Failed to load pending bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveBooking = async (bookingId) => {
    try {
      setProcessingBookingId(bookingId);

      // Approve booking using FastAPI
      await apiClient.put(`/admin/bookings/${bookingId}/approve`);

      // Update local state
      setBookings(prevBookings =>
        prevBookings.filter(b => b.id !== bookingId)
      );

      Alert.alert('Success', 'Booking approved successfully');
    } catch (error) {
      console.error('Error approving booking:', error);
      Alert.alert('Error', 'Failed to approve booking. Please try again.');
    } finally {
      setProcessingBookingId(null);
    }
  };

  const handleRejectBooking = async (bookingId) => {
    try {
      setProcessingBookingId(bookingId);

      // Reject booking using FastAPI
      await apiClient.put(`/admin/bookings/${bookingId}/reject`);

      // Update local state
      setBookings(prevBookings =>
        prevBookings.filter(b => b.id !== bookingId)
      );

      Alert.alert('Success', 'Booking rejected successfully');
    } catch (error) {
      console.error('Error rejecting booking:', error);
      Alert.alert('Error', 'Failed to reject booking. Please try again.');
    } finally {
      setProcessingBookingId(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Pending Bookings" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Pending Bookings" />
      <ScrollView>
        <Surface style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Pending Requests</Text>
            <Text style={styles.statValue}>{bookings.length}</Text>
          </View>
        </Surface>

        <Searchbar
          placeholder="Search by name, email or mobile..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />

        {bookings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No pending booking requests</Text>
          </View>
        ) : (
          <>
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Name</DataTable.Title>
                <DataTable.Title>Date</DataTable.Title>
                <DataTable.Title>Actions</DataTable.Title>
              </DataTable.Header>

              {filteredBookings.slice(from, to).map((booking) => (
                <DataTable.Row key={booking.id}>
                  <DataTable.Cell>
                    <View>
                      <Text style={styles.nameText}>{booking.name}</Text>
                      <Text style={styles.emailText}>{booking.email}</Text>
                    </View>
                  </DataTable.Cell>
                  <DataTable.Cell>
                    {formatDate(booking.created_at)}
                  </DataTable.Cell>
                  <DataTable.Cell>
                    <View style={styles.actionButtons}>
                      <IconButton
                        icon="check"
                        iconColor="#4CAF50"
                        size={20}
                        disabled={processingBookingId === booking.id}
                        onPress={() => handleApproveBooking(booking.id)}
                      />
                      <IconButton
                        icon="close"
                        iconColor="#F44336"
                        size={20}
                        disabled={processingBookingId === booking.id}
                        onPress={() => handleRejectBooking(booking.id)}
                      />
                    </View>
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>

            <DataTable.Pagination
              page={page}
              numberOfPages={Math.ceil(filteredBookings.length / bookingsPerPage)}
              onPageChange={setPage}
              label={`${from + 1}-${to} of ${filteredBookings.length}`}
            />
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  searchBar: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  nameText: {
    fontWeight: '500',
  },
  emailText: {
    fontSize: 12,
    color: '#666',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});

export default BookingRequests;
