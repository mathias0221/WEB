const CACHE_NAME = 'enrutador-app-v1';
const urlsToCache = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './icon.png',
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs',
  'https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open