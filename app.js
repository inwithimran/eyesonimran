let images = (window.privateMemories || []).slice();

let currentFilter = 'all';
let searchQuery = '';
let activeLightboxIndex = 0;
let filteredImages = [];
let activeDataset = [];
let slideshowTimer = null;
let deferredInstallPrompt = null;

images.sort((a, b) => b.id - a.id);

function refreshAllViews() {
    renderCategoryTabs();
    renderCollections();
    renderGallery();
    updateHeroStats();
    if (!screens.profile.classList.contains('hidden')) updateProfileStats();
    if (!screens.explore.classList.contains('hidden')) { renderTimeline(); renderLocations(); }
}

function loadCloudImages() {
    if (!firebaseReady || !db) return;
    db.collection('images').orderBy('createdAt', 'desc').onSnapshot((snapshot) => {
        const cloudImages = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: data.numericId || Date.now(),
                url: data.url,
                caption: data.caption || '',
                categories: data.categories || [],
                camera: data.camera || '',
                capturedAt: data.capturedAt || ''
            };
        });
        const legacy = (window.privateMemories || []).slice();
        images = [...legacy, ...cloudImages];
        images.sort((a, b) => b.id - a.id);
        refreshAllViews();
    });
}

const CATEGORY_LABELS = {
    'dhaka': 'Dhaka',
    'du': 'Dhaka University',
    'dhaka-university-shahid-osman-hadi-hall': 'Shahid Osman Hadi Hall',
    'dhaka-zia-park': 'Zia Park',
    'jashore': 'Jashore',
    'khulna': 'Khulna',
    'ru': 'Rajshahi University',
    'rajshahi': 'Rajshahi',
    'eid-special': 'Eid Special',
    'my-college': 'My College',
    'pleasure-time': 'Pleasure Time',
    'moments': 'Special Moments',
    'admission-time': 'Admission Time'
};

const CATEGORY_ICONS = {
    'dhaka': '🌇',
    'du': '🎓',
    'dhaka-university-shahid-osman-hadi-hall': '🏫',
    'dhaka-zia-park': '🌳',
    'jashore': '🏙️',
    'khulna': '🌊',
    'ru': '🎓',
    'rajshahi': '📍',
    'eid-special': '🕌',
    'my-college': '🏫',
    'pleasure-time': '☕',
    'moments': '⭐',
    'admission-time': '📝'
};

const galleryGrid = document.getElementById('gallery-grid');
const noResults = document.getElementById('no-results');
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search');
const searchSuggestions = document.getElementById('search-suggestions');
const categoryTabs = document.getElementById('category-tabs');
const collectionsStrip = document.getElementById('collections-strip');

const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxZoomWrap = document.getElementById('lightbox-zoom-wrap');
const lightboxDesc = document.getElementById('lightbox-desc');
const lightboxBadge = document.getElementById('lightbox-badge');
const lightboxCounter = document.getElementById('lightbox-counter');
const lightboxDownloadBtn = document.getElementById('lightbox-download-btn');
const lightboxShareBtn = document.getElementById('lightbox-share-btn');
const lightboxPlayBtn = document.getElementById('lightbox-play-btn');
const lightboxThumbs = document.getElementById('lightbox-thumbs');

const screens = {
    home: document.getElementById('screen-home'),
    explore: document.getElementById('screen-explore'),
    profile: document.getElementById('screen-profile')
};

const navItems = document.querySelectorAll('.nav-item');

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.1 });

function showToast(message) {
    const toast = document.getElementById('toast');
    document.getElementById('toast-message').textContent = message;
    toast.classList.remove('opacity-0', 'scale-90', 'translate-y-2');
    toast.classList.add('opacity-100', 'scale-100', '-translate-y-2');
    setTimeout(() => {
        toast.classList.remove('opacity-100', 'scale-100', '-translate-y-2');
        toast.classList.add('opacity-0', 'scale-90', 'translate-y-2');
    }, 1800);
}

