var config = {
        host: 'http://localhost:',
        port: 8080,
        secret: 'kingofjs',
        redisUrl: 'redis://localhost',
        salt: 'VeritasLuxMea(SNUMiManJob)',
        routes: {
                login: '/login',
                logout: '/logout',
                facebookAuth: '/auth/facebook',
                facebookAuthCallback: '/auth/facebook/callback',
                googleAuth: '/auth/google',
                googleAuthCallback: '/auth/google/callback'
        },
        facebook:{
            appID: '425833044484941',
            appSecret: '0e9e3abe80ba381899984a701e999f28'
        },
        google:{
          clientID: '770120767599-42ls9uil9m3n9vs7h706ej0gspie9m74.apps.googleusercontent.com',
          clientSecret: 'X64vCDQ5DX3OuvxrhG7ro87f'
        },
        crypto:{
                workFactor: 5000,
                keylen: 32,
                randomSize: 256
        }
};

module.exports = config;

