import { useTranslation } from 'react-i18next';
import { isRTL, getDirection } from '../i18n';

const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'EN', flag: '🇺🇸' },
  { code: 'zh', name: 'Chinese', nativeName: '中', flag: '🇨🇳' },
  { code: 'ar', name: 'Arabic', nativeName: 'ع', flag: '🇸🇦' },
  { code: 'he', name: 'Hebrew', nativeName: 'ע', flag: '🇮🇱' },
];

/**
 * Normalize a full locale like "en-US" to just the language code "en".
 * Falls back to 'en' if no match.
 */
function normalizeLang(lang) {
  if (!lang) return 'en';
  // Handle "en-US" -> "en", "zh-CN" -> "zh", etc.
  const base = lang.split('-')[0].toLowerCase();
  const matched = LANGUAGES.find(l => l.code === base);
  return matched ? matched.code : 'en';
}

function LanguageSwitcher() {
  const { i18n, t } = useTranslation();

  const normalizedLang = normalizeLang(i18n.language);
  const currentLang = LANGUAGES.find(l => l.code === normalizedLang) || LANGUAGES[0];
  const direction = getDirection(normalizedLang);

  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('i18nextLng', langCode);
  };

  const toggleLanguage = () => {
    const currentIndex = LANGUAGES.findIndex(l => l.code === normalizedLang);
    const nextIndex = (currentIndex + 1) % LANGUAGES.length;
    handleLanguageChange(LANGUAGES[nextIndex].code);
  };

  return (
    <div className="relative">
      <button
        onClick={toggleLanguage}
        className="px-3 py-2 rounded-lg bg-gray-500 text-white hover:bg-gray-600 flex items-center gap-2"
        title={t('language.selectLanguage')}
      >
        <span className="text-lg">{currentLang.flag}</span>
        <span className="text-sm font-medium rtl:font-arabic">
          {currentLang.nativeName}
        </span>
        {isRTL(normalizedLang) && (
          <span className="text-xs bg-yellow-500 px-1 rounded">RTL</span>
        )}
      </button>
      
      {/* Language dropdown */}
      <div className={`absolute ${direction === 'rtl' ? 'left-0' : 'right-0'} mt-2 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 min-w-[160px] z-50`}>
        <div className="px-3 py-1 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
          {t('language.selectLanguage')}
        </div>
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
              normalizedLang === lang.code ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : ''
            }`}>
            <span className="text-lg">{lang.flag}</span>
            <div className="flex flex-col">
              <span className={`text-sm font-medium ${lang.code === 'ar' || lang.code === 'he' ? 'rtl:font-arabic' : ''}`}>
                {lang.nativeName}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{lang.name}</span>
            </div>
            {isRTL(lang.code) && (
              <span className="ml-auto text-xs text-gray-400">RTL</span>
            )}
            {normalizedLang === lang.code && (
              <svg className="w-4 h-4 ml-auto text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export default LanguageSwitcher;
