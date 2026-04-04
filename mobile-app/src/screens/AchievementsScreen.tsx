import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useReactiveClient } from '@dynamic-labs/react-hooks';
import { dynamicClient } from '../client';
import { COLORS } from '../constants/theme';
import { CANNES_BIRDS, Rarity } from '../constants/birds';

type Tab = 'badges' | 'collection';

interface NFTBadge {
  tokenId: string;
  serial: number;
  name: string;
  description: string;
  image: string;
}

const MIRROR_BASE = 'https://testnet.mirrornode.hedera.com/api/v1';
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

const SCREEN_WIDTH = Dimensions.get('window').width;
const COLLECTION_PADDING = 16;
const COLLECTION_COLS = 5;
const COLLECTION_GAP = 8;
const CELL_SIZE = Math.floor((SCREEN_WIDTH - COLLECTION_PADDING * 2 - COLLECTION_GAP * (COLLECTION_COLS - 1)) / COLLECTION_COLS);

const RARITIES: Rarity[] = ['Common', 'Uncommon', 'Rare'];
const RARITY_COLORS: Record<Rarity, string> = {
  Common: COLORS.GRAY,
  Uncommon: '#2980b9',
  Rare: '#8e44ad',
};

async function fetchNFTsForAddress(evmAddress: string): Promise<NFTBadge[]> {
  const res = await fetch(`${MIRROR_BASE}/accounts/${evmAddress}/nfts?limit=50`);
  const data = await res.json();
  const nfts: any[] = data.nfts ?? [];

  const badges: NFTBadge[] = [];
  for (const nft of nfts) {
    try {
      const decoded = Buffer.from(nft.metadata, 'base64').toString('utf8');
      const meta = JSON.parse(decoded);
      badges.push({
        tokenId: nft.token_id,
        serial: nft.serial_number,
        name: meta.name ?? 'Badge',
        description: meta.description ?? '',
        image: meta.image ?? '',
      });
    } catch {
      // skip unparseable metadata
    }
  }
  return badges;
}

async function fetchSeenBirds(walletAddress: string): Promise<Set<string>> {
  const res = await fetch(`${API_URL}/api/my-birds?wallet=${walletAddress}`);
  const data = await res.json();
  return new Set<string>(data.birds ?? []);
}

