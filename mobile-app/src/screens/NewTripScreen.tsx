import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { BIRD_NAMES, findBird, type Bird } from '../constants/birds';

const ANTHROPIC_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY!;

// ── Types ────────────────────────────────────────────────────────────────────

type TripState = 'drop-pin' | 'active' | 'identify';

interface BirdEntry {
  id: string;
  name: string;
  count: number;
  timestamp: Date;
  lat: number;
  lon: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatDistance(meters: number) {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(2)}km`;
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function NewTripScreen() {
  const [tripState, setTripState] = useState<TripState>('drop-pin');
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [startPin, setStartPin] = useState<{ latitude: number; longitude: number } | null>(null);

  // Trip stats
  const [elapsed, setElapsed] = useState(0);
  const [distance, setDistance] = useState(0);
  const [birds, setBirds] = useState<BirdEntry[]>([]);
  const [birdInput, setBirdInput] = useState('');

  // Identify
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [identifyDescription, setIdentifyDescription] = useState<string | null>(null);
  const [matchedBird, setMatchedBird] = useState<Bird | null>(null);
  const [isIdentifying, setIsIdentifying] = useState(false);

  const lastLocation = useRef<{ latitude: number; longitude: number } | null>(null);
  const locationSub = useRef<Location.LocationSubscription | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Get current location on mount
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        setCurrentLocation(coords);
        setStartPin(coords); // default pin to current location
      }
    })();
  }, []);

  // ── Trip controls ─────────────────────────────────────────────────────────

  async function startTrip() {
    if (!startPin) return;
    setElapsed(0);
    setDistance(0);
    setBirds([]);
    lastLocation.current = startPin;
    setTripState('active');

    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);

    locationSub.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, distanceInterval: 5 },
      ({ coords }) => {
        const { latitude, longitude } = coords;
        if (lastLocation.current) {
          const d = haversineMeters(
            lastLocation.current.latitude,
            lastLocation.current.longitude,
            latitude,
            longitude,
          );
          setDistance(prev => prev + d);
        }
        lastLocation.current = { latitude, longitude };
      },
    );
  }

  function endTrip() {
    timerRef.current && clearInterval(timerRef.current);
    locationSub.current?.remove();
    Alert.alert(
      'Trip Complete!',
      `Time: ${formatDuration(elapsed)}\nDistance: ${formatDistance(distance)}\nBirds logged: ${birds.length}`,
      [{ text: 'OK', onPress: () => { setTripState('drop-pin'); setBirds([]); } }],
    );
  }

  // ── Bird actions ──────────────────────────────────────────────────────────

  function addBird(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    const loc = lastLocation.current;
    setBirds(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        name: trimmed,
        count: 1,
        timestamp: new Date(),
        lat: loc?.latitude ?? 0,
        lon: loc?.longitude ?? 0,
      },
    ]);
    setBirdInput('');
  }

  function updateCount(birdId: string, delta: number) {
    setBirds(prev =>
      prev
        .map(b => (b.id === birdId ? { ...b, count: b.count + delta } : b))
        .filter(b => b.count > 0),
    );
  }

  async function openCamera() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Camera required', 'Please enable camera access in Settings.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      base64: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      setPhotoBase64(result.assets[0].base64 ?? null);
      setIdentifyDescription(null);
      setMatchedBird(null);
      setTripState('identify');
    }
  }

  async function identifyBird() {
    if (!photoBase64) return;
    setIsIdentifying(true);
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-opus-4-6',
          max_tokens: 512,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: 'image/jpeg', data: photoBase64 },
              },
              {
                type: 'text',
                text: `You are a bird identification assistant for the Cannes, France area. Identify the bird in this image by choosing the closest match from this list:\n\n${BIRD_NAMES.join(', ')}\n\nRespond with valid JSON only, no other text:\n{"bird": "<exact name from list>", "description": "<2-3 sentences about key identifying features visible in this photo>"}`,
              },
            ],
          }],
        }),
      });
      const data = await response.json();
      const text = data.content?.[0]?.text ?? '{}';
      const parsed = JSON.parse(text);
      const bird = findBird(parsed.bird ?? '');
      setMatchedBird(bird ?? null);
      setIdentifyDescription(parsed.description ?? '');
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to identify bird.');
    } finally {
      setIsIdentifying(false);
    }
  }

  function addIdentifiedBird() {
    if (!matchedBird) return;
    const loc = lastLocation.current;
    setBirds(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        name: matchedBird.name,
        count: 1,
        timestamp: new Date(),
        lat: loc?.latitude ?? 0,
        lon: loc?.longitude ?? 0,
      },
    ]);
    setTripState('active');
  }

  // ── Identify screen ───────────────────────────────────────────────────────

  if (tripState === 'identify') {
    return (
      <ScrollView style={styles.flex} contentContainerStyle={styles.identifyContainer}>
        {/* Photo */}
        {photoUri && (
          <Image source={{ uri: photoUri }} style={styles.identifyPhoto} resizeMode="cover" />
        )}

        {/* Identify button */}
        {!matchedBird && (
          <TouchableOpacity
            style={[styles.btnPrimary, isIdentifying && styles.btnDisabled]}
            onPress={identifyBird}
            disabled={isIdentifying}
          >
            {isIdentifying
              ? <ActivityIndicator color={COLORS.WHITE} />
              : <Text style={styles.btnText}>Identify Bird</Text>
            }
          </TouchableOpacity>
        )}

        {/* AI result */}
        {matchedBird && identifyDescription && (
          <View style={styles.identifyResult}>
            <View style={styles.identifyResultHeader}>
              <Text style={styles.identifyResultTitle}>{matchedBird.name}</Text>
              <View style={[styles.rarityBadge, matchedBird.rarity === 'Common' ? styles.rarityCommon : matchedBird.rarity === 'Uncommon' ? styles.rarityUncommon : styles.rarityRare]}>
                <Text style={styles.rarityText}>{matchedBird.rarity}</Text>
              </View>
            </View>
            <Text style={styles.identifyResultBody}>{identifyDescription}</Text>

            <View style={styles.identifyActions}>
              <TouchableOpacity style={styles.btnPrimary} onPress={addIdentifiedBird}>
                <Text style={styles.btnText}>Add to Trip</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnSecondary}
                onPress={() => Alert.alert('Coming soon', 'iNaturalist submission coming with backend.')}
              >
                <Text style={styles.btnText}>Submit to iNat</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Back */}
        <TouchableOpacity style={styles.identifyBack} onPress={() => setTripState('active')}>
          <Text style={styles.identifyBackText}>← Back to trip</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ── Active trip screen ────────────────────────────────────────────────────

  if (tripState === 'active') {
    return (
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.activeContainer}>

          {/* Add bird row */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Bird name..."
              placeholderTextColor={COLORS.GRAY}
              value={birdInput}
              onChangeText={setBirdInput}
              onSubmitEditing={() => addBird(birdInput)}
              returnKeyType="done"
            />
            <TouchableOpacity style={styles.addBtn} onPress={() => addBird(birdInput)}>
              <Text style={styles.btnText}>Add</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cameraBtn} onPress={openCamera}>
              <Ionicons name="camera-outline" size={22} color={COLORS.WHITE} />
            </TouchableOpacity>
          </View>

          {/* Observations title */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Observations</Text>
            <View style={styles.sectionUnderline} />
          </View>

          {/* Bird list */}
          <FlatList
            data={[...birds].reverse()}
            keyExtractor={b => b.id}
            style={styles.list}
            contentContainerStyle={{ paddingBottom: 8 }}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No birds logged yet — add one below</Text>
            }
            renderItem={({ item }) => (
              <View style={styles.birdRow}>
                <View style={styles.birdInfo}>
                  <Text style={styles.birdName}>{item.name}</Text>
                  <Text style={styles.birdTime}>{item.timestamp.toLocaleTimeString()}</Text>
                </View>
                <View style={styles.counter}>
                  <TouchableOpacity style={styles.counterBtn} onPress={() => updateCount(item.id, -1)}>
                    <Text style={styles.counterBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.counterValue}>{item.count}</Text>
                  <TouchableOpacity style={styles.counterBtn} onPress={() => updateCount(item.id, 1)}>
                    <Text style={styles.counterBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatDuration(elapsed)}</Text>
              <Text style={styles.statLabel}>Time</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatDistance(distance)}</Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{birds.length}</Text>
              <Text style={styles.statLabel}>Birds</Text>
            </View>
            <View style={styles.statDivider} />
            <TouchableOpacity style={styles.statItem} onPress={endTrip}>
              <Ionicons name="stop-circle-outline" size={28} color="#c0392b" />
              <Text style={[styles.statLabel, { color: '#c0392b' }]}>End</Text>
            </TouchableOpacity>
          </View>

        </View>
      </KeyboardAvoidingView>
    );
  }

  // ── Drop pin screen ───────────────────────────────────────────────────────

  if (!currentLocation) {
    return (
      <View style={[styles.flex, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={COLORS.GREEN} />
      </View>
    );
  }

  const mapRegion = { ...currentLocation, latitudeDelta: 0.01, longitudeDelta: 0.01 };

  return (
    <View style={styles.flex}>
      <MapView
        style={styles.flex}
        initialRegion={mapRegion}
        showsUserLocation
        onPress={e => setStartPin(e.nativeEvent.coordinate)}
      >
        {startPin && (
          <Marker coordinate={startPin} pinColor={COLORS.GREEN} title="Start here" />
        )}
      </MapView>

      {/* Overlay */}
      <View style={styles.dropPinOverlay}>
        <View style={styles.dropPinCard}>
          <Text style={styles.dropPinTitle}>Drop your starting point</Text>
          <Text style={styles.dropPinSub}>Tap the map to place your pin</Text>

          <View style={styles.dropPinButtons}>
            {currentLocation && (
              <TouchableOpacity
                style={styles.btnSecondary}
                onPress={() => setStartPin(currentLocation)}
              >
                <Text style={styles.btnText}>Use My Location</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.btnPrimary, !startPin && styles.btnDisabled]}
              onPress={startTrip}
              disabled={!startPin}
            >
              <Text style={styles.btnText}>Start Trip</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1 },

  // Drop pin
  dropPinOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  dropPinCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  dropPinTitle: {
    fontFamily: 'Sniglet_400Regular',
    fontSize: 20,
    color: COLORS.GREEN,
    marginBottom: 4,
  },
  dropPinSub: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: COLORS.GRAY,
    marginBottom: 16,
  },
  dropPinButtons: {
    flexDirection: 'row',
    gap: 12,
  },

  // Active trip
  activeContainer: {
    flex: 1,
    backgroundColor: COLORS.OFF_WHITE,
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: COLORS.WHITE,
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.LIGHT_GRAY,
  },
  statValue: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: COLORS.GREEN,
  },
  statLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: COLORS.GRAY,
    marginTop: 2,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: COLORS.DARK,
    marginBottom: 6,
  },
  sectionUnderline: {
    height: 1,
    backgroundColor: COLORS.LIGHT_GRAY,
  },

  // Bird list
  list: { flex: 1 },
  emptyText: {
    textAlign: 'center',
    color: COLORS.GRAY,
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    marginTop: 40,
  },
  birdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  birdInfo: { flex: 1 },
  birdName: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: COLORS.DARK,
  },
  birdTime: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: COLORS.GRAY,
    marginTop: 2,
  },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  counterBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: COLORS.LIGHT_GRAY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterBtnText: {
    fontSize: 16,
    color: COLORS.GREEN,
    includeFontPadding: false,
    lineHeight: 16,
  },
  counterValue: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: COLORS.DARK,
    minWidth: 20,
    textAlign: 'center',
  },

  // Input row
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    borderWidth: 1,
    borderColor: COLORS.LIGHT_GRAY,
  },
  addBtn: {
    backgroundColor: COLORS.GREEN,
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: 'center',
  },
  cameraBtn: {
    backgroundColor: COLORS.LIGHT_GREEN,
    paddingHorizontal: 14,
    borderRadius: 10,
    justifyContent: 'center',
  },

  // Identify screen
  identifyContainer: {
    padding: 16,
    gap: 16,
  },
  identifyPhoto: {
    width: '100%',
    height: 280,
    borderRadius: 16,
  },
  identifyResult: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 14,
    padding: 16,
    gap: 10,
  },
  identifyResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  identifyResultTitle: {
    fontFamily: 'Sniglet_400Regular',
    fontSize: 22,
    color: COLORS.GREEN,
    flex: 1,
  },
  identifyScientific: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: COLORS.GRAY,
    fontStyle: 'italic',
    marginTop: -4,
  },
  identifyResultBody: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: COLORS.DARK,
    lineHeight: 22,
  },
  rarityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  rarityCommon: { backgroundColor: '#d4edda' },
  rarityUncommon: { backgroundColor: '#fff3cd' },
  rarityRare: { backgroundColor: '#f8d7da' },
  rarityText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
  },
  identifyActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  identifyBack: {
    alignSelf: 'center',
    paddingVertical: 8,
  },
  identifyBackText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: COLORS.GRAY,
  },

  // Shared buttons
  btnPrimary: {
    flex: 1,
    backgroundColor: COLORS.GREEN,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnSecondary: {
    flex: 1,
    backgroundColor: COLORS.GRAY,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.4,
  },
  btnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: COLORS.WHITE,
  },
});
