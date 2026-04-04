import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useReactiveClient } from '@dynamic-labs/react-hooks';
import { dynamicClient } from '../client';
import { COLORS } from '../constants/theme';

type Tab = 'badges' | 'collection';

interface NFTBadge {
  tokenId: string;
  serial: number;
  name: string;
  description: string;
  image: string;
}

const MIRROR_BASE = 'https://testnet.mirrornode.hedera.com/api/v1';

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

export default function AchievementsScreen() {
  const { wallets } = useReactiveClient(dynamicClient);
  const walletAddress = wallets.userWallets[0]?.address ?? '';

  const [tab, setTab] = useState<Tab>('badges');
  const [badges, setBadges] = useState<NFTBadge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!walletAddress || tab !== 'badges') return;
    setLoading(true);
    setError(null);
    fetchNFTsForAddress(walletAddress)
      .then(setBadges)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
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
          {loading && (
            <View style={styles.center}>
              <ActivityIndicator color={COLORS.GREEN} />
            </View>
          )}
          {error && (
            <View style={styles.center}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          {!loading && !error && (
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
        <View style={styles.center}>
          <Text style={styles.emptyText}>Collection coming soon</Text>
        </View>
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

  // Grid
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
