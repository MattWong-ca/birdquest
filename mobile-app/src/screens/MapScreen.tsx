import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { COLORS } from '../constants/theme';

const HARDCODED_PINS = [
  {
    id: '1',
    title: 'American Robin',
    description: 'Spotted by @birder42 · 2h ago',
    coordinate: { latitude: 37.78925, longitude: -122.4334 },
  },
  {
    id: '2',
    title: 'Red-tailed Hawk',
    description: 'Spotted by @hawkwatcher · 5h ago',
    coordinate: { latitude: 37.78625, longitude: -122.4294 },
  },
  {
    id: '3',
    title: 'Black-capped Chickadee',
    description: 'Spotted by @nature_matt · 1d ago',
    coordinate: { latitude: 37.79025, longitude: -122.4314 },
  },
];

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      }
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.GREEN} />
      </View>
    );
  }

  const region = location
    ? { ...location, latitudeDelta: 0.01, longitudeDelta: 0.01 }
    : { latitude: 37.78825, longitude: -122.4324, latitudeDelta: 0.01, longitudeDelta: 0.01 };

  // Offset hardcoded pins relative to current location if available
  const pins = location
    ? HARDCODED_PINS.map((pin, i) => ({
        ...pin,
        coordinate: {
          latitude: location.latitude + (i - 1) * 0.003,
          longitude: location.longitude + (i - 1) * 0.002,
        },
      }))
    : HARDCODED_PINS;

  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      initialRegion={region}
      showsUserLocation
      showsMyLocationButton
    >
      {pins.map(pin => (
        <Marker key={pin.id} coordinate={pin.coordinate} pinColor={COLORS.GREEN}>
          <Callout>
            <View style={styles.callout}>
              <Text style={styles.calloutTitle}>{pin.title}</Text>
              <Text style={styles.calloutDesc}>{pin.description}</Text>
            </View>
          </Callout>
        </Marker>
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  callout: { padding: 8, maxWidth: 200 },
  calloutTitle: { fontWeight: '700', fontSize: 14, color: COLORS.GREEN, marginBottom: 2 },
  calloutDesc: { fontSize: 12, color: '#666' },
});
