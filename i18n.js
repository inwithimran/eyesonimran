const translations = {
    en: {
        searchPlaceholder: "Search memories, locations, or dates...",
        collectionsTitle: "Collections",
        navHome: "Home",
        navSettings: "Settings",
        navExplore: "Explore",
        exploreTimelineTab: "Timeline",
        exploreLocationsTab: "Locations",
        earlierMemories: "Earlier Memories",
        noResultsTitle: "No matching assets",
        noResultsDesc: "Try querying using a different filter or word.",
        allFeeds: "All Feeds",
        configPanel: "Configuration Panel",
        darkModeLabel: "Force System Dark Mode",
        installApp: "Install App",
        statsChartTitle: "Memories by Collection",
        capturedLabel: "Captured",
        heroTagline: "One frame at a time — my visual journal.",
        swipeHint: "Swipe sideways or pinch to zoom",
        photosCountSuffix: "photos",
        totalSuffix: "total"
    },
    bn: {
        searchPlaceholder: "স্মৃতি, লোকেশন বা তারিখ খুঁজুন...",
        collectionsTitle: "কালেকশন",
        navHome: "হোম",
        navSettings: "সেটিংস",
        navExplore: "এক্সপ্লোর",
        exploreTimelineTab: "টাইমলাইন",
        exploreLocationsTab: "লোকেশন",
        earlierMemories: "পুরনো স্মৃতি",
        noResultsTitle: "কোনো ছবি পাওয়া যায়নি",
        noResultsDesc: "অন্য কোনো ফিল্টার বা শব্দ দিয়ে খুঁজে দেখুন।",
        allFeeds: "সব ছবি",
        configPanel: "কনফিগারেশন প্যানেল",
        darkModeLabel: "সিস্টেম ডার্ক মোড বাধ্যতামূলক করুন",
        installApp: "অ্যাপ ইনস্টল করুন",
        statsChartTitle: "কালেকশন অনুযায়ী স্মৃতি",
        capturedLabel: "মোট ছবি",
        heroTagline: "এক ফ্রেমে এক মুহূর্ত — আমার ভিজ্যুয়াল জার্নাল।",
        swipeHint: "সোয়াইপ করুন অথবা জুম করতে চিমটি দিন",
        photosCountSuffix: "টি ছবি",
        totalSuffix: "টি"
    }
};

let currentLang = localStorage.getItem('imran_app_lang') || 'en';

function t(key) {
    return (translations[currentLang] && translations[currentLang][key]) || key;
}

function applyLanguage(lang) {
    currentLang = lang;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        if (translations[lang][key]) el.textContent = translations[lang][key];
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.dataset.i18nPlaceholder;
        if (translations[lang][key]) el.placeholder = translations[lang][key];
    });
    document.documentElement.lang = lang;
    localStorage.setItem('imran_app_lang', lang);
    const toggle = document.getElementById('lang-toggle');
    if (toggle) toggle.textContent = lang === 'bn' ? 'EN' : 'বাং';
}

function initLanguage() {
    applyLanguage(currentLang);
}
