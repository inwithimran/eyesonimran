let images = JSON.parse(localStorage.getItem('imran_vault_images')) || window.privateMemories || [];
let likedImages = JSON.parse(localStorage.getItem('imran_app_liked_ids')) || [];

let currentFilter = 'all';
let searchQuery = '';
let activeLightboxIndex = 0;
let filteredImages = [];
let activeDataset = [];

// Sort images by newest first (highest ID first)
images.sort((a, b) => b.id - a.id);

// UI Elements
const galleryGrid = document.getElementById('gallery-grid');
const favGrid = document.getElementById('fav-grid');
const noResults = document.getElementById('no-results');
const favEmptyState = document.getElementById('fav-empty-state');
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search');
const categoryTabs = document.getElementById('category-tabs');

const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxDesc = document.getElementById('lightbox-desc');
const lightboxBadge = document.getElementById('lightbox-badge');
const lightboxCounter = document.getElementById('lightbox-counter');
const lightboxFavBtn = document.getElementById('lightbox-fav-btn');
const lightboxCopyBtn = document.getElementById('lightbox-copy-btn');
const overlayHeart = document.getElementById('overlay-heart');

const screens = {
    home: document.getElementById('screen-home'),
    favorites: document.getElementById('screen-favorites'),
    profile: document.getElementById('screen-profile')
};

const navItems = document.querySelectorAll('.nav-item');

// Toast
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

    if (screenName === 'favorites') renderFavorites();
    if (screenName === 'profile') updateProfileStats();
}

// Nav Items Click
navItems.forEach(item => {
    item.addEventListener('click', () => {
        const targetScreen = item.dataset.screen;
        switchScreen(targetScreen);
    });
});

// Render Gallery with Multiple Categories
function renderGallery() {
    filteredImages = images.filter(img => {
        const matchesSearch = img.caption.toLowerCase().includes(searchQuery.toLowerCase());
        
        let matchesCategory = true;
        
        if (currentFilter !== 'all') {
            if (img.categories && Array.isArray(img.categories)) {
                matchesCategory = img.categories.includes(currentFilter);
            } else if (img.category) {
                matchesCategory = img.category === currentFilter;
            }
        }

        return matchesCategory && matchesSearch;
    });

    // Ensure newest images appear first
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
        const isLiked = likedImages.includes(img.id);
        const itemDiv = document.createElement('div');
        itemDiv.className = 'masonry-item relative overflow-hidden rounded-app-xl bg-white dark:bg-app-cardDark border border-slate-100 dark:border-zinc-900 shadow-sm active-scale transition-all duration-300 cursor-pointer group';
        
        itemDiv.innerHTML = `
            <div class="relative w-full overflow-hidden">
                <img src="${img.url}" alt="${img.caption}" class="w-full h-auto object-cover transition duration-700 select-none" loading="lazy">
                ${isLiked ? `<div class="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/95 dark:bg-zinc-950/95 flex items-center justify-center shadow-md border border-slate-100/30"><i class="fa-solid fa-heart text-app-accent text-xs"></i></div>` : ''}
            </div>
            <div class="p-4 space-y-1.5">
                <span class="text-[9px] font-black uppercase tracking-widest text-app-primary dark:text-app-primaryDark">${translateCategory(img.categories || [img.category])}</span>
                <p class="text-xs font-bold text-slate-800 dark:text-zinc-200 leading-normal line-clamp-2">${img.caption}</p>
            </div>
        `;

        let tapCount = 0;
        let tapTimer;

        itemDiv.addEventListener('click', (e) => {
            tapCount++;
            if (tapCount === 1) {
                tapTimer = setTimeout(() => {
                    openLightbox(index, filteredImages);
                    tapCount = 0;
                }, 220);
            } else if (tapCount === 2) {
                clearTimeout(tapTimer);
                triggerDoubleTapLike(img, itemDiv);
                tapCount = 0;
            }
        });

        galleryGrid.appendChild(itemDiv);
    });
}

