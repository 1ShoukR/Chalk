import { Tabs } from 'expo-router';

import { ModeSwitchAction } from '@/src/components/mvp/ModeSwitchAction';

export default function ClientTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerRight: () => <ModeSwitchAction currentMode="client" />,
        headerShown: true,
      }}>
      <Tabs.Screen name="index" options={{ title: 'Workout' }} />
      <Tabs.Screen name="schedule" options={{ title: 'Sessions' }} />
      <Tabs.Screen name="messages" options={{ title: 'Chat' }} />
    </Tabs>
  );
}
