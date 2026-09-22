import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const bundlePath = path.join(projectRoot, 'canva-bundle', 'app.js');

const PORT = 8080;
const FIREBASE_API_KEY = 'AIzaSyBmyIAGv2y7UVqrIIOhQdllnrEOwJ8Purk';
const FIREBASE_PROJECT_ID = 'aoneprintstudio-4c1bd';
const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

// Helper: update Firestore document
async function setFirestoreDoc(collection, docId, data) {
  const url = `${FIRESTORE_BASE_URL}/${collection}/${docId}?key=${FIREBASE_API_KEY}`;
  const fields = {
    id: { stringValue: docId },
    title: { stringValue: data.title || 'Baby Frames' },
    baseImageUrl: { stringValue: data.baseImageUrl || '' },
    cleanBaseImageUrl: { stringValue: data.cleanBaseImageUrl || data.baseImageUrl || '' },
    category: { stringValue: data.category || 'baby-birth-frame' },
    updatedAt: { stringValue: new Date().toISOString() },
    jsonPayload: { stringValue: JSON.stringify(data) },
  };

  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  });
  return res.ok;
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost:8080'}`);
  const pathname = parsedUrl.pathname;
  const action = parsedUrl.searchParams.get('action');

  // 1. API: recent-templates proxy
  if (pathname === '/api/recent-templates' || (pathname === '/api/canva' && action === 'recent-templates')) {
    const defaultTemplates = [
      {
        id: 'tmpl-prod-1788931962289',
        title: 'Baby Frames (Current Product)',
        canvaDesignId: 'active-canva-design',
        photoSlotsCount: 2,
        textZonesCount: 4,
      },
      {
        id: 'tmpl-prod-1788932131885',
        title: 'Baby Birth Frame (Hot Air Balloon)',
        canvaDesignId: 'active-canva-design',
        photoSlotsCount: 3,
        textZonesCount: 5,
      },
    ];
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, templates: defaultTemplates }));
    return;
  }

  // 2. API: field-sync local handler (avoids CORS / Failed to fetch in Canva)
  if (
    req.method === 'POST' &&
    (pathname === '/api/field-sync' || (pathname === '/api/canva' && action === 'field-sync'))
  ) {
    let bodyStr = '';
    req.on('data', (chunk) => {
      bodyStr += chunk;
    });

    req.on('end', async () => {
      try {
        const payload = JSON.parse(bodyStr || '{}');
        const templateId = payload.templateId || 'tmpl-prod-1788931962289';
        const productId = templateId.replace(/^tmpl-/, '');
        const fields = payload.fields || [];

        const photoSlots = fields
          .filter((f) => f.type === 'photo')
          .map((f, i) => ({
            id: f.fieldId || `photo-${i + 1}`,
            label: f.label || `Photo Slot ${i + 1}`,
            shape: f.shape || 'rounded',
            x: f.centerX ? Math.round((f.centerX / (payload.pageWidth || 1200)) * 100) : 50,
            y: f.centerY ? Math.round((f.centerY / (payload.pageHeight || 1600)) * 100) : 50,
            width: Math.round(((f.width || 300) / (payload.pageWidth || 1200)) * 100),
            height: Math.round(((f.height || f.width || 300) / (payload.pageHeight || 1600)) * 100),
            rotation: f.rotation || 0,
            zIndex: i + 1,
            visibleToCustomer: true,
            required: i === 0,
          }));

        const textZones = fields
          .filter((f) => f.type === 'text')
          .map((f, i) => ({
            id: f.fieldId || `zone-${i + 1}`,
            label: f.label || `Text Zone ${i + 1}`,
            defaultValue: f.defaultValue || f.label || 'Custom Text',
            x: f.centerX ? Math.round((f.centerX / (payload.pageWidth || 1200)) * 100) : 50,
            y: f.centerY ? Math.round((f.centerY / (payload.pageHeight || 1600)) * 100) : 15 + i * 8,
            maxWidth: 80,
            fontSize: f.fontSize || 28,
            fontFamily: f.fontFamily || 'Playfair Display',
            color: f.color || '#1E293B',
            align: f.align || 'center',
            type: 'text',
            rotation: f.rotation || 0,
            zIndex: photoSlots.length + i + 1,
            visibleToCustomer: true,
            required: false,
            autoShrinkToFit: true,
          }));

        const updatedTemplateData = {
          id: templateId,
          productId,
          title: 'Baby Frames',
          category: 'baby-birth-frame',
          basePrice: 699,
          originalPrice: 999,
          baseImageUrl: 'https://res.cloudinary.com/dcnnn0ogm/image/upload/v1788932049/a1print/products/prod-1788931962289/ck8aqdvlxugiz2azifbp.jpg',
          cleanBaseImageUrl: 'https://res.cloudinary.com/dcnnn0ogm/image/upload/v1788932049/a1print/products/prod-1788931962289/ck8aqdvlxugiz2azifbp.jpg',
          photoSlots: photoSlots.length > 0 ? photoSlots : [
            { id: 'slot-center-main', label: 'Main Baby Photo', shape: 'rounded', x: 50, y: 58, width: 36, height: 36, rotation: 0, zIndex: 1, visibleToCustomer: true, required: true },
            { id: 'slot-bottom', label: 'Baby Milestone Photo', shape: 'rounded', x: 50, y: 76, width: 18, height: 14, rotation: 0, zIndex: 2, visibleToCustomer: true, required: false }
          ],
          textZones: textZones.length > 0 ? textZones : [
            { id: 'zone-baby-name', label: 'Baby Name', defaultValue: 'Add Baby Name', x: 50, y: 14, maxWidth: 80, fontSize: 34, fontFamily: 'Playfair Display', color: '#1E293B', align: 'center', type: 'text', rotation: 0, zIndex: 3, visibleToCustomer: true, required: true, autoShrinkToFit: true },
            { id: 'zone-subheading', label: 'Birth Details / Subheading', defaultValue: 'Date & Time of Birth', x: 50, y: 18, maxWidth: 75, fontSize: 22, fontFamily: 'Inter', color: '#475569', align: 'center', type: 'text', rotation: 0, zIndex: 4, visibleToCustomer: true, required: false, autoShrinkToFit: true },
            { id: 'zone-welcome', label: 'Welcome Text', defaultValue: 'Welcome world', x: 50, y: 22, maxWidth: 70, fontSize: 28, fontFamily: 'Dancing Script', color: '#0F172A', align: 'center', type: 'text', rotation: 0, zIndex: 5, visibleToCustomer: true, required: false, autoShrinkToFit: true },
            { id: 'zone-parents', label: 'Parents Name', defaultValue: 'Proud Parents', x: 50, y: 70, maxWidth: 70, fontSize: 24, fontFamily: 'Great Vibes', color: '#334155', align: 'center', type: 'text', rotation: 0, zIndex: 6, visibleToCustomer: true, required: false, autoShrinkToFit: true }
          ],
          status: 'published',
          updatedAt: new Date().toISOString(),
        };

        // Write directly to Firestore collections
        await setFirestoreDoc('universal_templates', templateId, updatedTemplateData);
        await setFirestoreDoc('frame_templates', templateId, updatedTemplateData);

        // Also update product document
        const prodUrl = `${FIRESTORE_BASE_URL}/products/${productId}?key=${FIREBASE_API_KEY}`;
        const prodRes = await fetch(prodUrl);
        let existingProdPayload = {};
        if (prodRes.ok) {
          const prodDoc = await prodRes.json();
          if (prodDoc.fields?.jsonPayload?.stringValue) {
            try { existingProdPayload = JSON.parse(prodDoc.fields.jsonPayload.stringValue); } catch {}
          }
        }

        const updatedProductData = {
          ...existingProdPayload,
          id: productId,
          photoSlots: updatedTemplateData.photoSlots,
          textZones: updatedTemplateData.textZones,
          linkedFrameTemplateId: templateId,
          baseImageUrl: updatedTemplateData.baseImageUrl,
          updatedAt: new Date().toISOString(),
        };
        await setFirestoreDoc('products', productId, updatedProductData);

        console.log(`✅ Synced ${updatedTemplateData.photoSlots.length} photos and ${updatedTemplateData.textZones.length} texts for ${templateId}!`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            success: true,
            templateId,
            photoSlotsCount: updatedTemplateData.photoSlots.length,
            textZonesCount: updatedTemplateData.textZones.length,
          })
        );
      } catch (err) {
        console.error('Field sync error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message || 'Sync failed' }));
      }
    });
    return;
  }

  // 3. Serve app.js bundle
  if (fs.existsSync(bundlePath)) {
    const content = fs.readFileSync(bundlePath, 'utf8');
    res.writeHead(200, {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Content-Length': Buffer.byteLength(content),
    });
    res.end(content);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('app.js bundle not found. Please build first.');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Canva Local Development Server running at: http://localhost:${PORT}/app.js`);
  console.log(`👉 Also handling proxy endpoints: /api/field-sync and /api/recent-templates`);
});
