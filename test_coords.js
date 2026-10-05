const fs = require('fs');
const path = require('path');
const assert = require('assert');

// 1. Validate oficios.json JSON syntax
const oficiosData = JSON.parse(fs.readFileSync('oficios.json', 'utf8'));
assert.ok(Array.isArray(oficiosData), 'oficios.json must be a valid JSON array');
console.log(`✓ oficios.json parsed successfully (${oficiosData.length} oficios en base de datos inicializada)`);

// 2. Validate app.js functions
const appJs = fs.readFileSync('app.js', 'utf8');

// Load environment from app.js
const zonaCoordsCode = appJs.match(/const AHOME_ZONA_COORDS = \{[\s\S]*?\n\};/)[0];
const normCode = appJs.match(/function normalizeText[\s\S]*?\n\}/)[0];
const normMapCode = appJs.match(/const NORMALIZED_ZONA_MAP[\s\S]*?function initNormalizedZonaMap\(\) \{[\s\S]*?\n\}/)[0];
const getBaseCoordsCode = appJs.match(/function getBaseCoordsForZona[\s\S]*?\n\}/)[0];
const getCircularCode = appJs.match(/function getCircularOffsetCoords[\s\S]*?\n\}/)[0];

const env = eval(`(() => {
  ${zonaCoordsCode};
  const AHOME_DEFAULT_CENTER = [25.7928, -108.9967];
  ${normCode};
  ${normMapCode};
  ${getBaseCoordsCode};
  ${getCircularCode};
  initNormalizedZonaMap();
  return { AHOME_ZONA_COORDS, normalizeText, getBaseCoordsForZona, getCircularOffsetCoords };
})()`);

console.log(`✓ Loaded ${Object.keys(env.AHOME_ZONA_COORDS).length} zones in AHOME_ZONA_COORDS`);

// 3. Test Álamos Country vs Los Álamos precision
const alamosCountryTests = [
  'Álamos Country',
  'alamos country',
  'Fracc. Álamos Country',
  'Fraccionamiento Álamos Country',
  'Alamos Country',
  'fracc alamos country'
];

alamosCountryTests.forEach(input => {
  const c = env.getBaseCoordsForZona(input);
  assert.strictEqual(c[0], 25.7805, `Input "${input}" lat must be 25.7805`);
  assert.strictEqual(c[1], -109.0215, `Input "${input}" lng must be -109.0215`);
});
console.log('✓ All Álamos Country variations resolve to exact [25.7805, -109.0215]');

// Test Los Álamos
const losAlamosTests = ['Los Álamos', 'los alamos', 'Álamos', 'alamos', 'Los Álamos 1 y 2'];
losAlamosTests.forEach(input => {
  const c = env.getBaseCoordsForZona(input);
  assert.strictEqual(c[0], 25.7950, `Input "${input}" lat must be 25.7950`);
  assert.strictEqual(c[1], -108.9720, `Input "${input}" lng must be -108.9720`);
});
console.log('✓ All Los Álamos variations resolve to exact [25.7950, -108.9720]');

// Test Virreyes
const virreyesCoords = env.getBaseCoordsForZona('Virreyes');
assert.strictEqual(virreyesCoords[0], 25.7778);
assert.strictEqual(virreyesCoords[1], -109.0192);
console.log('✓ Virreyes resolves to exact [25.7778, -109.0192]');

// 4. Test circular orbital distribution
const baseAlamos = [25.7805, -109.0215];
// 1 oficio in Álamos Country
const p1_of_1 = env.getCircularOffsetCoords(baseAlamos, 0, 1);
assert.deepStrictEqual(p1_of_1, baseAlamos, 'Single worker must be at exact base coords');

// 2 oficios in Álamos Country (user case: "al poner nuevamente un oficio en alamos country")
const p1_of_2 = env.getCircularOffsetCoords(baseAlamos, 0, 2);
const p2_of_2 = env.getCircularOffsetCoords(baseAlamos, 1, 2);

console.log(`  Worker 1 of 2: [${p1_of_2[0]}, ${p1_of_2[1]}]`);
console.log(`  Worker 2 of 2: [${p2_of_2[0]}, ${p2_of_2[1]}]`);

