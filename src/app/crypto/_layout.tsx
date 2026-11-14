import { Stack } from 'expo-router';
import { ModuleGate } from '@/core/ModuleGate';

export default function CryptoLayout() {
  return (
    <ModuleGate id="crypto">
      <Stack screenOptions={{ headerShown: false }} />
    </ModuleGate>
  );
}