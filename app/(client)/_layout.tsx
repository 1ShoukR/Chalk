import { Tabs } from 'expo-router';

export default function ClientTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}>
      <Tabs.Screen name="index" options={{ title: 'Workout' }} />
      <Tabs.Screen name="schedule" options={{ title: 'Sessions' }} />
      <Tabs.Screen name="messages" options={{ title: 'Chat' }} />
    </Tabs>
  );
}
