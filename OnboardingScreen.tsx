/**
 * OnboardingScreen.tsx
 * Water Intake Tracker — 8x Engineer Contest
 *
 * A 4-step onboarding flow:
 *   Step 0: Welcome
 *   Step 1: Name
 *   Step 2: Weight + Activity Level
 *   Step 3: Calculated Goal + CTA
 *
 * Dependencies:
 *   npx expo install expo-linear-gradient @react-native-async-storage/async-storage
 *   npm install react-native-svg
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path, Circle, Defs, LinearGradient as SvgGradient, Stop, Text as SvgText } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Types ────────────────────────────────────────────────────────────────────

type ActivityLevel = 'sedentary' | 'moderate' | 'active';

interface UserProfile {
  name: string;
  weightKg: number;
  activityLevel: ActivityLevel;
  dailyGoalMl: number;
  unit: 'metric' | 'imperial';
}

interface OnboardingScreenProps {
  onComplete: (profile: UserProfile) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COLORS = {
  water: '#1B8FD8',
  waterLight: '#5BB8F5',
  waterDeep: '#0D5FA0',
  accent: '#00C9A7',
  surface: '#F0F8FF',
  card: '#FFFFFF',
  text: '#0A1628',
  muted: '#6B8BAE',
  stepBg: '#E8F4FD',
  border: 'rgba(27,143,216,0.15)',
};

const ACTIVITY_OPTIONS: {
  key: ActivityLevel;
  emoji: string;
  label: string;
  description: string;
  multiplier: number;
}[] = [
  {
    key: 'sedentary',
    emoji: '🧘',
    label: 'Sedentary',
    description: 'Mostly sitting, light walking',
    multiplier: 1.0,
  },
  {
    key: 'moderate',
    emoji: '🚶',
    label: 'Moderate',
    description: 'Walking, light exercise 2–4×/week',
    multiplier: 1.2,
  },
  {
    key: 'active',
    emoji: '🏃',
    label: 'Active',
    description: 'Gym, sport 5+×/week',
    multiplier: 1.4,
  },
];

// ─── Goal Calculator ──────────────────────────────────────────────────────────

function calculateGoal(weightKg: number, activity: ActivityLevel): number {
  const mult = ACTIVITY_OPTIONS.find((a) => a.key === activity)?.multiplier ?? 1.0;
  const base = Math.round(weightKg * 33);
  return Math.round(base * mult);
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const WaterDropIcon = () => (
  <Svg width={80} height={80} viewBox="0 0 120 120">
    <Defs>
      <SvgGradient id="dg" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor={COLORS.waterLight} />
        <Stop offset="100%" stopColor={COLORS.waterDeep} />
      </SvgGradient>
    </Defs>
    <Path
      d="M60 8C46 28 22 50 22 72a38 38 0 0076 0C98 50 74 28 60 8z"
      fill="url(#dg)"
    />
    <Path
      d="M38 68 Q40 56 50 54"
      stroke="rgba(255,255,255,0.35)"
      strokeWidth={3}
      strokeLinecap="round"
      fill="none"
    />
  </Svg>
);

const GoalRing = ({ goalMl }: { goalMl: number }) => {
  const glasses = Math.round(goalMl / 250);
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  const fillRatio = 0.75; // visual decoration only
  const strokeDashoffset = circumference * (1 - fillRatio);

  return (
    <Svg width={160} height={160} viewBox="0 0 160 160">
      <Defs>
        <SvgGradient id="rg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor={COLORS.waterLight} />
          <Stop offset="100%" stopColor={COLORS.waterDeep} />
        </SvgGradient>
      </Defs>
      {/* Track */}
      <Circle
        cx={80} cy={80} r={radius}
        fill="none"
        stroke={COLORS.stepBg}
        strokeWidth={10}
      />
      {/* Fill */}
      <Circle
        cx={80} cy={80} r={radius}
        fill="none"
        stroke="url(#rg)"
        strokeWidth={10}
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        rotation={-90}
        origin="80, 80"
      />
      <SvgText
        x={80} y={74}
        textAnchor="middle"
        fill={COLORS.text}
        fontSize={28}
        fontWeight="800"
      >
        {goalMl}
      </SvgText>
      <SvgText
        x={80} y={94}
        textAnchor="middle"
        fill={COLORS.muted}
        fontSize={13}
      >
        ml / day
      </SvgText>
      <SvgText
        x={80} y={114}
        textAnchor="middle"
        fill={COLORS.water}
        fontSize={11}
      >
        ≈ {glasses} glasses
      </SvgText>
    </Svg>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [weight, setWeight] = useState('70');
  const [unit, setUnit] = useState<'metric' | 'imperial'>('metric');
  const [activity, setActivity] = useState<ActivityLevel>('moderate');

  const scrollRef = useRef<ScrollView>(null);
  const progressAnim = useRef(new Animated.Value(0.25)).current;

  const weightKg =
    unit === 'metric'
      ? parseFloat(weight) || 70
      : (parseFloat(weight) || 154) / 2.205;

  const goalMl = calculateGoal(weightKg, activity);
  const baseGoal = Math.round(weightKg * 33);
  const activityBonus = goalMl - baseGoal;

  // ── Navigation ──────────────────────────────────────────────────────────────

  const goTo = (s: number) => {
    setStep(s);
    scrollRef.current?.scrollTo({ x: s * SCREEN_WIDTH, animated: true });
    Animated.spring(progressAnim, {
      toValue: (s + 1) / 4,
      useNativeDriver: false,
      tension: 120,
      friction: 14,
    }).start();
  };

  const handleComplete = async () => {
    const profile: UserProfile = {
      name: name.trim() || 'Friend',
      weightKg,
      activityLevel: activity,
      dailyGoalMl: goalMl,
      unit,
    };
    await AsyncStorage.setItem('userProfile', JSON.stringify(profile));
    await AsyncStorage.setItem('onboardingComplete', 'true');
    onComplete(profile);
  };

  // ── Unit toggle ─────────────────────────────────────────────────────────────

  const toggleUnit = (u: 'metric' | 'imperial') => {
    if (u === unit) return;
    const current = parseFloat(weight) || (unit === 'metric' ? 70 : 154);
    setUnit(u);
    setWeight(
      u === 'imperial'
        ? String(Math.round(current * 2.205))
        : String(Math.round(current / 2.205))
    );
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={[COLORS.water, COLORS.waterLight]}
          style={styles.logoBox}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.logoEmoji}>💧</Text>
        </LinearGradient>
        <Text style={styles.logoText}>Drip</Text>
        <Text style={styles.stepCount}>{step + 1} of 4</Text>
      </View>

      {/* Dot indicators */}
      <View style={styles.dots}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={[styles.dot, step === i && styles.dotActive]} />
        ))}
      </View>

      {/* Screens */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {/* ── Step 0: Welcome ────────────────────────────────────────────── */}
        <View style={styles.screen}>
          <View style={styles.heroArea}>
            <WaterDropIcon />
          </View>

          <Text style={styles.title}>
            Stay hydrated,{'\n'}feel <Text style={{ color: COLORS.water }}>alive</Text>.
          </Text>
          <Text style={styles.subtitle}>
            Drip tracks your daily water intake and reminds you to drink before you even feel thirsty.
          </Text>

          <View style={styles.statsRow}>
            {[
              { num: '75%', lbl: 'People chronically\ndehydrated' },
              { num: '2–3L', lbl: 'Daily target for\nmost adults' },
              { num: '21d', lbl: 'To build a\nhydration habit' },
            ].map((s) => (
              <View key={s.num} style={styles.statPill}>
                <Text style={styles.statNum}>{s.num}</Text>
                <Text style={styles.statLbl}>{s.lbl}</Text>
              </View>
            ))}
          </View>

          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={() => goTo(1)} activeOpacity={0.88}>
            <LinearGradient
              colors={[COLORS.waterDeep, COLORS.water]}
              style={styles.btn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.btnText}>Get started →</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* ── Step 1: Name ───────────────────────────────────────────────── */}
        <View style={styles.screen}>
          <Text style={styles.title}>What should{'\n'}we call you?</Text>
          <Text style={styles.subtitle}>
            We'll personalise your experience and keep your reminders friendly.
          </Text>

          <Text style={styles.label}>YOUR NAME</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Arjun"
            placeholderTextColor={COLORS.muted}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            returnKeyType="next"
          />

          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={() => goTo(2)} activeOpacity={0.88}>
            <LinearGradient
              colors={[COLORS.waterDeep, COLORS.water]}
              style={styles.btn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.btnText}>Continue →</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => goTo(0)} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
        </View>

        {/* ── Step 2: Weight + Activity ───────────────────────────────────── */}
        <ScrollView style={{ width: SCREEN_WIDTH }} contentContainerStyle={styles.screen}>
          <Text style={styles.title}>Let's calculate{'\n'}your goal</Text>
          <Text style={styles.subtitle}>
            We use your weight and activity level to set the right daily target.
          </Text>

          {/* Unit toggle */}
          <Text style={styles.label}>UNITS</Text>
          <View style={styles.unitToggle}>
            {(['metric', 'imperial'] as const).map((u) => (
              <TouchableOpacity
                key={u}
                style={[styles.unitBtn, unit === u && styles.unitBtnActive]}
                onPress={() => toggleUnit(u)}
              >
                <Text style={[styles.unitBtnText, unit === u && styles.unitBtnTextActive]}>
                  {u === 'metric' ? 'kg / ml' : 'lbs / oz'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Weight input */}
          <Text style={styles.label}>YOUR WEIGHT</Text>
          <View style={styles.weightRow}>
            <View style={styles.numInputWrap}>
              <TextInput
                style={styles.numInput}
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
                returnKeyType="done"
                selectTextOnFocus
              />
              <Text style={styles.unitBadge}>{unit === 'metric' ? 'kg' : 'lbs'}</Text>
            </View>
            <View style={styles.stepper}>
              {[1, -1].map((delta) => (
                <TouchableOpacity
                  key={delta}
                  style={styles.stepBtn}
                  onPress={() =>
                    setWeight(
                      String(
                        Math.max(30, Math.min(300, (parseFloat(weight) || 70) + delta))
                      )
                    )
                  }
                >
                  <Text style={styles.stepBtnText}>{delta > 0 ? '▲' : '▼'}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Activity */}
          <Text style={styles.label}>ACTIVITY LEVEL</Text>
          {ACTIVITY_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.activityItem, activity === opt.key && styles.activityItemSelected]}
              onPress={() => setActivity(opt.key)}
              activeOpacity={0.8}
            >
              {activity === opt.key && (
                <View style={styles.activityAccent} />
              )}
              <View style={[styles.activityIcon, activity === opt.key && styles.activityIconSelected]}>
                <Text style={{ fontSize: 18 }}>{opt.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.activityName}>{opt.label}</Text>
                <Text style={styles.activityDesc}>{opt.description}</Text>
              </View>
              <View style={[styles.radio, activity === opt.key && styles.radioSelected]}>
                {activity === opt.key && (
                  <View style={styles.radioInner} />
                )}
              </View>
            </TouchableOpacity>
          ))}

          <TouchableOpacity onPress={() => goTo(3)} activeOpacity={0.88} style={{ marginTop: 20 }}>
            <LinearGradient
              colors={[COLORS.waterDeep, COLORS.water]}
              style={styles.btn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.btnText}>See my goal →</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => goTo(1)} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* ── Step 3: Goal Result ─────────────────────────────────────────── */}
        <View style={[styles.screen, { paddingBottom: 24 }]}>
          <Text style={styles.title}>Your daily goal 🎯</Text>
          <Text style={styles.subtitle}>
            {name.trim() ? name : 'You'}, here's what your body needs daily
          </Text>

          <View style={{ alignItems: 'center', marginVertical: 8 }}>
            <GoalRing goalMl={goalMl} />
          </View>

          <View style={styles.breakdownCard}>
            {[
              { label: 'Base (weight × 33ml)', value: `${baseGoal} ml`, accent: false },
              { label: 'Activity bonus', value: `+${activityBonus} ml`, accent: true },
              { label: 'Daily target', value: `${goalMl} ml`, accent: false, big: true },
            ].map((row) => (
              <View key={row.label} style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>{row.label}</Text>
                <Text
                  style={[
                    styles.breakdownVal,
                    row.accent && { color: COLORS.accent },
                    row.big && { color: COLORS.water, fontSize: 16, fontWeight: '700' },
                  ]}
                >
                  {row.value}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.tipRow}>
            <Text style={{ fontSize: 16 }}>💡</Text>
            <Text style={styles.tipText}>
              Start your morning with 500ml before breakfast — it kickstarts your metabolism and counts toward your goal immediately.
            </Text>
          </View>

          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={handleComplete} activeOpacity={0.88}>
            <LinearGradient
              colors={[COLORS.waterDeep, COLORS.water]}
              style={styles.btn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.btnText}>Start tracking 💧</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => goTo(2)} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Adjust</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  progressTrack: {
    height: 3,
    backgroundColor: COLORS.stepBg,
  },
  progressFill: {
    height: 3,
    backgroundColor: COLORS.water,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 4,
    gap: 10,
  },
  logoBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: { fontSize: 18 },
  logoText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  stepCount: {
    marginLeft: 'auto',
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: '500',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.border,
  },
  dotActive: {
    width: 20,
    borderRadius: 3,
    backgroundColor: COLORS.water,
  },
  screen: {
    width: SCREEN_WIDTH,
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  heroArea: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
    lineHeight: 33,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.muted,
    lineHeight: 21,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  statPill: {
    flex: 1,
    backgroundColor: COLORS.stepBg,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.water,
    lineHeight: 20,
  },
  statLbl: {
    fontSize: 10,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 3,
    fontWeight: '500',
    lineHeight: 14,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.muted,
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: COLORS.stepBg,
  },
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.stepBg,
    borderRadius: 12,
    padding: 3,
    gap: 3,
    marginBottom: 20,
  },
  unitBtn: {
    flex: 1,
    height: 36,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitBtnActive: {
    backgroundColor: COLORS.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  unitBtnText: { fontSize: 13, color: COLORS.muted, fontWeight: '500' },
  unitBtnTextActive: { color: COLORS.water, fontWeight: '600' },
  weightRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  numInputWrap: {
    flex: 1,
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  numInput: {
    flex: 1,
    height: 52,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 14,
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    backgroundColor: COLORS.stepBg,
    textAlign: 'center',
    paddingRight: 40,
  },
  unitBadge: {
    position: 'absolute',
    right: 14,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.muted,
  },
  stepper: { flexDirection: 'column', gap: 6 },
  stepBtn: {
    width: 44,
    height: 22,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: { fontSize: 10, color: COLORS.muted },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    marginBottom: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  activityItemSelected: {
    borderColor: COLORS.water,
    backgroundColor: COLORS.stepBg,
  },
  activityAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: COLORS.water,
    borderRadius: 2,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.stepBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityIconSelected: { backgroundColor: 'rgba(27,143,216,0.15)' },
  activityName: { fontSize: 14, fontWeight: '500', color: COLORS.text },
  activityDesc: { fontSize: 11, color: COLORS.muted, marginTop: 1 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { backgroundColor: COLORS.water, borderColor: COLORS.water },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
  },
  breakdownCard: {
    backgroundColor: COLORS.stepBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(27,143,216,0.1)',
  },
  breakdownLabel: { fontSize: 13, color: COLORS.muted },
  breakdownVal: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  tipRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    backgroundColor: '#FFF9EC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 4,
  },
  tipText: { flex: 1, fontSize: 12, color: '#8B6914', lineHeight: 18 },
  btn: {
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.water,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  btnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  backBtn: {
    alignItems: 'center',
    paddingTop: 14,
  },
  backBtnText: {
    fontSize: 13,
    color: COLORS.muted,
  },
});
