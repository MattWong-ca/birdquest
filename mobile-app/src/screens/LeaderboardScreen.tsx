import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useReactiveClient } from '@dynamic-labs/react-hooks';
import { dynamicClient } from '../client';
import { COLORS } from '../constants/theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

interface Quest {
  id: string;
  sponsor_name: string;
  sponsor_logo: string | null;
  prize_pool: number;
  starts_at: string;
  ends_at: string;
  status: string;
  schedule_id: string | null;
  top_n: number;
}

interface LeaderboardEntry {
  rank: number;
  wallet_address: string;
  username: string;
  total_score: number;
}

function truncateAddress(addr: string) {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function useCountdown(endDate: string | undefined) {
  const [remaining, setRemaining] = useState('');
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    if (!endDate) return;

    function tick() {
      const diff = new Date(endDate!).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining('Ended');
        setEnded(true);
        return;
      }
      setEnded(false);
      const days = Math.floor(diff / 86_400_000);
      const hrs = Math.floor((diff % 86_400_000) / 3_600_000);
      const mins = Math.floor((diff % 3_600_000) / 60_000);
      const secs = Math.floor((diff % 60_000) / 1000);

      if (days > 0) setRemaining(`${days}d ${hrs}h ${mins}m`);
      else if (hrs > 0) setRemaining(`${hrs}h ${mins}m ${secs}s`);
      else setRemaining(`${mins}m ${secs}s`);
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endDate]);

  return { remaining, ended };
}

const RANK_COLORS: Record<number, string> = {
  1: '#FFD700',
  2: '#C0C0C0',
  3: '#CD7F32',
};

const RANK_ICONS: Record<number, string> = {
  1: 'trophy',
  2: 'medal',
  3: 'medal-outline',
};