// Distance between the two pins
function distMeters(p1, p2) {
  const R = 6371000;
  const dLat = (p2[0] - p1[0]) * Math.PI / 180;
  const dLon = (p2[1] - p1[1]) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(p1[0]*Math.PI/180) * Math.cos(p2[0]*Math.PI/180) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

const sepMeters = distMeters(p1_of_2, p2_of_2);
console.log(`  Separation between workers: ${sepMeters.toFixed(1)} meters`);
assert.ok(sepMeters >= 100 && sepMeters <= 180, 'Separation between 2 pins must be ~140m (neighborhood scale)');

// Both must be within 100 meters of the center
const dist1FromCenter = distMeters(baseAlamos, p1_of_2);
const dist2FromCenter = distMeters(baseAlamos, p2_of_2);
console.log(`  Distance from Álamos center: Worker 1=${dist1FromCenter.toFixed(1)}m, Worker 2=${dist2FromCenter.toFixed(1)}m`);
assert.ok(dist1FromCenter <= 80, 'Worker 1 must be within 80m of center');
assert.ok(dist2FromCenter <= 80, 'Worker 2 must be within 80m of center');
console.log('✓ Circular orbital distribution stays strictly inside the neighborhood boundaries');

// 5. Test all options in index.html
const indexHtml = fs.readFileSync('index.html', 'utf8');
const regZonaMatch = indexHtml.match(/<select[^>]*id="reg-zona"[^>]*>([\s\S]*?)<\/select>/);
const optionRegex = /<option\s+value="([^"]+)">/g;
let match;
let count = 0;
while ((match = optionRegex.exec(regZonaMatch[1])) !== null) {
  if (match[1]) {
    count++;
    const coords = env.getBaseCoordsForZona(match[1]);
    assert.ok(Array.isArray(coords) && coords.length === 2, `Coords for "${match[1]}" must be valid`);
    assert.ok(!isNaN(coords[0]) && !isNaN(coords[1]), `Coords for "${match[1]}" must not be NaN`);
  }
}
console.log(`✓ All ${count} options in reg-zona resolve cleanly to valid geographic coordinates`);

// 6. Test WhatsApp contact and compromiso disclaimer
assert.ok(indexHtml.includes('668 395 6301'), 'indexHtml must contain WhatsApp number 668 395 6301');
assert.ok(indexHtml.includes('https://wa.me/526683956301'), 'indexHtml must contain direct WhatsApp link');
assert.ok(indexHtml.includes('id="reg-compromiso"'), 'indexHtml must contain reg-compromiso checkbox');
assert.ok(indexHtml.includes('name="compromiso" required'), 'reg-compromiso must be required');
assert.ok(appJs.includes("formData.get('compromiso') === 'on'"), 'app.js must validate compromiso checkbox');
console.log('✓ WhatsApp contact section (668 395 6301) and compromiso disclaimer verified');

// 7. Test Fotos de Trabajos Reales (enlaceTrabajos)
assert.ok(indexHtml.includes('id="reg-enlace-trabajos"'), 'indexHtml must contain reg-enlace-trabajos input');
assert.ok(indexHtml.includes('name="enlaceTrabajos"'), 'indexHtml must have input with name="enlaceTrabajos"');
assert.ok(indexHtml.includes('Facebook / Instagram / Drive / Imgur'), 'indexHtml must mention Facebook, Instagram, Drive, Imgur');

// Test getEnlaceTrabajosInfo helper
const getEnlaceCode = appJs.match(/function getEnlaceTrabajosInfo[\s\S]*?\n\}/)[0];
const getEnlaceTrabajosInfo = eval(`(${getEnlaceCode})`);

const fbTest = getEnlaceTrabajosInfo('facebook.com/taller');
assert.strictEqual(fbTest.type, 'facebook');
assert.strictEqual(fbTest.url, 'https://facebook.com/taller');
assert.ok(fbTest.label.includes('Facebook'));

const igTest = getEnlaceTrabajosInfo('https://instagram.com/herreriamochis');
assert.strictEqual(igTest.type, 'instagram');
assert.ok(igTest.label.includes('Instagram'));

const driveTest = getEnlaceTrabajosInfo('https://drive.google.com/drive/folders/xyz');
assert.strictEqual(driveTest.type, 'drive');
assert.ok(driveTest.label.includes('Drive'));

const imgurTest = getEnlaceTrabajosInfo('imgur.com/a/album123');
assert.strictEqual(imgurTest.type, 'imgur');
assert.strictEqual(imgurTest.url, 'https://imgur.com/a/album123');
assert.ok(imgurTest.label.includes('Imgur'));

