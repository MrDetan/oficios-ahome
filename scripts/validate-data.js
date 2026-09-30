/**
 * ============================================================================
 * OFICIOS AHOME - VALIDADOR DE ESQUEMA Y CALIDAD DE DATOS (DATA LINTER)
 * ============================================================================
 * Propósito: Garantizar la integridad, seguridad y calidad geográfica de los 
 * 288+ oficios registrados antes de ser desplegados a producción.
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'oficios.json');

// Polígono Geográfico Estricto del Municipio de Ahome (Bounding Box)
const AHOME_BOUNDS = {
  minLat: 25.30,
  maxLat: 26.35,
  minLng: -109.45,
  maxLng: -108.80
};

function validateData() {
  console.log('🔍 Iniciando validación de calidad de datos en oficios.json...');
  
  if (!fs.existsSync(DATA_FILE)) {
    console.error('❌ Error: El archivo oficios.json no existe.');
    process.exit(1);
  }

  let data;
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    data = JSON.parse(raw);
  } catch (err) {
    console.error('❌ Error fatal de sintaxis JSON en oficios.json:', err.message);
    process.exit(1);
  }

  if (!Array.isArray(data)) {
    console.error('❌ Error: oficios.json debe ser un arreglo JSON válido.');
    process.exit(1);
  }

  console.log(`📊 Total de registros a inspeccionar: ${data.length}`);
  if (data.length === 0) {
    console.log('✨ Base de datos limpia y lista para nuevos registros comunitarios.');
    return;
  }

  let errors = 0;
  let warnings = 0;
  const seenIds = new Set();
  const seenPhones = new Map();

  data.forEach((item, index) => {
    const id = item.ID || item.id || `row-${index + 1}`;
    const nombre = item['Nombre / Taller'] || item.nombre || item.taller;
    const oficio = item['Oficio Principal'] || item.oficio;
    const zona = item['Zona / Sindicatura'] || item.zona;
    const telefono = String(item['Teléfono (WhatsApp)'] || item.telefono || '').replace(/\D/g, '');
    const lat = parseFloat(item.Latitud || item.lat);
    const lng = parseFloat(item.Longitud || item.lng);

    // 1. Validar ID único
    if (seenIds.has(id)) {
      console.error(`[Error #${index + 1}] ID Duplicado: "${id}"`);
      errors++;
    } else {
      seenIds.add(id);
    }

    // 2. Validar campos requeridos
    if (!nombre || typeof nombre !== 'string' || nombre.trim().length < 2) {
      console.error(`[Error #${index + 1}] Nombre inválido o ausente en ID ${id}`);
      errors++;
    }

    if (!oficio || typeof oficio !== 'string' || oficio.trim().length < 2) {
      console.error(`[Error #${index + 1}] Oficio principal inválido o ausente en ID ${id}`);
      errors++;
    }

    if (!zona || typeof zona !== 'string') {
      console.warn(`[Advertencia #${index + 1}] Zona no especificada en ID ${id}`);
      warnings++;
    }

    // 3. Validar Teléfono Mexicano (10 dígitos)
    if (telefono.length !== 10) {
      console.warn(`[Advertencia #${index + 1}] Teléfono no tiene exactamente 10 dígitos: "${telefono}" en ID ${id}`);
      warnings++;
    } else if (!/^[1-9][0-9]{9}$/.test(telefono)) {
      console.warn(`[Advertencia #${index + 1}] Formato de teléfono celular mexicano atípico: "${telefono}" en ID ${id}`);
      warnings++;
    }

    // 4. Validar Coordenadas Geográficas dentro de Ahome
    if (isNaN(lat) || isNaN(lng)) {
      console.error(`[Error #${index + 1}] Coordenadas no numéricas [${lat}, ${lng}] en ID ${id}`);
      errors++;
    } else {
      const inBounds = lat >= AHOME_BOUNDS.minLat && lat <= AHOME_BOUNDS.maxLat &&
                       lng >= AHOME_BOUNDS.minLng && lng <= AHOME_BOUNDS.maxLng;
      if (!inBounds) {
        console.warn(`[Advertencia #${index + 1}] Coordenadas [${lat}, ${lng}] fuera de los límites de Ahome en ID ${id} (${zona})`);
        warnings++;
      }
    }
  });

  console.log('---------------------------------------------------------');
  console.log(`✅ Registros validados con éxito: ${data.length}`);
  console.log(`⚠️ Advertencias no críticas: ${warnings}`);
  console.log(`❌ Errores críticos detectados: ${errors}`);
  console.log('---------------------------------------------------------');

  if (errors > 0) {
    console.error('❌ Validación fallida. Corrige los errores antes de hacer merge.');
    process.exit(1);
  } else {
    console.log('✨ Todos los registros cumplen con los estándares de calidad cívica.');
  }
}

validateData();
