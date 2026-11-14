import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { Key } from '@/i18n';

export type IconName =
  keyof typeof MaterialCommunityIcons.glyphMap;

export type ModuleStatus =
  | 'active'
  | 'maintenance'
  | 'soon'
  | 'hidden';

export type ModuleDef = {
  id: string;
  route?: string;
  icon: IconName;
  title: Key;
  sub: Key;
  status: ModuleStatus;
};

export const modules: ModuleDef[] = [
  {
    id: 'vehicles',
    route: '/vehicules',
    icon: 'car-estate',
    title: 'svc.vehicules.t',
    sub: 'svc.vehicules.s',
    status: 'active',
  },
  {
    id: 'rental',
    route: '/rental/location',
    icon: 'car-key',
    title: 'svc.location.t',
    sub: 'svc.location.s',
    status: 'active',
  },
  {
    id: 'housing',
    route: '/housing/appartements',
    icon: 'office-building',
    title: 'svc.appartements.t',
    sub: 'svc.appartements.s',
    status: 'active',
  },
  {
    id: 'drivers',
    route: '/drivers/chauffeurs',
    icon: 'steering',
    title: 'svc.chauffeurs.t',
    sub: 'svc.chauffeurs.s',
    status: 'active',
  },
  {
    id: 'crypto',
    route: '/crypto',
    icon: 'bitcoin',
    title: 'svc.crypto.t',
    sub: 'svc.crypto.s',
    status: 'active',
  },
  {
    id: 'cards',
    route: '/cards/cartes',
    icon: 'credit-card-outline',
    title: 'svc.cartes.t',
    sub: 'svc.cartes.s',
    status: 'active',
  },
  {
    id: 'ride',
    route: '/ride',
    icon: 'map-marker-path',
    title: 'svc.ride.t',
    sub: 'svc.ride.s',
    status: 'active',
  },
  {
    id: 'pro',
    icon: 'briefcase-outline',
    title: 'svc.pro.t',
    sub: 'svc.pro.s',
    status: 'soon',
  },
  {
    id: 'support',
    route: '/assistance',
    icon: 'headset',
    title: 'svc.support.t',
    sub: 'svc.support.s',
    status: 'active',
  },
];

export const getModule = (id: string) =>
  modules.find((module) => module.id === id);