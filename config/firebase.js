const admin = require('firebase-admin');

// One Firebase Admin app for the service: FCM pushes (notificationService) and
// OTA bundle storage (otaUpdateController) both use it.
// Uses FIREBASE_SERVICE_ACCOUNT (JSON) or GOOGLE_APPLICATION_CREDENTIALS.
if (!admin.apps.length) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : null;
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || 'elevateclientapp.firebasestorage.app';

  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket
    });
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      storageBucket
    });
  } else {
    console.warn('⚠️  Firebase Admin: No credentials found. Set FIREBASE_SERVICE_ACCOUNT or GOOGLE_APPLICATION_CREDENTIALS env var.');
    admin.initializeApp({ storageBucket });
  }
}

const getBucket = () => admin.storage().bucket();

module.exports = { admin, getBucket };
