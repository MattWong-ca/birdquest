import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Linking,
  Modal,
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
import * as ExpoSharing from 'expo-sharing';
import ViewShot from 'react-native-view-shot';
import { Ionicons } from '@expo/vector-icons';
import { useReactiveClient } from '@dynamic-labs/react-hooks';
import { dynamicClient } from '../client';
import { BIRD_NAMES, CANNES_BIRDS, findBird, type Bird } from '../constants/birds';
import { COLORS } from '../constants/theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
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

interface TripResult {
  elapsed: number;
  distance: number;
  birds: BirdEntry[];
  score: number;
  walletAddress: string;
  photoUri?: string;
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

// ── Trip Complete Modal ───────────────────────────────────────────────────────

function TripCompleteModal({ result, onDone }: { result: TripResult; onDone: () => void }) {
  const viewShotRef = useRef<any>(null);
  const [isSharing, setIsSharing] = useState(false);

  const hashscanUrl = `https://hashscan.io/testnet/address/${result.walletAddress}`;

  // Background: photo taken during trip, or most common bird's image
  const mostCommonBird = result.birds.length > 0
    ? result.birds.reduce((max, b) => b.count > max.count ? b : max, result.birds[0])
    : null;
  const bgImage = result.photoUri
    ? { uri: result.photoUri }
    : mostCommonBird ? { uri: findBird(mostCommonBird.name)?.image ?? '' } : null;

  async function shareTrip() {
    setIsSharing(true);
    try {
      const uri = await viewShotRef.current?.capture();
      if (uri && await ExpoSharing.isAvailableAsync()) {
        await ExpoSharing.shareAsync(uri, { mimeType: 'image/png' });
      }
    } catch (e: any) {
      Alert.alert('Share failed', e.message);
    } finally {
      setIsSharing(false);
    }
  }

  return (
    <Modal transparent animationType="fade" visible>
      <View style={mStyles.overlay}>
        <View style={mStyles.card}>

          <Text style={mStyles.title}>Trip Complete!</Text>

          {/* Share card — captured as image */}
          {(() => {
            const totalBirds = result.birds.reduce((sum, b) => sum + b.count, 0);
            const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const bgSrc = bgImage ?? { uri: '' };
            const cardContent = (
              <>
                {/* BirdQuest branding top-right */}
                <Text style={mStyles.brandText}>BirdQuest</Text>

                {/* Bottom overlay */}
                <View style={mStyles.shareCardOverlay}>
                  <View style={mStyles.statsRow}>
                    {/* Left: big bird count */}
                    <View style={mStyles.statsBigCol}>
                      <Text style={mStyles.statsBigLabel}>Birds</Text>
                      <Text style={mStyles.statsBigNumber}>{totalBirds}</Text>
                    </View>
                    {/* Right: 2-column aligned */}
                    <View style={mStyles.statsDetailGrid}>
                      <View style={mStyles.statsDetailCol}>
                        <Text style={mStyles.statsDetailKey}>Time</Text>
                        <Text style={mStyles.statsDetailKey}>Dist</Text>
                      </View>
                      <View style={mStyles.statsDetailCol}>
                        <Text style={mStyles.statsDetailVal}>{Math.floor(result.elapsed / 60)} min</Text>
                        <Text style={mStyles.statsDetailVal}>{formatDistance(result.distance)}</Text>
                      </View>
                      <View style={[mStyles.statsDetailCol, { marginLeft: 12 }]}>
                        <Text style={mStyles.statsDetailKey}>Date</Text>
                        <Text style={mStyles.statsDetailKey}>City</Text>
                      </View>
                      <View style={mStyles.statsDetailCol}>
                        <Text style={mStyles.statsDetailVal}>{dateStr}</Text>
                        <Text style={mStyles.statsDetailVal}>Cannes 🇫🇷</Text>
                      </View>
                    </View>
                  </View>
                  {result.birds.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={mStyles.thumbsRow}>
                        {result.birds.map(b => {
                          const img = findBird(b.name)?.image;
                          return img ? (
                            <Image key={b.id} source={{ uri: img }} style={mStyles.birdThumb} />
                          ) : null;
                        })}
                      </View>
                    </ScrollView>
                  )}
                </View>
              </>
            );

            return (
              <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
                <View style={mStyles.shareCard}>
                  {bgImage ? (
                    <ImageBackground source={bgSrc} style={mStyles.shareCardBg} imageStyle={{ borderRadius: 16 }}>
                      {cardContent}
                    </ImageBackground>
                  ) : (
                    <View style={[mStyles.shareCardBg, { backgroundColor: COLORS.GREEN, borderRadius: 16 }]}>
                      {cardContent}
                    </View>
                  )}
                </View>
              </ViewShot>
            );
          })()}

          {/* Hashscan link */}
          <TouchableOpacity style={mStyles.hashscanBtn} onPress={() => Linking.openURL(hashscanUrl)}>
            <Ionicons name="open-outline" size={15} color={COLORS.GREEN} />
            <Text style={mStyles.hashscanText}>View BIRD tokens on Hashscan</Text>
          </TouchableOpacity>

          {/* Action buttons */}
          <View style={mStyles.btnRow}>
            <TouchableOpacity style={mStyles.shareBtn} onPress={shareTrip} disabled={isSharing}>
              {isSharing
                ? <ActivityIndicator color={COLORS.WHITE} />
                : <>
                    <Ionicons name="share-outline" size={16} color={COLORS.WHITE} />
                    <Text style={mStyles.shareBtnText}>Share</Text>
                  </>
              }
            </TouchableOpacity>
            <TouchableOpacity style={mStyles.doneBtn} onPress={onDone}>
              <Text style={mStyles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function NewTripScreen() {
  const { wallets, auth } = useReactiveClient(dynamicClient);
  const walletAddress = wallets.userWallets[0]?.address ?? '';
  const username = auth.authenticatedUser?.username ?? '';

  const [tripState, setTripState] = useState<TripState>('drop-pin');
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [startPin, setStartPin] = useState<{ latitude: number; longitude: number } | null>(null);

  // Trip stats
  const [elapsed, setElapsed] = useState(0);
  const [distance, setDistance] = useState(0);
  const [birds, setBirds] = useState<BirdEntry[]>([]);
  const [birdInput, setBirdInput] = useState('');
  const [isLoggingTrip, setIsLoggingTrip] = useState(false);
  const [tripResult, setTripResult] = useState<TripResult | null>(null);

  // Identify
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [identifyDescription, setIdentifyDescription] = useState<string | null>(null);
  const [matchedBird, setMatchedBird] = useState<Bird | null>(null);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [isSubmittingInat, setIsSubmittingInat] = useState(false);
  const [inatSubmitted, setInatSubmitted] = useState(false);

  const lastLocation = useRef<{ latitude: number; longitude: number } | null>(null);
  const tripStartPin = useRef<{ latitude: number; longitude: number } | null>(null);
  const tripPhotoUri = useRef<string | null>(null);
  const locationSub = useRef<Location.LocationSubscription | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        setCurrentLocation(coords);
        setStartPin(coords);
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
    tripStartPin.current = startPin;
    tripPhotoUri.current = null;
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

  async function endTrip() {
    timerRef.current && clearInterval(timerRef.current);
    locationSub.current?.remove();
    setIsLoggingTrip(true);

    const pin = tripStartPin.current;
    try {
      const res = await fetch(`${API_URL}/api/log-trip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress,
          username,
          duration: elapsed,
          distance,
          birds,
          startLat: pin?.latitude ?? 0,
          startLon: pin?.longitude ?? 0,
        }),
      });
      const data = await res.json();
      setIsLoggingTrip(false);
      setTripResult({ elapsed, distance, birds, score: data.score ?? 0, walletAddress, photoUri: tripPhotoUri.current ?? undefined });
    } catch {
      setIsLoggingTrip(false);
      setTripResult({ elapsed, distance, birds, score: 0, walletAddress, photoUri: tripPhotoUri.current ?? undefined });
    }
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
    const result = await ImagePicker.launchCameraAsync({ base64: true, quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setPhotoUri(uri);
      if (!tripPhotoUri.current) tripPhotoUri.current = uri;
      setPhotoBase64(result.assets[0].base64 ?? null);
      setIdentifyDescription(null);
      setMatchedBird(null);
      setInatSubmitted(false);
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
      const raw = data.content?.[0]?.text ?? '{}';
      const text = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
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

  const [inatUrl, setInatUrl] = useState<string | null>(null);

  async function submitToINat() {
    if (!matchedBird) return;
    setIsSubmittingInat(true);
    try {
      const loc = lastLocation.current;
      const res = await fetch(`${API_URL}/api/submit-inat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          birdName: matchedBird.name,
          scientificName: matchedBird.scientificName,
          lat: loc?.latitude ?? 0,
          lon: loc?.longitude ?? 0,
          photoBase64,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setInatUrl(data.url);
      setInatSubmitted(true);
    } catch (e: any) {
      Alert.alert('iNaturalist error', e.message);
    } finally {
      setIsSubmittingInat(false);
    }
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
              : <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="sparkles" size={16} color={COLORS.WHITE} />
                  <Text style={styles.btnText}>Identify Bird</Text>
                </View>
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
          </View>
        )}

        {/* Add to trip */}
        {matchedBird && (
          <TouchableOpacity style={styles.btnPrimary} onPress={addIdentifiedBird}>
            <Text style={styles.btnText}>Add to Trip</Text>
          </TouchableOpacity>
        )}

        {/* iNaturalist section */}
        {matchedBird && (
          <View style={styles.inatSection}>
            <Text style={styles.inatTitle}>Submit to iNaturalist</Text>
            <Text style={styles.inatSub}>Help the biggest biodiversity database with your sighting</Text>

            {!inatSubmitted ? (
              <TouchableOpacity
                style={[styles.inatBtn, isSubmittingInat && styles.btnDisabled]}
                onPress={submitToINat}
                disabled={isSubmittingInat}
              >
                {isSubmittingInat
                  ? <ActivityIndicator color={COLORS.WHITE} />
                  : <Text style={styles.btnText}>Submit to iNaturalist</Text>
                }
              </TouchableOpacity>
            ) : (
              <View style={styles.inatSuccess}>
                <Ionicons name="checkmark-circle" size={20} color="#27ae60" />
                <Text style={styles.inatSuccessText}>Submitted!</Text>
                {inatUrl && (
                  <TouchableOpacity onPress={() => Linking.openURL(inatUrl)}>
                    <Text style={styles.inatLink}>View on iNaturalist →</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
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

          {/* Trip complete modal */}
          {tripResult && (
            <TripCompleteModal
              result={tripResult}
              onDone={() => { setTripResult(null); setTripState('drop-pin'); setBirds([]); }}
            />
          )}

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

          {/* Autocomplete suggestions */}
          {birdInput.trim().length > 0 && (() => {
            const suggestions = CANNES_BIRDS.filter(b =>
              b.name.toLowerCase().includes(birdInput.toLowerCase())
            ).slice(0, 5);
            return suggestions.length > 0 ? (
              <View style={styles.suggestions}>
                {suggestions.map(b => (
                  <TouchableOpacity
                    key={b.id}
                    style={styles.suggestionItem}
                    onPress={() => addBird(b.name)}
                  >
                    <Text style={styles.suggestionText}>{b.name}</Text>
                    <Text style={styles.suggestionRarity}>{b.rarity}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null;
          })()}

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
              <Text style={styles.emptyText}>No birds logged yet — add one above</Text>
            }
            renderItem={({ item }) => {
              const birdData = findBird(item.name);
              return (
                <View style={styles.birdRow}>
                  {birdData?.image && (
                    <Image source={{ uri: birdData.image }} style={styles.birdImg} />
                  )}
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
              );
            }}
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
            <TouchableOpacity style={styles.statItem} onPress={endTrip} disabled={isLoggingTrip}>
              {isLoggingTrip
                ? <ActivityIndicator color="#c0392b" />
                : <Ionicons name="stop-circle-outline" size={28} color="#c0392b" />
              }
              <Text style={[styles.statLabel, { color: '#c0392b' }]}>{isLoggingTrip ? 'Saving...' : 'End'}</Text>
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

      <View style={styles.dropPinOverlay}>
        <View style={styles.dropPinCard}>
          <Text style={styles.dropPinTitle}>Drop your starting point</Text>
          <Text style={styles.dropPinSub}>Tap the map to place your pin</Text>
          <View style={styles.dropPinButtons}>
            {currentLocation && (
              <TouchableOpacity style={styles.btnSecondary} onPress={() => setStartPin(currentLocation)}>
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
  dropPinOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16 },
  dropPinCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  dropPinTitle: { fontFamily: 'Sniglet_400Regular', fontSize: 20, color: COLORS.GREEN, marginBottom: 4 },
  dropPinSub: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: COLORS.GRAY, marginBottom: 16 },
  dropPinButtons: { flexDirection: 'row', gap: 12 },

  // Active trip
  activeContainer: { flex: 1, backgroundColor: COLORS.OFF_WHITE, paddingTop: 16, paddingHorizontal: 16 },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: COLORS.WHITE,
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 16,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 32, backgroundColor: COLORS.LIGHT_GRAY },
  statValue: { fontFamily: 'Poppins_600SemiBold', fontSize: 18, color: COLORS.GREEN },
  statLabel: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: COLORS.GRAY, marginTop: 2 },
  sectionHeader: { marginBottom: 12 },
  sectionTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: COLORS.DARK, marginBottom: 6 },
  sectionUnderline: { height: 1, backgroundColor: COLORS.LIGHT_GRAY },

  // Bird list
  list: { flex: 1 },
  emptyText: { textAlign: 'center', color: COLORS.GRAY, fontFamily: 'Poppins_400Regular', fontSize: 13, marginTop: 40 },
  birdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  birdImg: { width: 44, height: 44, borderRadius: 8, marginRight: 12 },
  birdInfo: { flex: 1 },
  birdName: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: COLORS.DARK },
  birdTime: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: COLORS.GRAY, marginTop: 2 },
  counter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  counterBtn: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: COLORS.LIGHT_GRAY, alignItems: 'center', justifyContent: 'center',
  },
  counterBtnText: { fontSize: 16, color: COLORS.GREEN, includeFontPadding: false, lineHeight: 16 },
  counterValue: { fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: COLORS.DARK, minWidth: 20, textAlign: 'center' },

  // Input row
  inputRow: { flexDirection: 'row', gap: 8, marginTop: 8, marginBottom: 12 },
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
  addBtn: { backgroundColor: COLORS.GREEN, paddingHorizontal: 16, borderRadius: 10, justifyContent: 'center' },
  cameraBtn: { backgroundColor: COLORS.LIGHT_GREEN, paddingHorizontal: 14, borderRadius: 10, justifyContent: 'center' },

  // Suggestions
  suggestions: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.LIGHT_GRAY,
    marginBottom: 8,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.LIGHT_GRAY,
    gap: 10,
  },
  suggestionImg: { width: 32, height: 32, borderRadius: 6 },
  suggestionText: { flex: 1, fontFamily: 'Poppins_400Regular', fontSize: 13, color: COLORS.DARK },
  suggestionRarity: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: COLORS.GRAY },

  // Identify screen
  identifyContainer: { padding: 16, gap: 16 },
  identifyPhoto: { width: '100%', aspectRatio: 3 / 4, borderRadius: 16 },
  identifyResult: { backgroundColor: COLORS.WHITE, borderRadius: 14, padding: 16, gap: 10 },
  identifyResultHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  identifyResultTitle: { fontFamily: 'Sniglet_400Regular', fontSize: 22, color: COLORS.GREEN, flex: 1 },
  identifyResultBody: { fontFamily: 'Poppins_400Regular', fontSize: 14, color: COLORS.DARK, lineHeight: 22 },
  rarityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  rarityCommon: { backgroundColor: '#d4edda' },
  rarityUncommon: { backgroundColor: '#fff3cd' },
  rarityRare: { backgroundColor: '#f8d7da' },
  rarityText: { fontFamily: 'Poppins_600SemiBold', fontSize: 11 },

  // iNat section
  inatSection: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 14,
    padding: 16,
    gap: 8,
  },
  inatTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 15, color: COLORS.DARK },
  inatSub: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: COLORS.GRAY },
  inatBtn: {
    backgroundColor: '#74ac00',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  inatSuccess: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 4 },
  inatSuccessText: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: '#27ae60' },
  inatLink: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: COLORS.GREEN, textDecorationLine: 'underline' },

  identifyBack: { alignSelf: 'center', paddingVertical: 8 },
  identifyBackText: { fontFamily: 'Poppins_400Regular', fontSize: 14, color: COLORS.GRAY },

  // Shared buttons
  btnPrimary: { flex: 1, backgroundColor: COLORS.GREEN, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  btnSecondary: { flex: 1, backgroundColor: COLORS.GRAY, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  btnDisabled: { opacity: 0.4 },
  btnText: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: COLORS.WHITE },
});

