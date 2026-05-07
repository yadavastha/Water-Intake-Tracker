import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OnboardingScreen from './OnboardingScreen';
import { View, Text, StyleSheet } from 'react-native';

export default function App() {
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('onboardingComplete').then((val) => {
      setOnboarded(val === 'true');
    });
  }, []);

  if (onboarded === null) return null;

  if (!onboarded) {
    return (
      <OnboardingScreen
        onComplete={() => setOnboarded(true)}
      />
    );
  }

  return (
    <View style={styles.placeholder}>
      <Text style={{ fontSize: 32 }}>💧</Text>
      <Text style={{ fontSize: 20, fontWeight: '700', marginTop: 12 }}>
        Onboarding complete!
      </Text>
      <Text style={{ color: '#666', marginTop: 8 }}>
        Home screen coming next.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F0F8FF',
  },
});