// Render Favorites
function renderFavorites() {
    let favoriteList = images.filter(img => likedImages.includes(img.id));
    document.getElementById('fav-count').textContent = `${favoriteList.length} total`;

    // Ensure newest favorites appear first
    favoriteList.sort((a, b) => b.id - a.id);

    if (favoriteList.length === 0) {
        favGrid.classList.add('hidden');
        favEmptyState.classList.remove('hidden');
        return;
    } else {
        favGrid.classList.remove('hidden');
        favEmptyState.classList.add('hidden');
    }

    favGrid.innerHTML = '';
    favoriteList.forEach((img, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'masonry-item relative overflow-hidden rounded-app-xl bg-white dark:bg-app-cardDark border border-slate-100 dark:border-zinc-900 shadow-sm active-scale transition-all duration-300 cursor-pointer';
        
        itemDiv.innerHTML = `
            <div class="relative w-full overflow-hidden">
                <img src="${img.url}" alt="${img.caption}" class="w-full h-auto object-cover" loading="lazy">
                <div class="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/95 dark:bg-zinc-950/95 flex items-center justify-center shadow-md border border-slate-100/50" onclick="removeFavoriteDirectly(event, ${img.id})">
                    <i class="fa-solid fa-heart text-app-accent text-xs"></i>
                </div>
            </div>
            <div class="p-4">
                <p class="text-xs font-bold text-slate-800 dark:text-zinc-200 leading-normal line-clamp-2">${img.caption}</p>
            </div>
        `;

        itemDiv.addEventListener('click', (e) => {
            if (!e.target.closest('div[onclick]')) {
                openLightbox(index, favoriteList);
            }
        });

        favGrid.appendChild(itemDiv);
    });
}

function triggerDoubleTapLike(img, itemElement) {
    if (!likedImages.includes(img.id)) {
        likedImages.push(img.id);
        localStorage.setItem('imran_app_liked_ids', JSON.stringify(likedImages));
        
        const heart = document.createElement('div');
        heart.className = 'absolute inset-0 flex items-center justify-center pointer-events-none z-10 bg-black/5 rounded-app-xl';
        heart.innerHTML = `<i class="fa-solid fa-heart text-white text-5xl drop-shadow-xl scale-0 transition-transform duration-300" id="temp-heart"></i>`;
        itemElement.appendChild(heart);

        setTimeout(() => {
            const tempHeart = heart.querySelector('#temp-heart');
            tempHeart.classList.remove('scale-0');
            tempHeart.classList.add('scale-100', 'animate-ping');
        }, 10);

        setTimeout(() => heart.remove(), 750);
        showToast("Added to Favorites ❤️");
        renderGallery();
    }
}

window.removeFavoriteDirectly = function(e, id) {
    e.stopPropagation();
    likedImages = likedImages.filter(item => item !== id);
    localStorage.setItem('imran_app_liked_ids', JSON.stringify(likedImages));
    showToast("Removed from Favorites 💔");
    renderFavorites();
    renderGallery();
};

function updateProfileStats() {
    document.getElementById('stat-total').textContent = images.length;
    document.getElementById('stat-liked').textContent = likedImages.length;
}

// Translate Category
function translateCategory(categories) {
    if (!categories || !Array.isArray(categories) || categories.length === 0) return 'Uncategorized';

    const categoryMap = {
        'dhaka': 'Dhaka',
        'du': 'Dhaka University',
        'dhaka-university-shahid-osman-hadi-hall': 'Shahid Osman Hadi Hall',
        'dhaka-zia-park': 'Zia Park',
        'jashore': 'Jashore',
        'khulna': 'Khulna',
        'rajshahi': 'Rajshahi',
        'eid-special': 'Eid Special',
        'my-college': 'My College',
        'pleasure-time': 'Pleasure Time',
        'moments': 'Special Moments'
    };

    return categoryMap[categories[0]] || categories[0];
}

// Category Filter
categoryTabs.addEventListener('click', (e) => {
    const target = e.target.closest('.category-btn');
    if (!target) return;

    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.className = "category-btn px-5 py-3 rounded-app-lg text-xs font-semibold tracking-wide transition-all duration-200 whitespace-nowrap bg-white dark:bg-app-cardDark text-slate-600 dark:text-zinc-300 border border-slate-100 dark:border-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 active-scale";
    });

    target.className = "category-btn active px-5 py-3 rounded-app-lg text-xs font-bold tracking-wide transition-all duration-200 whitespace-nowrap bg-app-primary text-white shadow-md shadow-app-primary/20 active-scale";
    
    currentFilter = target.dataset.category;
    renderGallery();
});

// Search
searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    clearSearchBtn.classList.toggle('hidden', searchQuery.trim().length === 0);
    renderGallery();
});

clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    clearSearchBtn.classList.add('hidden');
    renderGallery();
});

