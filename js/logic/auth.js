window.authLogic = {
    login: function(email, password) {
        if (!email || !password) {
            return Promise.reject(new Error("E-mail e senha são obrigatórios."));
        }
        // Normalize email if use just typed "hyrton"
        let normalizedEmail = email;
        if (!email.includes('@')) {
            normalizedEmail = `${email.toLowerCase()}@concursosti.com`;
        }
        
        return firebase.auth().signInWithEmailAndPassword(normalizedEmail, password);
    },
    
    logout: function() {
        return firebase.auth().signOut();
    }
};
