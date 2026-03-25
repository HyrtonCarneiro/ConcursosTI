// Firebase configuration structure (Standard Compat Version for Zero-Build)
// Note: User needs to replace these with their own credentials from Firebase Console
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "estudos-ti.firebaseapp.com",
    projectId: "estudos-ti",
    storageBucket: "estudos-ti.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
try {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
        window.db = firebase.firestore();
        window.auth = firebase.auth();
        console.log("Firebase initialized successfully");
    }
} catch (error) {
    console.error("Firebase initialization error:", error.message);
}
