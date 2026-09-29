/**
 * ============================================================================
 * OFICIOS AHOME - BACKEND SERVERLESS GRATUITO CON GOOGLE SHEETS & APPS SCRIPT
 * ============================================================================
 * 
 * Novedades v3.1:
 * - Filtro Honeypot anti-spam (descarta bots silenciosamente)
 * - Sanitización estricta de teléfono mexicano a 10 dígitos (/^[1-9][0-9]{9}$/)
 * - Esquema de doble hoja: 'Ingresos_Pendientes' (Staging) vs 'Oficios' (Publicados)
 * - Columna 'Ultima_Verificacion' para control de caducidad
 * ============================================================================
 */

const SHEET_NAME_PUBLISHED = 'Oficios';
const SHEET_NAME_PENDING = 'Ingresos_Pendientes';

// Cabeceras de la base de datos (con soporte para Fotos, Mapa y Verificación)
const HEADERS = [
  'ID',
  'Fecha de Registro',
  'Nombre / Taller',
  'Oficio Principal',
  'Zona / Sindicatura',
  'Teléfono (WhatsApp)',
  'Foto (URL o Base64)',
  'Descripción del Servicio',
  'Palabras Clave',
  'Atiende Emergencias (24h)',
  'Horario de Atención',
  'Latitud',
  'Longitud',
  'Estado',
  'Ultima_Verificacion'
];

/**
 * Configuración inicial: Crea las hojas de cálculo con sus encabezados y estilos
 */
function initialSetup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Hoja de Publicados
  let sheetPub = ss.getSheetByName(SHEET_NAME_PUBLISHED);
  if (!sheetPub) {
    sheetPub = ss.insertSheet(SHEET_NAME_PUBLISHED);
  }
  if (sheetPub.getLastRow() === 0) {
    sheetPub.appendRow(HEADERS);
    const headerRange = sheetPub.getRange(1, 1, 1, HEADERS.length);
    headerRange.setBackground('#090a0f');
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');
    sheetPub.setFrozenRows(1);
    
    // Registro de ejemplo
    sheetPub.appendRow([
      'ahome-000-juan',
      new Date().toISOString(),
      'Herrería y Balcones Don Juan',
      'Herrería',
      'Scally',
      '6689876543',
      './images/juan_referencia.png',
      'Especialista en balcones de alta resistencia y portones forjados.',
      'balcon, herrero, porton, juan',
      'Sí',
      'Lun-Sáb 7:30 am - 7:00 pm',
      25.7995,
      -109.0055,
      'Activo',
      new Date().toISOString()
    ]);
  }

  // 2. Hoja de Ingresos Pendientes (Staging)
  let sheetPend = ss.getSheetByName(SHEET_NAME_PENDING);
  if (!sheetPend) {
    sheetPend = ss.insertSheet(SHEET_NAME_PENDING);
  }
  if (sheetPend.getLastRow() === 0) {
    sheetPend.appendRow(HEADERS);
    const headerRange2 = sheetPend.getRange(1, 1, 1, HEADERS.length);
    headerRange2.setBackground('#7c3a1e');
    headerRange2.setFontColor('#ffffff');
    headerRange2.setFontWeight('bold');
    sheetPend.setFrozenRows(1);
  }
}

/**
 * GET: Devuelve todos los oficios activos en formato JSON para el frontend y mapa
 */
function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME_PUBLISHED);
    
    if (!sheet) {
      sheet = ss.getSheetByName('Oficios') || ss.getSheets()[0];
    }
    
    if (!sheet) {
      return jsonResponse({ success: false, error: 'Hoja no encontrada. Ejecuta initialSetup primero.' }, 404);
    }
    
    const rows = sheet.getDataRange().getValues();
    if (rows.length <= 1) {
      return jsonResponse([]);
    }
    
    const data = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const estado = String(row[13] || row[12] || row[10] || 'Activo').trim().toLowerCase();
      
      if (estado === 'activo' || estado === 'aprobado' || estado === '') {
        const palabrasRaw = String(row[8] || '');
        const palabrasClave = palabrasRaw
          ? palabrasRaw.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
          : [];
        
        data.push({
          id: String(row[0] || 'ahome-' + i),
          fechaRegistro: row[1] ? new Date(row[1]).toISOString() : new Date().toISOString(),
          nombre: String(row[2] || '').trim(),
          oficio: String(row[3] || '').trim(),
          zona: String(row[4] || '').trim(),
          cobertura: String(row[4] || 'Ahome y sindicaturas').trim(),
          telefono: String(row[5] || '').replace(/\D/g, '').slice(-10),
          foto: String(row[6] || '').trim(),
          descripcion: String(row[7] || '').trim(),
          palabrasClave: palabrasClave,
          emergencias: String(row[9] || '').toLowerCase() === 'sí' || String(row[9] || '').toLowerCase() === 'true',
          horario: String(row[10] || 'Lunes a Sábado').trim(),
          lat: row[11] ? parseFloat(row[11]) : null,
          lng: row[12] ? parseFloat(row[12]) : null,
          ultimaVerificacion: row[14] ? new Date(row[14]).toISOString() : null
        });
      }
    }
    
    return jsonResponse(data);
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() }, 500);
  }
}

