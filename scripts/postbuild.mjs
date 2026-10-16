// GitHub Pages has no SPA fallback: serving index.html as 404.html lets
// deep links like /nomly/venue/slug load the app, which then routes client-side.
import { copyFileSync } from 'node:fs';
copyFileSync('dist/index.html', 'dist/404.html');
console.log('postbuild: wrote dist/404.html');
