const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\Administrador\\Documents\\cftec\\vite.config.ts', 'utf8');
const updated = content.replace(
  "if (path === '/api/admin/summary' && req.method === 'GET') {\n              if (!supabase)",
  "if (path === '/api/admin/summary' && req.method === 'GET') {\n            console.log('[SUMMARY] Endpoint hit')\n              if (!supabase)"
);
fs.writeFileSync('C:\\Users\\Administrador\\Documents\\cftec\\vite.config.ts', updated);
console.log('Done');