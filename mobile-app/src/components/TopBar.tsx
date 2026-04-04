import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReactiveClient } from '@dynamic-labs/react-hooks';
import { dynamicClient } from '../client';
import { COLORS } from '../constants/theme';

export default function TopBar() {
  const insets = useSafeAreaInsets();
  const { auth } = useReactiveClient(dynamicClient);
  const username = auth.authenticatedUser?.username ?? '';

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <TouchableOpacity onPress={() => dynamicClient.ui.userProfile.show()}>
        <Text style={styles.address}>
          {username ? `@${username}` : ''}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
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
