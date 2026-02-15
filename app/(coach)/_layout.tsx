import { Tabs } from 'expo-router';

import { ModeSwitchAction } from '@/src/components/mvp/ModeSwitchAction';

export default function CoachTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerRight: () => <ModeSwitchAction currentMode="coach" />,
        headerShown: true,
      }}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="clients" options={{ title: 'Clients' }} />
      <Tabs.Screen name="schedule" options={{ title: 'Schedule' }} />
      <Tabs.Screen name="messages" options={{ title: 'Messages' }} />
    </Tabs>
  );
}
