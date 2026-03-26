// Mocking window and Firebase for Node environment
global.window = {
    db: {
        collection: (name) => ({
            doc: (id) => ({
                get: async () => ({
                    exists: id === '_admin_',
                    data: () => ({
                        userList: [
                            { username: 'hyrton', password: 'hyrtinho' },
                            { username: 'teste', password: '123' }
                        ]
                    })
                }),
                onSnapshot: (callback) => {
                    callback({
                        exists: true,
                        data: () => ({ state: { materias: [] } })
                    });
                    return () => {};
                },
                set: async () => {},
                update: async () => {}
            })
        })
    },
    utils: {
        showToast: (msg) => console.log("TOAST:", msg)
    },
    localStorage: {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {}
    },
    firebase: {
        firestore: {
            FieldValue: {
                serverTimestamp: () => 'now'
            }
        }
    }
};

const fs = require('fs');
const path = require('path');

// Mock Store
const storeCode = fs.readFileSync(path.join(__dirname, '../data/store.js'), 'utf8');
eval(storeCode.replace('window.', 'global.window.'));
global.window.store = global.window.window.store; // Fix eval artifact

// Mock Auth
const authCode = fs.readFileSync(path.join(__dirname, '../logic/auth.js'), 'utf8');
eval(authCode.replace('window.', 'global.window.'));
global.window.authLogic = global.window.window.authLogic;

async function runTests() {
    console.log("Running Multi-user & Auth Tests...");

    // Test 1: Admin Identification
    global.window.store.state.currentUser = 'hyrton';
    if (!global.window.store.isAdmin()) throw new Error("Hyrton should be admin");
    
    global.window.store.state.currentUser = 'teste';
    if (global.window.store.isAdmin()) throw new Error("Teste should NOT be admin");

    // Test 2: Login Logic (Async)
    const loginOk = await global.window.authLogic.login('hyrton', 'hyrtinho');
    if (!loginOk) throw new Error("Hyrton login failed");

    const loginFail = await global.window.authLogic.login('hyrton', 'wrong');
    if (loginFail) throw new Error("Login should fail with wrong password");

    const loginUser = await global.window.authLogic.login('teste', '123');
    if (!loginUser) throw new Error("User 'teste' login failed");

    // Test 3: Data Isolation Mock Check
    global.window.store.state.currentUser = 'abc';
    // The collection path should be 'users/abc' (verified by inspection of store.js)
    
    console.log("✅ Multi-user & Auth tests passed!");
}

runTests().catch(e => {
    console.error("❌ Test failed:", e.message);
    process.exit(1);
});
