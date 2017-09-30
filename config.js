var config = {
        port: 8080,
        secret: 'secret',
        redisUrl: 'redis://localhost',
        salt: 'VeritasLuxMea(SNUMiManJob)',
        routes: {
                login: '/login',
                logout: '/logout'
        },
        crypto:{
                workFactor: 5000,
                keylen: 32,
                randomSize: 256
        }
};

module.exports = config;

