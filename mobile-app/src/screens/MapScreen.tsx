import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

// ~80 metres in degrees — trips closer than this get clustered
const CLUSTER_THRESHOLD = 0.0007;

interface Trip {
  id: string;
  username: string;
  wallet_address: string;
  logged_at: string;
  start_lat: number;
  start_lon: number;
  total_birds: number;
  species_count: number;
  distance_meters: number;
  duration_seconds: number;
  score: number;
}

interface Cluster {
  id: string;
  latitude: number;
  longitude: number;
  trips: Trip[];
}

function clusterTrips(trips: Trip[]): Cluster[] {
  const assigned = new Set<string>();
  const clusters: Cluster[] = [];

  for (const trip of trips) {
    if (assigned.has(trip.id)) continue;

    const members = trips.filter(t => {
      if (assigned.has(t.id)) return false;
      const dlat = t.start_lat - trip.start_lat;
      const dlon = t.start_lon - trip.start_lon;
      return Math.sqrt(dlat * dlat + dlon * dlon) < CLUSTER_THRESHOLD;
    });

    members.forEach(t => assigned.add(t.id));

    const lat = members.reduce((s, t) => s + t.start_lat, 0) / members.length;
    const lon = members.reduce((s, t) => s + t.start_lon, 0) / members.length;

    clusters.push({
      id: trip.id,
      latitude: lat,
      longitude: lon,
      trips: members,
    });
  }

  return clusters;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function formatDuration(s: number) {
  const m = Math.floor(s / 60);
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;
}

function formatDistance(m: number) {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
}

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);

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

  useEffect(() => {
    fetch(`${API_URL}/api/trips`)
      .then(r => r.json())
      .then(data => setTrips(data.trips ?? []))
      .catch(() => {});
  }, []);

  const clusters = clusterTrips(trips);

  const region = location
    ? { ...location, latitudeDelta: 0.02, longitudeDelta: 0.02 }
    : { latitude: 43.5528, longitude: 7.0174, latitudeDelta: 0.05, longitudeDelta: 0.05 };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.GREEN} />
      </View>
    );
  }

  return (
    <>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton
      >
        {clusters.map(cluster => (
          <Marker
            key={cluster.id}
            coordinate={{ latitude: cluster.latitude, longitude: cluster.longitude }}
            onPress={() => setSelectedCluster(cluster)}
          >
            <View style={[styles.pin, cluster.trips.length > 1 && styles.pinCluster]}>
              {cluster.trips.length > 1 ? (
                <Text style={styles.pinCount}>{cluster.trips.length}</Text>
              ) : (
                <Ionicons name="egg" size={16} color={COLORS.WHITE} />
              )}
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Trip detail / cluster list modal */}
      <Modal
        visible={selectedCluster !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedCluster(null)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setSelectedCluster(null)}
        />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />

          {selectedCluster && selectedCluster.trips.length === 1 ? (
            <TripDetail trip={selectedCluster.trips[0]} />
          ) : selectedCluster ? (
            <>
              <Text style={styles.sheetTitle}>{selectedCluster.trips.length} Trips Here</Text>
              <FlatList
                data={selectedCluster.trips}
                keyExtractor={t => t.id}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                renderItem={({ item }) => (
                  <TripDetail trip={item} compact />
                )}
              />
            </>
          ) : null}
        </View>
      </Modal>
    </>
  );
}

function TripDetail({ trip, compact }: { trip: Trip; compact?: boolean }) {
  const label = trip.username ? `@${trip.username}` : `${trip.wallet_address.slice(0, 6)}...`;
  return (
    <View style={compact ? styles.tripRowCompact : styles.tripDetail}>
      <View style={styles.tripHeader}>
        <Text style={styles.tripUser}>{label}</Text>
        <Text style={styles.tripDate}>{formatDate(trip.logged_at)}</Text>
      </View>
      <View style={styles.tripStats}>
        <StatChip icon="egg-outline" label={`${trip.total_birds} birds`} />
        <StatChip icon="walk-outline" label={formatDistance(trip.distance_meters)} />
        <StatChip icon="time-outline" label={formatDuration(trip.duration_seconds)} />
        <StatChip icon="star-outline" label={`${trip.score} pts`} />
      </View>
    </View>
  );
}

function StatChip({ icon, label }: { icon: any; label: string }) {
  return (
    <View style={styles.chip}>
      <Ionicons name={icon} size={12} color={COLORS.GRAY} />
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Pins
  pin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  pinCluster: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.DARK,
  },
  pinCount: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: COLORS.WHITE,
  },

  // Bottom sheet
  modalBackdrop: {
    flex: 1,
  },
  sheet: {
    backgroundColor: COLORS.WHITE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    maxHeight: '60%',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.LIGHT_GRAY,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: COLORS.DARK,
    marginBottom: 12,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.LIGHT_GRAY,
    marginVertical: 10,
  },

  // Trip rows
  tripDetail: { gap: 8 },
  tripRowCompact: { gap: 6 },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tripUser: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: COLORS.DARK,
  },
  tripDate: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: COLORS.GRAY,
  },
  tripStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.OFF_WHITE,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  chipText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: COLORS.GRAY,
  },
});
