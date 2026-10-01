// Proxy de `ng serve`: la aplicación llama siempre a rutas relativas (/api/...) y aquí
// se reenvían al backend. Así el navegador ve un solo origen y no hace falta CORS.
// Para apuntar a otro backend: API_PROXY_TARGET=http://host:puerto pnpm start
const target = process.env.API_PROXY_TARGET ?? 'http://localhost:3000';

export default {
  '/api': { target, changeOrigin: true },
};
