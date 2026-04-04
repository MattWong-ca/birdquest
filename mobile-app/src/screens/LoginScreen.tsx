import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground, Alert } from 'react-native';
import { COLORS } from '../constants/theme';
import { dynamicClient } from '../client';

export default function LoginScreen() {
  return (
    <ImageBackground
      source={require('../../assets/wallpaper.png')}
      style={styles.bg}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <Text style={styles.title}>BirdQuest</Text>

        <TouchableOpacity style={styles.button} onPress={() => {
          try {
            dynamicClient.ui.auth.show();
          } catch (e: any) {
            Alert.alert('Auth error', e?.message ?? String(e));
          }
        }}>
          <Text style={styles.buttonText}>Log In</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: '80%',
    paddingBottom: '50%',
  },
  title: {
    fontFamily: 'Sniglet_400Regular',
    fontSize: 52,
    color: COLORS.GREEN,
  },
  button: {
    backgroundColor: COLORS.GREEN,
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 30,
  },
  buttonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: COLORS.WHITE,
  },
});
