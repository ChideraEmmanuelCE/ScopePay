import { mkdir, writeFile } from 'node:fs/promises';
import app from '../worker/index.js';

await mkdir('public', { recursive: true });
const response = await app.fetch(new Request('https://scopepay.invalid/'));
if (!response.ok) throw new Error('Unable to render ScopePay');
await writeFile('public/index.html', await response.text());
console.log('Built ScopePay public/index.html');
