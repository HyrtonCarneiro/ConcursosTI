window.authLogic = {
    login: function(username, password) {
        if (!username || !password) {
            return Promise.reject(new Error("Usuário e senha são obrigatórios."));
        }
        
        if (username.toLowerCase() === 'hyrton' && password === 'hyrtinho') {
            return Promise.resolve(true);
        } else {
            return Promise.reject(new Error("Credenciais inválidas."));
        }
    },
    
    logout: function() {
        return Promise.resolve();
    }
};
