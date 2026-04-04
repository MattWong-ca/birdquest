import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { defineChain, parseEther } from 'viem';
import { dynamicClient } from '../client';
import { COLORS } from '../constants/theme';

const TIP_PRESETS = [1, 2, 3];

const hederaTestnetChain = defineChain({
  id: 296,
  name: 'Hedera Testnet',
  nativeCurrency: { decimals: 18, name: 'HBAR', symbol: 'HBAR' },
  rpcUrls: { default: { http: ['https://testnet.hashio.io/api'] } },
  blockExplorers: { default: { name: 'HashScan', url: 'https://hashscan.io/testnet' } },
});

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

// ~80 metres in degrees — trips closer than this get clustered
const CLUSTER_THRESHOLD = 0.0007;

interface BirdEntry {
  name: string;
  count: number;
}

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
  birds: BirdEntry[];
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
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
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
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

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

  function fetchTrips() {
    setRefreshing(true);
    fetch(`${API_URL}/api/trips`)
      .then(r => r.json())
      .then(data => setTrips(data.trips ?? []))
      .catch(() => {})
      .finally(() => setRefreshing(false));
  }

  useEffect(() => { fetchTrips(); }, []);

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

      {/* Refresh button */}
      <TouchableOpacity style={styles.refreshBtn} onPress={fetchTrips} disabled={refreshing}>
        {refreshing
          ? <ActivityIndicator size="small" color={COLORS.WHITE} />
          : <Ionicons name="refresh" size={20} color={COLORS.WHITE} />
        }
      </TouchableOpacity>

      {/* Trip detail / cluster list modal */}
      <Modal
        visible={selectedCluster !== null}
        transparent
        animationType="slide"
        onRequestClose={() => { setSelectedTrip(null); setSelectedCluster(null); }}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => { setSelectedTrip(null); setSelectedCluster(null); }}
        />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />

          {/* Trip detail drill-down */}
          {selectedTrip ? (
            <>
              <TouchableOpacity style={styles.backRow} onPress={() => setSelectedTrip(null)}>
                <Ionicons name="chevron-back" size={18} color={COLORS.GREEN} />
                <Text style={styles.backText}>Back</Text>
              </TouchableOpacity>
              <TripDetail trip={selectedTrip} onDismiss={() => { setSelectedTrip(null); setSelectedCluster(null); }} />
            </>
          ) : selectedCluster && selectedCluster.trips.length === 1 ? (
            <TripDetail trip={selectedCluster.trips[0]} onDismiss={() => setSelectedCluster(null)} />
          ) : selectedCluster ? (
            <>
              <Text style={styles.sheetTitle}>{selectedCluster.trips.length} Trips Here</Text>
              <FlatList
                data={selectedCluster.trips}
                keyExtractor={t => t.id}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                renderItem={({ item }) => (
                  <TouchableOpacity onPress={() => setSelectedTrip(item)} activeOpacity={0.7}>
                    <TripSummaryRow trip={item} />
                  </TouchableOpacity>
                )}
              />
            </>
          ) : null}
        </View>
      </Modal>
    </>
  );
}

// Row shown in cluster list — no score, tappable
function TripSummaryRow({ trip }: { trip: Trip }) {
  const label = trip.username ? `@${trip.username}` : `${trip.wallet_address.slice(0, 6)}...`;
  return (
    <View style={styles.tripRowCompact}>
      <View style={styles.tripHeader}>
        <Text style={styles.tripDateBold}>{formatDate(trip.logged_at)}</Text>
        <Text style={styles.tripUserSmall}>{label}</Text>
      </View>
      <View style={styles.tripStats}>
        <StatChip icon="egg-outline" label={`${trip.total_birds} birds`} />
        <StatChip icon="walk-outline" label={formatDistance(trip.distance_meters)} />
        <StatChip icon="time-outline" label={formatDuration(trip.duration_seconds)} />
      </View>
    </View>
  );
}