/**
 * POST: Recibe un nuevo registro desde el formulario "Suma tu oficio"
 * Incluye protección honeypot, sanitización de 10 dígitos y desvío a Staging
 */
function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    let body = {};
    if (e.postData && e.postData.contents) {
      try {
        body = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        body = e.parameter || {};
      }
    } else if (e.parameter) {
      body = e.parameter;
    }

    // 1. Filtro Honeypot Invisible: Si el bot llenó 'empresa_verificacion', descartar silenciosamente
    if (body.empresa_verificacion && String(body.empresa_verificacion).trim().length > 0) {
      return jsonResponse({
        success: true,
        message: 'Solicitud recibida para validación comunitaria.'
      });
    }
    
    const nombre = sanitize(body.nombre);
    const oficio = sanitize(body.oficio);
    const zona = sanitize(body.zona);
    const rawPhone = sanitize(body.telefono).replace(/\D/g, '').slice(-10);
    const foto = body.foto ? String(body.foto).substring(0, 150000) : '';
    const descripcion = sanitize(body.descripcion);
    const palabrasClave = sanitize(body.palabrasClave || '');
    const emergencias = (body.emergencias === true || body.emergencias === 'true' || body.emergencias === 'on') ? 'Sí' : 'No';
    const horario = sanitize(body.horario || 'Lunes a Sábado');
    const lat = body.lat ? parseFloat(body.lat) : '';
    const lng = body.lng ? parseFloat(body.lng) : '';
    
    if (!nombre || !oficio || !zona || !rawPhone || !descripcion) {
      return jsonResponse({
        success: false,
        error: 'Faltan campos obligatorios (nombre, oficio, zona, teléfono, descripción).'
      }, 400);
    }
    
    // 2. Validación estricta de teléfono mexicano a 10 dígitos
    if (!/^[1-9][0-9]{9}$/.test(rawPhone)) {
      return jsonResponse({
        success: false,
        error: 'El teléfono debe contener exactamente 10 dígitos numéricos válidos (ej. 6681234567).'
      }, 400);
    }
    
    const id = 'ahome-' + Date.now();
    const fecha = new Date().toISOString();
    const estado = 'Pendiente'; // Para revisión comunitaria antes de publicar
    const ultimaVerificacion = fecha;

    // Guardar en la hoja de Ingresos_Pendientes (o directamente en Oficios si solo hay una)
    let sheet = ss.getSheetByName(SHEET_NAME_PENDING);
    if (!sheet) {
      sheet = ss.getSheetByName(SHEET_NAME_PUBLISHED) || ss.getSheets()[0];
    }
    
    sheet.appendRow([
      id,
      fecha,
      nombre,
      oficio,
      zona,
      rawPhone,
      foto,
      descripcion,
      palabrasClave,
      emergencias,
      horario,
      lat,
      lng,
      estado,
      ultimaVerificacion
    ]);
    
    return jsonResponse({
      success: true,
      message: 'Oficio recibido exitosamente. Será revisado y activado en el directorio.',
      data: {
        id: id,
        nombre: nombre,
        oficio: oficio,
        zona: zona,
        telefono: rawPhone
      }
    });
    
  } catch (error) {
    return jsonResponse({
      success: false,
      error: 'Error interno en Google Apps Script: ' + error.toString()
    }, 500);
  }
}

function sanitize(str) {
  if (!str) return '';
  return String(str)
    .replace(/[<>]/g, '')
    .trim()
    .substring(0, 500);
}

function jsonResponse(data, statusCode) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
