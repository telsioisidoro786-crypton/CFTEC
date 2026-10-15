const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\Administrador\\Documents\\cftec\\vite.config.ts', 'utf8');
const updated = content.replace(
  "if (path === '/api/admin/session' && req.method === 'GET') {\n            const admin = currentAdmin(req)",
  "if (path === '/api/admin/session' && req.method === 'GET') {\n            console.log('[SESSION] Endpoint hit')\n            const admin = currentAdmin(req)"
);
fs.writeFileSync('C:\\Users\\Administrador\\Documents\\cftec\\vite.config.ts', updated);
console.log('Done');