export default function AchievementsScreen() {
  const { wallets } = useReactiveClient(dynamicClient);
  const walletAddress = wallets.userWallets[0]?.address ?? '';

  const [tab, setTab] = useState<Tab>('badges');

  // Badges state
  const [badges, setBadges] = useState<NFTBadge[]>([]);
  const [badgesLoading, setBadgesLoading] = useState(false);
  const [badgesError, setBadgesError] = useState<string | null>(null);

  // Collection state
  const [seenBirds, setSeenBirds] = useState<Set<string>>(new Set());
  const [collectionLoading, setCollectionLoading] = useState(false);
  const [collectionError, setCollectionError] = useState<string | null>(null);

  useEffect(() => {
    if (!walletAddress || tab !== 'badges') return;
    setBadgesLoading(true);
    setBadgesError(null);
    fetchNFTsForAddress(walletAddress)
      .then(setBadges)
      .catch(e => setBadgesError(e.message))
      .finally(() => setBadgesLoading(false));
  }, [walletAddress, tab]);

  useEffect(() => {
    if (!walletAddress || tab !== 'collection') return;
    setCollectionLoading(true);
    setCollectionError(null);
    fetchSeenBirds(walletAddress)
      .then(setSeenBirds)
      .catch(e => setCollectionError(e.message))
      .finally(() => setCollectionLoading(false));
  }, [walletAddress, tab]);

  return (
    <View style={styles.container}>
      {/* Tab bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, tab === 'badges' && styles.tabActive]}
          onPress={() => setTab('badges')}
        >
          <Text style={[styles.tabText, tab === 'badges' && styles.tabTextActive]}>Badges</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'collection' && styles.tabActive]}
          onPress={() => setTab('collection')}
        >
          <Text style={[styles.tabText, tab === 'collection' && styles.tabTextActive]}>Collection</Text>
        </TouchableOpacity>
      </View>

      {/* Badges tab */}
      {tab === 'badges' && (
        <>
          {badgesLoading && (
            <View style={styles.center}>
              <ActivityIndicator color={COLORS.GREEN} />
            </View>
          )}
          {badgesError && (
            <View style={styles.center}>
              <Text style={styles.errorText}>{badgesError}</Text>
            </View>
          )}
          {!badgesLoading && !badgesError && (
            <FlatList
              data={badges}
              keyExtractor={b => `${b.tokenId}-${b.serial}`}
              numColumns={2}
              contentContainerStyle={styles.grid}
              columnWrapperStyle={styles.row}
              ListEmptyComponent={
                <View style={styles.center}>
                  <Text style={styles.emptyText}>No badges yet — complete a trip to earn one!</Text>
                </View>
              }
              renderItem={({ item }) => (
                <View style={styles.badgeCard}>
                  {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.badgeImage} />
                  ) : (
                    <View style={[styles.badgeImage, styles.badgePlaceholder]} />
                  )}
                  <Text style={styles.badgeName}>{item.name}</Text>
                  {item.description ? (
                    <Text style={styles.badgeDesc}>{item.description}</Text>
                  ) : null}
                </View>
              )}
            />
          )}
        </>
      )}

      {/* Collection tab */}
      {tab === 'collection' && (
        <>
          {collectionLoading && (
            <View style={styles.center}>
              <ActivityIndicator color={COLORS.GREEN} />
            </View>
          )}
          {collectionError && (
            <View style={styles.center}>
              <Text style={styles.errorText}>{collectionError}</Text>
            </View>
          )}
          {!collectionLoading && !collectionError && (
            <ScrollView contentContainerStyle={styles.collectionScroll}>
              {RARITIES.map(rarity => {
                const group = CANNES_BIRDS.filter(b => b.rarity === rarity);
                const seen = group.filter(b => seenBirds.has(b.name)).length;
                return (
                  <View key={rarity} style={styles.raritySection}>
                    <View style={styles.rarityHeader}>
                      <View style={[styles.rarityDot, { backgroundColor: RARITY_COLORS[rarity] }]} />
                      <Text style={[styles.rarityLabel, { color: RARITY_COLORS[rarity] }]}>{rarity}</Text>
                      <Text style={styles.rarityCount}>{seen}/{group.length}</Text>
                    </View>
                    <View style={styles.collectionGrid}>
                      {group.map(bird => {
                        const spotted = seenBirds.has(bird.name);
                        return (
                          <View key={bird.id} style={styles.collectionCell}>
                            {spotted ? (
                              <Image source={{ uri: bird.image }} style={styles.collectionImage} />
                            ) : (
                              <View style={styles.collectionLocked}>
                                <Text style={styles.collectionQ}>?</Text>
                              </View>
                            )}
                            <Text style={styles.collectionName} numberOfLines={2}>
                              {spotted ? bird.name : ' '}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.OFF_WHITE },

  // Tabs
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.LIGHT_GRAY,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: COLORS.GREEN,
  },
  tabText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: COLORS.GRAY,
  },
  tabTextActive: {
    color: COLORS.GREEN,
  },

  // Badges grid
  grid: { padding: 16, gap: 12 },
  row: { gap: 12 },
  badgeCard: {
    width: '47%',
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 10,
  },
  badgeImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  badgePlaceholder: {
    backgroundColor: COLORS.LIGHT_GRAY,
  },
  badgeName: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: COLORS.DARK,
    textAlign: 'center',
  },
  badgeDesc: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: COLORS.GRAY,
    textAlign: 'center',
  },

  // Collection
  collectionScroll: { padding: 16, gap: 24 },
  raritySection: { gap: 12 },
  rarityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rarityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  rarityLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    flex: 1,
  },
  rarityCount: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: COLORS.GRAY,
  },
  collectionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: COLLECTION_GAP,
  },
  collectionCell: {
    width: CELL_SIZE,
    alignItems: 'center',
    gap: 4,
  },
  collectionImage: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 10,
  },
  collectionLocked: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 10,
    backgroundColor: COLORS.LIGHT_GRAY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collectionQ: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 22,
    color: COLORS.GRAY,
  },
  collectionName: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
    color: COLORS.DARK,
    textAlign: 'center',
    minHeight: 28,
  },

  // States
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: COLORS.GRAY,
    textAlign: 'center',
  },
  errorText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: '#c0392b',
    textAlign: 'center',
  },
});
