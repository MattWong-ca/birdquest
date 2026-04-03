import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';

export default function AchievementsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Achievements</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.OFF_WHITE },
  text: { fontSize: 24, color: COLORS.GREEN },
});