// ── Modal Styles ──────────────────────────────────────────────────────────────

const mStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 20,
    padding: 20,
    gap: 14,
  },
  title: {
    fontFamily: 'Sniglet_400Regular',
    fontSize: 26,
    color: COLORS.GREEN,
    textAlign: 'center',
  },

  // Share card
  shareCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  shareCardBg: {
    height: 400,
    justifyContent: 'flex-end',
  },
  brandText: {
    position: 'absolute',
    top: 14,
    right: 14,
    fontFamily: 'Sniglet_400Regular',
    fontSize: 20,
    color: COLORS.WHITE,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  shareCardOverlay: {
    backgroundColor: 'rgba(60,60,60,0.72)',
    padding: 10,
    paddingTop: 6,
    gap: 6,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statsBigCol: {
    alignItems: 'center',
    marginTop: 8,
    minWidth: 56,
  },
  statsBigLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.5,
  },
  statsBigNumber: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 52,
    color: COLORS.WHITE,
    lineHeight: 58,
    marginTop: 2,
  },
  statsDetailGrid: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
  },
  statsDetailCol: {
    gap: 5,
  },
  statsDetailKey: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 20,
  },
  statsDetailVal: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: COLORS.WHITE,
    lineHeight: 20,
  },
  thumbsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  birdThumb: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
  },

  // Hashscan
  hashscanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.GREEN,
  },
  hashscanText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: COLORS.GREEN,
  },

  // Buttons
  btnRow: { flexDirection: 'row', gap: 12 },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.LIGHT_GREEN,
    paddingVertical: 14,
    borderRadius: 12,
  },
  shareBtnText: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: COLORS.WHITE },
  doneBtn: {
    flex: 1,
    backgroundColor: COLORS.GREEN,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneBtnText: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: COLORS.WHITE },
});
