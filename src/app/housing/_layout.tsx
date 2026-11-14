import { Stack } from 'expo-router';
import { ModuleGate } from '@/core/ModuleGate';

export default function HousingLayout() {
  return (
    <ModuleGate id="housing">
      <Stack screenOptions={{ headerShown: false }} />
    </ModuleGate>
  );
}