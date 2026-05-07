## Prompt
I picked the Build a Water Intake Tracker — Daily Hydration App contest. 
Break it down into screens and features. What should I build first for MVP?

## Response
Picked React Native + Expo stack. Broke down the app into:

MVP Screens:
- Onboarding (name, weight, activity → auto-calculate goal)
- Home / Dashboard (progress ring, log button)
- Log Water (presets + custom ml)
- History (7-day bar chart)
- Reminders (push notification schedule)
- Profile / Settings (edit goal, units, theme)

V2 Screens:
- Streaks + badges
- Smart goal recalculator
- Home screen widget

Build order: Onboarding first → Home → Log Water → History → Reminders → Settings

Goal formula: weight_kg × 33ml × activity_multiplier
Activity multipliers: sedentary 1.0, moderate 1.2, active 1.4

---

## Prompt
Build the Onboarding screen

## Response
Built a 4-step onboarding flow in React Native + Expo:
- Step 1: Welcome screen with water drop animation and hydration stats
- Step 2: Name input with personalized greeting
- Step 3: Weight input (kg/lbs toggle) + activity level selector (sedentary/moderate/active)
- Step 4: Calculated daily goal with breakdown card showing formula

Goal calculation: weight_kg × 33ml × activity_multiplier
Saves UserProfile object to AsyncStorage on completion.
Triggers onComplete() callback to navigate to Home screen.

Dependencies used:
- expo-linear-gradient
- @react-native-async-storage/async-storage
- react-native-svg

---

## Prompt
Build the Home screen

## Response
[will be added after next screen is built]