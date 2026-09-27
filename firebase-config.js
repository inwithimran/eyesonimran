const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

let firebaseReady = false;
let auth = null;
let db = null;

try {
    firebase.initializeApp(firebaseConfig);
    firebaseReady = firebaseConfig.apiKey !== "YOUR_API_KEY";
} catch (err) {
    firebaseReady = false;
}

if (firebaseReady) {
    try { auth = firebase.auth(); } catch (err) {}
    try { db = firebase.firestore(); } catch (err) {}
}
