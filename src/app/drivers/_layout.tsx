import { Stack } from 'expo-router';
import { ModuleGate } from '@/core/ModuleGate';

export default function DriversLayout() {
  return (
    <ModuleGate id="drivers">
      <Stack screenOptions={{ headerShown: false }} />
    </ModuleGate>
  );
}