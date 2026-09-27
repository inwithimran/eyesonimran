const loginView = document.getElementById('login-view');
const dashboardView = document.getElementById('dashboard-view');
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const loginBtn = document.getElementById('login-btn');
const loginError = document.getElementById('login-error');
const firebaseWarning = document.getElementById('firebase-warning');
const logoutBtn = document.getElementById('logout-btn');

const fileInput = document.getElementById('file-input');
const dropzone = document.getElementById('dropzone');
const uploadQueue = document.getElementById('upload-queue');
const captionInput = document.getElementById('caption-input');
const categoriesInput = document.getElementById('categories-input');
const cameraInput = document.getElementById('camera-input');
const dateInput = document.getElementById('date-input');
const uploadBtn = document.getElementById('upload-btn');
const uploadBtnText = document.getElementById('upload-btn-text');
const uploadSpinner = document.getElementById('upload-spinner');
const cloudPhotoList = document.getElementById('cloud-photo-list');
const cloudEmpty = document.getElementById('cloud-empty');
const editModal = document.getElementById('edit-modal');
const editPreview = document.getElementById('edit-preview');
const editCaption = document.getElementById('edit-caption');
const editCategories = document.getElementById('edit-categories');
const editCancelBtn = document.getElementById('edit-cancel-btn');
const editSaveBtn = document.getElementById('edit-save-btn');

let selectedFiles = [];
let editingDocId = null;

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.remove('opacity-0');
    toast.classList.add('opacity-100');
    setTimeout(() => {
        toast.classList.remove('opacity-100');
        toast.classList.add('opacity-0');
    }, 2200);
}

if (!firebaseReady || !cloudinaryReady) {
    const missing = [];
    if (!firebaseReady) missing.push("firebase-config.js");
    if (!cloudinaryReady) missing.push("cloudinary-config.js");
    firebaseWarning.textContent = `${missing.join(' ও ')} এ আপনার কনফিগারেশন বসান।`;
    firebaseWarning.classList.remove('hidden');
    if (!firebaseReady) loginBtn.disabled = true;
    if (!cloudinaryReady) uploadBtn.disabled = true;
}

loginBtn.addEventListener('click', () => {
    if (!firebaseReady) return;
    loginError.classList.add('hidden');
    auth.signInWithEmailAndPassword(loginEmail.value.trim(), loginPassword.value)
        .catch((err) => {
            loginError.textContent = "লগইন ব্যর্থ হয়েছে। ইমেইল বা পাসওয়ার্ড দেখুন।";
            loginError.classList.remove('hidden');
        });
});

logoutBtn.addEventListener('click', () => {
    if (firebaseReady) auth.signOut();
});

if (firebaseReady) {
    auth.onAuthStateChanged((user) => {
        if (user) {
            loginView.classList.add('hidden');
            dashboardView.classList.remove('hidden');
            watchCloudPhotos();
        } else {
            loginView.classList.remove('hidden');
            dashboardView.classList.add('hidden');
        }
    });
}

function formatExifDate(raw) {
    if (!raw) return '';
    const parts = raw.split(' ');
    if (parts.length !== 2) return raw;
    return parts[0].replace(/:/g, '-') + ' ' + parts[1];
}

function renderQueue() {
    uploadQueue.innerHTML = '';
    uploadQueue.classList.toggle('hidden', selectedFiles.length === 0);

    selectedFiles.forEach((file, index) => {
        const reader = new FileReader();
        const card = document.createElement('div');
        card.className = 'relative rounded-lg overflow-hidden border border-slate-100 h-20';
        card.innerHTML = `<div class="w-full h-full bg-slate-100 skeleton"></div>`;
        reader.onload = (e) => {
            card.innerHTML = `
                <img src="${e.target.result}" class="w-full h-full object-cover">
                <button class="remove-queue-btn absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-[10px] flex items-center justify-center" data-index="${index}">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            `;
            card.querySelector('.remove-queue-btn').addEventListener('click', () => {
                selectedFiles.splice(index, 1);
                renderQueue();
            });
        };
        reader.readAsDataURL(file);
        uploadQueue.appendChild(card);
    });
}

function addFilesToQueue(fileList) {
    const files = Array.from(fileList).filter(f => f.type.startsWith('image/'));
    if (files.length === 0) return;
    selectedFiles = selectedFiles.concat(files);
    renderQueue();

    if (typeof EXIF !== 'undefined' && selectedFiles.length > 0) {
        cameraInput.value = '';
        dateInput.value = '';
        EXIF.getData(selectedFiles[0], function () {
            const make = EXIF.getTag(this, "Make") || '';
            const model = EXIF.getTag(this, "Model") || '';
            const dateTime = EXIF.getTag(this, "DateTimeOriginal") || EXIF.getTag(this, "DateTime") || '';
            const camera = (make + ' ' + model).trim();
            if (camera) cameraInput.value = camera;
            if (dateTime) dateInput.value = formatExifDate(dateTime);
        });
    }
}

dropzone.addEventListener('click', () => fileInput.click());

dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('border-indigo-400', 'bg-indigo-50/40');
});

dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('border-indigo-400', 'bg-indigo-50/40');
});

dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('border-indigo-400', 'bg-indigo-50/40');
    addFilesToQueue(e.dataTransfer.files);
});

fileInput.addEventListener('change', () => {
    addFilesToQueue(fileInput.files);
    fileInput.value = '';
});

uploadBtn.addEventListener('click', async () => {
    if (!firebaseReady || !cloudinaryReady) return;
    if (selectedFiles.length === 0) {
        showToast("অন্তত একটা ছবি বাছাই করুন");
        return;
    }
    if (!captionInput.value.trim()) {
        showToast("ক্যাপশন লিখুন");
        return;
    }

    uploadBtn.disabled = true;
    uploadSpinner.classList.remove('hidden');

    const categories = categoriesInput.value.split(',').map(c => c.trim().toLowerCase()).filter(Boolean);
    let uploaded = 0;
    let failed = 0;

    for (const file of selectedFiles) {
        uploadBtnText.textContent = `আপলোড হচ্ছে... (${uploaded + failed + 1}/${selectedFiles.length})`;
        try {
            const numericId = Date.now() + uploaded;
            const cloudinaryResult = await uploadToCloudinary(file);

            await db.collection('images').add({
                numericId,
                url: cloudinaryResult.secure_url,
                publicId: cloudinaryResult.public_id,
                caption: captionInput.value.trim(),
                categories,
                camera: cameraInput.value.trim(),
                capturedAt: dateInput.value.trim(),
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            uploaded++;
        } catch (err) {
            failed++;
        }
    }

    showToast(failed === 0 ? `${uploaded}টি ছবি আপলোড সম্পন্ন হয়েছে ✅` : `${uploaded}টি সফল, ${failed}টি ব্যর্থ হয়েছে`);

    selectedFiles = [];
    renderQueue();
    fileInput.value = '';
    captionInput.value = '';
    categoriesInput.value = '';
    cameraInput.value = '';
    dateInput.value = '';

    uploadBtn.disabled = false;
    uploadBtnText.textContent = "আপলোড করুন";
    uploadSpinner.classList.add('hidden');
});

function watchCloudPhotos() {
    db.collection('images').orderBy('createdAt', 'desc').onSnapshot((snapshot) => {
        cloudPhotoList.innerHTML = '';
        if (snapshot.empty) {
            cloudEmpty.classList.remove('hidden');
            return;
        }
        cloudEmpty.classList.add('hidden');

        snapshot.forEach((doc) => {
            const data = doc.data();
            const card = document.createElement('div');
            card.className = 'relative rounded-xl overflow-hidden border border-slate-100 group cursor-pointer';
            card.innerHTML = `
                <img src="${data.url}" class="w-full h-28 object-cover">
                <div class="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[10px] px-2 py-1 truncate">${data.caption || ''}</div>
                <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <i class="fa-solid fa-pen text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity"></i>
                </div>
                <button class="delete-btn absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-white/90 text-red-500 flex items-center justify-center text-xs shadow" data-id="${doc.id}">
                    <i class="fa-solid fa-trash"></i>
                </button>
            `;

            card.addEventListener('click', () => openEditModal(doc.id, data));

            card.querySelector('.delete-btn').addEventListener('click', async (e) => {
                e.stopPropagation();
                if (!confirm('এই ছবিটা গ্যালারি থেকে মুছে ফেলতে চান? Cloudinary থেকে ফাইল থেকেই যাবে।')) return;
                try {
                    await db.collection('images').doc(doc.id).delete();
                    showToast("ছবি মুছে ফেলা হয়েছে");
                } catch (err) {
                    showToast("মুছতে সমস্যা হয়েছে");
                }
            });

            cloudPhotoList.appendChild(card);
        });
    });
}

let editModalPushed = false;

function openEditModal(docId, data) {
    editingDocId = docId;
    editPreview.src = data.url;
    editCaption.value = data.caption || '';
    editCategories.value = (data.categories || []).join(', ');
    editModal.classList.remove('hidden');
    editModal.classList.add('flex');
    history.pushState({ modal: 'edit' }, '');
    editModalPushed = true;
}

function closeEditModalUI() {
    editingDocId = null;
    editModal.classList.add('hidden');
    editModal.classList.remove('flex');
    editModalPushed = false;
}

function closeEditModal() {
    if (editModalPushed) {
        history.back();
    } else {
        closeEditModalUI();
    }
}

window.addEventListener('popstate', () => {
    if (editModalPushed) closeEditModalUI();
});

editCancelBtn.addEventListener('click', closeEditModal);

editSaveBtn.addEventListener('click', async () => {
    if (!editingDocId) return;
    const categories = editCategories.value.split(',').map(c => c.trim().toLowerCase()).filter(Boolean);
    try {
        await db.collection('images').doc(editingDocId).update({
            caption: editCaption.value.trim(),
            categories
        });
        showToast("ছবি আপডেট হয়েছে ✅");
        closeEditModal();
    } catch (err) {
        showToast("আপডেট করতে সমস্যা হয়েছে");
    }
});
