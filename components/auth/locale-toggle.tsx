'use client'

interface LocaleToggleProps {
  currentLocale: string
}

export function LocaleToggle({ currentLocale }: LocaleToggleProps) {
  function handleLocaleChange(newLocale: string) {
    document.cookie = `locale=${newLocale}; path=/; max-age=31536000`
    window.location.reload()
  }

  return (
    <div className="flex items-center justify-center gap-1 text-xs text-gray-400">
      <button
        type="button"
        onClick={() => handleLocaleChange('ko')}
        className={`px-2 py-1 rounded transition-colors ${
          currentLocale === 'ko'
            ? 'text-gray-700 font-medium'
            : 'hover:text-gray-600'
        }`}
      >
        한국어
      </button>
      <span className="text-gray-300">|</span>
      <button
        type="button"
        onClick={() => handleLocaleChange('en')}
        className={`px-2 py-1 rounded transition-colors ${
          currentLocale === 'en'
            ? 'text-gray-700 font-medium'
            : 'hover:text-gray-600'
        }`}
      >
        English
      </button>
    </div>
  )
}
