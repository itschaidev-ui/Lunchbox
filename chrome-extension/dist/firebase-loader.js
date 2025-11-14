// Load Firebase from CDN and make available globally
// This file is loaded before popup-firebase.js
// @ts-ignore - Firebase loaded from CDN
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
// @ts-ignore
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
// Make Firebase available globally for popup-firebase.js
window.firebaseApp = initializeApp;
window.firebaseAuth = { getAuth, onAuthStateChanged };
// Dispatch event when Firebase is ready
window.dispatchEvent(new Event('firebase-ready'));
