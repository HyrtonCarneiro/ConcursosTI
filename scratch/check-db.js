const admin = require('firebase-admin');

async function check() {
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: "estudaqui-ca2ef",
                clientEmail: "firebase-adminsdk-p7p30@estudaqui-ca2ef.iam.gserviceaccount.com",
                privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            })
        });
    }

    const db = admin.firestore();
    const snapshot = await db.collection('users').get();
    
    console.log("--- DOCUMENTOS NO FIRESTORE ---");
    snapshot.forEach(doc => {
        const data = doc.data();
        console.log(`ID: ${doc.id}`);
        console.log(`Email: ${data.email || 'N/A'}`);
        console.log(`AnkiSyncData: ${JSON.stringify(data.ankiSyncData || 'Vazio')}`);
        console.log(`AnkiMonitorKey: ${data.ankiMonitorKey || 'N/A'}`);
        console.log("------------------------------");
    });
}

check().catch(console.error);