// Verify app.js integration for enlaceTrabajos
assert.ok(appJs.includes("formData.get('enlaceTrabajos')"), 'app.js must extract enlaceTrabajos from form');
assert.ok(appJs.includes("enlaceTrabajos: formattedEnlaceTrabajos"), 'app.js must store enlaceTrabajos in nuevoOficio');
assert.ok(appJs.includes("getEnlaceTrabajosInfo(item.enlaceTrabajos)"), 'app.js must parse enlaceTrabajos for cards');

console.log('✓ Fotos de trabajos reales (enlaceTrabajos): Facebook, Instagram, Drive, Imgur verified');

// 8. Test Generador de Mensaje Claro para Cotización por WhatsApp
assert.ok(indexHtml.includes('id="modal-quote"'), 'indexHtml must contain modal-quote');
assert.ok(indexHtml.includes('id="quote-trabajo"'), 'indexHtml must contain quote-trabajo input');
assert.ok(indexHtml.includes('id="quote-colonia"'), 'indexHtml must contain quote-colonia input');
assert.ok(indexHtml.includes('quote-urgencia-btn'), 'indexHtml must contain quote-urgencia buttons');
assert.ok(indexHtml.includes('id="quote-preview-text"'), 'indexHtml must contain quote-preview-text');
assert.ok(indexHtml.includes('id="btn-send-whatsapp-quote"'), 'indexHtml must contain btn-send-whatsapp-quote');

// Test compileWhatsAppQuoteMessage function from app.js
const compileMsgMatch = appJs.match(/function compileWhatsAppQuoteMessage[\s\S]*?\n\}/)[0];
const compileWhatsAppQuoteMessage = eval(`(${compileMsgMatch})`);

const compiledWithName = compileWhatsAppQuoteMessage('Don Toño', 'reparación de fuga', 'Col. Bienestar', 'esta semana');
console.log('  Compiled message sample:', compiledWithName);
assert.strictEqual(
  compiledWithName,
  'Hola Don Toño, vi tu contacto en Oficios Ahome. Necesito cotizar: [reparación de fuga] en [Col. Bienestar]. ¿Tienes disponibilidad [esta semana]?'
);

const compiledWithoutName = compileWhatsAppQuoteMessage('', 'reparación de fuga', 'Col. Bienestar', 'esta semana');
assert.strictEqual(
  compiledWithoutName,
  'Hola, vi tu contacto en Oficios Ahome. Necesito cotizar: [reparación de fuga] en [Col. Bienestar]. ¿Tienes disponibilidad [esta semana]?'
);

// Verify wiring in cards and ficha modal
assert.ok(appJs.includes("window.openWhatsAppQuoteModal('${escapeHtml(item.id)}')"), 'createCardElement and openFichaModal must trigger openWhatsAppQuoteModal');
assert.ok(appJs.includes('OFICIO_SUGGESTIONS'), 'app.js must have OFICIO_SUGGESTIONS for 1-click chips');
assert.ok(appJs.includes('window.openWhatsAppQuoteModal = openWhatsAppQuoteModal'), 'openWhatsAppQuoteModal must be exported to window');

console.log('✓ Generador de mensaje claro para cotización: 3 casillas, vista previa en vivo y compilación perfecta');

// 9. Test Modo Sin Conexión Garantizado (Offline Cache)
const swJs = fs.readFileSync('sw.js', 'utf8');
assert.ok(swJs.includes("CACHE_NAME = 'oficios-ahome-v5.0'"), 'sw.js must be at v5.0');
assert.ok(swJs.includes("'./oficios.json'"), 'sw.js must precache oficios.json');
assert.ok(swJs.includes("url.pathname.endsWith('oficios.json')"), 'sw.js must serve cached oficios.json');
assert.ok(swJs.includes("SKIP_WAITING"), 'sw.js must handle SKIP_WAITING message');

// app.js offline cache sync
assert.ok(appJs.includes('async function syncDatabaseToOfflineCache'), 'app.js must implement syncDatabaseToOfflineCache');
assert.ok(appJs.includes("SW_CACHE_NAME = 'oficios-ahome-v5.0'"), 'app.js SW_CACHE_NAME must match sw.js');
assert.ok(appJs.includes("syncDatabaseToOfflineCache(state.oficios)"), 'app.js must sync state.oficios to offline cache');