export default function LeaderboardScreen() {
  const { wallets } = useReactiveClient(dynamicClient);
  const walletAddress = wallets.userWallets[0]?.address ?? '';

  const [quest, setQuest] = useState<Quest | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { remaining, ended } = useCountdown(quest?.ends_at);

  const fetchData = useCallback(async () => {
    try {
      const url = `${API_URL}/api/quests${walletAddress ? `?wallet=${walletAddress}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      setQuest(data.quest ?? null);
      setLeaderboard(data.leaderboard ?? []);
      setUserRank(data.userRank ?? null);
    } catch {
      /* network error — keep stale data */
    }
  }, [walletAddress]);

  useEffect(() => {
    setLoading(true);
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.GREEN} />
      </View>
    );
  }

  if (!quest) {
    return (
      <View style={[styles.container, styles.center]}>
        <MaterialCommunityIcons name="trophy-broken" size={48} color={COLORS.LIGHT_GREEN} />
        <Text style={styles.emptyTitle}>No Active Quest</Text>
        <Text style={styles.emptySubtitle}>Check back soon for the next weekly challenge!</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.GREEN} />}
    >
      {/* ── Quest Banner ── */}
      <View style={styles.questCard}>
        <Text style={styles.questLabel}>WEEKLY QUEST</Text>
        <Text style={styles.sponsorName}>Sponsored by {quest.sponsor_name}</Text>

        <View style={styles.prizeRow}>
          <View style={styles.prizeBox}>
            <Text style={styles.prizeAmount}>
              {(quest.prize_pool / 100_000_000).toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </Text>
            <Text style={styles.prizeUnit}>HBAR Prize Pool</Text>
          </View>
        </View>

        <View style={styles.timerRow}>
          <Ionicons name="time-outline" size={18} color={ended ? COLORS.GRAY : COLORS.GREEN} />
          <Text style={[styles.timerText, ended && styles.timerEnded]}>
            {ended ? 'Quest ended' : remaining}
          </Text>
        </View>

        {quest.status === 'distributing' && quest.schedule_id && (
          <TouchableOpacity
            style={styles.hashscanButton}
            activeOpacity={0.7}
            onPress={() =>
              Linking.openURL(`https://hashscan.io/testnet/schedule/${quest.schedule_id}`)
            }
          >
            <Ionicons name="open-outline" size={14} color={COLORS.WHITE} />
            <Text style={styles.hashscanText}>View payout on Hashscan</Text>
          </TouchableOpacity>
        )}

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Top {quest.top_n} win</Text>
          <Text style={styles.infoLabel}>Score by logging trips</Text>
        </View>
      </View>

      {/* ── User rank callout ── */}
      {userRank !== null && (
        <View style={styles.rankCallout}>
          <Text style={styles.rankCalloutText}>
            You're #{userRank} on the leaderboard
          </Text>
        </View>
      )}

      {/* ── Leaderboard ── */}
      <Text style={styles.sectionTitle}>Leaderboard</Text>

      {leaderboard.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptySubtitle}>No trips logged yet during this quest.</Text>
        </View>
      ) : (
        leaderboard.map((entry) => {
          const isUser =
            walletAddress && entry.wallet_address.toLowerCase() === walletAddress.toLowerCase();
          const isTop3 = entry.rank <= 3;

          return (
            <View
              key={entry.wallet_address}
              style={[styles.leaderRow, isUser && styles.leaderRowHighlight]}
            >
              {/* Rank badge */}
              <View
                style={[
                  styles.rankBadge,
                  isTop3 && { backgroundColor: RANK_COLORS[entry.rank] + '22' },
                ]}
              >
                {isTop3 ? (
                  <Ionicons
                    name={(RANK_ICONS[entry.rank] ?? 'medal-outline') as any}
                    size={18}
                    color={RANK_COLORS[entry.rank]}
                  />
                ) : (
                  <Text style={styles.rankNumber}>{entry.rank}</Text>
                )}
              </View>

              {/* User info */}
              <View style={styles.leaderInfo}>
                <Text style={[styles.leaderName, isUser && styles.leaderNameHighlight]}>
                  {entry.username ? `@${entry.username}` : truncateAddress(entry.wallet_address)}
                  {isUser ? '  (you)' : ''}
                </Text>
              </View>

              {/* Score */}
              <Text style={[styles.leaderScore, isTop3 && { color: COLORS.GREEN }]}>
                {entry.total_score.toLocaleString()} BIRD
              </Text>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.OFF_WHITE },
  content: { padding: 16, paddingBottom: 32, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },

  /* Empty state */
  emptyTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: COLORS.DARK,
    marginTop: 8,
  },
  emptySubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: COLORS.GRAY,
    textAlign: 'center',
  },

  /* Quest card */
  questCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 20,
    padding: 24,
    gap: 10,
    alignItems: 'center',
  },
  questLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    letterSpacing: 1.5,
    color: COLORS.LIGHT_GREEN,
  },
  sponsorName: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: COLORS.GRAY,
  },

  prizeRow: { marginVertical: 4 },
  prizeBox: { alignItems: 'center' },
  prizeAmount: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 36,
    color: COLORS.GREEN,
  },
  prizeUnit: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: COLORS.GRAY,
    marginTop: -4,
  },

  timerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timerText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: COLORS.GREEN,
  },
  timerEnded: { color: COLORS.GRAY },

  hashscanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.GREEN,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 4,
  },
  hashscanText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: COLORS.WHITE,
  },

  divider: {
    width: '100%',
    height: 1,
    backgroundColor: COLORS.LIGHT_GRAY,
    marginVertical: 2,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  infoLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: COLORS.GRAY,
  },

  /* User rank callout */
  rankCallout: {
    backgroundColor: COLORS.GREEN + '15',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  rankCalloutText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: COLORS.GREEN,
  },

  sectionTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: COLORS.DARK,
    marginTop: 4,
  },

  /* Leaderboard rows */
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  leaderRowHighlight: {
    borderWidth: 1.5,
    borderColor: COLORS.GREEN,
  },

  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.OFF_WHITE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumber: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: COLORS.GRAY,
  },

  leaderInfo: { flex: 1 },
  leaderName: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: COLORS.DARK,
  },
  leaderNameHighlight: { color: COLORS.GREEN },

  leaderScore: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: COLORS.DARK,
  },
});
