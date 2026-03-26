window.authLogic = {
    login: function(username, password) {
        if (!username || !password) return false;
        return (username.toLowerCase() === 'hyrton' && password === 'hyrtinho');
    },
    
    logout: function() {
        return true;
    }
};