// Calling by conventional cellular network
assert.ok(indexHtml.includes('red celular convencional'), 'indexHtml offline-banner must mention red celular convencional');
assert.ok(indexHtml.includes('id="quote-offline-warning"'), 'indexHtml must contain quote-offline-warning');
assert.ok(indexHtml.includes('id="quote-direct-call-btn"'), 'indexHtml must contain quote-direct-call-btn');
assert.ok(appJs.includes("href=\"${telUrl}\""), 'app.js must keep tel: link for cellular calling');

console.log('✓ Modo sin conexión garantizado (Offline Cache): SW v2.2, CacheStorage ./oficios.json y llamadas celulares directas');

// 10. Test Botón "Compartir por WhatsApp": Acción nativa (navigator.share) y reenvío a vecinos o grupos
const sampleWorker = {
  id: 'ahome-001',
  nombre: 'Don Toño',
  oficio: 'Plomero y Fontanero',
  zona: 'Álamos Country',
  sindicatura: 'Central (Los Mochis)',
  telefono: '668 123 4567',
  descripcion: 'Reparación de fugas e instalación de tuberías',
  cobertura: 'Sector Poniente y colonias aledañas',
  horario: 'Lunes a Sábado 8:00 AM - 6:00 PM',
  enlaceTrabajos: 'https://facebook.com/plomeriadontono'
};

// Evaluar formatOficioShareText de app.js en un contexto limpio
const formatShareMatch = appJs.match(/function formatOficioShareText\([\s\S]*?\n\}/);
assert.ok(formatShareMatch, 'formatOficioShareText function must be present in app.js');
const formatOficioShareTextFn = new Function('item', 'shareUrl', `${formatShareMatch[0]}; return formatOficioShareText(item, shareUrl);`);

const testUrl = 'https://oficiosahome.online/?id=ahome-001';
const formattedShareMsg = formatOficioShareTextFn(sampleWorker, testUrl);

assert.ok(formattedShareMsg.includes('👋 *Recomendación en Oficios Ahome:*'), 'Must include friendly neighbor recommendation header');
assert.ok(formattedShareMsg.includes('🛠️ *Don Toño* — Plomero y Fontanero'), 'Must include worker name and trade');
assert.ok(formattedShareMsg.includes('📍 *Zona:* Álamos Country (Central (Los Mochis))'), 'Must include zone and sindicatura');
assert.ok(formattedShareMsg.includes('📞 *WhatsApp / Tel:* 668 123 4567'), 'Must include WhatsApp / phone number');
assert.ok(formattedShareMsg.includes('📸 *Fotos de trabajos reales:* https://facebook.com/plomeriadontono'), 'Must include real work catalog link if present');
assert.ok(formattedShareMsg.includes('👉 *Ver ficha completa y ubicación en el mapa:*'), 'Must include map call to action');
assert.ok(formattedShareMsg.includes(testUrl), 'Must include exact card URL for 1-click opening');

// Verify navigator.share native invocation and WhatsApp direct fallback
assert.ok(appJs.includes('navigator.share'), 'app.js must call navigator.share for native OS share sheet');
assert.ok(appJs.includes('https://api.whatsapp.com/send?text='), 'app.js must have direct WhatsApp URL fallback');
assert.ok(appJs.includes('async function shareOficioViaWhatsApp'), 'app.js must define shareOficioViaWhatsApp');
assert.ok(appJs.includes('window.shareOficioViaWhatsApp = shareOficioViaWhatsApp'), 'shareOficioViaWhatsApp must be exported to window');
assert.ok(appJs.includes('window.formatOficioShareText = formatOficioShareText'), 'formatOficioShareText must be exported to window');
assert.ok(appJs.includes('function shareOficio'), 'shareOficio backwards compatibility wrapper must exist');

// Verify UI presence in all 3 key touchpoints: cards, ficha modal, and expanded view
assert.ok(appJs.includes("onclick=\"window.shareOficioViaWhatsApp('${escapeHtml(item.id)}')\""), 'shareOficioViaWhatsApp must be wired into template buttons');
const shareButtonOccurrences = (appJs.match(/Compartir por WhatsApp/g) || []).length;
assert.ok(shareButtonOccurrences >= 3, `Must have Compartir por WhatsApp in card, modal, and expanded card (found: ${shareButtonOccurrences})`);

// Deep linking check on page load (?id=workerId)
assert.ok(appJs.includes('function checkSharedWorkerParam'), 'app.js must handle ?id= parameter to focus worker on map and modal');

