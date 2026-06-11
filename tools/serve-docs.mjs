// Tiny static server for previewing the built site in docs/.
// Usage: node tools/serve-docs.mjs [port]
import http from 'http';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const port = Number(process.argv[2]) || 8743;
const root = path.resolve('docs');
const types = {
	'.html': 'text/html',
	'.css': 'text/css',
	'.js': 'text/javascript',
	'.json': 'application/json',
	'.png': 'image/png',
	'.webp': 'image/webp',
	'.jpg': 'image/jpeg',
	'.svg': 'image/svg+xml',
	'.woff2': 'font/woff2',
	'.xml': 'application/xml',
	'.webmanifest': 'application/manifest+json'
};

http
	.createServer((req, res) => {
		let p = decodeURIComponent(req.url.split('?')[0]);
		if (p.endsWith('/')) p += 'index.html';
		let file = path.join(root, p);
		if (!file.startsWith(root)) {
			res.writeHead(403);
			res.end();
			return;
		}
		if (!fs.existsSync(file) && fs.existsSync(path.join(file, 'index.html'))) {
			file = path.join(file, 'index.html');
		}
		fs.readFile(file, (err, data) => {
			if (err) {
				res.writeHead(404, { 'content-type': 'text/html' });
				fs.readFile(path.join(root, '404.html'), (e2, nf) => res.end(e2 ? 'Not found' : nf));
				return;
			}
			const type = types[path.extname(file)] || 'application/octet-stream';
			// gzip text responses like production (GitHub Pages) does
			const compressible = /text|javascript|json|xml|svg|manifest/.test(type);
			if (compressible && /gzip/.test(req.headers['accept-encoding'] || '')) {
				zlib.gzip(data, (e3, zipped) => {
					res.writeHead(200, { 'content-type': type, 'content-encoding': 'gzip' });
					res.end(e3 ? data : zipped);
				});
				return;
			}
			res.writeHead(200, { 'content-type': type });
			res.end(data);
		});
	})
	.listen(port, () => console.log(`serving docs/ on http://localhost:${port}`));
