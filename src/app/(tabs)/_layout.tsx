import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '@/i18n';
import { colors, font } from '@/theme';

export default function TabsLayout() {
  const { t } = useI18n();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        // Couleurs de la barre de navigation
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,

        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: font.bold,
        },

        tabBarStyle: {
          height: 64,
          paddingTop: 6,
          paddingBottom: 8,
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          elevation: 8,
        },
      }}
    >
      {/* ACCUEIL */}
      <Tabs.Screen
        name="index"
        options={{
          title: t('nav.home'),
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={size + 2}
              color={focused ? colors.accent : colors.textMuted}
            />
          ),
        }}
      />

      {/* PORTEFEUILLE */}
      <Tabs.Screen
        name="wallet"
        options={{
          title: t('nav.wallet'),
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name={focused ? 'wallet' : 'wallet-outline'}
              size={size + 2}
              color={focused ? colors.accent : colors.textMuted}
            />
          ),
        }}
      />

      {/* PROFIL */}
      <Tabs.Screen
        name="profile"
        options={{
          title: t('nav.profile'),
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={size + 2}
              color={focused ? colors.accent : colors.textMuted}
            />
          ),
        }}
      />
    </Tabs>
  );
}