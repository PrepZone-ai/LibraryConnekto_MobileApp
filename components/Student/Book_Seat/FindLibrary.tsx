import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { Card, IconButton, Searchbar, Text, useTheme } from 'react-native-paper';
import { apiClient } from '../../../config/api';
import Header from '../../common/Header';

type RootStackParamList = {
  StudentHome: undefined;
  StudentProfile: undefined;
  FindLibrary: undefined;
};

type FindLibraryScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface Library {
  id: string;
  library_name: string;
  address: string;
  total_seats: number;
  occupied_seats: number;
  latitude: number;
  longitude: number;
  distance?: number;
}

const FindLibrary: React.FC = () => {
  const navigation = useNavigation<FindLibraryScreenNavigationProp>();
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [filteredLibraries, setFilteredLibraries] = useState<Library[]>([]);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const fetchLibraries = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get('/libraries');
      setLibraries(data || []);
      setFilteredLibraries(data || []);
    } catch (error) {
      console.error('Error fetching libraries:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLibraries();
  }, []);

  useEffect(() => {
    const filtered = libraries.filter(library =>
      library.library_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      library.address.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredLibraries(filtered);
  }, [searchQuery, libraries]);

  const handleFindNearestLibraries = async () => {
    try {
      setLocationLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        alert('Location permission is required to find nearest libraries.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const librariesWithDistance = libraries.map(library => ({
        ...library,
        distance: calculateDistance(
          location.coords.latitude,
          location.coords.longitude,
          library.latitude,
          library.longitude
        )
      })).sort((a, b) => (a.distance || 0) - (b.distance || 0));

      setFilteredLibraries(librariesWithDistance);
    } catch (error) {
      console.error('Error getting location:', error);
      alert('Failed to get your location. Please try again.');
    } finally {
      setLocationLoading(false);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c * 10) / 10; // Round to 1 decimal place
  };

  return (
    <View style={styles.container}>
      <Header
        title="Find Library"
        showWelcome={false}
        autoBackButton={true}
      />
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search libraries..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
        <IconButton
          icon="map-marker"
          mode="contained"
          onPress={handleFindNearestLibraries}
          loading={locationLoading}
          style={styles.locationButton}
        />
      </View>
      
      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color={theme.colors.primary} />
      ) : (
        <ScrollView style={styles.content}>
          {filteredLibraries.map((library) => (
            <Card key={library.id} style={styles.libraryCard}>
              <Card.Content>
                <View style={styles.cardHeader}>
                  <MaterialCommunityIcons name="library" size={24} color={theme.colors.primary} />
                  <Text variant="titleLarge" style={styles.libraryName}>{library.library_name}</Text>
                </View>
                <Text variant="bodyMedium" style={styles.libraryAddress}>{library.address}</Text>
                <View style={styles.cardFooter}>
                  <View style={styles.seatsContainer}>
                    <MaterialCommunityIcons name="seat" size={20} color={theme.colors.primary} />
                    <Text variant="bodyMedium" style={styles.seatsText}>
                      {library.total_seats - library.occupied_seats} seats available
                    </Text>
                  </View>
                  {library.distance && (
                    <View style={styles.distanceContainer}>
                      <MaterialCommunityIcons name="map-marker-distance" size={20} color={theme.colors.primary} />
                      <Text variant="bodyMedium" style={styles.distance}>
                        {library.distance.toFixed(1)} km away
                      </Text>
                    </View>
                  )}
                </View>
              </Card.Content>
            </Card>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  searchBar: {
    flex: 1,
    elevation: 2,
  },
  locationButton: {
    marginLeft: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  libraryCard: {
    marginBottom: 16,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  libraryName: {
    flex: 1,
    fontWeight: 'bold',
  },
  libraryAddress: {
    color: '#666',
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  seatsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seatsText: {
    color: '#4f46e5',
  },
  distance: {
    color: '#4f46e5',
    fontWeight: '500',
  },
});

export default FindLibrary;