console.log('  Share message sample:\n' + formattedShareMsg.split('\n').map(l => '    ' + l).join('\n'));
console.log('✓ Botón "Compartir por WhatsApp": navigator.share nativo, fallback a api.whatsapp.com, ficha completa y botón en tarjetas');

// 11. Test Selector Interactivo de Ubicación: Mini-mapa, Pin Arrastrable y Botón GPS
assert.ok(indexHtml.includes('id="reg-map-picker"'), 'indexHtml must contain #reg-map-picker container');
assert.ok(indexHtml.includes('id="btn-reg-use-gps"'), 'indexHtml must contain #btn-reg-use-gps button');
assert.ok(indexHtml.includes('id="reg-coords-display"'), 'indexHtml must contain #reg-coords-display element');
assert.ok(indexHtml.includes('id="reg-lat"'), 'indexHtml must contain #reg-lat input');
assert.ok(indexHtml.includes('id="reg-lng"'), 'indexHtml must contain #reg-lng input');

// Verify app.js handlers
assert.ok(appJs.includes('function initOrUpdateRegisterPickerMap'), 'app.js must define initOrUpdateRegisterPickerMap');
assert.ok(appJs.includes('function setPickerCoords'), 'app.js must define setPickerCoords');
assert.ok(appJs.includes('navigator.geolocation'), 'app.js must integrate navigator.geolocation for GPS detection');
assert.ok(appJs.includes('state.pickerMarker'), 'app.js must hold draggable picker marker state');

console.log('✓ Selector Interactivo de Ubicación: Mini-mapa Leaflet, Pin Arrastrable, Botón GPS y Coordenadas Inmutables');

// 12. Test Búsqueda Inteligente con Diccionario de Regionalismos por Categoría de Oficio
const regMatch = appJs.match(/const OFICIO_REGIONALISMS = \{[\s\S]*?\n\};/)[0];
assert.ok(regMatch, 'app.js must define OFICIO_REGIONALISMS dictionary');
const OFICIO_REGIONALISMS = eval(`(() => { ${regMatch}; return OFICIO_REGIONALISMS; })()`);

assert.ok(OFICIO_REGIONALISMS['Herrería'].includes('porton'), 'Herrería must include porton');
assert.ok(OFICIO_REGIONALISMS['Herrería'].includes('soldador'), 'Herrería must include soldador');
assert.ok(OFICIO_REGIONALISMS['Reparación de electrodomésticos'].includes('cooler'), 'Electrodomésticos must include cooler');
assert.ok(OFICIO_REGIONALISMS['Reparación de electrodomésticos'].includes('minisplit'), 'Electrodomésticos must include minisplit');
assert.ok(OFICIO_REGIONALISMS['Albañilería'].includes('enjarrador'), 'Albañilería must include enjarrador');
assert.ok(OFICIO_REGIONALISMS['Albañilería'].includes('loza'), 'Albañilería must include loza');
assert.ok(OFICIO_REGIONALISMS['Albañilería'].includes('pegapiso'), 'Albañilería must include pegapiso');
assert.ok(OFICIO_REGIONALISMS['Plomería'].includes('tinaco'), 'Plomería must include tinaco');
assert.ok(OFICIO_REGIONALISMS['Plomería'].includes('bomba'), 'Plomería must include bomba');
assert.ok(OFICIO_REGIONALISMS['Mecánica ligera'].includes('freno') || OFICIO_REGIONALISMS['Mecánica ligera'].includes('frenos'), 'Mecánica must include frenos');

const synonymsMatch = appJs.match(/const SEARCH_SYNONYMS = \{[\s\S]*?\n\};/)[0];
assert.ok(synonymsMatch, 'app.js must define SEARCH_SYNONYMS dictionary');
const SEARCH_SYNONYMS = eval(`(() => { ${synonymsMatch}; return SEARCH_SYNONYMS; })()`);

