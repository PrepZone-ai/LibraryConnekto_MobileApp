import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, IconButton } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';

interface FacilityItem {
  id: number;
  title: string;
  items: string[];
  icon: keyof typeof MaterialIcons.glyphMap;
  colors: {
    from: string;
    to: string;
    iconBg: string;
    iconColor: string;
    border: string;
  };
}

interface FacilitiesProps {
  facilities: FacilityItem[];
}

const Facilities: React.FC<FacilitiesProps> = ({ facilities }) => {
  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.header}>Our Facilities</Text>
      <View style={styles.facilityWrapper}>
        {facilities.map((facility) => (
          <View key={facility.id} style={styles.facilityItem}>
            <Card style={[styles.card, { backgroundColor: facility.colors.from, borderColor: facility.colors.border }]}>
              <Card.Content>
                <View style={styles.iconContainer}>
                  <View style={[styles.iconWrapper, { backgroundColor: facility.colors.iconBg }]}>
                    <MaterialIcons name={facility.icon} size={24} color={facility.colors.iconColor} />
                  </View>
                  <Text style={[styles.title, { color: facility.colors.iconColor }]}>{facility.title}</Text>
                </View>
                <View>
                  {facility.items.map((item, index) => (
                    <View key={index} style={styles.listItem}>
                      <IconButton icon="check" size={12} iconColor={facility.colors.iconColor} />
                      <Text style={styles.listText}>{item}</Text>
                    </View>
                  ))}
                </View>
              </Card.Content>
            </Card>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  header: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  facilityWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  facilityItem: {
    width: '50%',
    padding: 8,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    elevation: 3,
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginLeft: 12,
    fontWeight: 'bold',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  listText: {
    fontSize: 14,
    color: '#4A4A4A',
    marginLeft: 4,
  },
});

export default Facilities;