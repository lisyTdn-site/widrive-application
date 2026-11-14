import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '@/i18n';

export default function TabsLayout() {
  const { t } = useI18n();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        // Couleurs de la barre de navigation
        tabBarActiveTintColor: '#C73A47',
        tabBarInactiveTintColor: '#5A5F66',

        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
        },

        tabBarStyle: {
          height: 64,
          paddingTop: 6,
          paddingBottom: 8,
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E4E4E0',
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
              color={focused ? '#C73A47' : '#5A5F66'}
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
              color={focused ? '#C73A47' : '#5A5F66'}
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
              color={focused ? '#C73A47' : '#5A5F66'}
            />
          ),
        }}
      />
    </Tabs>
  );
}