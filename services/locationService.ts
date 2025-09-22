import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { apiClient } from '../config/api';

const LOCATION_TASK_NAME = 'background-location-task';

// Define the background task
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('Background location task error:', error);
    return;
  }

  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    const location = locations[0];

    try {
      // Check student location and auto checkout if outside range
      await apiClient.post('/student/attendance/check-location', {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
    } catch (error) {
      console.error('Error in background location task:', error);
    }
  }
});

export class LocationService {
  private static instance: LocationService;
  private locationSubscription: Location.LocationSubscription | null = null;
  private isMonitoring = false;

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const foregroundPermission = await Location.requestForegroundPermissionsAsync();
      const backgroundPermission = await Location.requestBackgroundPermissionsAsync();
      
      return foregroundPermission.status === 'granted' && backgroundPermission.status === 'granted';
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  async startLocationMonitoring(): Promise<boolean> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log('Location permissions not granted');
        return false;
      }

      if (this.isMonitoring) {
        console.log('Location monitoring already active');
        return true;
      }

      // Start background location updates
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 30000, // 30 seconds
        distanceInterval: 10, // 10 meters
        foregroundService: {
          notificationTitle: 'Library Connect',
          notificationBody: 'Monitoring your location for attendance',
          notificationColor: '#4F46E5',
        },
        deferredUpdatesInterval: 30000,
        deferredUpdatesDistance: 10,
      });

      // Start foreground location updates for immediate feedback
      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 30000,
          distanceInterval: 10,
        },
        async (location) => {
          try {
            // Check location and auto checkout if needed
            const response = await apiClient.post('/student/attendance/check-location', {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude
            });

            if (response.auto_checkout) {
              console.log('Auto checkout triggered - outside library range');
            }
          } catch (error) {
            console.error('Error in location update:', error);
          }
        }
      );

      this.isMonitoring = true;
      console.log('Location monitoring started');
      return true;
    } catch (error) {
      console.error('Error starting location monitoring:', error);
      return false;
    }
  }

  async stopLocationMonitoring(): Promise<void> {
    try {
      if (this.locationSubscription) {
        this.locationSubscription.remove();
        this.locationSubscription = null;
      }

      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      this.isMonitoring = false;
      console.log('Location monitoring stopped');
    } catch (error) {
      console.error('Error stopping location monitoring:', error);
    }
  }

  async getCurrentLocation(): Promise<Location.LocationObject | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log('Location permission not granted');
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return location;
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  isMonitoringActive(): boolean {
    return this.isMonitoring;
  }
}

export default LocationService.getInstance(); 