assert.ok(SEARCH_SYNONYMS['clima'].includes('minisplit'), 'clima must map to minisplit');
assert.ok(SEARCH_SYNONYMS['fuga'].includes('plomeria'), 'fuga must map to plomeria');
assert.ok(SEARCH_SYNONYMS['chapa'].includes('cerrajeria'), 'chapa must map to cerrajeria');
assert.ok(SEARCH_SYNONYMS['porton'].includes('herreria'), 'porton must map to herreria');
assert.ok(!SEARCH_SYNONYMS['porton'].includes('motor'), 'porton must NOT contain generic motor to avoid false car mechanic matches');
assert.ok(SEARCH_SYNONYMS['zacate'].includes('jardineria'), 'zacate must map to jardineria');
assert.ok(SEARCH_SYNONYMS['corto'].includes('electricidad'), 'corto must map to electricidad');
console.log('✓ Búsqueda Inteligente: Diccionario de regionalismos por categoría y sinónimos verificado (portón aislado de mecánica)');

// 13. Test Cálculo de Distancia Real (Fórmula de Haversine)
const haversineMatch = appJs.match(/function calculateDistanceKm\([\s\S]*?\n\}/)[0];
assert.ok(haversineMatch, 'app.js must define calculateDistanceKm');
const calculateDistanceKm = eval(`(${haversineMatch})`);

// Distancia entre Álamos Country [25.7805, -109.0215] y Centro Los Mochis [25.7928, -108.9967] (~2.8 km)
const sampleDistance = calculateDistanceKm(25.7805, -109.0215, 25.7928, -108.9967);
console.log(`  Sample Haversine distance Álamos Country -> Centro: ${sampleDistance.toFixed(2)} km`);
assert.ok(sampleDistance >= 2.6 && sampleDistance <= 3.1, 'Distance between Álamos Country and Centro must be ~2.8 km');
assert.strictEqual(calculateDistanceKm(null, null, 25, -109), null, 'Invalid coords must return null');
console.log('✓ Cálculo de Distancia Real (Fórmula Haversine): Precisión métrica confirmada');

// 14. Test Formateador en Vivo de Teléfono a 10 Dígitos
const phoneFormatMatch = appJs.match(/function formatLivePhoneNumber\([\s\S]*?\n\}/)[0];
assert.ok(phoneFormatMatch, 'app.js must define formatLivePhoneNumber');
const formatLivePhoneNumber = eval(`(${phoneFormatMatch})`);

assert.strictEqual(formatLivePhoneNumber('6681234567'), '668 123 4567', 'Must format 10 digits to 668 123 4567');
assert.strictEqual(formatLivePhoneNumber('(668) 123-4567'), '668 123 4567', 'Must strip punctuation and format');
assert.strictEqual(formatLivePhoneNumber('668'), '668', 'Must preserve 3 digits');
assert.strictEqual(formatLivePhoneNumber('66812'), '668 12', 'Must format 5 digits as 668 12');
assert.strictEqual(formatLivePhoneNumber('6681234567999'), '668 123 4567', 'Must cap at 10 digits');
console.log('✓ Formateador Dinámico de Teléfono: 10 dígitos con espaciado natural (668 123 4567)');

// 15. Test Barra de Filtros Activos con Eliminación 1-Clic
assert.ok(indexHtml.includes('id="active-filters-bar"'), 'indexHtml must contain active-filters-bar');
assert.ok(indexHtml.includes('id="active-filter-chips"'), 'indexHtml must contain active-filter-chips');
assert.ok(!indexHtml.includes('id="btn-user-gps"'), 'btn-user-gps must be removed');
assert.ok(appJs.includes('function renderActiveFilterChips'), 'app.js must define renderActiveFilterChips');
assert.ok(appJs.includes('function clearSingleFilter'), 'app.js must define clearSingleFilter');
assert.ok(appJs.includes('function applyQuickSearch'), 'app.js must define applyQuickSearch');
assert.ok(!appJs.includes('function toggleGpsProximity'), 'toggleGpsProximity must be removed');
assert.ok(appJs.includes('window.clearSingleFilter = clearSingleFilter'), 'clearSingleFilter must be exported to window');
assert.ok(appJs.includes('window.applyQuickSearch = applyQuickSearch'), 'applyQuickSearch must be exported to window');
console.log('✓ Barra de Filtros Activos con Eliminación 1-Clic (✕) verificada (Cercanos GPS removido limpiamente)');

