// Petit store observable persisté dans AsyncStorage.
// Sert de base au portefeuille et aux réservations (démo locale).
// À remplacer par une vraie API plus tard : la surface publique
// (get / set / subscribe / useStore) ne changera pas.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

type Updater<T> = T | ((prev: T) => T);

export type Store<T> = {
  get: () => T;
  set: (updater: Updater<T>) => void;
  subscribe: (listener: () => void) => () => void;
  hydrated: () => boolean;
};

export function createStore<T>(key: string, initial: T): Store<T> {
  let value = initial;
  let isHydrated = false;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((listener) => listener());

  AsyncStorage.getItem(key)
    .then((raw) => {
      if (raw) value = JSON.parse(raw) as T;
    })
    .catch(() => undefined)
    .finally(() => {
      isHydrated = true;
      emit();
    });

  return {
    get: () => value,
    set: (updater) => {
      value = typeof updater === 'function' ? (updater as (prev: T) => T)(value) : updater;
      emit();
      AsyncStorage.setItem(key, JSON.stringify(value)).catch(() => undefined);
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    hydrated: () => isHydrated,
  };
}

export function useStore<T>(store: Store<T>): T {
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}

let seq = 0;
export function uid(prefix: string): string {
  seq += 1;
  return `${prefix}_${Date.now().toString(36)}_${seq}`;
}

/** Store observable NON persisté : reflète des données serveur (rechargées à la connexion). */
export function createLiveStore<T>(initial: T): Store<T> {
  let value = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    set: (updater) => {
      value = typeof updater === 'function' ? (updater as (prev: T) => T)(value) : updater;
      listeners.forEach((l) => l());
    },
    subscribe: (l) => {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    hydrated: () => true,
  };
}