// Lightbox Functions
function openLightbox(index, dataset) {
    activeLightboxIndex = index;
    activeDataset = dataset;
    updateLightboxContent();
    lightbox.classList.remove('hidden');
    lightbox.classList.add('flex');
    document.body.style.overflow = 'hidden';
}

function updateLightboxContent() {
    if (activeDataset.length === 0) return;
    const currentImg = activeDataset[activeLightboxIndex];
    const isLiked = likedImages.includes(currentImg.id);
    
    lightboxImg.style.transform = 'scale(0.95)';
    lightboxImg.src = currentImg.url;
    lightboxImg.alt = currentImg.caption;
    lightboxDesc.textContent = currentImg.caption;
    lightboxBadge.textContent = translateCategory(currentImg.categories || [currentImg.category]);
    lightboxCounter.textContent = `${activeLightboxIndex + 1} / ${activeDataset.length}`;

    const heartIcon = lightboxFavBtn.querySelector('i');
    heartIcon.className = isLiked 
        ? 'fa-solid fa-heart text-app-accent' 
        : 'fa-regular fa-heart text-white';

    setTimeout(() => lightboxImg.style.transform = 'scale(1)', 50);
}

function closeLightbox() {
    lightbox.classList.add('hidden');
    lightbox.classList.remove('flex');
    document.body.style.overflow = 'auto';
    renderGallery();
    renderFavorites();
}

function nextImage() {
    activeLightboxIndex = (activeLightboxIndex + 1) % activeDataset.length;
    updateLightboxContent();
}

function prevImage() {
    activeLightboxIndex = (activeLightboxIndex - 1 + activeDataset.length) % activeDataset.length;
    updateLightboxContent();
}

// Lightbox Listeners
document.getElementById('lightbox-next').addEventListener('click', nextImage);
document.getElementById('lightbox-prev').addEventListener('click', prevImage);
document.getElementById('lightbox-close-btn').addEventListener('click', closeLightbox);

lightboxFavBtn.addEventListener('click', () => {
    const currentImg = activeDataset[activeLightboxIndex];
    const isLiked = likedImages.includes(currentImg.id);
    
    if (isLiked) {
        likedImages = likedImages.filter(item => item !== currentImg.id);
        showToast("Removed from Favorites 💔");
    } else {
        likedImages.push(currentImg.id);
        showToast("Added to Favorites ❤️");
    }
    
    localStorage.setItem('imran_app_liked_ids', JSON.stringify(likedImages));
    updateLightboxContent();
});

lightboxCopyBtn.addEventListener('click', () => {
    const currentImg = activeDataset[activeLightboxIndex];
    const tempInput = document.createElement('input');
    tempInput.value = currentImg.url;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    showToast("Direct URL copied to clipboard 🔗");
});

// Double Tap Lightbox
let lightboxLastTap = 0;
lightboxImg.addEventListener('touchstart', (e) => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lightboxLastTap;
    if (tapLength < 280 && tapLength > 0) {
        e.preventDefault();
        const currentImg = activeDataset[activeLightboxIndex];
        if (!likedImages.includes(currentImg.id)) {
            likedImages.push(currentImg.id);
            localStorage.setItem('imran_app_liked_ids', JSON.stringify(likedImages));
            
            overlayHeart.classList.remove('hidden');
            overlayHeart.classList.add('heart-popup');
            
            setTimeout(() => {
                overlayHeart.classList.remove('heart-popup');
                overlayHeart.classList.add('hidden');
            }, 750);
            
            showToast("Added to Favorites ❤️");
            updateLightboxContent();
        }
    }
    lightboxLastTap = currentTime;
}, { passive: false });

// Keyboard
document.addEventListener('keydown', (e) => {
    if (lightbox.classList.contains('hidden')) return;
    if (e.key === 'ArrowRight') nextImage();
    if (e.key === 'ArrowLeft') prevImage();
    if (e.key === 'Escape') closeLightbox();
});

// Theme
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

// Touch Swipe
let touchstartX = 0;
let touchendX = 0;

lightbox.addEventListener('touchstart', e => {
    touchstartX = e.changedTouches[0].screenX;
}, { passive: true });

lightbox.addEventListener('touchend', e => {
    touchendX = e.changedTouches[0].screenX;
    if (touchendX < touchstartX - 60) nextImage();
    if (touchendX > touchstartX + 60) prevImage();
}, { passive: true });

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    initTheme();
    renderGallery();
    switchScreen('home');
});