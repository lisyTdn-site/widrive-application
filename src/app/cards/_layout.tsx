import { Stack } from 'expo-router';
import { ModuleGate } from '@/core/ModuleGate';

export default function CardsLayout() {
  return (
    <ModuleGate id="cards">
      <Stack screenOptions={{ headerShown: false }} />
    </ModuleGate>
  );
}