function switchScreen(screenName) {
    Object.keys(screens).forEach(key => {
        screens[key].classList.add('hidden');
        screens[key].style.opacity = '0';
        screens[key].style.transform = 'translateY(12px)';
    });

    const activeScreen = screens[screenName];
    activeScreen.classList.remove('hidden');

    setTimeout(() => {
        activeScreen.style.opacity = '1';
        activeScreen.style.transform = 'translateY(0)';
    }, 30);

    navItems.forEach(btn => {
        const isTarget = btn.dataset.screen === screenName;
        const pill = document.getElementById(`nav-pill-${btn.dataset.screen}`);

        if (isTarget) {
            btn.classList.add('text-app-primary', 'dark:text-app-primaryDark');
            btn.classList.remove('text-slate-400', 'dark:text-zinc-500');
            btn.querySelector('span').classList.add('font-bold');
            btn.querySelector('span').classList.remove('font-semibold');
            if (pill) pill.className = 'w-12 h-8 rounded-full bg-app-primary/10 dark:bg-app-primaryDark/10 flex items-center justify-center transition-all duration-300 scale-105';
        } else {
            btn.classList.remove('text-app-primary', 'dark:text-app-primaryDark');
            btn.classList.add('text-slate-400', 'dark:text-zinc-500');
            btn.querySelector('span').classList.remove('font-bold');
            btn.querySelector('span').classList.add('font-semibold');
            if (pill) pill.className = 'w-12 h-8 rounded-full bg-transparent flex items-center justify-center transition-all duration-300 scale-100';
        }
    });

    if (screenName === 'profile') updateProfileStats();
    if (screenName === 'explore') { renderTimeline(); renderLocations(); }
}

navItems.forEach(item => {
    item.addEventListener('click', () => {
        switchScreen(item.dataset.screen);
    });
});

function getCategoryList(img) {
    if (img.categories && Array.isArray(img.categories)) return img.categories;
    if (img.category) return [img.category];
    return [];
}

function translateCategory(categories) {
    if (!categories || !Array.isArray(categories) || categories.length === 0) return 'Uncategorized';
    const key = categories[0];
    return CATEGORY_LABELS[key] || key;
}

function getUniqueCategories() {
    const counts = {};
    images.forEach(img => {
        getCategoryList(img).forEach(cat => {
            counts[cat] = (counts[cat] || 0) + 1;
        });
    });
    return Object.keys(counts).sort((a, b) => counts[b] - counts[a]).map(id => ({ id, count: counts[id] }));
}

function buildCategoryButtonClass(active) {
    return active
        ? 'category-btn active px-5 py-3 rounded-app-lg text-xs font-bold tracking-wide transition-all duration-200 whitespace-nowrap bg-app-primary text-white shadow-md shadow-app-primary/20 active-scale'
        : 'category-btn px-5 py-3 rounded-app-lg text-xs font-semibold tracking-wide transition-all duration-200 whitespace-nowrap bg-white dark:bg-app-cardDark text-slate-600 dark:text-zinc-300 border border-slate-100 dark:border-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 active-scale';
}

function renderCategoryTabs() {
    const categories = getUniqueCategories();
    categoryTabs.innerHTML = '';

    const allBtn = document.createElement('button');
    allBtn.className = buildCategoryButtonClass(currentFilter === 'all');
    allBtn.dataset.category = 'all';
    allBtn.innerHTML = `<i class="fa-solid fa-layer-group mr-1.5"></i> ${t('allFeeds')}`;
    categoryTabs.appendChild(allBtn);

    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = buildCategoryButtonClass(currentFilter === cat.id);
        btn.dataset.category = cat.id;
        btn.innerHTML = `${CATEGORY_ICONS[cat.id] || '📁'} ${translateCategory([cat.id])}`;
        categoryTabs.appendChild(btn);
    });
}

