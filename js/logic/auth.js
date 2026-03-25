window.authLogic = {
    login: function(username, password) {
        if (!username || !password) {
            throw new Error("Usuário e senha são obrigatórios.");
        }
        if (username === 'Hyrton' && password === 'hyrtinho') {
            return true;
        }
        throw new Error("Credenciais inválidas. Tente novamente.");
    }
};
