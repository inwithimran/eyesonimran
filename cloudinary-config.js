const cloudinaryConfig = {
    cloudName: "YOUR_CLOUD_NAME",
    uploadPreset: "YOUR_UPLOAD_PRESET"
};

const cloudinaryReady = cloudinaryConfig.cloudName !== "YOUR_CLOUD_NAME" && cloudinaryConfig.uploadPreset !== "YOUR_UPLOAD_PRESET";

async function uploadToCloudinary(file) {
    const url = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', cloudinaryConfig.uploadPreset);
    formData.append('folder', 'pictures');

    const response = await fetch(url, { method: 'POST', body: formData });
    if (!response.ok) {
        throw new Error('Cloudinary upload failed');
    }
    return response.json();
}