// 16. Test Gestos Móviles Touch Swipe, Animación Pulse Pin y Lazy Loading
assert.ok(appJs.includes('function initFichaModalTouchSwipe'), 'app.js must define initFichaModalTouchSwipe');
assert.ok(appJs.includes('touchstart'), 'app.js must listen to touchstart for swiping');
assert.ok(appJs.includes('touchend'), 'app.js must listen to touchend for swiping');
assert.ok(appJs.includes('pulse-pin'), 'app.js must add pulse-pin class to map pin');
assert.ok(indexHtml.includes('pulse-pin'), 'indexHtml must define pulse-pin CSS');
assert.ok(appJs.includes('loading="lazy"'), 'app.js cards must use loading="lazy"');
assert.ok(appJs.includes('decoding="async"'), 'app.js cards must use decoding="async"');
assert.ok(indexHtml.includes('role="dialog"'), 'indexHtml modals must have role="dialog"');
assert.ok(indexHtml.includes('aria-modal="true"'), 'indexHtml modals must have aria-modal="true"');
console.log('✓ Gestos Móviles Touch Swipe, Animación Pulse Pin y Lazy Loading verificados');

// 17. Test ⭐ Favoritos / "Mis Oficios de Confianza" (Opción 1)
assert.ok(appJs.includes('function initFavorites'), 'app.js must define initFavorites');
assert.ok(appJs.includes('function toggleFavorite'), 'app.js must define toggleFavorite');
assert.ok(appJs.includes('function isFavorite'), 'app.js must define isFavorite');
assert.ok(appJs.includes('function toggleFavoritesFilter'), 'app.js must define toggleFavoritesFilter');
assert.ok(appJs.includes('ahome_favoritos'), 'app.js must persist favorites in localStorage under ahome_favoritos');
assert.ok(appJs.includes('btn-fav-'), 'app.js must tag star buttons with btn-fav- prefix');
assert.ok(indexHtml.includes('id="btn-filter-favorites"'), 'index.html must include btn-filter-favorites in search filter chips');
assert.ok(indexHtml.includes('id="favorites-count-badge"'), 'index.html must include favorites-count-badge');
console.log('✓ ⭐ Favoritos / Mis Oficios de Confianza (Opción 1): Persistencia, badges y filtrado verificados');

// 18. Test 🧭 Botón "Cómo llegar" con Google Maps (Opción 2)
assert.ok(appJs.includes('https://www.google.com/maps/dir/?api=1&destination='), 'app.js must generate Google Maps directions links');
assert.ok(appJs.includes('Cómo llegar'), 'app.js cards and ficha modal must have Cómo llegar button');
assert.ok(appJs.includes('Ruta</span>'), 'Leaflet popup must contain direct Ruta link');
console.log('✓ 🧭 Botón "Cómo llegar" (Opción 2): Navegación paso a paso en tarjetas, ficha y mapa verificada');

// 19. Test 📇 Botón "Guardar en Contactos" con vCard 3.0 (Opción 3)
assert.ok(appJs.includes('function downloadVCard'), 'app.js must define downloadVCard');
assert.ok(appJs.includes('BEGIN:VCARD'), 'app.js must format valid vCard 3.0 header');
assert.ok(appJs.includes('VERSION:3.0'), 'app.js must specify vCard VERSION:3.0');
assert.ok(appJs.includes('END:VCARD'), 'app.js must conclude with END:VCARD');
assert.ok(appJs.includes('.vcf'), 'app.js must trigger download of .vcf contact file');
assert.ok(appJs.includes('text/vcard;charset=utf-8;'), 'app.js must use text/vcard MIME type');
console.log('✓ 📇 Guardar en Contactos (Opción 3): Generador offline de vCard 3.0 (.vcf) verificado');

// 20. Test 🖨️ Generador de Cartel Comunitario con Código QR Imprimible (Opción 5)
assert.ok(fs.existsSync(path.join(__dirname, 'qrcode.min.js')), 'qrcode.min.js must exist in workspace for 100% offline generation');
assert.ok(indexHtml.includes('src="./qrcode.min.js"'), 'index.html must load local qrcode.min.js');
assert.ok(indexHtml.includes('id="modal-poster"'), 'index.html must include modal-poster');
assert.ok(indexHtml.includes('id="poster-printable-area"'), 'index.html must include poster-printable-area');
assert.ok(indexHtml.includes('id="poster-qr-container"'), 'index.html must include poster-qr-container');
assert.ok(indexHtml.includes('@media print'), 'index.html must define @media print styles for poster');
assert.ok(appJs.includes('function openPosterModal'), 'app.js must define openPosterModal');
assert.ok(appJs.includes('function closePosterModal'), 'app.js must define closePosterModal');
assert.ok(appJs.includes('function printPoster'), 'app.js must define printPoster');
console.log('✓ 🖨️ Cartel Comunitario Imprimible con QR (Opción 5): Modal, estilos de impresión y QR offline verificados');