function applyCategoryFilter(categoryId) {
    currentFilter = categoryId;
    renderCategoryTabs();
    renderGallery();
    if (screens.home.classList.contains('hidden')) switchScreen('home');
    galleryGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderCollections() {
    const categories = getUniqueCategories();
    collectionsStrip.innerHTML = '';

    categories.forEach(cat => {
        const cover = images.find(img => getCategoryList(img).includes(cat.id));
        if (!cover) return;

        const card = document.createElement('button');
        card.className = 'collection-card relative flex-shrink-0 w-28 h-36 rounded-app-lg overflow-hidden shadow-sm active-scale border border-slate-100 dark:border-zinc-900';
        card.innerHTML = `
            <img src="${cloudinaryResize(cover.url, 300)}" class="w-full h-full object-cover" loading="lazy" onerror="this.parentElement.classList.add('bg-slate-200','dark:bg-zinc-800');this.remove();">
            <div class="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent"></div>
            <div class="absolute bottom-2 left-2 right-2 text-left">
                <span class="text-white text-[11px] font-bold leading-tight block truncate">${CATEGORY_ICONS[cat.id] || '📁'} ${translateCategory([cat.id])}</span>
                <span class="text-white/70 text-[9px] font-semibold">${cat.count} photos</span>
            </div>
        `;
        card.addEventListener('click', () => applyCategoryFilter(cat.id));
        collectionsStrip.appendChild(card);
    });
}

function cloudinaryResize(url, width) {
    if (!url || !url.includes('res.cloudinary.com')) return url;
    return url.replace('/upload/', `/upload/w_${width},q_auto,f_auto/`);
}

function buildImageCardMarkup(img) {
    return `
        <div class="relative w-full overflow-hidden">
            <div class="skeleton absolute inset-0 z-0"></div>
            <img src="${cloudinaryResize(img.url, 600)}" alt="${img.caption}" class="relative z-10 w-full h-auto object-cover transition duration-700 select-none opacity-0" loading="lazy" decoding="async">
            <div class="absolute inset-x-0 bottom-0 z-10 h-16 bg-gradient-to-t from-black/55 to-transparent pointer-events-none"></div>
            <div class="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center text-white text-xs pointer-events-none">
                <i class="fa-solid fa-expand"></i>
            </div>
        </div>
        <div class="p-4 space-y-1.5">
            <span class="text-[9px] font-black uppercase tracking-widest text-app-primary dark:text-app-primaryDark">${translateCategory(getCategoryList(img))}</span>
            <p class="text-xs font-bold text-slate-800 dark:text-zinc-200 leading-normal line-clamp-2">${img.caption}</p>
        </div>
    `;
}

function wireImageLoad(itemDiv) {
    const img = itemDiv.querySelector('img');
    const skeleton = itemDiv.querySelector('.skeleton');
    if (!img) return;
    img.addEventListener('load', () => {
        img.classList.remove('opacity-0');
        if (skeleton) skeleton.remove();
    });
    img.addEventListener('error', () => {
        if (skeleton) skeleton.remove();
        img.classList.remove('opacity-0');
        img.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='100%25' height='100%25' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' font-size='14' text-anchor='middle' fill='%2394a3b8' dy='.3em'%3EImage unavailable%3C/text%3E%3C/svg%3E";
    });
}

function renderGallery() {
    filteredImages = images.filter(img => {
        const matchesSearch = img.caption.toLowerCase().includes(searchQuery.toLowerCase());
        let matchesCategory = currentFilter === 'all' || getCategoryList(img).includes(currentFilter);
        return matchesCategory && matchesSearch;
    });

    filteredImages.sort((a, b) => b.id - a.id);

    if (filteredImages.length === 0) {
        galleryGrid.classList.add('hidden');
        noResults.classList.remove('hidden');
        return;
    } else {
        galleryGrid.classList.remove('hidden');
        noResults.classList.add('hidden');
    }

    galleryGrid.innerHTML = '';
    filteredImages.forEach((img, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'masonry-item fade-in-up relative overflow-hidden rounded-app-xl bg-white dark:bg-app-cardDark border border-slate-100 dark:border-zinc-900 shadow-sm active-scale transition-all duration-300 cursor-pointer group';
        itemDiv.innerHTML = buildImageCardMarkup(img);
        wireImageLoad(itemDiv);

        itemDiv.addEventListener('click', () => {
            openLightbox(index, filteredImages);
        });

        galleryGrid.appendChild(itemDiv);
        revealObserver.observe(itemDiv);
    });
}

function updateProfileStats() {
    document.getElementById('stat-total').textContent = images.length;
    renderStatsChart();
}

function updateHeroStats() {
    document.getElementById('hero-total').textContent = `${images.length} photos`;
}

function renderStatsChart() {
    const chart = document.getElementById('stats-chart');
    if (!chart) return;
    const categories = getUniqueCategories();
    const max = categories.length ? categories[0].count : 1;
    chart.innerHTML = '';

    categories.forEach(cat => {
        const percent = Math.round((cat.count / max) * 100);
        const row = document.createElement('div');
        row.innerHTML = `
            <div class="flex items-center justify-between text-[11px] font-bold mb-1">
                <span class="text-slate-600 dark:text-zinc-300">${CATEGORY_ICONS[cat.id] || '📁'} ${translateCategory([cat.id])}</span>
                <span class="text-slate-400 dark:text-zinc-500">${cat.count}</span>
            </div>
            <div class="w-full h-2 bg-slate-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-app-primary to-app-accent rounded-full transition-all duration-700" style="width:${percent}%"></div>
            </div>
        `;
        chart.appendChild(row);
    });
}

categoryTabs.addEventListener('click', (e) => {
    const target = e.target.closest('.category-btn');
    if (!target) return;
    applyCategoryFilter(target.dataset.category);
});

const LOCATION_CATEGORIES = ['dhaka', 'du', 'dhaka-university-shahid-osman-hadi-hall', 'dhaka-zia-park', 'jashore', 'khulna', 'ru', 'rajshahi'];

function parseCapturedAt(value) {
    if (!value) return null;
    const parsed = new Date(value.replace(' ', 'T'));
    return isNaN(parsed) ? null : parsed;
}

function buildTimelineSection(title, items) {
    const section = document.createElement('div');
    const grid = document.createElement('div');
    grid.className = 'masonry-grid';
    items.forEach(img => {
        const item = document.createElement('div');
        item.className = 'masonry-item relative overflow-hidden rounded-app-lg cursor-pointer active-scale group';
        item.innerHTML = `<img src="${cloudinaryResize(img.url, 500)}" class="w-full h-auto object-cover transition duration-500 group-hover:scale-105" loading="lazy" decoding="async">`;
        item.addEventListener('click', () => openLightbox(images.indexOf(img), images));
        grid.appendChild(item);
    });
    section.innerHTML = `<h3 class="text-xs font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-3 pl-1">${title}</h3>`;
    section.appendChild(grid);
    return section;
}

function renderTimeline() {
    const container = document.getElementById('explore-timeline');
    if (!container) return;
    container.innerHTML = '';

    const groups = {};
    const undated = [];

    images.forEach(img => {
        const date = parseCapturedAt(img.capturedAt);
        if (!date) { undated.push(img); return; }
        const key = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        if (!groups[key]) groups[key] = { date, items: [] };
        groups[key].items.push(img);
    });

    Object.keys(groups)
        .sort((a, b) => groups[b].date - groups[a].date)
        .forEach(key => container.appendChild(buildTimelineSection(key, groups[key].items)));

    if (undated.length) {
        container.appendChild(buildTimelineSection(t('earlierMemories'), undated));
    }
}

function renderLocations() {
    const wrap = document.getElementById('explore-locations');
    if (!wrap) return;

    const counts = {};
    images.forEach(img => getCategoryList(img).forEach(cat => { counts[cat] = (counts[cat] || 0) + 1; }));

    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-2 md:grid-cols-4 gap-4';

    LOCATION_CATEGORIES.filter(cat => counts[cat]).forEach(cat => {
        const cover = images.find(img => getCategoryList(img).includes(cat));
        if (!cover) return;
        const card = document.createElement('button');
        card.className = 'relative h-40 rounded-app-xl overflow-hidden shadow-sm active-scale border border-slate-100 dark:border-zinc-900 group text-left';
        card.innerHTML = `
            <img src="${cloudinaryResize(cover.url, 500)}" class="w-full h-full object-cover transition duration-500 group-hover:scale-110" loading="lazy" decoding="async">
            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            <div class="absolute bottom-3 left-3 right-3">
                <span class="text-2xl">${CATEGORY_ICONS[cat] || '📍'}</span>
                <p class="text-white text-sm font-extrabold mt-1">${translateCategory([cat])}</p>
                <p class="text-white/70 text-[10px] font-bold">${counts[cat]} photos</p>
            </div>
        `;
        card.addEventListener('click', () => applyCategoryFilter(cat));
        grid.appendChild(card);
    });

    wrap.innerHTML = '';
    wrap.appendChild(grid);
}

function buildExploreTabClass(active) {
    return active
        ? 'explore-tab-btn px-4 py-2 rounded-app-lg text-xs font-bold transition-all bg-white dark:bg-app-cardDark text-app-primary dark:text-app-primaryDark shadow-sm'
        : 'explore-tab-btn px-4 py-2 rounded-app-lg text-xs font-bold transition-all text-slate-500 dark:text-zinc-400';
}

document.querySelectorAll('.explore-tab-btn').forEach(btn => {
    btn.className = buildExploreTabClass(btn.dataset.explore === 'timeline');
    btn.addEventListener('click', () => {
        document.querySelectorAll('.explore-tab-btn').forEach(b => {
            b.className = buildExploreTabClass(b === btn);
        });
        document.getElementById('explore-timeline').classList.toggle('hidden', btn.dataset.explore !== 'timeline');
        document.getElementById('explore-locations').classList.toggle('hidden', btn.dataset.explore !== 'locations');
    });
});


function buildSuggestions(query) {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const matches = [];
    const seen = new Set();

    getUniqueCategories().forEach(cat => {
        const label = translateCategory([cat.id]);
        if (label.toLowerCase().includes(q) && !seen.has(label)) {
            matches.push({ type: 'category', id: cat.id, label: `${CATEGORY_ICONS[cat.id] || '📁'} ${label}` });
            seen.add(label);
        }
    });

    images.forEach(img => {
        if (matches.length >= 6) return;
        if (img.caption.toLowerCase().includes(q)) {
            const snippet = img.caption.length > 40 ? img.caption.slice(0, 40) + '…' : img.caption;
            matches.push({ type: 'caption', id: img.id, label: snippet });
        }
    });

    return matches.slice(0, 6);
}

function renderSuggestions(list) {
    if (list.length === 0) {
        searchSuggestions.classList.add('hidden');
        searchSuggestions.innerHTML = '';
        return;
    }
    searchSuggestions.innerHTML = list.map(item => `
        <button class="suggestion-item w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors" data-type="${item.type}" data-id="${item.id}">
            ${item.label}
        </button>
    `).join('');
    searchSuggestions.classList.remove('hidden');
}

searchSuggestions.addEventListener('click', (e) => {
    const item = e.target.closest('.suggestion-item');
    if (!item) return;
    if (item.dataset.type === 'category') {
        searchInput.value = '';
        searchQuery = '';
        applyCategoryFilter(item.dataset.id);
    } else {
        const img = images.find(i => i.id === Number(item.dataset.id));
        if (img) {
            searchInput.value = img.caption.slice(0, 30);
            searchQuery = searchInput.value;
            renderGallery();
        }
    }
    searchSuggestions.classList.add('hidden');
});

document.addEventListener('click', (e) => {
    if (!e.target.closest('#search-suggestions') && e.target !== searchInput) {
        searchSuggestions.classList.add('hidden');
    }
});

searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    clearSearchBtn.classList.toggle('hidden', searchQuery.trim().length === 0);
    renderGallery();
    renderSuggestions(buildSuggestions(searchQuery));
});

clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    clearSearchBtn.classList.add('hidden');
    searchSuggestions.classList.add('hidden');
    renderGallery();
});

function buildThumbStrip(dataset) {
    lightboxThumbs.innerHTML = '';
    dataset.forEach((img, idx) => {
        const thumb = document.createElement('img');
        thumb.src = img.url;
        thumb.loading = 'lazy';
        thumb.className = idx === activeLightboxIndex ? 'active' : '';
        thumb.addEventListener('click', () => {
            activeLightboxIndex = idx;
            updateLightboxContent();
        });
        lightboxThumbs.appendChild(thumb);
    });
}

function highlightActiveThumb() {
    const thumbs = lightboxThumbs.querySelectorAll('img');
    thumbs.forEach((t, idx) => {
        t.classList.toggle('active', idx === activeLightboxIndex);
        if (idx === activeLightboxIndex) t.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    });
}

function openLightbox(index, dataset) {
    activeLightboxIndex = index;
    activeDataset = dataset;
    resetZoom();
    updateLightboxContent();
    buildThumbStrip(dataset);
    lightbox.classList.remove('hidden');
    lightbox.classList.add('flex');
    document.body.style.overflow = 'hidden';
}

function updateLightboxContent() {
    if (activeDataset.length === 0) return;
    const currentImg = activeDataset[activeLightboxIndex];

    resetZoom();
    lightboxImg.style.transform = 'scale(0.95)';
    lightboxImg.src = cloudinaryResize(currentImg.url, 1600);
    lightboxImg.alt = currentImg.caption;
    lightboxDesc.textContent = currentImg.caption;
    lightboxBadge.textContent = translateCategory(getCategoryList(currentImg));
    lightboxCounter.textContent = `${activeLightboxIndex + 1} / ${activeDataset.length}`;

    setTimeout(() => lightboxImg.style.transform = 'scale(1)', 50);
    highlightActiveThumb();
}

