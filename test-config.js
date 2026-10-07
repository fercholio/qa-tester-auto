const ConfigLoader = require('./src/infrastructure/config/ConfigLoader');
console.log(JSON.stringify(ConfigLoader.load(), null, 2));
