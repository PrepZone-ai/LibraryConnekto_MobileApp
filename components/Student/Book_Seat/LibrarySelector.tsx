import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Surface, Text, ActivityIndicator } from 'react-native-paper';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Library } from './types';

interface LibrarySelectorProps {
  libraries: Library[];
  loading: boolean;
  onSelectLibrary: (library: Library) => void;
  onClose: () => void;
  onFindNearest: () => Promise<void>;
}

const LibrarySelector: React.FC<LibrarySelectorProps> = ({
  libraries,
  loading,
  onSelectLibrary,
  onClose
}) => {
  return (
    <Surface style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Select Library</Text>
        <TouchableOpacity onPress={onClose}>
          <MaterialIcons name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={styles.loadingText}>Finding nearby libraries...</Text>
        </View>
      ) : (
        <View style={styles.librariesContainer}>
          {libraries.map((library) => (
            <TouchableOpacity
              key={library.id}
              style={styles.libraryCard}
              onPress={() => onSelectLibrary(library)}
            >
              <View style={styles.libraryInfo}>
                <Text style={styles.libraryName}>{library.library_name}</Text>
                <Text style={styles.libraryAddress}>{library.address}</Text>
                <View style={styles.libraryDetails}>
                  <View style={styles.detailItem}>
                    <MaterialCommunityIcons name="map-marker-distance" size={16} color="#666" />
                    <Text style={styles.detailText}>{library.distance?.toFixed(1)} km away</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <MaterialCommunityIcons name="seat" size={16} color="#666" />
                    <Text style={styles.detailText}>{library.total_seats - library.occupied_seats} seats available</Text>
                  </View>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#666" />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 4,
    margin: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  librariesContainer: {
    gap: 12,
  },
  libraryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  libraryInfo: {
    flex: 1,
    gap: 4,
  },
  libraryName: {
    fontSize: 16,
    fontWeight: '600',
  },
  libraryAddress: {
    fontSize: 14,
    color: '#666',
  },
  libraryDetails: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
  },
});

export default LibrarySelector;