function stopSlideshow() {
    if (slideshowTimer) {
        clearInterval(slideshowTimer);
        slideshowTimer = null;
        lightboxPlayBtn.innerHTML = '<i class="fa-solid fa-play text-sm text-white"></i>';
    }
}

function closeLightbox() {
    stopSlideshow();
    lightbox.classList.add('hidden');
    lightbox.classList.remove('flex');
    document.body.style.overflow = 'auto';
    renderGallery();
}

function nextImage() {
    activeLightboxIndex = (activeLightboxIndex + 1) % activeDataset.length;
    updateLightboxContent();
}

function prevImage() {
    activeLightboxIndex = (activeLightboxIndex - 1 + activeDataset.length) % activeDataset.length;
    updateLightboxContent();
}

document.getElementById('lightbox-next').addEventListener('click', () => { stopSlideshow(); nextImage(); });
document.getElementById('lightbox-prev').addEventListener('click', () => { stopSlideshow(); prevImage(); });
document.getElementById('lightbox-close-btn').addEventListener('click', closeLightbox);

lightboxPlayBtn.addEventListener('click', () => {
    if (slideshowTimer) {
        stopSlideshow();
    } else {
        slideshowTimer = setInterval(nextImage, 2600);
        lightboxPlayBtn.innerHTML = '<i class="fa-solid fa-pause text-sm text-white"></i>';
    }
});

