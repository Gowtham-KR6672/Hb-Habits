const fs = require('fs');
let data = fs.readFileSync('server.js', 'utf8');
data = data.replace(/\\`/g, '`');
data = data.replace(/\\\$/g, '$');
fs.writeFileSync('server.js', data);
