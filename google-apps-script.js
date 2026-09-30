/**
 * ============================================================================
 * OFICIOS AHOME - BACKEND SERVERLESS GRATUITO CON GOOGLE SHEETS & APPS SCRIPT
 * ============================================================================
 * 
 * Novedades v4.0 (Sistema de Aprobación 1 a 1 y Revisión en 24h):
 * - Menú interactivo en Google Sheets ("🛠️ Oficios Ahome") para aprobar registros con 1 clic.
 * - Flujo de Aprobación: Nuevos registros entran a 'Ingresos_Pendientes' (Staging).
 * - Publicación Controlada: Solo los oficios aprobados por el administrador pasan a 'Oficios'.
 * - El frontend y la API (doGet) solo sirven oficios verificados y activos.
 * - Filtro Honeypot anti-spam + Sanitización estricta de teléfono a 10 dígitos.
 * ============================================================================
 */

const SHEET_NAME_PUBLISHED = 'Oficios';
const SHEET_NAME_PENDING = 'Ingresos_Pendientes';
const SHEET_NAME_REJECTED = 'Descartados';

// Encabezados estándar de la base de datos
const HEADERS = [
  'ID',
  'Fecha de Registro',
  'Nombre / Taller',
  'Oficio Principal',
  'Zona / Sindicatura',
  'Teléfono (WhatsApp)',
  'Foto / Fotos (URLs)',
  'Enlace Trabajos (FB/IG/Drive)',
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
 * Crea el menú personalizado en Google Sheets al abrir la hoja de cálculo.
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🛠️ Oficios Ahome')
    .addItem('✅ Aprobar oficio seleccionado (Fila activa)', 'aprobarOficioSeleccionado')
    .addItem('❌ Rechazar / Descartar oficio seleccionado', 'rechazarOficioSeleccionado')
    .addSeparator()
    .addItem('⚡ Aprobar TODOS los pendientes', 'aprobarTodosLosPendientes')
    .addSeparator()
    .addItem('⚙️ Configuración inicial de hojas y colores', 'initialSetup')
    .addToUi();
}

/**
 * Configuración inicial: Crea las hojas con encabezados, colores y protecciones
 */
function initialSetup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Hoja de Publicados (Oficios Oficiales)
  let sheetPub = ss.getSheetByName(SHEET_NAME_PUBLISHED);
  if (!sheetPub) {
    sheetPub = ss.insertSheet(SHEET_NAME_PUBLISHED);
  }
  if (sheetPub.getLastRow() === 0) {
    sheetPub.appendRow(HEADERS);
    const headerRange = sheetPub.getRange(1, 1, 1, HEADERS.length);
    headerRange.setBackground('#09090b');
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
      'https://facebook.com/herreriadonjuan',
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

  // 2. Hoja de Ingresos Pendientes (Staging de Revisión)
  let sheetPend = ss.getSheetByName(SHEET_NAME_PENDING);
  if (!sheetPend) {
    sheetPend = ss.insertSheet(SHEET_NAME_PENDING);
  }
  if (sheetPend.getLastRow() === 0) {
    sheetPend.appendRow(HEADERS);
    const headerRange2 = sheetPend.getRange(1, 1, 1, HEADERS.length);
    headerRange2.setBackground('#b45309'); // Ámbar / naranja para indicar pendientes
    headerRange2.setFontColor('#ffffff');
    headerRange2.setFontWeight('bold');
    sheetPend.setFrozenRows(1);
  }

  // 3. Hoja de Descartados
  let sheetRej = ss.getSheetByName(SHEET_NAME_REJECTED);
  if (!sheetRej) {
    sheetRej = ss.insertSheet(SHEET_NAME_REJECTED);
  }
  if (sheetRej.getLastRow() === 0) {
    sheetRej.appendRow(HEADERS);
    const headerRange3 = sheetRej.getRange(1, 1, 1, HEADERS.length);
    headerRange3.setBackground('#7f1d1d'); // Rojo oscuro
    headerRange3.setFontColor('#ffffff');
    headerRange3.setFontWeight('bold');
    sheetRej.setFrozenRows(1);
  }

  SpreadsheetApp.getActiveSpreadsheet().toast('Hojas configuradas correctamente con sistema de aprobación.', '✅ Configuración Lista', 5);
}