lightboxShareBtn.addEventListener('click', async () => {
    const currentImg = activeDataset[activeLightboxIndex];
    const absoluteUrl = new URL(currentImg.url, window.location.href).href;

    if (navigator.share) {
        try {
            await navigator.share({ title: 'Eyes on Imran', text: currentImg.caption, url: absoluteUrl });
        } catch (err) {}
    } else if (navigator.clipboard) {
        try {
            await navigator.clipboard.writeText(absoluteUrl);
            showToast("Link copied to clipboard 🔗");
        } catch (err) {
            showToast("Couldn't copy link");
        }
    }
});

lightboxDownloadBtn.addEventListener('click', () => {
    const currentImg = activeDataset[activeLightboxIndex];
    const downloadLink = document.createElement('a');
    downloadLink.href = currentImg.url;

    const sanitizedCaption = currentImg.caption ? currentImg.caption.substring(0, 20).replace(/[^\w\s\u0980-\u09FF]/gi, '') : '';
    downloadLink.download = sanitizedCaption ? `imran_${sanitizedCaption}.jpg` : `imran_memory_${currentImg.id}.jpg`;

    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    showToast("Downloading image... 📥");
});

let currentZoomScale = 1;
let pinchStartDistance = 0;
let pinchStartScale = 1;

function resetZoom() {
    currentZoomScale = 1;
    lightboxImg.style.transition = 'transform 0.25s ease';
    lightboxImg.style.transform = 'scale(1)';
}

function getTouchDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

