import { Linking, Alert, Platform } from 'react-native';
import * as Location from 'expo-location';

export interface NavigationOptions {
  destination: string;
  mode?: 'driving' | 'walking' | 'transit';
  useCurrentLocation?: boolean;
}

export class NavigationService {
  /**
   * Open Google Maps with navigation to destination
   */
  static async navigateToDestination(options: NavigationOptions): Promise<void> {
    try {
      const { destination, mode = 'driving', useCurrentLocation = true } = options;
      
      console.log('🗺️ Starting navigation to:', destination);
      
      let origin = '';
      
      if (useCurrentLocation) {
        try {
          const currentLocation = await this.getCurrentLocation();
          if (currentLocation) {
            origin = `${currentLocation.latitude},${currentLocation.longitude}`;
          }
        } catch (error) {
          console.log('⚠️ Could not get current location, using default');
        }
      }
      
      const encodedDestination = encodeURIComponent(destination);
      let url: string;
      
      if (Platform.OS === 'ios') {
        // iOS - Try Apple Maps first, fallback to Google Maps
        if (origin) {
          url = `http://maps.apple.com/?saddr=${origin}&daddr=${encodedDestination}&dirflg=${this.getAppleMapsMode(mode)}`;
        } else {
          url = `http://maps.apple.com/?daddr=${encodedDestination}&dirflg=${this.getAppleMapsMode(mode)}`;
        }
        
        const canOpenAppleMaps = await Linking.canOpenURL(url);
        
        if (!canOpenAppleMaps) {
          // Fallback to Google Maps
          url = this.buildGoogleMapsUrl(origin, encodedDestination, mode);
        }
      } else {
        // Android - Use Google Maps
        url = this.buildGoogleMapsUrl(origin, encodedDestination, mode);
      }
      
      console.log('🗺️ Opening navigation URL:', url);
      
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        throw new Error('No navigation app available');
      }
      
    } catch (error) {
      console.error('❌ Navigation error:', error);
      Alert.alert(
        'Navigation Error',
        'Unable to open navigation app. Please check if you have Google Maps or Apple Maps installed.'
      );
    }
  }

  /**
   * Get current location
   */
  static async getCurrentLocation(): Promise<{ latitude: number; longitude: number } | null> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        console.log('⚠️ Location permission not granted');
        return null;
      }
      
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 10000,
      });
      
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      };
      
    } catch (error) {
      console.error('❌ Error getting current location:', error);
      return null;
    }
  }

  /**
   * Build Google Maps URL
   */
  private static buildGoogleMapsUrl(origin: string, destination: string, mode: string): string {
    const baseUrl = 'https://www.google.com/maps/dir/';
    const params = new URLSearchParams();
    
    params.append('api', '1');
    params.append('destination', destination);
    params.append('travelmode', this.getGoogleMapsMode(mode));
    
    if (origin) {
      params.append('origin', origin);
    }
    
    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Convert mode to Google Maps format
   */
  private static getGoogleMapsMode(mode: string): string {
    switch (mode) {
      case 'walking': return 'walking';
      case 'transit': return 'transit';
      case 'driving':
      default: return 'driving';
    }
  }

  /**
   * Convert mode to Apple Maps format
   */
  private static getAppleMapsMode(mode: string): string {
    switch (mode) {
      case 'walking': return 'w';
      case 'transit': return 'r';
      case 'driving':
      default: return 'd';
    }
  }

  /**
   * Open navigation with address string
   */
  static async navigateToAddress(address: string, mode: 'driving' | 'walking' | 'transit' = 'driving'): Promise<void> {
    await this.navigateToDestination({
      destination: address,
      mode,
      useCurrentLocation: true
    });
  }

  /**
   * Open navigation with coordinates
   */
  static async navigateToCoordinates(
    latitude: number, 
    longitude: number, 
    mode: 'driving' | 'walking' | 'transit' = 'driving'
  ): Promise<void> {
    await this.navigateToDestination({
      destination: `${latitude},${longitude}`,
      mode,
      useCurrentLocation: true
    });
  }

  /**
   * Check if navigation is available
   */
  static async isNavigationAvailable(): Promise<boolean> {
    try {
      const googleMapsUrl = 'https://www.google.com/maps';
      const appleMapsUrl = 'http://maps.apple.com';
      
      const canOpenGoogle = await Linking.canOpenURL(googleMapsUrl);
      const canOpenApple = Platform.OS === 'ios' ? await Linking.canOpenURL(appleMapsUrl) : false;
      
      return canOpenGoogle || canOpenApple;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get estimated travel time (placeholder - would need actual API integration)
   */
  static getEstimatedTravelTime(
    origin: string, 
    destination: string, 
    mode: 'driving' | 'walking' | 'transit' = 'driving'
  ): string {
    // This is a placeholder - in a real app you'd integrate with Google Maps API
    // or similar service to get actual travel times
    switch (mode) {
      case 'walking': return '15-30 min';
      case 'transit': return '20-45 min';
      case 'driving':
      default: return '10-20 min';
    }
  }
}
