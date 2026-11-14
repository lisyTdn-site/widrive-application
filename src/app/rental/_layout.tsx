import { Stack } from 'expo-router';
import { ModuleGate } from '@/core/ModuleGate';

export default function RentalLayout() {
  return (
    <ModuleGate id="rental">
      <Stack screenOptions={{ headerShown: false }} />
    </ModuleGate>
  );
}