// Full detail with birds list + tip
function TripDetail({ trip, onDismiss }: { trip: Trip; onDismiss: () => void }) {
  const myWallet = dynamicClient.wallets.userWallets[0]?.address ?? '';
  const label = trip.username ? `@${trip.username}` : `${trip.wallet_address.slice(0, 6)}...`;
  const isOwn = myWallet !== '' && myWallet.toLowerCase() === trip.wallet_address.toLowerCase();
  const canTip = !isOwn || myWallet === '';

  const [tipState, setTipState] = useState<'idle' | 'picking'>('idle');

  async function sendTip(hbar: number) {
    setTipState('idle');
    onDismiss(); // close our sheet so Dynamic's modal is on top
    try {
      const wallet = dynamicClient.wallets.userWallets[0];
      if (!wallet) return;
      const walletClient = await dynamicClient.viem.createWalletClient({
        wallet,
        chain: hederaTestnetChain,
      });
      await walletClient.sendTransaction({
        to: trip.wallet_address as `0x${string}`,
        value: parseEther(hbar.toString()),
      });
      Alert.alert('Tip sent!', `${hbar} HBAR sent successfully.`);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Transaction failed');
    }
  }

  return (
    <View style={styles.tripDetail}>
      <View style={styles.tripHeader}>
        <Text style={styles.tripDateBold}>{formatDate(trip.logged_at)}</Text>
        <Text style={styles.tripUserSmall}>{label}</Text>
      </View>
      <View style={styles.tripStats}>
        <StatChip icon="walk-outline" label={formatDistance(trip.distance_meters)} />
        <StatChip icon="time-outline" label={formatDuration(trip.duration_seconds)} />
        <View style={{ flex: 1 }} />
        {canTip && tipState === 'idle' && (
          <TouchableOpacity style={styles.tipBtn} onPress={() => setTipState('picking')}>
            <Ionicons name="heart-outline" size={12} color={COLORS.GREEN} />
            <Text style={styles.tipBtnText}>Tip</Text>
          </TouchableOpacity>
        )}
      </View>

      {canTip && tipState === 'picking' && (
        <View style={styles.tipPicker}>
          <Text style={styles.tipPickerLabel}>Send tip in HBAR</Text>
          <View style={styles.tipPresets}>
            {TIP_PRESETS.map(amount => (
              <TouchableOpacity
                key={amount}
                style={styles.tipPreset}
                onPress={() => sendTip(amount)}
              >
                <Text style={styles.tipPresetText}>{amount} HBAR</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity onPress={() => setTipState('idle')}>
            <Text style={styles.tipCancel}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.birdsTitle}>Birds Spotted</Text>
      {(trip.birds ?? []).length === 0 ? (
        <Text style={styles.noBirds}>No birds recorded</Text>
      ) : (
        (trip.birds ?? []).map((b, i) => (
          <View key={i} style={styles.birdRow}>
            <Ionicons name="egg" size={14} color={COLORS.GREEN} />
            <Text style={styles.birdName}>{b.name}</Text>
            <Text style={styles.birdCount}>×{b.count}</Text>
          </View>
        ))
      )}
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
  refreshBtn: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    backgroundColor: COLORS.GREEN,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },

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

  // Back button
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  backText: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: COLORS.GREEN },

  // Trip rows
  tripDetail: { gap: 10 },
  tripRowCompact: { gap: 6 },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tripDateBold: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: COLORS.DARK,
  },
  tripUserSmall: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: COLORS.GRAY,
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

  // Birds list
  birdsTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: COLORS.DARK,
    marginTop: 4,
  },
  noBirds: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: COLORS.GRAY,
  },
  birdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  birdName: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: COLORS.DARK,
    flex: 1,
  },
  birdCount: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: COLORS.GRAY,
  },

  // Tip
  tipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: COLORS.GREEN,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tipBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: COLORS.GREEN,
  },
  tipPicker: { gap: 8 },
  tipPickerLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: COLORS.DARK,
  },
  tipPresets: { flexDirection: 'row', gap: 8 },
  tipPreset: {
    flex: 1,
    backgroundColor: COLORS.GREEN,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  tipPresetText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: COLORS.WHITE,
  },
  tipCancel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: COLORS.GRAY,
    textAlign: 'center',
  },
  tipStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tipStatusText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: COLORS.GRAY,
  },
});