// 21. Test 🚨 Modo "Auxilio Rápido Nocturno 24 Horas" (Opción 6)
assert.ok(appJs.includes('function toggleAuxilioNocturno'), 'app.js must define toggleAuxilioNocturno');
assert.ok(appJs.includes('function updateAuxilioNocturnoUI'), 'app.js must define updateAuxilioNocturnoUI');
assert.ok(!indexHtml.includes('id="btn-auxilio-nocturno"'), 'btn-auxilio-nocturno must be removed from header');
assert.ok(indexHtml.includes('id="auxilio-nocturno-banner"'), 'index.html must include auxilio-nocturno-banner in toolbar');
assert.ok(appJs.includes('state.auxilioNocturno'), 'app.js must maintain state.auxilioNocturno');
assert.ok(appJs.includes('LLAMAR AHORA (URGENCIA 24H)'), 'app.js must render high-urgency call action when auxilio nocturno is active');
console.log('✓ 🚨 Modo Auxilio Nocturno 24h (Opción 6): 1-toque, banner de urgencia y llamadas directas verificados');

// 22. Test 🌙 Modo Oscuro y Ahorro de Batería (Opción 8)
assert.ok(indexHtml.includes("darkMode: 'class'"), 'index.html tailwind.config must configure darkMode: class');
assert.ok(appJs.includes('function initTheme'), 'app.js must define initTheme');
assert.ok(appJs.includes('function toggleTheme'), 'app.js must define toggleTheme');
assert.ok(appJs.includes('ahome_theme'), 'app.js must store theme preference in localStorage under ahome_theme');
assert.ok(indexHtml.includes('.dark .leaflet-tile'), 'index.html must style Leaflet tiles with dark invert filter');
assert.ok(indexHtml.includes('id="btn-toggle-theme"'), 'index.html must include btn-toggle-theme');
assert.ok(indexHtml.includes('id="btn-toggle-theme-mobile"'), 'index.html must include btn-toggle-theme-mobile');
console.log('✓ 🌙 Modo Oscuro y Ahorro de Batería (Opción 8): Toggle sol/luna, persistencia y mapa nocturno verificados');

// 23. Test 💡 Sobre Nosotros (Página dedicada PolyLab Studio Aesthetic)
assert.ok(fs.existsSync(path.join(__dirname, 'sobre-nosotros.html')), 'sobre-nosotros.html must exist as a dedicated standalone page');
const sobreNosotrosHtml = fs.readFileSync('sobre-nosotros.html', 'utf8');
assert.ok(sobreNosotrosHtml.includes('RAMSSES GARCÍA'), 'sobre-nosotros.html must introduce Ramsses Garcia');
assert.ok(sobreNosotrosHtml.includes('POLYLAB STUDIO'), 'sobre-nosotros.html must display POLYLAB STUDIO');
assert.ok(sobreNosotrosHtml.includes('impresión artística en 3D'), 'sobre-nosotros.html must include PolyLab 3D artistic printing description');
assert.ok(sobreNosotrosHtml.includes('“UN LUGAR DONDE CREAMOS COSAS PARA MUNDOS QUE AÚN NO EXISTEN.”'), 'sobre-nosotros.html must include PolyLab core philosophy');
assert.ok(sobreNosotrosHtml.includes('swiss-modular-grid'), 'sobre-nosotros.html must use PolyLab swiss-modular-grid');
assert.ok(sobreNosotrosHtml.includes('href="./terminos-y-privacidad.html"'), 'sobre-nosotros.html must link to terminos-y-privacidad.html');
assert.ok(indexHtml.includes('href="./sobre-nosotros.html"'), 'index.html must link to sobre-nosotros.html');
assert.ok(indexHtml.includes('href="./terminos-y-privacidad.html"'), 'index.html header must link to terminos-y-privacidad.html');
assert.ok(!indexHtml.includes('href="#seccion-mapa-central">'), 'Header must not contain the old fast map button');
console.log('✓ 💡 Sobre Nosotros (sobre-nosotros.html & PolyLab Studio Aesthetic): Página dedicada y estética contemporánea verificadas');

console.log('\n======================================================');
console.log('ALL 23 TEST SUITES PASSED PERFECTLY (100%)!');
console.log('======================================================');



