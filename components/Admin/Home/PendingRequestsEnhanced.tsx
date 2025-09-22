import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator, Avatar, Button, Card, Divider, IconButton, Portal, Surface, Text } from 'react-native-paper';
import { apiClient } from '../../../config/api';

interface BookingRequest {
  id: string;
  name: string;
  email: string;
  mobile: string;
  address: string;
  subscription_months: number;
  amount: number;
  created_at: string;
  status: string;
  library_id: string;
}

const PendingRequests = () => {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<BookingRequest | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
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

  const handleApproveBooking = async (bookingId: string) => {
    try {
      setProcessingId(bookingId);
      
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
      setProcessingId(null);
    }
  };

  const handleRejectBooking = async (bookingId: string) => {
    try {
      setProcessingId(bookingId);
      
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
      setProcessingId(null);
    }
  };

  const openBookingDetails = (booking: BookingRequest) => {
    setSelectedBooking(booking);
    setModalVisible(true);
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
    <>
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
              <TouchableOpacity 
                key={booking.id} 
                onPress={() => openBookingDetails(booking)}
                style={styles.bookingCardContainer}
              >
                <Surface style={styles.bookingCard}>
                  <View style={styles.bookingCardContent}>
                    <View style={styles.bookingInfo}>
                      <Text style={styles.nameText}>{booking.name}</Text>
                      <Text style={styles.emailText}>{booking.email}</Text>
                      <Text style={styles.dateText}>{formatDate(booking.created_at)}</Text>
                    </View>
                    <Button 
                      mode="contained" 
                      onPress={(e) => {
                        e.stopPropagation();
                        handleApproveBooking(booking.id);
                      }}
                      style={styles.approveButton}
                      loading={processingId === booking.id}
                      disabled={processingId === booking.id}
                    >
                      Approve
                    </Button>
                  </View>
                </Surface>
              </TouchableOpacity>
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

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          transparent={true}
        >
          <View style={styles.modalOverlay}>
            <Card style={styles.modalContent}>
              <ScrollView>
                {selectedBooking && (
                  <>
                    <View style={styles.modalHeader}>
                      <Text variant="titleLarge" style={styles.modalTitle}>Booking Request</Text>
                      <IconButton
                        icon="close"
                        size={24}
                        onPress={() => setModalVisible(false)}
                      />
                    </View>
                    
                    <View style={styles.studentInfoContainer}>
                      <Avatar.Icon 
                        size={60} 
                        icon="account" 
                        style={styles.studentAvatar} 
                      />
                      <View style={styles.studentDetails}>
                        <Text variant="titleMedium" style={styles.studentName}>{selectedBooking.name}</Text>
                        <Text variant="bodyMedium">{selectedBooking.email}</Text>
                        <Text variant="bodyMedium">{selectedBooking.mobile}</Text>
                      </View>
                    </View>
                    
                    <Divider style={styles.divider} />
                    
                    <View style={styles.bookingDetailsContainer}>
                      <View style={styles.detailRow}>
                        <MaterialCommunityIcons name="map-marker" size={20} color="#6B7280" />
                        <Text style={styles.detailText}>{selectedBooking.address}</Text>
                      </View>
                      
                      <View style={styles.detailRow}>
                        <MaterialCommunityIcons name="calendar-range" size={20} color="#6B7280" />
                        <Text style={styles.detailText}>
                          Subscription: {selectedBooking.subscription_months} months
                        </Text>
                      </View>
                      
                      <View style={styles.detailRow}>
                        <MaterialCommunityIcons name="currency-inr" size={20} color="#6B7280" />
                        <Text style={styles.detailText}>
                          Amount: ₹{selectedBooking.amount}
                        </Text>
                      </View>
                      
                      <View style={styles.detailRow}>
                        <MaterialCommunityIcons name="clock-outline" size={20} color="#6B7280" />
                        <Text style={styles.detailText}>
                          Requested on: {formatDate(selectedBooking.created_at)}
                        </Text>
                      </View>
                    </View>
                    
                    <Divider style={styles.divider} />
                    
                    <View style={styles.actionButtonsContainer}>
                      <Button 
                        mode="contained" 
                        onPress={() => handleApproveBooking(selectedBooking.id)}
                        style={[styles.actionButton, styles.approveActionButton]}
                        loading={processingId === selectedBooking.id}
                        disabled={processingId === selectedBooking.id}
                      >
                        Approve Request
                      </Button>
                      
                      <Button 
                        mode="outlined" 
                        onPress={() => handleRejectBooking(selectedBooking.id)}
                        style={styles.actionButton}
                        loading={processingId === selectedBooking.id}
                        disabled={processingId === selectedBooking.id}
                      >
                        Reject
                      </Button>
                    </View>
                  </>
                )}
              </ScrollView>
            </Card>
          </View>
        </Modal>
      </Portal>
    </>
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
  bookingCardContainer: {
    marginBottom: 12,
  },
  bookingCard: {
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
  },
  bookingCardContent: {
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  approveButton: {
    backgroundColor: '#10B981',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  viewAllButton: {
    marginTop: 8,
    borderColor: '#6366F1',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    padding: 16,
    borderRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontWeight: 'bold',
  },
  studentInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  studentAvatar: {
    backgroundColor: '#6366F1',
  },
  studentDetails: {
    marginLeft: 16,
  },
  studentName: {
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 16,
  },
  bookingDetailsContainer: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailText: {
    marginLeft: 12,
    fontSize: 16,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  approveActionButton: {
    backgroundColor: '#10B981',
  },
});

export default PendingRequests;