/**
 * Aprueba el oficio seleccionado en la fila actual de 'Ingresos_Pendientes'
 * y lo traslada a la hoja 'Oficios' con Estado 'Activo'.
 */
function aprobarOficioSeleccionado() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetPend = ss.getSheetByName(SHEET_NAME_PENDING);
  const sheetPub = ss.getSheetByName(SHEET_NAME_PUBLISHED);
  
  if (!sheetPend || !sheetPub) {
    SpreadsheetApp.getUi().alert('Error: Asegúrate de haber ejecutado la configuración inicial de hojas.');
    return;
  }
  
  const activeSheet = ss.getActiveSheet();
  if (activeSheet.getName() !== SHEET_NAME_PENDING) {
    SpreadsheetApp.getUi().alert(`Por favor colócate en la hoja "${SHEET_NAME_PENDING}" y selecciona la fila del oficio que deseas aprobar.`);
    return;
  }
  
  const row = activeSheet.getActiveCell().getRow();
  if (row <= 1) {
    SpreadsheetApp.getUi().alert('Selecciona una fila con datos de un oficio pendiente (fila 2 en adelante).');
    return;
  }
  
  const rowData = sheetPend.getRange(row, 1, 1, HEADERS.length).getValues()[0];
  const nombre = rowData[2] || 'Oficio';
  const oficio = rowData[3] || '';
  
  // Cambiar estado a 'Activo' y actualizar fecha de verificación
  rowData[14] = 'Activo'; // Columna Estado
  rowData[15] = new Date().toISOString(); // Columna Ultima_Verificacion
  
  // Añadir a hoja de publicados
  sheetPub.appendRow(rowData);
  
  // Eliminar de pendientes
  sheetPend.deleteRow(row);
  
  ss.toast(`Oficio "${nombre}" (${oficio}) ha sido APROBADO y publicado en el directorio oficial.`, '✅ Aprobado con Éxito', 5);
}

/**
 * Rechaza o descarta el oficio seleccionado en 'Ingresos_Pendientes'
 */
function rechazarOficioSeleccionado() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetPend = ss.getSheetByName(SHEET_NAME_PENDING);
  let sheetRej = ss.getSheetByName(SHEET_NAME_REJECTED);
  
  if (!sheetRej) {
    sheetRej = ss.insertSheet(SHEET_NAME_REJECTED);
    sheetRej.appendRow(HEADERS);
  }
  
  const activeSheet = ss.getActiveSheet();
  if (activeSheet.getName() !== SHEET_NAME_PENDING) {
    SpreadsheetApp.getUi().alert(`Por favor colócate en la hoja "${SHEET_NAME_PENDING}" y selecciona la fila del oficio que deseas rechazar.`);
    return;
  }
  
  const row = activeSheet.getActiveCell().getRow();
  if (row <= 1) {
    SpreadsheetApp.getUi().alert('Selecciona una fila con datos válidos.');
    return;
  }
  
  const rowData = sheetPend.getRange(row, 1, 1, HEADERS.length).getValues()[0];
  const nombre = rowData[2] || 'Oficio';
  
  rowData[14] = 'Rechazado';
  rowData[15] = new Date().toISOString();
  
  sheetRej.appendRow(rowData);
  sheetPend.deleteRow(row);
  
  ss.toast(`Oficio "${nombre}" movido a la hoja de Descartados.`, '❌ Oficio Descartado', 5);
}

/**
 * Aprueba todos los registros pendientes en bloque
 */
