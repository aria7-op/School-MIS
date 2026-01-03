import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

// Initialize i18next
i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'fa-AF', 'ps-AF'],
    ns: ['translation'],
    defaultNS: 'translation',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'querystring', 'navigator'],
      caches: ['localStorage'],
    },
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json?v=' + Date.now() + '&t=' + Math.random() + '&r=' + Math.floor(Math.random() * 1000000),
      allowMultiLoading: false,
      loadTimeout: 20000,
      requestOptions: {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
      },
    },
    react: {
      useSuspense: false,
    },
  });

// Keep html lang/dir in sync
const applyDir = (lng: string) => {
  const isRTL = lng === 'fa-AF' || lng === 'ps-AF';
  document.documentElement.lang = lng;
  document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
};

applyDir(i18n.resolvedLanguage || 'en');
i18n.on('languageChanged', (lng) => applyDir(lng));

// Force reload translations on startup to ensure latest translations are loaded
setTimeout(() => {
  i18n.reloadResources().then(() => {
    // console.log('🌐 Translations force-reloaded on startup');
  });
}, 1000);

// Debug: Log when translations are loaded
// i18n.on('loaded', (loaded) => {
//   console.log('🌐 i18n translations loaded:', loaded);
//   console.log('🌐 Available translations:', i18n.getResourceBundle(i18n.language, 'translation'));
//   console.log('🌐 TeacherPortal translations:', i18n.t('teacherPortal.attendance.student'));
//   console.log('🌐 Assignment translations test:', {
//     selectSubject: i18n.t('teacherPortal.assignments.selectSubject'),
//     allSubjects: i18n.t('teacherPortal.assignments.allSubjects')
//   });
// });

i18n.on('failedLoading', (lng, ns, msg) => {
  console.error('❌ i18n failed to load translations:', { lng, ns, msg });
});

// Debug: Log when language changes
// i18n.on('languageChanged', (lng) => {
//   console.log('🌐 Language changed to:', lng);
//   console.log('🌐 Available translations for', lng, ':', i18n.getResourceBundle(lng, 'translation'));
// });

// Force reload translations
export const reloadTranslations = () => {
  i18n.reloadResources().then(() => {
    // console.log('🌐 Translations reloaded');
  });
};

// Clear cache and reload
export const clearCacheAndReload = () => {
  localStorage.removeItem('i18nextLng');
  localStorage.removeItem('i18next');
  // Clear all i18n cache
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('i18next')) {
      localStorage.removeItem(key);
    }
  });
  i18n.reloadResources().then(() => {
    console.log('🌐 Cache cleared and translations reloaded');
    // Force reload the page to ensure clean state
    window.location.reload();
  });
};

// Test translations
export const testTranslations = () => {
  // console.log('🧪 Testing translations...');
  // console.log('Current language:', i18n.language);
  // console.log('Available languages:', i18n.languages);
  // console.log('Loaded namespaces:', i18n.loadedNamespaces);
  
  // Test specific keys
  const testKeys = [
    'teacherPortal.attendance.student',
    'teacherPortal.attendance.excused', 
    'teacherPortal.attendance.halfDay',
    'teacherPortal.assignments.title',
    'teacherPortal.assignments.subtitle',
    'teacherPortal.assignments.selectSubject',
    'teacherPortal.assignments.allSubjects'
  ];
  
  testKeys.forEach(key => {
    const translation = i18n.t(key);
    // console.log(`${key}:`, translation);
    if (translation === key) {
      console.warn(`⚠️ Translation missing for key: ${key}`);
    }
  });
  
  // Check if resource bundle exists
  const resourceBundle = i18n.getResourceBundle(i18n.language, 'translation');
  // console.log('Resource bundle keys:', Object.keys(resourceBundle || {}));
  // console.log('TeacherPortal in bundle:', !!resourceBundle?.teacherPortal);
  // console.log('Assignments in bundle:', !!resourceBundle?.teacherPortal?.assignments);
};

// Force clear i18n cache and reload
export const forceReloadTranslations = () => {
  // Clear all i18n related cache
  if (typeof window !== 'undefined') {
    localStorage.removeItem('i18nextLng');
    localStorage.removeItem('i18next');
    // Clear all i18n cache
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('i18next')) {
        localStorage.removeItem(key);
      }
    });
    // Clear session storage
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('i18next')) {
        sessionStorage.removeItem(key);
      }
    });
  }
  
  // Force reload translations
  i18n.reloadResources().then(() => {
    // console.log('🌐 Translations force-reloaded with cache clear');
    // Force reload the page to ensure clean state
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  });
};

// Make functions available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).reloadTranslations = reloadTranslations;
  (window as any).clearCacheAndReload = clearCacheAndReload;
  (window as any).testTranslations = testTranslations;
  (window as any).forceReloadTranslations = forceReloadTranslations;
}

export default i18n;


