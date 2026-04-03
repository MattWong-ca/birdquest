import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useReactiveClient } from '@dynamic-labs/react-hooks';
import { dynamicClient } from '../client';
import { COLORS } from '../constants/theme';

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function TopBar() {
  const insets = useSafeAreaInsets();
  const { wallets } = useReactiveClient(dynamicClient);
  const address = wallets?.[0]?.address;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <TouchableOpacity onPress={() => dynamicClient.ui.userProfile.show()}>
        <Text style={styles.address}>
          {address ? truncateAddress(address) : '...'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => dynamicClient.auth.logout()} hitSlop={8}>
        <Ionicons name="exit-outline" size={24} color={COLORS.GREEN} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.LIGHT_GRAY,
  },
  address: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: COLORS.GREEN,
  },
});