function aprobarTodosLosPendientes() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetPend = ss.getSheetByName(SHEET_NAME_PENDING);
  const sheetPub = ss.getSheetByName(SHEET_NAME_PUBLISHED);
  
  if (!sheetPend || !sheetPub) return;
  
  const lastRow = sheetPend.getLastRow();
  if (lastRow <= 1) {
    SpreadsheetApp.getUi().alert('No hay oficios pendientes de revisar en este momento.');
    return;
  }
  
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert('Confirmación', `¿Deseas aprobar y publicar todos los ${lastRow - 1} oficios pendientes de una sola vez?`, ui.ButtonSet.YES_NO);
  
  if (response !== ui.Button.YES) return;
  
  const rows = sheetPend.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();
  const now = new Date().toISOString();
  
  rows.forEach(r => {
    r[14] = 'Activo';
    r[15] = now;
    sheetPub.appendRow(r);
  });
  
  // Limpiar hoja de pendientes manteniendo encabezados
  sheetPend.deleteRows(2, lastRow - 1);
  
  ss.toast(`Se han aprobado ${rows.length} oficios pendientes.`, '⚡ Aprobación Masiva Completada', 5);
}

/**
 * GET: Devuelve únicamente los oficios APROBADOS y ACTIVOS en formato JSON
 */
function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME_PUBLISHED);
    
    if (!sheet) {
      sheet = ss.getSheetByName('Oficios') || ss.getSheets()[0];
    }
    
    if (!sheet) {
      return jsonResponse({ success: false, error: 'Hoja de oficios no encontrada. Ejecuta initialSetup primero.' }, 404);
    }
    
    const rows = sheet.getDataRange().getValues();
    if (rows.length <= 1) {
      return jsonResponse([]);
    }
    
    const data = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const estado = String(row[14] || row[13] || row[12] || 'Activo').trim().toLowerCase();
      
      // Filtrar estrictamente: Solo entregar oficios activos o aprobados
      if (estado === 'activo' || estado === 'aprobado' || estado === '') {
        const palabrasRaw = String(row[9] || '');
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
          enlaceTrabajos: String(row[7] || '').trim(),
          descripcion: String(row[8] || '').trim(),
          palabrasClave: palabrasClave,
          emergencias: String(row[10] || '').toLowerCase() === 'sí' || String(row[10] || '').toLowerCase() === 'true',
          horario: String(row[11] || 'Lunes a Sábado').trim(),
          lat: row[12] ? parseFloat(row[12]) : null,
          lng: row[13] ? parseFloat(row[13]) : null,
          ultimaVerificacion: row[15] ? new Date(row[15]).toISOString() : null
        });
      }
    }
    
    return jsonResponse(data);
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() }, 500);
  }
}

/**
 * POST: Recibe un nuevo registro desde el formulario web
 * y lo guarda como 'Pendiente de revisión' en la hoja 'Ingresos_Pendientes'.
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

    // 1. Filtro Honeypot Anti-Spam: Si el bot llenó 'empresa_verificacion', descartar silenciosamente
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
    const enlaceTrabajos = sanitize(body.enlaceTrabajos || '');
    const descripcion = sanitize(body.descripcion);
    const palabrasClave = sanitize(Array.isArray(body.palabrasClave) ? body.palabrasClave.join(', ') : (body.palabrasClave || ''));
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
    const estado = 'Pendiente de revisión'; // En espera de que Ramsses lo apruebe

    // Guardar SIEMPRE en la hoja de Ingresos_Pendientes (crearla si aún no existe)
    let sheet = ss.getSheetByName(SHEET_NAME_PENDING);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME_PENDING);
      sheet.appendRow(HEADERS);
      const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
      headerRange.setBackground('#b45309');
      headerRange.setFontColor('#ffffff');
      headerRange.setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
    
    sheet.appendRow([
      id,
      fecha,
      nombre,
      oficio,
      zona,
      rawPhone,
      foto,
      enlaceTrabajos,
      descripcion,
      palabrasClave,
      emergencias,
      horario,
      lat,
      lng,
      estado,
      fecha
    ]);
    
    return jsonResponse({
      success: true,
      message: 'Ficha recibida con éxito. Está en estado pendiente de revisión (puede tardar hasta 24 horas en ser aprobada).',
      data: {
        id: id,
        nombre: nombre,
        oficio: oficio,
        zona: zona,
        telefono: rawPhone,
        estado: 'Pendiente de revisión'
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
