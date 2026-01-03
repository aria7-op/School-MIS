import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import dashboardVisitorAnalytics from '../i18n/dashboard_customer_analytics.json';
import common from '../i18n/common.json';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface TranslationMap {
  [key: string]: string;
}

const translations: { [lang in Lang]: TranslationMap } = {
  en: { ...common.en, ...dashboardVisitorAnalytics.en },
  fa: { ...common.fa, ...dashboardVisitorAnalytics.fa },
  ps: { ...common.ps, ...dashboardVisitorAnalytics.ps },
};

type Lang = 'en' | 'fa' | 'ps';

interface TranslationContextProps {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

const TranslationContext = createContext<TranslationContextProps>({
  lang: 'en',
  setLang: () => {},
  t: (key) => key,
});

const LANG_KEY = 'app_language';

export const TranslationProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    setLangState('fa'); // Force Dari for testing
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(LANG_KEY);
        if (stored === 'en' || stored === 'fa' || stored === 'ps') {
          setLangState(stored);
        } else {
          setLangState('en');
        }
      } catch (error) {
        setLangState('en');
      }
    })();
  }, []);

  const setLang = (newLang: Lang) => {
    setLangState(newLang);
    AsyncStorage.setItem(LANG_KEY, newLang).then(() => {
    }).catch((error) => {
    });
  };

  const t = (key: string) => {
    const translation = translations[lang]?.[key] || key;
    return translation;
  };

  return (
    <TranslationContext.Provider value={{ lang, setLang, t }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
}; 
