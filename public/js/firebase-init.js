// Initializes Firebase once, using the config from js/firebase-config.js.
// Exposes: window.fbAuth, window.fbDB, window.fbStorage
// Safe to include on every page — if the config still says "REPLACE_ME",
// everything below silently no-ops and the site just uses local demo content.
(function(){
  "use strict";
  const isConfigured = FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.apiKey !== "REPLACE_ME";
  window.FIREBASE_IS_CONFIGURED = isConfigured;
  if (!isConfigured){
    console.info("[portfolio] Firebase not configured yet — using local demo projects. See README.md.");
    return;
  }
  try{
    firebase.initializeApp(FIREBASE_CONFIG);
    window.fbAuth = firebase.auth();
    window.fbDB = firebase.firestore();
    // Storage SDK is only loaded on admin.html (public pages don't need it).
    // Guard this separately so its absence never breaks Auth/Firestore.
    if (typeof firebase.storage === "function"){
      window.fbStorage = firebase.storage();
    }
  }catch(err){
    console.error("[portfolio] Firebase init failed:", err);
    window.FIREBASE_IS_CONFIGURED = false;
  }
})();
