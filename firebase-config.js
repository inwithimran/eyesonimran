const firebaseConfig = {
  apiKey: "AIzaSyCiILsuIIvCokCEdMcx_sNJx5WncBLUlAk",
  authDomain: "eyesonimran.firebaseapp.com",
  projectId: "eyesonimran",
  storageBucket: "eyesonimran.firebasestorage.app",
  messagingSenderId: "501577569267",
  appId: "1:501577569267:web:345dbc603cb5c95841b886",
  measurementId: "G-K7JREBRYJP"
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
