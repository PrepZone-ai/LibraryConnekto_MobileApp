import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Surface, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface NearbyLibrariesProps {
  isLoggedIn: boolean;
  onLoginPress: () => void;
}

const NearbyLibraries: React.FC<NearbyLibrariesProps> = ({ isLoggedIn, onLoginPress }) => {
  const libraries = [
    {
      name: "Central Study Hub",
      image: require('../../../assets/lib1.jpg'),
      distance: "0.5 km",
      price: "$50/month",
      rating: 4.8,
      amenities: [
        { icon: 'snowflake' as const, label: 'AC' },
        { icon: 'wifi' as const, label: 'Free WiFi' },
      ],
    },
    {
      name: "Knowledge Center",
      image: require('../../../assets/lib2.jpg'),
      distance: "1.2 km",
      price: "$45/month",
      rating: 4.5,
      amenities: [
        { icon: 'snowflake' as const, label: 'AC' },
        { icon: 'wifi' as const, label: 'Free WiFi' },
        { icon: 'coffee' as const, label: 'Café' },
      ],
    },
  ];

  return (
    <>
      <Text variant="titleMedium" style={styles.sectionTitle}>Nearby Libraries</Text>
      {libraries.map((library, index) => (
        <Surface key={index} style={styles.libraryCard}>
          <Image
            source={library.image}
            style={styles.libraryImage}
          />
          <View style={styles.libraryContent}>
            <View style={styles.libraryHeader}>
              <View>
                <Text variant="titleMedium">{library.name}</Text>
                <Text variant="bodySmall" style={styles.libraryMeta}>
                  {library.distance} • {library.price}
                </Text>
              </View>
              <View style={styles.ratingContainer}>
                <MaterialCommunityIcons name="star" size={16} color="#f59e0b" />
                <Text style={styles.rating}>{library.rating}</Text>
              </View>
            </View>
            <View style={styles.amenities}>
              {library.amenities.map((amenity, aIndex) => (
                <Surface key={aIndex} style={styles.amenityTag}>
                  <MaterialCommunityIcons name={amenity.icon} size={14} color="#3b82f6" />
                  <Text style={styles.amenityText}>{amenity.label}</Text>
                </Surface>
              ))}
            </View>
            <TouchableOpacity 
              style={styles.bookButton} 
              onPress={() => isLoggedIn ? {} : onLoginPress()}
            >
              <Text style={styles.bookButtonText}>
                {isLoggedIn ? 'Book Now' : 'Login to Access'}
              </Text>
            </TouchableOpacity>
          </View>
        </Surface>
      ))}
    </>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    marginBottom: 16,
    color: '#1f2937',
  },
  libraryCard: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: 'white',
  },
  libraryImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  libraryContent: {
    padding: 16,
  },
  libraryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  libraryMeta: {
    color: '#6b7280',
    marginTop: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  rating: {
    color: '#f59e0b',
    marginLeft: 4,
    fontWeight: '500',
  },
  amenities: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  amenityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
  },
  amenityText: {
    color: '#3b82f6',
    fontSize: 12,
  },
  bookButton: {
    backgroundColor: '#4338ca',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  bookButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default NearbyLibraries;
