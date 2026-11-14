import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
  useCallback,
  useMemo,
} from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { fr, type Key } from './fr';
import { en } from './en';

export type { Key };

export type Lang = 'fr' | 'en';

export type L = {
  fr: string;
  en: string;
};

export const LANGS: { id: Lang; label: string }[] = [
  { id: 'fr', label: 'Français' },
  { id: 'en', label: 'English' },
];

const dicts: Record<Lang, Record<Key, string>> = {
  fr,
  en,
};

const K_LANG = 'wid_lang';

function detect(): Lang {
  try {
    const locale =
      Intl.DateTimeFormat().resolvedOptions().locale || 'fr';

    return locale.toLowerCase().startsWith('en') ? 'en' : 'fr';
  } catch {
    return 'fr';
  }
}

type Vars = Record<string, string | number>;

type I18n = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: Key, vars?: Vars) => string;
  tr: (l: L) => string;
};

const Ctx = createContext<I18n | null>(null);

export function I18nProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [lang, setLangState] = useState<Lang>('fr');

  useEffect(() => {
    let mounted = true;

    AsyncStorage.getItem(K_LANG)
      .then((value) => {
        if (!mounted) return;

        if (value === 'fr' || value === 'en') {
          setLangState(value);
        } else {
          setLangState(detect());
        }
      })
      .catch(() => {
        if (mounted) setLangState(detect());
      });

    return () => {
      mounted = false;
    };
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);

    AsyncStorage.setItem(K_LANG, l).catch((error) => {
      console.warn('Unable to save language:', error);
    });
  }, []);

  const t = useCallback(
    (key: Key, vars?: Vars): string => {
      const translation =
        dicts[lang]?.[key] ??
        dicts.fr?.[key] ??
        String(key);

      return translation.replace(/\{(\w+)\}/g, (_, k: string) =>
        String(vars?.[k] ?? `{${k}}`)
      );
    },
    [lang]
  );

  const tr = useCallback(
    (value: L): string => {
      return value?.[lang] ?? value?.fr ?? '';
    },
    [lang]
  );

  const contextValue = useMemo(
    () => ({
      lang,
      setLang,
      t,
      tr,
    }),
    [lang, setLang, t, tr]
  );

  return (
    <Ctx.Provider value={contextValue}>
      {children}
    </Ctx.Provider>
  );
}

export function useI18n() {
  const context = useContext(Ctx);

  if (!context) {
    throw new Error('useI18n must be used inside I18nProvider');
  }

  return context;
}