lightboxZoomWrap.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
        pinchStartDistance = getTouchDistance(e.touches);
        pinchStartScale = currentZoomScale;
        lightboxImg.style.transition = 'none';
    }
}, { passive: true });

lightboxZoomWrap.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2) {
        e.preventDefault();
        const newDistance = getTouchDistance(e.touches);
        const ratio = newDistance / pinchStartDistance;
        currentZoomScale = Math.min(Math.max(pinchStartScale * ratio, 1), 3.5);
        lightboxImg.style.transform = `scale(${currentZoomScale})`;
    }
}, { passive: false });

lightboxZoomWrap.addEventListener('touchend', (e) => {
    if (e.touches.length === 0 && currentZoomScale < 1.05) {
        resetZoom();
    }
});

document.addEventListener('keydown', (e) => {
    if (lightbox.classList.contains('hidden')) return;
    if (e.key === 'ArrowRight') { stopSlideshow(); nextImage(); }
    if (e.key === 'ArrowLeft') { stopSlideshow(); prevImage(); }
    if (e.key === 'Escape') closeLightbox();
    if (e.key === ' ' || e.code === 'Space') { e.preventDefault(); lightboxPlayBtn.click(); }
});

document.addEventListener('keydown', (e) => {
    if (e.key !== '/') return;
    if (!lightbox.classList.contains('hidden')) return;
    const tag = document.activeElement.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    e.preventDefault();
    switchScreen('home');
    searchInput.focus();
});

const themeToggleBtn = document.getElementById('theme-toggle');
const autoDarkToggle = document.getElementById('auto-dark-toggle');

function initTheme() {
    const savedTheme = localStorage.getItem('imran_app_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.documentElement.classList.add('dark');
        autoDarkToggle.checked = true;
    } else {
        document.documentElement.classList.remove('dark');
        autoDarkToggle.checked = false;
    }
}

themeToggleBtn.addEventListener('click', () => {
    if (document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('imran_app_theme', 'light');
        autoDarkToggle.checked = false;
        showToast("Light mode activated ☀️");
    } else {
        document.documentElement.classList.add('dark');
        localStorage.setItem('imran_app_theme', 'dark');
        autoDarkToggle.checked = true;
        showToast("Dark mode activated 🌙");
    }
});

autoDarkToggle.addEventListener('change', () => {
    if (autoDarkToggle.checked) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('imran_app_theme', 'dark');
        showToast("Dark mode activated 🌙");
    } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('imran_app_theme', 'light');
        showToast("Light mode activated ☀️");
    }
});

document.getElementById('shuffle-btn').addEventListener('click', () => {
    if (images.length === 0) return;
    const randomIndex = Math.floor(Math.random() * images.length);
    switchScreen('home');
    setTimeout(() => openLightbox(randomIndex, images), 40);
});

let touchstartX = 0;
let touchendX = 0;
let touchStartedOnThumbs = false;

lightbox.addEventListener('touchstart', e => {
    touchStartedOnThumbs = !!e.target.closest('#lightbox-thumbs');
    touchstartX = e.changedTouches[0].screenX;
}, { passive: true });

lightbox.addEventListener('touchend', e => {
    if (touchStartedOnThumbs) return;
    touchendX = e.changedTouches[0].screenX;
    if (currentZoomScale > 1.05) return;
    if (touchendX < touchstartX - 60) { stopSlideshow(); nextImage(); }
    if (touchendX > touchstartX + 60) { stopSlideshow(); prevImage(); }
}, { passive: true });

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    const installBtn = document.getElementById('install-app-btn');
    if (installBtn) installBtn.classList.remove('hidden');
});

document.getElementById('install-app-btn').addEventListener('click', async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    document.getElementById('install-app-btn').classList.add('hidden');
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(() => {});
    });
}

document.getElementById('lang-toggle').addEventListener('click', () => {
    const next = currentLang === 'bn' ? 'en' : 'bn';
    applyLanguage(next);
    refreshAllViews();
});

window.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initLanguage();
    renderCategoryTabs();
    renderCollections();
    renderGallery();
    updateHeroStats();
    loadCloudImages();
    switchScreen('home');
});
