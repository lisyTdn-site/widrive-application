import type { ImageSourcePropType } from 'react-native';
import { images } from '@/data/images';

export type VehicleCategory = 'sedan' | 'suv' | 'pickup';
export type VehicleStatus = 'available' | 'reserved' | 'sold';
export type VehicleFuel = 'petrol' | 'diesel';
export type VehicleGearbox = 'manual' | 'auto';
export type VehicleCondition = 'excellent' | 'veryGood' | 'good' | 'works';
export type VehicleEquipment = 'bluetooth' | 'camera' | 'windows' | 'screen' | 'roof' | 'sunroof' | 'leather' | 'gps';

export type Vehicle = {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  km: number;
  fuel: VehicleFuel;
  gearbox: VehicleGearbox;
  drive: 'twoWheel' | 'fourWheel';
  category: VehicleCategory;
  city: string;
  status: VehicleStatus;
  engine: VehicleCondition;
  paint: VehicleCondition;
  interior: VehicleCondition;
  ac: VehicleCondition;
  equipment: VehicleEquipment[];
  documentKey: 'vehicle.docs.1' | 'vehicle.docs.2' | 'vehicle.docs.3';
  image: ImageSourcePropType;
};

export const vehicles: Vehicle[] = [
  {
    id: '1', brand: 'Toyota', model: 'Corolla', year: 2016, price: 6500000, km: 98000,
    fuel: 'petrol', gearbox: 'auto', drive: 'twoWheel', category: 'sedan', city: 'Cotonou', status: 'available',
    engine: 'veryGood', paint: 'good', interior: 'veryGood', ac: 'works',
    equipment: ['bluetooth', 'camera', 'windows'], documentKey: 'vehicle.docs.1', image: images.rentals.corolla,
  },
  {
    id: '2', brand: 'Toyota', model: 'Hilux', year: 2018, price: 14500000, km: 76000,
    fuel: 'diesel', gearbox: 'manual', drive: 'fourWheel', category: 'pickup', city: 'Porto-Novo', status: 'available',
    engine: 'excellent', paint: 'veryGood', interior: 'good', ac: 'works',
    equipment: ['screen', 'roof'], documentKey: 'vehicle.docs.2', image: images.rentals.hilux,
  },
  {
    id: '3', brand: 'Toyota', model: 'Land Cruiser Prado', year: 2015, price: 17000000, km: 120000,
    fuel: 'diesel', gearbox: 'auto', drive: 'fourWheel', category: 'suv', city: 'Cotonou', status: 'reserved',
    engine: 'good', paint: 'good', interior: 'veryGood', ac: 'works',
    equipment: ['sunroof', 'leather', 'gps'], documentKey: 'vehicle.docs.3', image: images.rentals.rav4,
  },
];
