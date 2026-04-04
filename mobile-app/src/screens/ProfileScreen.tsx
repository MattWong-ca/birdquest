import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Clipboard,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useReactiveClient } from '@dynamic-labs/react-hooks';
import { dynamicClient } from '../client';
import { COLORS } from '../constants/theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

interface Trip {
  id: string;
  logged_at: string;
  duration_seconds: number;
  distance_meters: number;
  total_birds: number;
  species_count: number;
  score: number;
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${m}m`;
}

function formatDistance(meters: number) {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters)} m`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function truncateAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function ProfileScreen() {
  const { auth, wallets } = useReactiveClient(dynamicClient);
  const username = auth.authenticatedUser?.username ?? '';
  const email = (auth.authenticatedUser as any)?.email ?? '';
  const walletAddress = wallets.userWallets[0]?.address ?? '';

  const [birdBalance, setBirdBalance] = useState<number | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!walletAddress) return;
    setLoading(true);
    fetch(`${API_URL}/api/profile?wallet=${walletAddress}`)
      .then(r => r.json())
      .then(data => {
        setBirdBalance(data.birdBalance ?? 0);
        setTrips(data.trips ?? []);
      })
      .catch(() => setBirdBalance(0))
      .finally(() => setLoading(false));
  }, [walletAddress]);

  function copyAddress() {
    Clipboard.setString(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile card */}
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{username ? username[0].toUpperCase() : '?'}</Text>
        </View>

        {username ? <Text style={styles.username}>@{username}</Text> : null}
        {email ? <Text style={styles.email}>{email}</Text> : null}

        <TouchableOpacity style={styles.addressRow} onPress={copyAddress} activeOpacity={0.7}>
          <Text style={styles.address}>{truncateAddress(walletAddress)}</Text>
          <Ionicons
            name={copied ? 'checkmark' : 'copy-outline'}
            size={14}
            color={copied ? COLORS.GREEN : COLORS.GRAY}
          />
        </TouchableOpacity>

        <View style={styles.divider} />

        <View style={styles.balanceRow}>
          <Text style={styles.balanceLabel}>BIRD Points</Text>
          {birdBalance === null ? (
            <ActivityIndicator size="small" color={COLORS.GREEN} />
          ) : (
            <Text style={styles.balanceValue}>{birdBalance.toLocaleString()} BIRD</Text>
          )}
        </View>
      </View>

      {/* Past trips */}
      <Text style={styles.sectionTitle}>Past Trips</Text>

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.GREEN} />
        </View>
      )}

      {!loading && trips.length === 0 && (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No trips yet — go explore!</Text>
        </View>
      )}

      {trips.map(trip => (
        <View key={trip.id} style={styles.tripCard}>
          <View style={styles.tripHeader}>
            <Text style={styles.tripDate}>{formatDate(trip.logged_at)}</Text>
            <Text style={styles.tripScore}>+{trip.score} BIRD</Text>
          </View>
          <View style={styles.tripStats}>
            <View style={styles.tripStat}>
              <Ionicons name="time-outline" size={14} color={COLORS.GRAY} />
              <Text style={styles.tripStatText}>{formatDuration(trip.duration_seconds)}</Text>
            </View>
            <View style={styles.tripStat}>
              <Ionicons name="walk-outline" size={14} color={COLORS.GRAY} />
              <Text style={styles.tripStatText}>{formatDistance(trip.distance_meters)}</Text>
            </View>
            <View style={styles.tripStat}>
              <Ionicons name="egg-outline" size={14} color={COLORS.GRAY} />
              <Text style={styles.tripStatText}>{trip.total_birds} birds · {trip.species_count} species</Text>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.OFF_WHITE },
  content: { padding: 16, gap: 12 },

  card: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 28,
    color: COLORS.WHITE,
  },
  username: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: COLORS.DARK,
  },
  email: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: COLORS.GRAY,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.OFF_WHITE,
    borderRadius: 8,
  },
  address: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: COLORS.GRAY,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: COLORS.LIGHT_GRAY,
    marginVertical: 4,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  balanceLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: COLORS.GRAY,
  },
  balanceValue: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: COLORS.GREEN,
  },

  sectionTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: COLORS.DARK,
    marginTop: 4,
  },

  tripCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tripDate: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: COLORS.DARK,
  },
  tripScore: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: COLORS.GREEN,
  },
  tripStats: { gap: 4 },
  tripStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tripStatText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: COLORS.GRAY,
  },

  center: { paddingVertical: 32, alignItems: 'center' },
  emptyText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: COLORS.GRAY,
  },
});
