// Firebase configuration structure (Standard Compat Version for Zero-Build)
// Note: User needs to replace these with their own credentials from Firebase Console
const firebaseConfig = {
    apiKey: "AIzaSyCXcmf8vYBZtBWhLP3k1HWDEUAC-_MSkwo",
    authDomain: "estudaqui-be0f5.firebaseapp.com",
    projectId: "estudaqui-be0f5",
    storageBucket: "estudaqui-be0f5.firebasestorage.app",
    messagingSenderId: "271897096717",
    appId: "1:271897096717:web:263533ff30f243c99ddb44",
    measurementId: "G-KJS46W8WP1"
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
