/**
 * ============================================================================
 * OFICIOS AHOME - LÓGICA DE APLICACIÓN PWA CÍVICA Y MAPA CENTRAL
 * ============================================================================
 * Arquitectura: Cliente ligero (Zero-Auth / Zero-Backend)
 * Persistencia: LocalStorage + oficios.json + Google Apps Script Webhook
 * Geolocalización Cívica: Leaflet.js + OpenStreetMap (Cero API Keys)
 * Cobertura: 7 Sindicaturas, colonias/fracc. de Los Mochis y ejidos aledaños
 * ============================================================================
 */

// Constante configurable para Google Apps Script (Webhook)
const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyKZGja4fVGI-pvVEEhD2NGfLtF9mZ9Ox-CM16wlc_SVyAPc3vt5_whSPifrdLHB4_x/exec';

const STORAGE_KEY_DATA = 'oficios_ahome_data_v5'; // v5 para base de datos limpia en producción
const STORAGE_KEY_URL = 'oficios_ahome_script_url';
const STORAGE_KEY_USER_COLONIA = 'oficios_ahome_user_colonia';
const SW_CACHE_NAME = 'oficios-ahome-v5.0';
const MAX_OFICIO_PHOTOS = 5; // Límite máximo de fotos por oficio al registrarse

// Diccionario de coordenadas para todas las sindicaturas, colonias y ejidos de Ahome
const AHOME_ZONA_COORDS = {
  // Sindicaturas de Ahome
  'Central (Los Mochis)': [25.7928, -108.9967],
  'Topolobampo': [25.6015, -109.0520],
  'Villa de Ahome': [25.9180, -109.1720],
  'Higuera de Zaragoza': [25.9750, -109.2980],
  'San Miguel': [25.9450, -109.0510],
  'San Miguel Zapotitlán': [25.9450, -109.0510],
  'El Guayabo': [25.9860, -109.2080],
  'Heriberto Valdez Romero': [25.9860, -109.2080],
  'El Carrizo': [26.2820, -109.1830],
  'Villa Gustavo Díaz Ordaz': [26.2820, -109.1830],

  // Colonias y Fraccionamientos de Los Mochis
  '12 de Octubre': [25.7820, -108.9990],
  'Álamos Country': [25.7805, -109.0215], // Sector Poniente / Mariano Escobedo, Blvd. Pedro Anaya y Las Norias
  'Fracc. Álamos Country': [25.7805, -109.0215],
  'Fraccionamiento Álamos Country': [25.7805, -109.0215],
  'Alamos Country': [25.7805, -109.0215],
  'Fracc Alamos Country': [25.7805, -109.0215],
  'Alfonso G. Calderón': [25.7760, -108.9810],
  'Altamira': [25.8060, -108.9860],
  'Altavista': [25.8110, -108.9940],
  'Ampliación 12 de Octubre': [25.7810, -109.0020],
  'Ampliación Prados del Sur': [25.7600, -108.9860],
  'Ampliación San Fernando': [25.8170, -109.0060],
  'Ampliación Siglo XXI': [25.8100, -108.9730],
  'Anáhuac': [25.7810, -108.9820],
  'Antonio Toledo Corro': [25.7750, -108.9840],
  'Arboledas': [25.7890, -108.9850],
  'Beltrones': [25.7640, -108.9950],
  'Benito Juárez': [25.7720, -108.9920],
  'Bienestar': [25.7860, -108.9890],
  'Bosques del Pedregal': [25.8160, -108.9990],
  'Bugambilias': [25.8060, -109.0140],
  'Burócrata': [25.7890, -108.9920],
  'Campestre': [25.7940, -108.9840],
  'Canteras': [25.8190, -109.0190],
  'Cedros': [25.7680, -109.0250],
  'Los Cedros': [25.7680, -109.0250],
  'Centro': [25.7928, -108.9967],
  'Chamizal': [25.7870, -109.0050],
  'Gabriel Leyva': [25.7870, -109.0050],
  'Chihuahuita': [25.7660, -108.9910],
  'Cuauhtémoc': [25.7840, -108.9950],
  'Daniel Biul Ruelas': [25.7730, -108.9780],
  'Del Real': [25.8020, -109.0150],
  'Diana Laura Riojas': [25.8050, -108.9710],
  'El Parque': [25.7880, -108.9810],
  'Estrella': [25.8040, -108.9980],
  'Ferrusquilla': [25.7670, -108.9980],
  'Fovissste 1': [25.8050, -108.9910],
  'Fovissste 2': [25.8060, -108.9930],
  'Fovissste 3': [25.8070, -108.9950],
  'Fovissste 4': [25.8080, -108.9970],
  'Fovissste': [25.8050, -108.9910],
  'Francisco Villa': [25.7790, -108.9860],
  'Fracc. Militar': [25.7850, -109.0160],
  'Guadalupe': [25.7910, -109.0020],
  'Huertas de Fátima': [25.7990, -108.9860],
  'Infonavit Arboledas': [25.7890, -108.9850],
  'Infonavit Macapule': [25.8090, -108.9890],
  'Infonavit Mochicahui': [25.7890, -108.9780],
  'Infonavit Morelos': [25.7770, -108.9800],
  'Infonavit Palos Verdes': [25.8120, -108.9980],
  'Infonavit Playas': [25.7830, -108.9740],
  'Insurgentes': [25.7840, -108.9760],
  'Jardines de Fátima': [25.8000, -108.9850],
  'Jardines del Bosque': [25.8180, -109.0090],
  'Jardines del Fuerte': [25.7630, -108.9970],
  'Jardines del Valle': [25.7900, -109.0150],
  'Jiquilpan': [25.7960, -109.0010],
  'La Herradura': [25.8080, -109.0170],
  'La Joya': [25.7650, -109.0120],
  'Las Aves': [25.8170, -109.0160],
  'Las Cañas': [25.7610, -108.9950],
  'Las Delicias': [25.8010, -108.9940],
  'Las Flores': [25.7910, -108.9860],
  'Las Fuentes': [25.8030, -109.0080],
  'Las Huertas': [25.7980, -108.9820],
  'Las Malvinas': [25.7720, -108.9920],
  'Las Mañanitas': [25.7970, -108.9680],
  'Las Misiones': [25.8130, -109.0020],
  'Las Palmas': [25.8070, -109.0010],
  'Lázaro Cárdenas': [25.7740, -108.9750],
  'Libertad': [25.7820, -108.9880],
  'López Mateos': [25.7790, -108.9950],
  'Los Álamos': [25.7950, -108.9720],
  'Álamos': [25.7950, -108.9720],
  'Los Álamos 1': [25.7950, -108.9720],
  'Los Álamos 2': [25.7970, -108.9700],
  'Los Álamos 1 y 2': [25.7950, -108.9720],
  'Los Ángeles': [25.8060, -108.9780],
  'Los Laureles': [25.8140, -109.0160],
  'Los Naranjos': [25.8160, -109.0220],
  'Los Olivos': [25.8210, -109.0110],
  'Los Pinos': [25.8090, -108.9770],
  'Los Sauces': [25.7690, -108.9890],
  'Macapule': [25.8090, -108.9890],
  'Magisterial': [25.7980, -108.9910],
  'Malvinas': [25.7720, -108.9920],
  'Mar de Cortés': [25.7640, -108.9820],
  'Montebello': [25.7970, -108.9790],
  'Morelos': [25.7780, -108.9840],
  'Nuevo Horizonte': [25.8150, -109.0120],
  'Nuevo Siglo': [25.7710, -108.9720],
  'Palos Verdes': [25.8120, -108.9980],
  'Paseo de las Aves': [25.8160, -109.0140],
  'Portal de Hierro': [25.8170, -109.0080],
  'Praderas de San Antonio': [25.8240, -109.0140],
  'Praderas de Villa': [25.8110, -109.0210],
  'Prados del Sur': [25.7620, -108.9880],
  'Privada Las Fuentes': [25.8050, -109.0110],
  'Privanzas': [25.8010, -108.9810],
  'Real de Casetas': [25.7670, -109.0190],
  'Real de Minas': [25.8200, -109.0150],
  'Residencial Bellavista': [25.8020, -108.9760],
  'Residencial Bugambilias': [25.8070, -109.0130],
  'Residencial del Valle': [25.7910, -109.0120],
  'Residencial Florencia': [25.7990, -108.9790],
  'Residencial Las Fuentes': [25.8040, -109.0070],
  'Residencial Tabachines': [25.7790, -109.0110],
  'Romanillo': [25.8130, -109.0190],
  'San Antonio': [25.8230, -109.0130],
  'San Fernando': [25.8140, -109.0080],
  'San Francisco': [25.7860, -108.9970],
  'Santa Alicia': [25.7690, -108.9810],
  'Santa Inés': [25.7980, -108.9760],
  'Santa Luz': [25.8120, -108.9840],
  'Santa Rosa': [25.8190, -109.0070],
  'Santa Teresa': [25.8210, -109.0090],
  'Scally': [25.7990, -109.0060],
  'Siglo XXI': [25.8080, -108.9750],
  'Solidaridad': [25.8100, -109.0150],
  'Tabachines': [25.7780, -109.0090],
  'Tepeca': [25.7720, -108.9810],
  'Texas': [25.7890, -109.0040],
  'Toledo Corro': [25.7750, -108.9840],
  'Urbi Paseo de los Cedros': [25.7660, -109.0280],
  'Urbi Villa del Bosque': [25.8200, -109.0030],
  'Urbi Villa del Rey': [25.8220, -109.0050],
  'Valle Bonito': [25.8230, -109.0180],
  'Valle Cañaveral': [25.8130, -109.0240],
  'Versalles': [25.7980, -108.9830],
  'Villa Fontana': [25.7960, -108.9780],
  'Villas Centenario': [25.7920, -108.9750],
  'Villas del Sol': [25.7930, -108.9770],
  'Viñedos': [25.8180, -108.9820],
  'Virreyes': [25.7778, -109.0192], // Sector Poniente / Calle Virreyes y Blvd. Pedro Anaya
  'Fracc. Los Virreyes': [25.7778, -109.0192],
  'Los Virreyes': [25.7778, -109.0192],

  // Ejidos y Comunidades Rurales de Ahome
  'Ejido Mochis': [25.8080, -109.0380],
  'Ejido México': [25.7710, -108.9650],
  'San Mateo': [25.7710, -108.9650],
  'Ejido 20 de Noviembre': [25.7760, -108.9510],
  'Ejido Primero de Mayo': [25.7510, -108.9680],
  'Ejido 9 de Diciembre': [25.7420, -109.0080],
  'Ejido Compuertas': [25.8280, -109.0210],
  'Ejido Plan de Ayala': [25.7580, -109.0420],
  'Ejido Morelos': [25.7780, -108.9420],
  'Ejido Flores Magón': [25.7890, -108.9480],
  'Ejido Bagojo Colectivo': [25.9320, -109.2150],
  'Ejido Felipe Ángeles': [25.9120, -109.1450],
  'Ejido Cuchilla de Cachoana': [25.8950, -109.1150],
  'Cohuibampo': [25.9520, -109.2550],
  'Las Grullas': [25.9250, -109.3250],
  'El Colorado': [25.6420, -109.1850],
  'Las Lajitas': [25.6850, -109.1250],
  'El Jitzámuri': [26.0420, -109.3520],
  'Paredones': [25.6650, -109.0850],
  'Topolobampo Viejo': [25.5980, -109.0480],
  'Mayocoba': [25.9620, -109.2350],
  'El Bule': [25.9850, -109.2750]
};

// Centro general del Municipio de Ahome / Los Mochis
const AHOME_DEFAULT_CENTER = [25.7928, -108.9967];
const AHOME_DEFAULT_ZOOM = 12;

// Estado global de la aplicación
const state = {
  oficios: [],
  filteredOficios: [],
  searchQuery: '',
  selectedOficio: 'todos',
  selectedZona: 'todas',
  onlyEmergencias: false,
  deferredPrompt: null,
  isOnline: navigator.onLine,
  map: null,
  markersLayer: null,
  clusterGroup: null,
  markerMap: new Map(),
  isMapVisible: true,
  currentUploadedPhotos: [], // Array de fotos base64 o URLs para nuevo registro
  expandedCards: new Set(),  // Tarjetas expandidas inline en el listado
  activeLightbox: {
    workerId: null,
    photos: [],
    title: '',
    currentIndex: 0
  },
  activeQuoteWorker: null,
  selectedQuoteUrgencia: 'esta semana',
  pickerMap: null,
  pickerMarker: null,
  activeFichaPhotoIndex: 0,
  userCoords: null,
  favorites: new Set(),
  onlyFavorites: false,
  auxilioNocturno: false,
  cardsPage: 1,
  theme: 'light'
};

// Íconos por categoría de oficio
const OFICIO_ICONS = {
  'Herrería': '🛠️',
  'Plomería': '🔧',
  'Electricidad': '⚡',
  'Reparación de electrodomésticos': '❄️',
  'Cerrajería': '🔑',
  'Costura y Modistería': '🧵',
  'Albañilería': '🧱',
  'Jardinería': '🌿',
  'Pintura': '🎨',
  'Mecánica ligera': '🚗',
  'Otros': '✨'
};

// Sugerencias rápidas por oficio para cotización en 1 clic
const OFICIO_SUGGESTIONS = {
  'Herrería': ['Reparación de portón', 'Balcón reforzado', 'Protecciones de ventana', 'Soldadura a domicilio', 'Instalar barandal'],
  'Plomería': ['Reparación de fuga', 'Destape de drenaje', 'Instalación de tinaco', 'Bomba de agua', 'Instalación de sanitario'],
  'Electricidad': ['Corto circuito', 'Instalación 220V', 'Cambio de pastillas', 'Centro de carga', 'Instalar lámparas'],
  'Reparación de electrodomésticos': ['Mantenimiento a minisplit', 'Recarga de gas', 'Reparar refrigerador', 'Falla en lavadora'],
  'Cerrajería': ['Apertura de chapa', 'Cambio de cerradura', 'Duplicado de llave', 'Instalar cerrojo'],
  'Costura y Modistería': ['Ajuste de bastilla', 'Cambio de cierre', 'Ajustar uniforme escolar', 'Confección de vestido'],
  'Albañilería': ['Resanar grietas', 'Colocación de piso', 'Construcción de barda', 'Repello de fachada'],
  'Jardinería': ['Poda de árboles', 'Corte y limpieza de pasto', 'Fumigación de jardín', 'Mantenimiento de áreas verdes'],
  'Pintura': ['Pintar fachada', 'Impermeabilización de techo', 'Pintura interior de casa', 'Sellado de paredes'],
  'Mecánica ligera': ['Cambio de balatas', 'Afinación y cambio de aceite', 'Revisión de frenos', 'Diagnóstico general'],
  'Otros': ['Cotización de trabajo', 'Instalación a domicilio', 'Mantenimiento preventivo']
};

// ============================================================================
// DICCIONARIO DE REGIONALISMOS Y VOCABULARIO BARRIAL POR CATEGORÍA DE OFICIO
// ============================================================================
// Cada término está estrictamente vinculado a sus oficios correspondientes para
// evitar falsos positivos cruzados (ej. 'portón' a Herrería sin mezclar Mecánica).
const OFICIO_REGIONALISMS = {
  'Herrería': [
    'herrero', 'herreria', 'porton', 'portones', 'corredizo', 'abatible', 'balcon', 'balcones',
    'soldador', 'soldadura', 'soldar', 'fierro', 'fierros', 'reja', 'rejas', 'proteccion',
    'protecciones', 'barandal', 'barandales', 'marco', 'marcos', 'techumbre', 'chapa de porton',
    'tubular', 'angulo', 'solera', 'viga', 'placa', 'rejilla', 'pasamanos', 'cortina metalica',
    'cortina enrollable', 'herraje', 'porton electrico', 'puerta de fierro', 'estructura metalica'
  ],
  'Plomería': [
    'plomero', 'plomeria', 'fontanero', 'fontaneria', 'fuga', 'fugas', 'tubo', 'tubos', 'tuberia',
    'tuberias', 'pvc', 'cpvc', 'cobre', 'tuboplus', 'destape', 'destapes', 'drenaje', 'drenajes',
    'alcantarilla', 'retrete', 'sanitario', 'taza', 'inodoro', 'wc', 'tinaco', 'tinacos',
    'rotoplas', 'cisterna', 'bomba', 'bomba de agua', 'presurizador', 'hidro', 'hidroneumatico',
    'flotador', 'valvula', 'llave de paso', 'grifo', 'mezcladora', 'maneral', 'fregadero',
    'tarja', 'cespol', 'coladera', 'regadera', 'boiler', 'calentador', 'calentador solar',
    'fosa', 'fosa septica', 'trampa de grasa', 'gotera de tubo', 'medidor de agua'
  ],
  'Electricidad': [
    'electricista', 'electricidad', 'electrico', 'luz', 'energia', 'corto', 'cortos', 'cortocircuito',
    'pastilla', 'pastillas', 'breaker', 'breakers', 'centro de carga', 'tablero', 'bajada', 'mufa',
    'medidor', 'cfe', '220v', '110v', 'trifasica', 'bifasica', 'cable', 'cables', 'cableado',
    'alambrado', 'contacto', 'contactos', 'enchufe', 'enchufes', 'apagador', 'apagadores',
    'switch', 'soquet', 'foco', 'focos', 'lampara', 'lamparas', 'balastra', 'spot', 'led',
    'fotocelda', 'sensor', 'sensor de movimiento', 'tierra fisica', 'varilla', 'sobrecarga',
    'timbre', 'interfon', 'canaleta', 'motor de porton electrico', 'automatizacion'
  ],
  'Reparación de electrodomésticos': [
    'clima', 'climas', 'minisplit', 'minisplits', 'aire', 'aires', 'aire acondicionado', 'cooler',
    'coolers', 'refrigeracion', 'refrigerador', 'refrigeradores', 'refri', 'refris', 'congelador',
    'congeladores', 'enfriador', 'frio', 'compresor', 'gas', 'gas refrigerante', 'carga de gas',
    'recarga de gas', 'fuga de gas', 'inverter', 'evaporador', 'condensador', 'termostato',
    'lavadora', 'lavadoras', 'secadora', 'secadoras', 'centrifugado', 'tina', 'microondas',
    'horno de microondas', 'licuadora', 'plancha', 'electrodomesticos', 'tarjeta electronica'
  ],
  'Cerrajería': [
    'cerrajero', 'cerrajeria', 'chapa', 'chapas', 'cerradura', 'cerraduras', 'cerrojo', 'cerrojos',
    'llave', 'llaves', 'duplicado', 'copia de llave', 'candado', 'candados', 'apertura',
    'abrir chapa', 'puerta trabada', 'chapa trabada', 'chapa de seguridad', 'chapa digital',
    'ojo magico', 'cambio de combinacion', 'llave maestra', 'chapa de pomo', 'chapa de manija'
  ],
  'Costura y Modistería': [
    'costurera', 'costura', 'modista', 'sastre', 'sastreria', 'modisteria', 'ropa', 'vestido',
    'vestidos', 'pantalon', 'pantalones', 'bastilla', 'bastillas', 'dobladillo', 'cierre', 'cierres',
    'cremallera', 'camisa', 'camisas', 'blusa', 'blusas', 'falda', 'faldas', 'uniforme', 'uniformes',
    'uniforme escolar', 'ajuste', 'ajustar', 'entallar', 'remiendo', 'zurcido', 'parche', 'ojal',
    'botones', 'confeccion', 'cortinas', 'fundas', 'cojines', 'maquila', 'overlock'
  ],
  'Albañilería': [
    'albanil', 'albanileria', 'construccion', 'constructor', 'maestro de obra', 'pegapiso', 'vitropiso',
    'piso', 'pisos', 'azulejo', 'azulejos', 'loseta', 'porcelanato', 'interceramic', 'enjarrador',
    'enjarre', 'enjarres', 'repello', 'revoque', 'yesero', 'yeso', 'resane', 'resanes', 'grieta',
    'grietas', 'humedad', 'salitre', 'barda', 'bardas', 'muro', 'muros', 'ladrillo', 'ladrillos',
    'block', 'blocks', 'cemento', 'grava', 'arena', 'loza', 'lozas', 'losa', 'losas', 'colado',
    'colados', 'cimiento', 'cimientos', 'zapata', 'castillo', 'banqueta', 'remodelacion', 'demolicion'
  ],
  'Jardinería': [
    'jardinero', 'jardineria', 'pasto', 'pastos', 'zacate', 'cesped', 'corte de pasto', 'podador',
    'poda', 'podar', 'arbol', 'arboles', 'palma', 'palmas', 'palmeras', 'desmonte',
    'limpieza de terreno', 'talar', 'maleza', 'hierba', 'deshierbe', 'jardin', 'jardines',
    'flores', 'plantas', 'tierra negra', 'abono', 'fumigacion', 'fumigador', 'plagas', 'termitas',
    'hormigas', 'cucarachas', 'riego', 'aspersores', 'mangueras'
  ],
  'Pintura': [
    'pintor', 'pintores', 'pintura', 'pinturas', 'pintar', 'esmalte', 'vinilica', 'acrilica',
    'brocha', 'rodillo', 'compresora', 'fachada', 'fachadas', 'interior', 'interiores',
    'impermeabilizar', 'impermeabilizante', 'impermeabilizacion', 'gotera', 'goteras', 'filtracion',
    'humedad de techo', 'sellador', 'acriltecho', 'membrana', 'malla', 'pintura de herreria', 'barniz'
  ],
  'Mecánica ligera': [
    'mecanico', 'mecanicos', 'mecanica', 'mecanica ligera', 'taller mecanico', 'auto', 'autos',
    'carro', 'carros', 'camioneta', 'camionetas', 'vehiculo', 'freno', 'frenos', 'balata', 'balatas',
    'disco', 'discos', 'tambor', 'purga de frenos', 'afinacion', 'afinaciones', 'cambio de aceite',
    'aceite de motor', 'filtro', 'filtros', 'bujia', 'bujias', 'bateria', 'baterias', 'acumulador',
    'suspension', 'amortiguador', 'amortiguadores', 'rotula', 'terminal', 'banda', 'bandas',
    'banda de tiempo', 'alternador', 'marcha', 'arranque', 'clutch', 'embrague', 'bomba de gasolina',
    'radiador', 'anticongelante', 'calentamiento de carro', 'escaner', 'obd2', 'check engine',
    'auxilio vial', 'paso de corriente', 'desponchado', 'cambio de llanta'
  ],
  'Otros': [
    'carpintero', 'carpinteria', 'madera', 'mueble', 'muebles', 'puerta de madera', 'closet',
    'closets', 'cocina integral', 'gabinete', 'repisa', 'mesa', 'silla', 'comedor', 'barniz',
    'duela', 'triplay', 'mdf', 'alacena', 'vidriero', 'vidrieria', 'vidrio', 'vidrios', 'cristal',
    'cristales', 'cristal templado', 'aluminio', 'aluminiero', 'canceleria', 'cancel', 'canceles',
    'cancel de bano', 'ventana', 'ventanas', 'mosquitero', 'mosquiteros', 'espejo', 'espejos',
    'tapicero', 'tapiceria', 'tapizado', 'sala', 'sillones', 'asiento de carro'
  ]
};

// Diccionario complementario de términos populares y sinónimos directos
const SEARCH_SYNONYMS = {
  // Climas y refrigeración
  'clima': ['minisplit', 'refrigeracion', 'aire', 'gas', 'frio', 'cooler', 'congelador'],
  'climas': ['minisplit', 'refrigeracion', 'aire', 'gas', 'frio', 'cooler'],
  'aire': ['minisplit', 'refrigeracion', 'clima', 'compresor', 'cooler'],
  'minisplit': ['clima', 'refrigeracion', 'aire', 'mantenimiento', 'gas', 'cooler'],
  'refrigeracion': ['minisplit', 'clima', 'refrigerador', 'enfriar', 'cooler', 'congelador', 'refri'],
  'refri': ['refrigerador', 'refrigeracion', 'electrodomesticos', 'congelador', 'enfriador'],
  'cooler': ['aire', 'clima', 'refrigeracion', 'minisplit', 'enfriador'],
  'congelador': ['refrigerador', 'refri', 'refrigeracion', 'frio'],
  'lavadora': ['secadora', 'electrodomesticos', 'centrifugado', 'tina', 'reparacion'],

  // Plomería
  'fuga': ['plomeria', 'plomero', 'tubo', 'gotera', 'agua', 'llave', 'destape', 'tinaco'],
  'fugas': ['plomeria', 'plomero', 'tubo', 'gotera', 'agua', 'llave', 'destape'],
  'destape': ['drenaje', 'plomeria', 'tuberia', 'retrete', 'sanitario', 'coladera', 'fosas'],
  'drenaje': ['destape', 'plomeria', 'tuberia', 'coladera', 'fosas'],
  'tinaco': ['bomba', 'presurizador', 'flotador', 'plomeria', 'cisterna'],
  'boiler': ['calentador', 'plomeria', 'gas', 'agua'],
  'tarja': ['fregadero', 'plomeria', 'llave', 'cespol'],
  'bomba': ['tinaco', 'agua', 'presion', 'plomeria', 'hidro'],

  // Cerrajería
  'chapa': ['cerrajeria', 'cerrajero', 'cerradura', 'llave', 'candado'],
  'chapas': ['cerrajeria', 'cerrajero', 'cerradura', 'llave', 'candado'],
  'cerradura': ['chapa', 'cerrajeria', 'llave', 'cerrojo'],
  'llave': ['cerrajeria', 'duplicado', 'chapa', 'cerradura'],
  'candado': ['cerrajeria', 'chapa', 'apertura'],

  // Herrería (sin 'motor' para evitar falsos positivos con carros)
  'porton': ['herreria', 'herrero', 'puerta', 'corredizo', 'soldadura', 'balcon', 'automatizacion'],
  'portones': ['herreria', 'herrero', 'puerta', 'corredizo', 'soldadura', 'balcon'],
  'balcon': ['herreria', 'herrero', 'reja', 'proteccion', 'barandal'],
  'balcones': ['herreria', 'herrero', 'reja', 'proteccion', 'barandal'],
  'soldador': ['herreria', 'soldadura', 'fierro', 'estructura', 'porton'],
  'soldadura': ['herreria', 'soldador', 'fierro', 'reparacion', 'porton'],
  'reja': ['herreria', 'proteccion', 'balcon', 'barandal'],
  'proteccion': ['herreria', 'reja', 'balcon', 'ventana'],

  // Electricidad
  'corto': ['electricidad', 'electricista', 'pastilla', 'cable', 'luz', 'apagador'],
  'cortos': ['electricidad', 'electricista', 'pastilla', 'cable', 'luz'],
  'luz': ['electricidad', 'electricista', 'foco', 'lampara', 'mufa'],
  'pastilla': ['electricidad', 'centro de carga', 'breaker', 'tablero'],
  'mufa': ['electricidad', 'bajada', 'cfe', 'medidor', '220v'],
  'cableado': ['electricidad', 'instalacion', 'contacto', 'apagador'],

  // Jardinería
  'zacate': ['jardineria', 'jardinero', 'pasto', 'cesped', 'poda'],
  'pasto': ['jardineria', 'jardinero', 'zacate', 'corte', 'poda'],
  'arbol': ['poda', 'jardineria', 'palma', 'talar', 'desmonte'],
  'fumigacion': ['plagas', 'jardineria', 'termitas', 'cucarachas'],

  // Pintura
  'impermeabilizante': ['goteras', 'pintura', 'techo', 'sellador'],
  'pintar': ['pintura', 'pintor', 'fachada', 'casa'],
  'gotera': ['impermeabilizante', 'techo', 'pintura', 'sellado'],

  // Mecánica ligera (términos automotrices específicos)
  'frenos': ['mecanica', 'mecanico', 'balatas', 'discos', 'tambor'],
  'balatas': ['frenos', 'mecanica', 'mecanico', 'auto'],
  'afinacion': ['mecanica', 'aceite', 'bujias', 'filtros', 'carro'],
  'bateria': ['mecanica', 'acumulador', 'arranque', 'auto'],

  // Costura
  'bastilla': ['costura', 'modista', 'sastre', 'pantalon', 'ropa', 'ajuste'],
  'cierre': ['costura', 'modista', 'cremallera', 'campera', 'pantalon'],
  'vestido': ['costura', 'modista', 'confeccion', 'ajuste'],
  'sastre': ['costura', 'modista', 'traje', 'pantalon', 'bastilla'],
  'modista': ['costura', 'sastre', 'vestido', 'confeccion', 'ropa'],

  // Albañilería
  'vitropiso': ['albanileria', 'albanil', 'piso', 'azulejo', 'loseta', 'pegapiso'],
  'pegapiso': ['vitropiso', 'albanileria', 'piso', 'azulejo', 'cemento'],
  'piso': ['vitropiso', 'albanileria', 'loseta', 'cemento', 'pegapiso'],
  'grieta': ['albanileria', 'resanar', 'enjarre', 'yeso'],
  'enjarrador': ['albanileria', 'albanil', 'enjarre', 'yeso', 'resane', 'revoque'],
  'loza': ['albanileria', 'albanil', 'techo', 'cemento', 'colado'],
  'barda': ['albanileria', 'construccion', 'ladrillo', 'block']
};

// Elementos del DOM
const elements = {
  searchInput: document.getElementById('search-input'),
  btnClearSearch: document.getElementById('btn-clear-search'),
  selectOficio: document.getElementById('select-oficio'),
  selectZona: document.getElementById('select-zona'),
  checkEmergencias: document.getElementById('check-emergencias'),
  resultsCount: document.getElementById('results-count'),
  btnResetFilters: document.getElementById('btn-reset-filters'),
  cardsContainer: document.getElementById('cards-container'),
  emptyState: document.getElementById('empty-state'),
  btnEmptyReset: document.getElementById('btn-empty-reset'),
  btnEmptyRegister: document.getElementById('btn-empty-register'),
  
  // Mapa Central
  mapContainer: document.getElementById('map'),
  mapWrapper: document.getElementById('map-wrapper'),
  mapEmptyOverlay: document.getElementById('map-empty-overlay'),
  mapWorkersBadge: document.getElementById('map-workers-badge'),
  btnRecenterMap: document.getElementById('btn-recenter-map'),
  btnToggleMap: document.getElementById('btn-toggle-map'),
  toggleMapText: document.getElementById('toggle-map-text'),

  // Modal de Ficha del Oficio
  modalFicha: document.getElementById('modal-ficha'),
  btnCloseFicha: document.getElementById('btn-close-ficha'),
  fichaContent: document.getElementById('ficha-content'),

  // Modal de Generador de Cotización por WhatsApp
  modalQuote: document.getElementById('modal-quote'),
  btnCloseQuote: document.getElementById('btn-close-quote'),
  quoteWorkerName: document.getElementById('quote-worker-name'),
  quoteWorkerBadge: document.getElementById('quote-worker-badge'),
  formQuote: document.getElementById('form-quote'),
  quoteTrabajo: document.getElementById('quote-trabajo'),
  quoteChips: document.getElementById('quote-chips'),
  quoteColonia: document.getElementById('quote-colonia'),
  quoteZonasList: document.getElementById('quote-zonas-list'),
  quotePreviewText: document.getElementById('quote-preview-text'),
  btnSendWhatsappQuote: document.getElementById('btn-send-whatsapp-quote'),
  btnSkipQuote: document.getElementById('btn-skip-quote'),
  quoteOfflineWarning: document.getElementById('quote-offline-warning'),
  quoteDirectCallBtn: document.getElementById('quote-direct-call-btn'),
  quoteDirectCallText: document.getElementById('quote-direct-call-text'),

  // Modal de Visor de Fotos en Pantalla Completa (Lightbox)
  modalLightbox: document.getElementById('modal-lightbox'),
  btnCloseLightbox: document.getElementById('btn-close-lightbox'),
  btnPrevLightbox: document.getElementById('btn-prev-lightbox'),
  btnNextLightbox: document.getElementById('btn-next-lightbox'),
  lightboxImg: document.getElementById('lightbox-img'),
  lightboxCounter: document.getElementById('lightbox-counter'),
  lightboxTitle: document.getElementById('lightbox-title'),
  lightboxThumbs: document.getElementById('lightbox-thumbs'),

  // Modal de Registro y Fotos Múltiples
  modalRegister: document.getElementById('modal-register'),
  btnOpenRegister: document.getElementById('btn-open-register'),
  btnQuickAddMobile: document.getElementById('btn-quick-add-mobile'),
  btnFloatAdd: document.getElementById('btn-float-add'),
  btnCloseModal: document.getElementById('btn-close-modal'),
  formRegister: document.getElementById('form-register'),
  regZona: document.getElementById('reg-zona'),
  regZonaHint: document.getElementById('reg-zona-hint'),
  regFotoFile: document.getElementById('reg-foto-file'),
  regFotoUrl: document.getElementById('reg-foto-url'),
  regEnlaceTrabajos: document.getElementById('reg-enlace-trabajos'),
  fotoPreviewContainer: document.getElementById('foto-preview-container'),
  fotoPreviewCount: document.getElementById('foto-preview-count'),
  fotoPreviewGrid: document.getElementById('foto-preview-grid'),
  btnRemoveAllFotos: document.getElementById('btn-remove-all-fotos'),
  regDescripcion: document.getElementById('reg-descripcion'),
  charCounter: document.getElementById('char-counter'),
  btnSubmitRegister: document.getElementById('btn-submit-register'),
  submitSpinner: document.getElementById('submit-spinner'),
  submitText: document.getElementById('submit-text'),
  regMapPicker: document.getElementById('reg-map-picker'),
  btnRegUseGps: document.getElementById('btn-reg-use-gps'),
  regCoordsDisplay: document.getElementById('reg-coords-display'),
  regLat: document.getElementById('reg-lat'),
  regLng: document.getElementById('reg-lng'),

  // Configuración
  modalSettings: document.getElementById('modal-settings'),
  btnOpenSettings: document.getElementById('btn-open-settings'),
  btnFooterSettings: document.getElementById('btn-footer-settings'),
  btnCloseSettings: document.getElementById('btn-close-settings'),
  inputWebhookUrl: document.getElementById('input-webhook-url'),
  btnSaveSettings: document.getElementById('btn-save-settings'),
  btnResetCache: document.getElementById('btn-reset-cache'),
  btnFooterManifest: document.getElementById('btn-footer-manifest'),

  // PWA y Red
  btnInstallPwa: document.getElementById('btn-install-pwa'),
  networkStatus: document.getElementById('network-status'),
  offlineBanner: document.getElementById('offline-banner'),
  toast: document.getElementById('toast'),
  toastMessage: document.getElementById('toast-message'),
  toastIcon: document.getElementById('toast-icon'),

  // Filtros activos
  activeFiltersBar: document.getElementById('active-filters-bar'),
  activeFilterChips: document.getElementById('active-filter-chips'),
  regTelefono: document.getElementById('reg-telefono'),

  // Opciones complementarias 1, 5, 6, 8
  btnToggleTheme: document.getElementById('btn-toggle-theme'),
  btnToggleThemeMobile: document.getElementById('btn-toggle-theme-mobile'),
  btnToggleFavorites: document.getElementById('btn-toggle-favorites'),
  btnToggleFavoritesMobile: document.getElementById('btn-toggle-favorites-mobile'),
  btnFilterFavorites: document.getElementById('btn-filter-favorites'),
  favoritesCountBadge: document.getElementById('favorites-count-badge'),
  favoritesCountBadgeMobile: document.getElementById('favorites-count-badge-mobile'),
  favoritesCountBadgeQuick: document.getElementById('favorites-count-badge-quick'),
  btnAuxilioNocturno: document.getElementById('btn-auxilio-nocturno'),
  auxilioNocturnoBanner: document.getElementById('auxilio-nocturno-banner'),
  modalPoster: document.getElementById('modal-poster'),
  posterQrContainer: document.getElementById('poster-qr-container'),

  // Modal de Aviso de Privacidad y Términos Cívicos
  modalPrivacyTerms: document.getElementById('modal-privacy-terms'),
  btnClosePrivacyTerms: document.getElementById('btn-close-privacy-terms'),
  btnAcceptPrivacyTerms: document.getElementById('btn-accept-privacy-terms'),
  btnFooterLegalModal: document.getElementById('btn-footer-legal-modal'),
  btnFooterPrivacy: document.getElementById('btn-footer-privacy'),
  btnFooterTerms: document.getElementById('btn-footer-terms'),
  btnFooterArco: document.getElementById('btn-footer-arco'),
  btnOpenTermsInline: document.getElementById('btn-open-terms-inline'),

  // Modal Sobre Nosotros (PolyLab / Ramsses García)
  modalAbout: document.getElementById('modal-about'),
  btnOpenAbout: document.getElementById('btn-open-about'),
  btnOpenAboutMobile: document.getElementById('btn-open-about-mobile'),
  btnCloseAbout: document.getElementById('btn-close-about'),
  btnAboutCloseAction: document.getElementById('btn-about-close-action')
};

// ============================================================================
// INICIALIZACIÓN ROBUSTA Y REFRESH DE ELEMENTOS
// ============================================================================
function refreshElements() {
  elements.searchInput = document.getElementById('search-input');
  elements.btnClearSearch = document.getElementById('btn-clear-search');
  elements.selectOficio = document.getElementById('select-oficio');
  elements.selectZona = document.getElementById('select-zona');
  elements.checkEmergencias = document.getElementById('check-emergencias');
  elements.resultsCount = document.getElementById('results-count');
  elements.btnResetFilters = document.getElementById('btn-reset-filters');
  elements.cardsContainer = document.getElementById('cards-container');
  elements.emptyState = document.getElementById('empty-state');
  elements.btnEmptyReset = document.getElementById('btn-empty-reset');
  elements.btnEmptyRegister = document.getElementById('btn-empty-register');
  elements.mapContainer = document.getElementById('map');
  elements.mapWrapper = document.getElementById('map-wrapper');
  elements.mapEmptyOverlay = document.getElementById('map-empty-overlay');
  elements.mapWorkersBadge = document.getElementById('map-workers-badge');
  elements.btnRecenterMap = document.getElementById('btn-recenter-map');
  elements.btnToggleMap = document.getElementById('btn-toggle-map');
  elements.toggleMapText = document.getElementById('toggle-map-text');
  elements.modalFicha = document.getElementById('modal-ficha');
  elements.btnCloseFicha = document.getElementById('btn-close-ficha');
  elements.fichaContent = document.getElementById('ficha-content');
  elements.modalQuote = document.getElementById('modal-quote');
  elements.btnCloseQuote = document.getElementById('btn-close-quote');
  elements.quoteWorkerName = document.getElementById('quote-worker-name');
  elements.quoteWorkerBadge = document.getElementById('quote-worker-badge');
  elements.formQuote = document.getElementById('form-quote');
  elements.quoteTrabajo = document.getElementById('quote-trabajo');
  elements.quoteChips = document.getElementById('quote-chips');
  elements.quoteColonia = document.getElementById('quote-colonia');
  elements.quoteZonasList = document.getElementById('quote-zonas-list');
  elements.quotePreviewText = document.getElementById('quote-preview-text');
  elements.btnSendWhatsappQuote = document.getElementById('btn-send-whatsapp-quote');
  elements.btnSkipQuote = document.getElementById('btn-skip-quote');
  elements.quoteOfflineWarning = document.getElementById('quote-offline-warning');
  elements.quoteDirectCallBtn = document.getElementById('quote-direct-call-btn');
  elements.quoteDirectCallText = document.getElementById('quote-direct-call-text');
  elements.modalLightbox = document.getElementById('modal-lightbox');
  elements.btnCloseLightbox = document.getElementById('btn-close-lightbox');
  elements.btnPrevLightbox = document.getElementById('btn-prev-lightbox');
  elements.btnNextLightbox = document.getElementById('btn-next-lightbox');
  elements.lightboxImg = document.getElementById('lightbox-img');
  elements.lightboxCounter = document.getElementById('lightbox-counter');
  elements.lightboxTitle = document.getElementById('lightbox-title');
  elements.lightboxThumbs = document.getElementById('lightbox-thumbs');
  elements.modalRegister = document.getElementById('modal-register');
  elements.btnOpenRegister = document.getElementById('btn-open-register');
  elements.btnQuickAddMobile = document.getElementById('btn-quick-add-mobile');
  elements.btnFloatAdd = document.getElementById('btn-float-add');
  elements.btnCloseModal = document.getElementById('btn-close-modal');
  elements.formRegister = document.getElementById('form-register');
  elements.regZona = document.getElementById('reg-zona');
  elements.regZonaHint = document.getElementById('reg-zona-hint');
  elements.regFotoFile = document.getElementById('reg-foto-file');
  elements.regFotoUrl = document.getElementById('reg-foto-url');
  elements.regEnlaceTrabajos = document.getElementById('reg-enlace-trabajos');
  elements.fotoPreviewContainer = document.getElementById('foto-preview-container');
  elements.fotoPreviewCount = document.getElementById('foto-preview-count');
  elements.fotoPreviewGrid = document.getElementById('foto-preview-grid');
  elements.btnRemoveAllFotos = document.getElementById('btn-remove-all-fotos');
  elements.regDescripcion = document.getElementById('reg-descripcion');
  elements.charCounter = document.getElementById('char-counter');
  elements.btnSubmitRegister = document.getElementById('btn-submit-register');
  elements.submitSpinner = document.getElementById('submit-spinner');
  elements.submitText = document.getElementById('submit-text');
  elements.regMapPicker = document.getElementById('reg-map-picker');
  elements.btnRegUseGps = document.getElementById('btn-reg-use-gps');
  elements.regCoordsDisplay = document.getElementById('reg-coords-display');
  elements.regLat = document.getElementById('reg-lat');
  elements.regLng = document.getElementById('reg-lng');
  elements.modalSettings = document.getElementById('modal-settings');
  elements.btnOpenSettings = document.getElementById('btn-open-settings');
  elements.btnFooterSettings = document.getElementById('btn-footer-settings');
  elements.btnCloseSettings = document.getElementById('btn-close-settings');
  elements.inputWebhookUrl = document.getElementById('input-webhook-url');
  elements.btnSaveSettings = document.getElementById('btn-save-settings');
  elements.btnResetCache = document.getElementById('btn-reset-cache');
  elements.btnFooterManifest = document.getElementById('btn-footer-manifest');
  elements.btnInstallPwa = document.getElementById('btn-install-pwa');
  elements.networkStatus = document.getElementById('network-status');
  elements.offlineBanner = document.getElementById('offline-banner');
  elements.toast = document.getElementById('toast');
  elements.toastMessage = document.getElementById('toast-message');
  elements.toastIcon = document.getElementById('toast-icon');
  elements.activeFiltersBar = document.getElementById('active-filters-bar');
  elements.activeFilterChips = document.getElementById('active-filter-chips');
  elements.regTelefono = document.getElementById('reg-telefono');
  elements.btnToggleTheme = document.getElementById('btn-toggle-theme');
  elements.btnToggleThemeMobile = document.getElementById('btn-toggle-theme-mobile');
  elements.btnToggleFavorites = document.getElementById('btn-toggle-favorites');
  elements.btnToggleFavoritesMobile = document.getElementById('btn-toggle-favorites-mobile');
  elements.btnFilterFavorites = document.getElementById('btn-filter-favorites');
  elements.favoritesCountBadge = document.getElementById('favorites-count-badge');
  elements.favoritesCountBadgeMobile = document.getElementById('favorites-count-badge-mobile');
  elements.favoritesCountBadgeQuick = document.getElementById('favorites-count-badge-quick');
  elements.btnAuxilioNocturno = document.getElementById('btn-auxilio-nocturno');
  elements.auxilioNocturnoBanner = document.getElementById('auxilio-nocturno-banner');
  elements.modalPoster = document.getElementById('modal-poster');
  elements.posterQrContainer = document.getElementById('poster-qr-container');
  elements.modalPrivacyTerms = document.getElementById('modal-privacy-terms');
  elements.btnClosePrivacyTerms = document.getElementById('btn-close-privacy-terms');
  elements.btnAcceptPrivacyTerms = document.getElementById('btn-accept-privacy-terms');
  elements.btnFooterLegalModal = document.getElementById('btn-footer-legal-modal');
  elements.btnFooterPrivacy = document.getElementById('btn-footer-privacy');
  elements.btnFooterTerms = document.getElementById('btn-footer-terms');
  elements.btnFooterArco = document.getElementById('btn-footer-arco');
  elements.btnOpenTermsInline = document.getElementById('btn-open-terms-inline');
  elements.modalAbout = document.getElementById('modal-about');
  elements.btnOpenAbout = document.getElementById('btn-open-about');
  elements.btnOpenAboutMobile = document.getElementById('btn-open-about-mobile');
  elements.btnCloseAbout = document.getElementById('btn-close-about');
  elements.btnAboutCloseAction = document.getElementById('btn-about-close-action');
}

var toastTimer = null;
function showToast(message, icon = '✓') {
  if (!elements || !elements.toast) return;
  if (elements.toastMessage) elements.toastMessage.textContent = message;
  if (elements.toastIcon) elements.toastIcon.textContent = icon;
  elements.toast.classList.remove('hidden');

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    if (elements.toast) elements.toast.classList.add('hidden');
  }, 3500);
}
window.showToast = showToast;

function escapeHtml(string) {
  if (!string) return '';
  return String(string)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
window.escapeHtml = escapeHtml;

const HERO_RANDOM_IMAGES = [
  { src: './images/hero_oficio_1.jpg', alt: 'Técnico mecánico y mantenimiento en Ahome', label: 'Mantenimiento & Mecánica' },
  { src: './images/hero_oficio_2.jpg', alt: 'Artesano de oficios tradicionales en Sinaloa', label: 'Artesanía & Oficios' },
  { src: './images/hero_oficio_3.jpg', alt: 'Albañiles y construcción en Los Mochis', label: 'Albañilería & Obra' },
  { src: './images/hero_oficio_4.jpg', alt: 'Carpintería y ebanistería fina en Ahome', label: 'Carpintería & Madera' }
];

function initRandomHeroImage() {
  const heroImg = document.getElementById('hero-random-image');
  const heroLabel = document.getElementById('hero-image-label');
  if (!heroImg) return;
  
  const randomIndex = Math.floor(Math.random() * HERO_RANDOM_IMAGES.length);
  const selected = HERO_RANDOM_IMAGES[randomIndex];
  
  heroImg.style.opacity = '0';
  heroImg.src = selected.src;
  heroImg.alt = selected.alt;
  if (heroLabel) heroLabel.textContent = selected.label;
  
  heroImg.onload = () => {
    heroImg.style.opacity = '1';
  };
  if (heroImg.complete) {
    heroImg.style.opacity = '1';
  }
}
window.initRandomHeroImage = initRandomHeroImage;

function bootApp() {
  try {
    ['oficios_ahome_data_v4', 'oficios_ahome_data_v3', 'oficios_ahome_data_v2', 'oficios_ahome_data'].forEach(k => localStorage.removeItem(k));
  } catch (e) {}
  try { initRandomHeroImage(); } catch (e) { console.warn('initRandomHeroImage:', e); }
  try { refreshElements(); } catch (e) { console.warn('refreshElements:', e); }
  try { initTheme(); } catch (e) { console.warn('initTheme:', e); }
  try { initFavorites(); } catch (e) { console.warn('initFavorites:', e); }
  try { initMap(); } catch (e) { console.warn('initMap:', e); }
  try { initEventListeners(); } catch (e) { console.warn('initEventListeners:', e); }
  try { initAuxilioNocturnoListeners(); } catch (e) { console.warn('initAuxilioNocturnoListeners:', e); }
  try { initPosterListeners(); } catch (e) { console.warn('initPosterListeners:', e); }
  try { initNetworkListeners(); } catch (e) { console.warn('initNetworkListeners:', e); }
  try { initPhotoUploadListeners(); } catch (e) { console.warn('initPhotoUploadListeners:', e); }
  try { initServiceWorker(); } catch (e) { console.warn('initServiceWorker:', e); }
  try { initPwaInstall(); } catch (e) { console.warn('initPwaInstall:', e); }
  try { loadOficiosData(); } catch (e) { console.warn('loadOficiosData:', e); }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootApp);
} else {
  bootApp();
}

// ============================================================================
// GESTIÓN DEL MAPA COMUNITARIO CENTRAL (LEAFLET / OPENSTREETMAP)
// ============================================================================
function initMap() {
  if (!elements.mapContainer || typeof L === 'undefined') {
    console.warn('Leaflet no está cargado o no se encontró el contenedor del mapa.');
    return;
  }

  try {
    // Delimitación geográfica estricta del Municipio de Ahome (Bounding Box)
    const ahomeBounds = L.latLngBounds([25.30, -109.45], [26.35, -108.80]);

    // Inicializar mapa centrado en Los Mochis / Ahome
    state.map = L.map('map', {
      center: AHOME_DEFAULT_CENTER,
      zoom: AHOME_DEFAULT_ZOOM,
      minZoom: 10,
      maxZoom: 16,
      maxBounds: ahomeBounds,
      maxBoundsViscosity: 0.8,
      zoomControl: true,
      scrollWheelZoom: false
    });

    state.map.on('focus', () => { state.map.scrollWheelZoom.enable(); });
    state.map.on('blur', () => { state.map.scrollWheelZoom.disable(); });

    // Capa OpenStreetMap libre optimizada
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      minZoom: 10,
      maxZoom: 16,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors • Oficios Ahome'
    }).addTo(state.map);

    // Inicializar grupo de clusters inteligentes o capa estándar como fallback
    if (typeof L.markerClusterGroup === 'function') {
      state.clusterGroup = L.markerClusterGroup({
        showCoverageOnHover: false,
        spiderfyOnMaxZoom: true,
        maxClusterRadius: 42,
        iconCreateFunction: createCustomClusterIcon,
        spiderLegPolylineOptions: { weight: 2, color: '#164e37', opacity: 0.8 }
      });
      state.map.addLayer(state.clusterGroup);
    } else {
      state.markersLayer = L.layerGroup().addTo(state.map);
    }

    if (elements.btnRecenterMap) {
      elements.btnRecenterMap.addEventListener('click', () => {
        state.map.setView(AHOME_DEFAULT_CENTER, AHOME_DEFAULT_ZOOM, { animate: true });
        showToast('Mapa centrado en Ahome', '📍');
      });
    }

    if (elements.btnToggleMap) {
      elements.btnToggleMap.addEventListener('click', toggleMapVisibility);
    }

    // Si ya existen oficios cargados en memoria, colocar los pines de inmediato
    if (state.filteredOficios && state.filteredOficios.length > 0) {
      updateMapMarkers(state.filteredOficios);
    } else if (state.oficios && state.oficios.length > 0) {
      updateMapMarkers(state.oficios);
    }

  } catch (err) {
    console.error('Error al inicializar Leaflet map:', err);
  }
}

function toggleMapVisibility() {
  state.isMapVisible = !state.isMapVisible;
  if (state.isMapVisible) {
    elements.mapWrapper.classList.remove('hidden');
    elements.toggleMapText.textContent = 'Ocultar';
    setTimeout(() => {
      if (state.map) state.map.invalidateSize();
    }, 200);
  } else {
    elements.mapWrapper.classList.add('hidden');
    elements.toggleMapText.textContent = 'Mostrar';
  }
}

function createCustomClusterIcon(cluster) {
  const count = cluster.getChildCount();
  let size = 42;
  let bgGradient = 'background: #09090b; border: 2.5px solid #164e37; color: #ffffff;';
  let pulseGlow = 'box-shadow: 0 4px 12px rgba(0,0,0,0.35), 0 0 0 2px rgba(22,78,55,0.3);';

  if (count >= 50) {
    size = 48;
    bgGradient = 'background: #09090b; border: 2.5px solid #10b981; color: #ffffff;';
    pulseGlow = 'box-shadow: 0 4px 14px rgba(0,0,0,0.4), 0 0 0 3px rgba(16,185,129,0.3);';
  } else if (count >= 10) {
    size = 44;
    bgGradient = 'background: #09090b; border: 2.5px solid #164e37; color: #ffffff;';
    pulseGlow = 'box-shadow: 0 4px 12px rgba(0,0,0,0.35), 0 0 0 2px rgba(22,78,55,0.25);';
  }

  return L.divIcon({
    html: `
      <div style="width:${size}px; height:${size}px; ${bgGradient} ${pulseGlow} border-radius:9999px; display:flex; align-items:center; justify-content:center; font-family:'JetBrains Mono',monospace; font-weight:800; font-size:12px; cursor:pointer; transition:transform 0.15s ease;" class="cluster-badge-pin" title="${count} oficios en esta zona">
        <span style="display:flex; align-items:center; gap:2px;">
          <span style="font-size:9px; opacity:0.8;">📍</span>${count}
        </span>
      </div>
    `,
    className: 'custom-cluster-marker-wrap',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
}

/**
 * Actualiza los marcadores en el mapa según la lista filtrada de oficios.
 * Usa Leaflet.markercluster para compactar 288+ pines en grupos limpios.
 */
function updateMapMarkers(oficiosList) {
  if (!state.map) return;

  if (state.clusterGroup) {
    state.clusterGroup.clearLayers();
  } else if (state.markersLayer) {
    state.markersLayer.clearLayers();
  }
  state.markerMap.clear();

  const validPoints = [];
  const markersToAdd = [];

  // Mapeo para detectar pines exactamente superpuestos (menos de ~15 metros)
  const coordUsageCount = new Map();

  oficiosList.forEach(item => {
    let rawLat = (typeof item.lat === 'number' && !isNaN(item.lat)) ? item.lat : null;
    let rawLng = (typeof item.lng === 'number' && !isNaN(item.lng)) ? item.lng : null;

    if (rawLat === null || rawLng === null) {
      const base = getBaseCoordsForZona(item.zona || 'Centro');
      rawLat = base[0];
      rawLng = base[1];
    }

    // Clave para detectar pines superpuestos exactamente en el mismo punto
    const coordKey = `${rawLat.toFixed(4)},${rawLng.toFixed(4)}`;
    const count = coordUsageCount.get(coordKey) || 0;
    coordUsageCount.set(coordKey, count + 1);

    let renderLat = rawLat;
    let renderLng = rawLng;

    if (count > 0) {
      const microRadius = 0.00016; // ~18 metros
      const angle = (count * 2.39996);
      renderLat += microRadius * Math.sin(angle);
      renderLng += (microRadius / Math.cos((rawLat * Math.PI) / 180)) * Math.cos(angle);
    }

    const iconText = OFICIO_ICONS[item.oficio] || '🛠️';
    const isEmergency = item.emergencias;
    const photos = getOficioPhotos(item);
    const hasPhoto = photos.length > 0;

    // Crear icono HTML personalizado para el pin
    const customIcon = L.divIcon({
      className: 'custom-leaflet-marker',
      html: `<div class="custom-marker-pin ${isEmergency ? 'emergency-pin' : ''} ${hasPhoto ? 'has-photo-pin' : ''}" title="${escapeHtml(item.nombre)} (${escapeHtml(item.oficio)})">${iconText}</div>`,
      iconSize: [38, 38],
      iconAnchor: [19, 19],
      popupAnchor: [0, -22]
    });

    const marker = L.marker([renderLat, renderLng], { icon: customIcon });

    // Contenido del Popup en el Mapa: Información esencial y botón exclusivo "Ver ficha"
    const popupHtml = `
      <div class="p-3 text-center space-y-2 min-w-[200px] max-w-[240px]">
        <div class="flex items-center justify-center gap-1.5">
          <span class="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-800 border border-zinc-200">
            <span>${iconText}</span> ${escapeHtml(item.oficio)}
          </span>
          ${isEmergency ? '<span class="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-[#fbf6f0] text-[#7c3a1e] border border-[#e8d5c4]">🚨 24h</span>' : ''}
        </div>

        <div>
          <h4 class="text-sm font-bold text-zinc-900 leading-snug">${escapeHtml(item.nombre)}</h4>
          <p class="text-[11px] text-zinc-500 font-medium flex items-center justify-center gap-1 mt-0.5 font-mono">
            <span>📍</span> ${escapeHtml(item.zona || 'Ahome')}
            ${item.sindicatura ? `<span class="text-zinc-400">(${escapeHtml(item.sindicatura)})</span>` : ''}
          </p>
        </div>

        <!-- ACCIONES: VER FICHA Y CÓMO LLEGAR (RUTA) -->
        <div class="flex items-center gap-1.5 mt-1.5">
          <button 
            type="button" 
            onclick="window.openFichaModal('${escapeHtml(item.id)}')" 
            class="flex-1 py-2 px-2.5 bg-[#09090b] hover:bg-zinc-800 active:bg-black text-white rounded-lg text-xs font-bold text-center flex items-center justify-center gap-1 shadow-sm transition cursor-pointer btn-glow"
            title="Ver ficha completa de este oficio"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            <span>Ver ficha</span>
          </button>
          <a 
            href="https://www.google.com/maps/dir/?api=1&destination=${renderLat},${renderLng}"
            target="_blank"
            rel="noopener noreferrer"
            class="py-2 px-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-300 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition"
            title="Abrir indicaciones de cómo llegar en Google Maps"
          >
            <span>🧭</span>
            <span>Ruta</span>
          </a>
        </div>
      </div>
    `;

    marker.bindPopup(popupHtml);
    markersToAdd.push(marker);
    state.markerMap.set(item.id, marker);
    validPoints.push([renderLat, renderLng]);
  });

  if (state.clusterGroup) {
    state.clusterGroup.addLayers(markersToAdd);
  } else if (state.markersLayer) {
    markersToAdd.forEach(m => state.markersLayer.addLayer(m));
  }

  if (elements.mapWorkersBadge) {
    const totalPines = validPoints.length;
    elements.mapWorkersBadge.textContent = totalPines === 1 ? '1 oficio en mapa' : `${totalPines} oficios en mapa`;
  }

  if (elements.mapEmptyOverlay) {
    if (validPoints.length === 0) {
      elements.mapEmptyOverlay.classList.remove('hidden');
    } else {
      elements.mapEmptyOverlay.classList.add('hidden');
    }
  }

  if (validPoints.length > 0) {
    if (state.selectedZona !== 'todas' || state.selectedOficio !== 'todos' || state.searchQuery) {
      try {
        const bounds = L.latLngBounds(validPoints);
        state.map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14, animate: true });
      } catch (e) {
        console.warn('Error al ajustar límites de mapa:', e);
      }
    }
  }
}

// ============================================================================
// CÁLCULO DE DISTANCIA HAVERSINE Y FORMATEADOR EN VIVO DE TELÉFONO
// ============================================================================
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatLivePhoneNumber(val) {
  if (!val) return '';
  const digits = String(val).replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

function focusWorkerOnMap(workerId) {
  closeFichaModal();
  const marker = state.markerMap.get(workerId);
  if (marker && state.map) {
    if (!state.isMapVisible) {
      toggleMapVisibility();
    }

    const triggerPopupAndPulse = () => {
      marker.openPopup();
      const el = marker.getElement();
      if (el) {
        el.classList.add('pulse-pin');
        setTimeout(() => {
          el.classList.remove('pulse-pin');
        }, 3500);
      }
    };

    if (state.clusterGroup && typeof state.clusterGroup.zoomToShowLayer === 'function') {
      state.clusterGroup.zoomToShowLayer(marker, triggerPopupAndPulse);
    } else {
      const latLng = marker.getLatLng();
      state.map.setView(latLng, 15, { animate: true });
      triggerPopupAndPulse();
    }

    const mapSection = document.getElementById('seccion-mapa-central');
    if (mapSection) {
      mapSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
}

// ============================================================================
// GESTIÓN DEL MODAL POP-UP DE FICHA COMPLETA DEL OFICIO
// ============================================================================
// ============================================================================
// HELPER: OBTENCIÓN DE TODAS LAS FOTOS DISPONIBLES DE UN OFICIO
// ============================================================================
function getOficioPhotos(item) {
  if (!item) return [];
  if (Array.isArray(item.fotos) && item.fotos.length > 0) {
    return item.fotos.filter(Boolean);
  }
  if (item.foto && typeof item.foto === 'string') {
    return [item.foto];
  }
  return [];
}

// ============================================================================
// HELPER: OBTENCIÓN Y ANÁLISIS DE ENLACE A TRABAJOS REALES / REDES SOCIALES
// ============================================================================
function getEnlaceTrabajosInfo(url) {
  if (!url || typeof url !== 'string') return null;
  const cleanUrl = url.trim();
  if (!cleanUrl) return null;

  // Asegurar protocolo http/https para apertura correcta en navegador
  const formattedUrl = (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://'))
    ? cleanUrl
    : `https://${cleanUrl}`;

  const lower = cleanUrl.toLowerCase();
  if (lower.includes('facebook.com') || lower.includes('fb.me') || lower.includes('fb.com')) {
    return {
      url: formattedUrl,
      type: 'facebook',
      label: 'Página de Facebook',
      icon: '📘',
      btnText: 'Ver en Facebook',
      categoryTag: 'Red Social',
      pillBadgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
      subtitle: 'Publicaciones, fotos recientes y opiniones de clientes.',
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
    };
  }
  if (lower.includes('instagram.com') || lower.includes('instagr.am')) {
    return {
      url: formattedUrl,
      type: 'instagram',
      label: 'Perfil de Instagram',
      icon: '📸',
      btnText: 'Ver en Instagram',
      categoryTag: 'Red Social',
      pillBadgeClass: 'bg-pink-100 text-pink-800 border-pink-200',
      subtitle: 'Galería de fotos, historias y proyectos realizados.',
      badgeClass: 'bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100'
    };
  }
  if (lower.includes('drive.google.com')) {
    return {
      url: formattedUrl,
      type: 'drive',
      label: 'Carpeta en Google Drive',
      icon: '📁',
      btnText: 'Ver en Google Drive',
      categoryTag: 'Portafolio Digital',
      pillBadgeClass: 'bg-zinc-100 text-zinc-800 border-zinc-200',
      subtitle: 'Carpeta compartida con fotos y catálogo de trabajos.',
      badgeClass: 'bg-zinc-100 text-zinc-800 border-zinc-200 hover:bg-zinc-200'
    };
  }
  if (lower.includes('imgur.com')) {
    return {
      url: formattedUrl,
      type: 'imgur',
      label: 'Álbum en Imgur',
      icon: '🖼️',
      btnText: 'Ver en Imgur',
      categoryTag: 'Galería de Fotos',
      pillBadgeClass: 'bg-zinc-100 text-zinc-800 border-zinc-200',
      subtitle: 'Álbum fotográfico con muestras de proyectos y acabados.',
      badgeClass: 'bg-zinc-100 text-zinc-800 border-zinc-200 hover:bg-zinc-200'
    };
  }
  if (lower.includes('tiktok.com')) {
    return {
      url: formattedUrl,
      type: 'tiktok',
      label: 'Perfil de TikTok',
      icon: '🎵',
      btnText: 'Ver en TikTok',
      categoryTag: 'Red Social',
      pillBadgeClass: 'bg-zinc-900 text-white border-zinc-700',
      subtitle: 'Videos de trabajos realizados, demostraciones y tips.',
      badgeClass: 'bg-zinc-900 text-white border-zinc-700 hover:bg-black'
    };
  }
  return {
    url: formattedUrl,
    type: 'web',
    label: 'Sitio Web / Redes',
    icon: '🌐',
    btnText: 'Visitar enlace',
    categoryTag: 'Presencia Digital',
    pillBadgeClass: 'bg-zinc-100 text-zinc-800 border-zinc-200',
    subtitle: 'Portafolio digital, fotos y contacto en línea.',
    badgeClass: 'bg-zinc-100 text-zinc-800 border-zinc-300 hover:bg-zinc-200'
  };
}

// ============================================================================
// VISOR INTERACTIVO DE FOTOS EN LA FICHA DE DETALLES
// ============================================================================
function switchFichaModalPhoto(workerId, index) {
  const item = state.oficios.find(o => String(o.id) === String(workerId));
  if (!item) return;
  const photos = getOficioPhotos(item);
  if (!photos || photos.length === 0) return;

  let newIndex = index;
  if (newIndex < 0) newIndex = photos.length - 1;
  if (newIndex >= photos.length) newIndex = 0;
  state.activeFichaPhotoIndex = newIndex;

  const mainImg = document.getElementById('ficha-modal-main-img');
  const counter = document.getElementById('ficha-modal-counter');

  if (mainImg) {
    mainImg.src = photos[newIndex];
  }

  if (counter) {
    counter.textContent = `Foto ${newIndex + 1} de ${photos.length}`;
  }

  // Actualizar estilos de dots, miniatura activa en tira superior y galería
  photos.forEach((_, i) => {
    const dot = document.getElementById(`ficha-dot-${i}`);
    if (dot) {
      if (i === newIndex) {
        dot.className = 'h-2 rounded-full bg-white w-5 transition-all duration-200';
      } else {
        dot.className = 'h-2 rounded-full bg-white/50 w-2 transition-all duration-200';
      }
    }
    const topThumb = document.getElementById(`ficha-top-thumb-${i}`);
    if (topThumb) {
      if (i === newIndex) {
        topThumb.className = 'w-16 h-12 rounded-lg overflow-hidden shrink-0 border-2 border-white ring-2 ring-white/50 relative transition cursor-pointer shadow-xs scale-105';
      } else {
        topThumb.className = 'w-16 h-12 rounded-lg overflow-hidden shrink-0 border border-white/30 opacity-70 hover:opacity-100 relative transition cursor-pointer shadow-xs';
      }
    }
    const galThumb = document.getElementById(`ficha-gal-thumb-${i}`);
    if (galThumb) {
      if (i === newIndex) {
        galThumb.className = 'h-28 rounded-xl overflow-hidden bg-zinc-900 border-2 border-zinc-900 dark:border-white ring-2 ring-zinc-900/30 dark:ring-white/30 transition cursor-pointer relative group/gal shadow-md scale-[1.02]';
      } else {
        galThumb.className = 'h-28 rounded-xl overflow-hidden bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-700 hover:border-zinc-900 dark:hover:border-white transition cursor-pointer relative group/gal shadow-2xs opacity-80 hover:opacity-100';
      }
    }
  });
}

function nextFichaModalPhoto(workerId) {
  const targetWorkerId = workerId || state.activeFichaWorkerId;
  if (!targetWorkerId) return;
  const current = state.activeFichaPhotoIndex || 0;
  switchFichaModalPhoto(targetWorkerId, current + 1);
}

function prevFichaModalPhoto(workerId) {
  const targetWorkerId = workerId || state.activeFichaWorkerId;
  if (!targetWorkerId) return;
  const current = state.activeFichaPhotoIndex || 0;
  switchFichaModalPhoto(targetWorkerId, current - 1);
}

window.switchFichaModalPhoto = switchFichaModalPhoto;
window.nextFichaModalPhoto = nextFichaModalPhoto;
window.prevFichaModalPhoto = prevFichaModalPhoto;

// ============================================================================
// GESTIÓN DEL MODAL POP-UP DE FICHA COMPLETA DEL OFICIO
// ============================================================================
function openFichaModal(workerId) {
  const item = state.oficios.find(o => String(o.id) === String(workerId));
  if (!item) return;

  // Asegurar que ningún visor lightbox de fondo quede visible
  if (elements.modalLightbox) {
    elements.modalLightbox.classList.add('hidden');
  }

  state.activeFichaWorkerId = workerId;
  state.activeFichaPhotoIndex = 0;

  const rawPhone = String(item.telefono || '').replace(/\D/g, '');
  const displayPhone = rawPhone.length === 10 
    ? `${rawPhone.substring(0, 3)} ${rawPhone.substring(3, 6)} ${rawPhone.substring(6)}`
    : rawPhone;

  const waMessage = encodeURIComponent(`Hola ${item.nombre}, vi tu ficha en Oficios Ahome y me interesa cotizar un trabajo de ${item.oficio} contigo.`);
  const waUrl = `https://wa.me/52${rawPhone}?text=${waMessage}`;
  const telUrl = `tel:${rawPhone}`;
  const icon = OFICIO_ICONS[item.oficio] || '🛠️';
  const photos = getOficioPhotos(item);
  const enlaceTrabajosInfo = getEnlaceTrabajosInfo(item.enlaceTrabajos);

  const isFav = isFavorite(item.id);
  const destCoords = (typeof item.lat === 'number' && typeof item.lng === 'number')
    ? [item.lat, item.lng]
    : getBaseCoordsForZona(item.zona || 'Centro');
  const dirUrl = `https://www.google.com/maps/dir/?api=1&destination=${destCoords[0]},${destCoords[1]}`;

  let photoHtml = '';
  if (photos.length > 0) {
    photoHtml = `
      <div class="relative bg-zinc-950 select-none">
        <!-- Foto principal interactiva con visor incorporado dentro de la ficha -->
        <div class="w-full h-64 sm:h-80 relative overflow-hidden group bg-zinc-900 flex items-center justify-center">
          <img 
            id="ficha-modal-main-img" 
            src="${escapeHtml(photos[0])}" 
            alt="${escapeHtml(item.nombre)}" 
            class="w-full h-full object-cover transition-opacity duration-200 cursor-pointer select-none"
            onclick="window.nextFichaModalPhoto('${escapeHtml(item.id)}')"
            title="Toca para ver siguiente foto"
          >
          <div class="absolute inset-0 bg-gradient-to-t from-zinc-950/85 via-zinc-950/15 to-black/30 pointer-events-none"></div>

          <!-- Flechas de navegación interactiva prev / next dentro del modal -->
          ${photos.length > 1 ? `
            <button 
              type="button" 
              onclick="event.stopPropagation(); window.prevFichaModalPhoto('${escapeHtml(item.id)}')" 
              class="absolute left-2.5 top-1/2 -tranzinc-y-1/2 w-11 h-11 rounded-full bg-black/75 hover:bg-black/95 active:scale-90 text-white flex items-center justify-center backdrop-blur-md border border-white/40 transition cursor-pointer shadow-xl z-20 hover:scale-105"
              title="Foto anterior"
              aria-label="Foto anterior"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/></svg>
            </button>
            <button 
              type="button" 
              onclick="event.stopPropagation(); window.nextFichaModalPhoto('${escapeHtml(item.id)}')" 
              class="absolute right-2.5 top-1/2 -tranzinc-y-1/2 w-11 h-11 rounded-full bg-black/75 hover:bg-black/95 active:scale-90 text-white flex items-center justify-center backdrop-blur-md border border-white/40 transition cursor-pointer shadow-xl z-20 hover:scale-105"
              title="Siguiente foto"
              aria-label="Siguiente foto"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
            </button>
          ` : ''}

          <!-- Puntos indicadores de posición en el carrusel -->
          ${photos.length > 1 ? `
            <div class="absolute bottom-11 left-0 right-0 flex items-center justify-center gap-1.5 z-10 pointer-events-none">
              ${photos.map((_, idx) => `
                <span id="ficha-dot-${idx}" class="h-2 rounded-full transition-all duration-200 ${idx === 0 ? 'bg-white w-5' : 'bg-white/50 w-2'}"></span>
              `).join('')}
            </div>
          ` : ''}

          <!-- Badge inferior con oficio y urgencias -->
          <div class="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white pointer-events-none z-10">
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#09090b]/90 text-white text-xs font-mono font-bold backdrop-blur-md shadow-sm border border-white/20">
              <span>${icon}</span> ${escapeHtml(item.oficio)}
            </span>
            ${item.emergencias ? '<span class="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-[#fbf6f0] text-[#7c3a1e] border border-[#e8d5c4] shadow-md">🚨 Urgencias 24h</span>' : ''}
          </div>

          <!-- Contador de foto activa -->
          <div class="absolute top-3 left-3 bg-black/75 text-white text-[11px] font-mono font-bold px-2.5 py-1 rounded-md backdrop-blur-xs flex items-center gap-1.5 shadow-md z-10">
            <span>📷</span> <span id="ficha-modal-counter">Foto 1 de ${photos.length}</span>
          </div>
        </div>

        <!-- Tira interactiva de miniaturas para cambiar foto en el modal -->
        ${photos.length > 1 ? `
          <div class="bg-zinc-900/95 p-3 flex items-center gap-2 overflow-x-auto border-t border-white/10 scrollbar-thin">
            <span class="text-[11px] font-bold text-zinc-300 shrink-0 font-mono">Fotos:</span>
            ${photos.map((p, idx) => `
              <button 
                type="button" 
                id="ficha-top-thumb-${idx}"
                onclick="window.switchFichaModalPhoto('${escapeHtml(item.id)}', ${idx})" 
                class="w-16 h-12 rounded-lg overflow-hidden shrink-0 border-2 ${idx === 0 ? 'border-white ring-2 ring-white/50' : 'border-white/30 opacity-70 hover:opacity-100'} relative transition cursor-pointer group/th shadow-xs"
                title="Ver foto ${idx + 1}"
              >
                <img src="${escapeHtml(p)}" alt="Foto ${idx + 1}" class="w-full h-full object-cover group-hover/th:scale-105 transition">
                <span class="absolute bottom-0.5 right-1 bg-black/70 text-white text-[9px] font-mono px-1 rounded">${idx + 1}</span>
              </button>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  } else {
    photoHtml = `
      <div class="w-full py-7 px-6 bg-[#09090b] text-white relative border-b border-white/10">
        <div class="flex items-center gap-3.5">
          <div class="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-3xl shadow-inner shrink-0">
            ${icon}
          </div>
          <div>
            <span class="inline-block text-[11px] font-mono font-bold text-zinc-300 uppercase tracking-wider">
              ${escapeHtml(item.oficio)}
            </span>
            <h3 class="text-xl sm:text-2xl font-black text-white leading-tight">${escapeHtml(item.nombre)}</h3>
          </div>
        </div>
        ${item.emergencias ? '<div class="mt-3 inline-flex items-center gap-1.5 text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-[#fbf6f0] text-[#7c3a1e] border border-[#e8d5c4]">🚨 Disponible para urgencias 24 horas</div>' : ''}
      </div>
    `;
  }

  let tagsHtml = '';
  if (item.palabrasClave && item.palabrasClave.length > 0) {
    const keywords = Array.isArray(item.palabrasClave)
      ? item.palabrasClave
      : item.palabrasClave.split(',').map(s => s.trim());
    
    tagsHtml = keywords.map(kw => `
      <span class="inline-block px-2.5 py-1 rounded-lg text-xs font-mono font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
        #${escapeHtml(kw)}
      </span>
    `).join(' ');
  }

  if (elements.fichaContent) {
    elements.fichaContent.innerHTML = `
      ${photoHtml}
      
      <div class="p-5 sm:p-6 space-y-4">
        <!-- Cabecera de Ficha: Nombre, Oficio y Botón Favoritos (Opción 1) -->
        <div>
          <div class="flex items-start justify-between gap-3">
            <div>
              <h3 class="text-xl sm:text-2xl font-black text-zinc-950 dark:text-white leading-tight">${escapeHtml(item.nombre)}</h3>
              <p class="text-xs text-zinc-500 dark:text-zinc-400 font-mono font-bold mt-0.5">${escapeHtml(item.oficio)}</p>
            </div>
            <button 
              type="button" 
              onclick="window.toggleFavorite('${escapeHtml(item.id)}', event)"
              class="btn-fav-${escapeHtml(item.id)} p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition cursor-pointer shrink-0 ${isFav ? 'text-amber-500' : 'text-zinc-400 hover:text-amber-500'}"
              title="${isFav ? 'Quitar de mis favoritos' : 'Guardar en mis oficios de confianza'}"
              aria-label="Guardar oficio en favoritos"
            >
              ${isFav ? `
                <svg class="w-6 h-6 fill-amber-400 stroke-amber-500 scale-105 transition-transform" viewBox="0 0 24 24" stroke-width="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
              ` : `
                <svg class="w-6 h-6 fill-none stroke-current transition-transform" viewBox="0 0 24 24" stroke-width="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
              `}
            </button>
          </div>
        </div>

        <!-- Zona, Sindicatura, Cobertura y Botón Cómo Llegar (Opción 2) -->
        <div class="bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700 rounded-xl p-3.5 space-y-2">
          <div class="flex items-start justify-between gap-2.5 text-xs flex-wrap">
            <div class="flex items-start gap-2.5">
              <span class="text-zinc-700 dark:text-zinc-300 text-base shrink-0">📍</span>
              <div>
                <div class="font-bold text-zinc-900 dark:text-zinc-100 font-mono">${escapeHtml(item.zona || 'Ahome')} ${item.sindicatura ? `<span class="text-zinc-500 dark:text-zinc-400 font-normal">(${escapeHtml(item.sindicatura)})</span>` : ''}</div>
                <div class="text-zinc-500 dark:text-zinc-400 text-[11px] mt-0.5"><strong>Cobertura:</strong> ${escapeHtml(item.cobertura || `${item.zona} y alrededores`)}</div>
              </div>
            </div>

            <!-- Botón Cómo Llegar con Google Maps (Opción 2) -->
            <a 
              href="${dirUrl}"
              target="_blank"
              rel="noopener noreferrer"
              class="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-300 dark:border-zinc-700 transition shadow-2xs cursor-pointer"
              title="Abrir cómo llegar en Google Maps (Ruta paso a paso)"
            >
              <span>🧭</span> Cómo llegar
            </a>
          </div>
          ${item.horario ? `
            <div class="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300 pt-2 border-t border-zinc-200/70 dark:border-zinc-700 font-mono">
              <span class="text-zinc-500 dark:text-zinc-400 shrink-0">⏰</span>
              <span><strong>Horario:</strong> ${escapeHtml(item.horario)}</span>
            </div>
          ` : ''}
        </div>

        <!-- Banner de Auxilio Nocturno si aplica (Opción 6) -->
        ${state.auxilioNocturno && item.emergencias ? `
          <div class="p-3 bg-rose-500/10 dark:bg-rose-950/60 border border-rose-600/30 dark:border-rose-800/40 rounded-xl text-rose-900 dark:text-rose-200 text-xs font-bold flex items-center gap-2 animate-pulse font-mono">
            <span class="text-lg">🚨</span>
            <span>Modo Auxilio Nocturno 24h activo. Toca "Llamar" para comunicarte telefónicamente de inmediato.</span>
          </div>
        ` : ''}

        <!-- Descripción Completa -->
        <div class="space-y-1">
          <h4 class="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">Descripción del Servicio</h4>
          <p class="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line bg-white dark:bg-zinc-900 rounded-lg p-2 border border-zinc-100 dark:border-zinc-800">
            ${escapeHtml(item.descripcion)}
          </p>
        </div>

        <!-- Galería de Fotos y Trabajos Realizados dentro de la Ficha -->
        ${photos.length > 1 ? `
          <div class="p-4 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/90 dark:border-zinc-700 rounded-2xl space-y-2.5">
            <div class="flex items-center justify-between">
              <h4 class="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <span>🖼️</span> Galería de trabajos (${photos.length} fotos)
              </h4>
              <span class="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">Toca cualquier foto para ampliarla</span>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
              ${photos.map((p, idx) => `
                <div 
                  id="ficha-gal-thumb-${idx}"
                  onclick="window.switchFichaModalPhoto('${escapeHtml(item.id)}', ${idx})" 
                  class="h-28 rounded-xl overflow-hidden bg-zinc-900 border-2 ${idx === 0 ? 'border-zinc-900 dark:border-white ring-2 ring-zinc-900/30 dark:ring-white/30' : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-900 dark:hover:border-white'} transition cursor-pointer relative group/gal shadow-2xs"
                  title="Toca para ver foto ${idx + 1}"
                >
                  <img src="${escapeHtml(p)}" alt="Trabajo ${idx + 1}" class="w-full h-full object-cover group-hover/gal:scale-108 transition duration-200">
                  <div class="absolute inset-0 bg-black/0 group-hover/gal:bg-black/25 transition flex items-center justify-center">
                    <span class="opacity-0 group-hover/gal:opacity-100 bg-black/75 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs transition">
                      Ver foto
                    </span>
                  </div>
                  <span class="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-[9px] font-mono px-1.5 py-0.5 rounded backdrop-blur-xs">
                    Foto ${idx + 1}
                  </span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Especialidades / Palabras Clave -->
        ${tagsHtml ? `
          <div class="space-y-1">
            <h4 class="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">Especialidades</h4>
            <div class="flex flex-wrap gap-1.5">${tagsHtml}</div>
          </div>
        ` : ''}

        <!-- Redes Sociales / Presencia Digital si está disponible -->
        ${enlaceTrabajosInfo ? `
          <div class="p-3.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div class="flex items-center gap-2.5">
              <span class="text-2xl shrink-0">${enlaceTrabajosInfo.icon}</span>
              <div>
                <div class="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5 flex-wrap font-mono">
                  <span>${escapeHtml(enlaceTrabajosInfo.label)}</span>
                  <span class="text-[10px] ${enlaceTrabajosInfo.pillBadgeClass || 'bg-zinc-100 text-zinc-800 border-zinc-200'} font-bold px-2 py-0.5 rounded-full border">${escapeHtml(enlaceTrabajosInfo.categoryTag || 'Red Social')}</span>
                </div>
                <div class="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">${escapeHtml(enlaceTrabajosInfo.subtitle || 'Conoce más proyectos, fotos y novedades en su perfil.')}</div>
              </div>
            </div>
            <a 
              href="${escapeHtml(enlaceTrabajosInfo.url)}" 
              target="_blank" 
              rel="noopener noreferrer" 
              class="shrink-0 py-2 px-3.5 bg-zinc-950 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <span>${escapeHtml(enlaceTrabajosInfo.btnText || 'Ver perfil')}</span>
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
            </a>
          </div>
        ` : ''}

        <!-- BOTONES DE CONTACTO DIRECTO: WHATSAPP Y LLAMAR -->
        <div class="pt-2 space-y-2.5">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            
            <!-- WhatsApp con Generador de Mensaje Claro de Cotización -->
            <button 
              type="button" 
              onclick="window.openWhatsAppQuoteModal('${escapeHtml(item.id)}')" 
              class="py-3 px-4 bg-zinc-950 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-btn transition active:scale-[0.98] cursor-pointer"
              title="Cotizar trabajo por WhatsApp con mensaje predeterminado"
            >
              <svg class="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.007c.101.005.232-.039.36.269.13.313.447 1.091.487 1.172.04.081.066.176.012.284-.054.108-.081.176-.162.271-.081.095-.17.212-.243.285-.081.081-.166.17-.071.333.095.163.424.7.91 1.134.625.557 1.152.73 1.315.811.163.081.258.072.355-.039.096-.111.414-.482.525-.647.111-.165.222-.138.373-.082.151.055.955.45 1.12.533.165.082.275.123.316.192.041.07.041.407-.103.812z"/></svg>
              <span>Cotizar por WhatsApp</span>
            </button>

            <!-- Llamar -->
            <a 
              href="${telUrl}" 
              class="py-3 px-4 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border border-zinc-200 dark:border-zinc-700 shadow-2xs transition active:scale-[0.98]"
              title="Hacer llamada telefónica"
            >
              <svg class="w-5 h-5 text-zinc-700 dark:text-zinc-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
              <span>Llamar: ${displayPhone}</span>
            </a>
          </div>

          <!-- Acciones secundarias: Guardar Contacto (Opción 3) -->
          <div class="pt-1">
            <button 
              type="button" 
              onclick="window.downloadVCard('${escapeHtml(item.id)}')" 
              class="w-full py-2.5 px-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition cursor-pointer border border-zinc-200 dark:border-zinc-700 shadow-2xs font-mono"
              title="Descargar contacto vCard (.vcf) para agregar a tu agenda celular"
            >
              <span class="text-sm">📇</span>
              <span>Guardar en contactos (.vcf)</span>
            </button>
          </div>

          <!-- Acciones terciarias: Compartir por WhatsApp y Ubicar en el mapa -->
          <div class="flex items-center gap-2 pt-1">
            <button 
              type="button" 
              onclick="window.shareOficioViaWhatsApp('${escapeHtml(item.id)}')" 
              class="flex-1 py-2.5 px-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition cursor-pointer border border-zinc-200 dark:border-zinc-700 shadow-2xs"
              title="Reenviar ficha a un vecino o grupo de WhatsApp con 1 toque"
            >
              <span class="text-sm">📲</span>
              <span>Compartir por WhatsApp</span>
            </button>
            <button 
              type="button" 
              onclick="window.focusWorkerOnMap('${escapeHtml(item.id)}')" 
              class="flex-1 py-2.5 px-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer border border-zinc-200 dark:border-zinc-700"
            >
              <span>📍</span> Ubicar en el mapa
            </button>
          </div>

          <!-- Botón de Reporte de Número Inactivo o Desactualizado -->
          <div class="pt-1">
            <a 
              href="https://wa.me/526683956301?text=${encodeURIComponent(`Reporte de oficio inactivo: ID [${item.id}] - ${item.nombre}`)}"
              target="_blank"
              rel="noopener noreferrer"
              class="w-full py-2 px-3 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition border border-amber-200 dark:border-amber-800/60 font-mono"
              title="Reportar si este número ya no contesta o ya no brinda servicio"
            >
              <span>⚠️</span>
              <span>Reportar número desactualizado / Ya no brinda servicio</span>
            </a>
          </div>
        </div>

        <div class="text-[11px] text-center text-zinc-400 dark:text-zinc-500 pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-1">
          <div>🤝 Contacto directo y sin intermediarios entre vecinos de Ahome.</div>
          <div class="text-[10px] text-zinc-400 dark:text-zinc-500">
            ¿Deseas reportar, actualizar o solicitar la baja temporal o definitiva de este oficio? Manda WhatsApp al <a href="https://wa.me/526683956301?text=Hola,%20quisiera%20solicitar%20la%20baja/actualización%20del%20oficio:%20${encodeURIComponent(item.nombre)}" target="_blank" class="text-emerald-700 dark:text-emerald-400 underline font-mono font-semibold">668 395 6301</a>
          </div>
        </div>
      </div>
    `;
  }

  if (elements.modalFicha) {
    elements.modalFicha.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
    initFichaModalTouchSwipe(item.id);
  }
}

// Gesto táctil Swipe (deslizar izq/der) para carrusel en móvil dentro de la ficha
function initFichaModalTouchSwipe(workerId) {
  const mainImg = document.getElementById('ficha-modal-main-img');
  if (!mainImg) return;

  let touchStartX = 0;
  let touchStartY = 0;
  let touchEndX = 0;
  let touchEndY = 0;

  mainImg.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches.length === 1) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchEndX = touchStartX;
      touchEndY = touchStartY;
    }
  }, { passive: true });

  mainImg.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches.length === 1) {
      touchEndX = e.touches[0].clientX;
      touchEndY = e.touches[0].clientY;
    }
  }, { passive: true });

  mainImg.addEventListener('touchend', () => {
    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;

    // Umbral de 40px y movimiento horizontal preponderante
    if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX < 0) {
        nextFichaModalPhoto(workerId);
      } else {
        prevFichaModalPhoto(workerId);
      }
    }
  }, { passive: true });
}

function closeFichaModal() {
  if (elements.modalFicha) {
    elements.modalFicha.classList.add('hidden');
    if (!elements.modalLightbox || elements.modalLightbox.classList.contains('hidden')) {
      if (!elements.modalRegister || elements.modalRegister.classList.contains('hidden')) {
        if (!elements.modalQuote || elements.modalQuote.classList.contains('hidden')) {
          document.body.classList.remove('overflow-hidden');
        }
      }
    }
  }
}

// ============================================================================
// GENERADOR DE MENSAJE CLARO PARA COTIZACIÓN POR WHATSAPP
// ============================================================================
function compileWhatsAppQuoteMessage(nombre, trabajo, colonia, urgencia) {
  const cleanTrabajo = (trabajo || '').trim() || 'reparación de fuga';
  const cleanColonia = (colonia || '').trim() || 'Col. Bienestar';
  const cleanUrgencia = (urgencia || '').trim() || 'esta semana';

  if (nombre) {
    return `Hola ${nombre}, vi tu contacto en Oficios Ahome. Necesito cotizar: [${cleanTrabajo}] en [${cleanColonia}]. ¿Tienes disponibilidad [${cleanUrgencia}]?`;
  }
  return `Hola, vi tu contacto en Oficios Ahome. Necesito cotizar: [${cleanTrabajo}] en [${cleanColonia}]. ¿Tienes disponibilidad [${cleanUrgencia}]?`;
}

function openWhatsAppQuoteModal(workerId) {
  const item = state.oficios.find(o => String(o.id) === String(workerId));
  if (!item) return;

  state.activeQuoteWorker = item;
  state.selectedQuoteUrgencia = 'esta semana';

  if (elements.quoteWorkerName) {
    elements.quoteWorkerName.textContent = `Cotizar con ${item.nombre}`;
  }
  if (elements.quoteWorkerBadge) {
    const icon = OFICIO_ICONS[item.oficio] || '🛠️';
    elements.quoteWorkerBadge.innerHTML = `<span>${icon}</span> ${escapeHtml(item.oficio)} • 📍 ${escapeHtml(item.zona || 'Ahome')}`;
  }

  // Manejo de aviso sin conexión a internet y llamada directa por red celular convencional
  const rawPhone = String(item.telefono || '').replace(/\D/g, '');
  const displayPhone = rawPhone.length === 10 
    ? `${rawPhone.substring(0, 3)} ${rawPhone.substring(3, 6)} ${rawPhone.substring(6)}`
    : rawPhone;

  if (elements.quoteOfflineWarning) {
    if (!navigator.onLine) {
      elements.quoteOfflineWarning.classList.remove('hidden');
      if (elements.quoteDirectCallBtn) {
        elements.quoteDirectCallBtn.href = `tel:${rawPhone}`;
      }
      if (elements.quoteDirectCallText) {
        elements.quoteDirectCallText.textContent = `Llamar a ${item.nombre}: ${displayPhone}`;
      }
    } else {
      elements.quoteOfflineWarning.classList.add('hidden');
    }
  }

  // Pre-llenar colonia: 1. guardada en localStorage, 2. filtro activo, 3. zona del oficio
  const savedColonia = localStorage.getItem(STORAGE_KEY_USER_COLONIA);
  const activeColonia = (state.selectedZona && state.selectedZona !== 'todas') ? state.selectedZona : (item.zona || '');
  if (elements.quoteColonia) {
    elements.quoteColonia.value = savedColonia || activeColonia;
  }

  // Limpiar y enfocar campo de trabajo
  if (elements.quoteTrabajo) {
    elements.quoteTrabajo.value = '';
    elements.quoteTrabajo.placeholder = `ej. ${getSampleTrabajoForOficio(item.oficio)}`;
  }

  // Renderizar chips de sugerencias rápidas
  renderQuoteChips(item.oficio);

  // Resetear botones de urgencia
  setQuoteUrgencia('esta semana');

  // Actualizar preview en tiempo real
  updateQuotePreview();

  if (elements.modalFicha && !elements.modalFicha.classList.contains('hidden')) {
    state.quoteOpenedFromFicha = true;
    elements.modalFicha.classList.add('hidden');
  } else {
    state.quoteOpenedFromFicha = false;
  }

  if (elements.modalQuote) {
    elements.modalQuote.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
    setTimeout(() => {
      if (elements.quoteTrabajo) elements.quoteTrabajo.focus();
    }, 120);
  }
}

function closeWhatsAppQuoteModal() {
  if (elements.modalQuote) {
    elements.modalQuote.classList.add('hidden');
  }
  if (state.quoteOpenedFromFicha) {
    state.quoteOpenedFromFicha = false;
    if (elements.modalFicha) {
      elements.modalFicha.classList.remove('hidden');
    }
  }
  // Si ningún otro modal está abierto, restaurar scroll
  if ((!elements.modalFicha || elements.modalFicha.classList.contains('hidden')) &&
      (!elements.modalRegister || elements.modalRegister.classList.contains('hidden')) &&
      (!elements.modalLightbox || elements.modalLightbox.classList.contains('hidden')) &&
      (!elements.modalSettings || elements.modalSettings.classList.contains('hidden'))) {
    document.body.classList.remove('overflow-hidden');
  }
}

function getSampleTrabajoForOficio(oficio) {
  const suggestions = OFICIO_SUGGESTIONS[oficio];
  if (suggestions && suggestions.length > 0) {
    return suggestions[0].toLowerCase();
  }
  return 'reparación de fuga';
}

function renderQuoteChips(oficio) {
  if (!elements.quoteChips) return;
  const suggestions = OFICIO_SUGGESTIONS[oficio] || OFICIO_SUGGESTIONS['Otros'];
  elements.quoteChips.innerHTML = `
    <span class="text-[10px] text-zinc-400 font-semibold self-center shrink-0">Sugerencias:</span>
    ${suggestions.map(sug => `
      <button 
        type="button" 
        class="text-[11px] font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 transition cursor-pointer"
        onclick="window.selectQuoteSuggestion('${escapeHtml(sug)}')"
      >
        ${escapeHtml(sug)}
      </button>
    `).join('')}
  `;
}

function selectQuoteSuggestion(text) {
  if (elements.quoteTrabajo) {
    elements.quoteTrabajo.value = text;
    updateQuotePreview();
    if (elements.quoteColonia && !elements.quoteColonia.value) {
      elements.quoteColonia.focus();
    }
  }
}

function setQuoteUrgencia(urgencia) {
  state.selectedQuoteUrgencia = urgencia;
  const buttons = document.querySelectorAll('.quote-urgencia-btn');
  buttons.forEach(btn => {
    const btnUrgencia = btn.getAttribute('data-urgencia');
    if (btnUrgencia === urgencia) {
      btn.className = 'quote-urgencia-btn py-2.5 px-2 rounded-xl border text-xs font-bold text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 border-zinc-950 bg-zinc-950 text-white dark:border-white dark:bg-white dark:text-zinc-950 shadow-2xs';
    } else {
      btn.className = 'quote-urgencia-btn py-2.5 px-2 rounded-xl border text-xs font-bold text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800';
    }
  });
  updateQuotePreview();
}

function updateQuotePreview() {
  if (!elements.quotePreviewText) return;
  const worker = state.activeQuoteWorker;
  const nombre = worker ? worker.nombre : '';
  const trabajo = elements.quoteTrabajo ? elements.quoteTrabajo.value : '';
  const colonia = elements.quoteColonia ? elements.quoteColonia.value : '';
  const urgencia = state.selectedQuoteUrgencia || 'esta semana';

  const compiled = compileWhatsAppQuoteMessage(nombre, trabajo, colonia, urgencia);
  elements.quotePreviewText.textContent = compiled;
}

function sendWhatsAppQuote(skipStructured = false) {
  const worker = state.activeQuoteWorker;
  if (!worker) return;

  const rawPhone = String(worker.telefono || '').replace(/\D/g, '');
  if (rawPhone.length < 10) {
    alert('Este prestador no cuenta con un número de teléfono válido.');
    return;
  }

  let finalMessage = '';
  if (skipStructured) {
    finalMessage = `Hola ${worker.nombre}, vi tu contacto en Oficios Ahome y me gustaría cotizar un trabajo contigo.`;
  } else {
    const trabajo = elements.quoteTrabajo ? elements.quoteTrabajo.value.trim() : '';
    const colonia = elements.quoteColonia ? elements.quoteColonia.value.trim() : '';
    const urgencia = state.selectedQuoteUrgencia || 'esta semana';

    if (colonia) {
      localStorage.setItem(STORAGE_KEY_USER_COLONIA, colonia);
    }

    finalMessage = compileWhatsAppQuoteMessage(worker.nombre, trabajo, colonia, urgencia);
  }

  const waUrl = `https://wa.me/52${rawPhone}?text=${encodeURIComponent(finalMessage)}`;
  window.open(waUrl, '_blank', 'noopener,noreferrer');

  state.quoteOpenedFromFicha = false;
  closeWhatsAppQuoteModal();
  showToast(`Mensaje preparado para ${worker.nombre}`, '💬');
}

// ============================================================================
// VISOR DE FOTOS EN PANTALLA COMPLETA (LIGHTBOX)
// ============================================================================
function openLightbox(workerId, photoIndex = 0) {
  const item = state.oficios.find(o => String(o.id) === String(workerId));
  if (!item) return;

  const photos = getOficioPhotos(item);
  if (photos.length === 0) return;

  state.activeLightbox = {
    workerId: workerId,
    photos: photos,
    title: `${item.nombre} (${item.oficio})`,
    currentIndex: Math.max(0, Math.min(photoIndex, photos.length - 1))
  };

  renderLightbox();

  if (elements.modalFicha && !elements.modalFicha.classList.contains('hidden')) {
    state.lightboxOpenedFromFicha = true;
    elements.modalFicha.classList.add('hidden');
  } else {
    state.lightboxOpenedFromFicha = false;
  }

  if (elements.modalLightbox) {
    elements.modalLightbox.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
  }
}

function renderLightbox() {
  const { photos, currentIndex, title } = state.activeLightbox;
  if (!photos || photos.length === 0) return;

  if (elements.lightboxImg) {
    elements.lightboxImg.src = photos[currentIndex];
  }
  if (elements.lightboxCounter) {
    elements.lightboxCounter.textContent = `${currentIndex + 1} / ${photos.length}`;
  }
  if (elements.lightboxTitle) {
    elements.lightboxTitle.textContent = title;
  }

  // Mostrar flechas de anterior / siguiente si hay más de 1 foto
  if (elements.btnPrevLightbox) {
    if (photos.length > 1) {
      elements.btnPrevLightbox.classList.remove('hidden');
    } else {
      elements.btnPrevLightbox.classList.add('hidden');
    }
  }
  if (elements.btnNextLightbox) {
    if (photos.length > 1) {
      elements.btnNextLightbox.classList.remove('hidden');
    } else {
      elements.btnNextLightbox.classList.add('hidden');
    }
  }

  // Miniaturas del visor
  if (elements.lightboxThumbs) {
    if (photos.length > 1) {
      elements.lightboxThumbs.innerHTML = photos.map((p, idx) => `
        <button 
          type="button" 
          onclick="window.setLightboxIndex(${idx})" 
          class="w-12 h-10 rounded-lg overflow-hidden shrink-0 border-2 transition cursor-pointer ${idx === currentIndex ? 'border-emerald-400 scale-110 shadow-lg' : 'border-white/30 opacity-60 hover:opacity-100'}"
        >
          <img src="${escapeHtml(p)}" alt="Miniatura ${idx + 1}" class="w-full h-full object-cover">
        </button>
      `).join('');
    } else {
      elements.lightboxThumbs.innerHTML = '';
    }
  }
}

function setLightboxIndex(idx) {
  if (!state.activeLightbox.photos) return;
  state.activeLightbox.currentIndex = idx;
  renderLightbox();
}

function nextLightboxPhoto() {
  const { photos, currentIndex } = state.activeLightbox;
  if (!photos || photos.length <= 1) return;
  state.activeLightbox.currentIndex = (currentIndex + 1) % photos.length;
  renderLightbox();
}

function prevLightboxPhoto() {
  const { photos, currentIndex } = state.activeLightbox;
  if (!photos || photos.length <= 1) return;
  state.activeLightbox.currentIndex = (currentIndex - 1 + photos.length) % photos.length;
  renderLightbox();
}

function closeLightbox() {
  if (elements.modalLightbox) {
    elements.modalLightbox.classList.add('hidden');
  }
  if (state.lightboxOpenedFromFicha) {
    state.lightboxOpenedFromFicha = false;
    if (elements.modalFicha) {
      elements.modalFicha.classList.remove('hidden');
    }
  }
  // Si modalFicha está cerrado y modalRegister está cerrado, restaurar scroll
  if ((!elements.modalFicha || elements.modalFicha.classList.contains('hidden')) &&
      (!elements.modalRegister || elements.modalRegister.classList.contains('hidden'))) {
    document.body.classList.remove('overflow-hidden');
  }
}

// ============================================================================
// AMPLIACIÓN / REDUCCIÓN DE TARJETAS EN EL LISTADO PRINCIPAL
// ============================================================================
function toggleCardExpansion(workerId) {
  const expandedContainer = document.getElementById(`card-expanded-${workerId}`);
  const expandBtnText = document.getElementById(`expand-text-${workerId}`);
  const expandBtnIcon = document.getElementById(`expand-icon-${workerId}`);
  const expandBtn = document.getElementById(`btn-expand-${workerId}`);

  if (!expandedContainer) return;

  const isCurrentlyExpanded = !expandedContainer.classList.contains('hidden');

  if (isCurrentlyExpanded) {
    expandedContainer.classList.add('hidden');
    state.expandedCards.delete(workerId);
    if (expandBtnText) {
      const item = state.oficios.find(o => String(o.id) === String(workerId));
      const photos = getOficioPhotos(item);
      expandBtnText.textContent = `Ampliar ficha ${photos.length > 0 ? `(${photos.length} fotos)` : ''}`;
    }
    if (expandBtnIcon) expandBtnIcon.textContent = '⤢';
    if (expandBtn) {
      expandBtn.className = 'flex-1 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl text-xs border border-emerald-200 flex items-center justify-center gap-1.5 transition cursor-pointer';
    }
  } else {
    expandedContainer.classList.remove('hidden');
    state.expandedCards.add(workerId);
    if (expandBtnText) expandBtnText.textContent = 'Reducir ficha';
    if (expandBtnIcon) expandBtnIcon.textContent = '⬆';
    if (expandBtn) {
      expandBtn.className = 'flex-1 py-2 px-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold rounded-xl text-xs border border-zinc-300 flex items-center justify-center gap-1.5 transition cursor-pointer';
    }
  }
}

// ============================================================================
// COMPARTIR POR WHATSAPP (ACCION NATIVA NAVIGATOR.SHARE + FALLBACK DIRECTO)
// Permite que un vecino reenvíe la ficha de un oficio a otro vecino o a un
// grupo de WhatsApp de la colonia con un solo toque.
// ============================================================================
function formatOficioShareText(item, shareUrl) {
  if (!item) return '';

  const fallbackUrl = (typeof window !== 'undefined' && window.location)
    ? `${window.location.origin}${window.location.pathname}?id=${encodeURIComponent(item.id)}`
    : `https://oficiosahome.org/?id=${encodeURIComponent(item.id)}`;

  const finalUrl = shareUrl || fallbackUrl;
  const sindicaturaText = item.sindicatura ? ` (${item.sindicatura})` : '';

  const lines = [
    `👋 *Recomendación en Oficios Ahome:*`,
    ``,
    `🛠️ *${item.nombre}* — ${item.oficio}`,
    `📍 *Zona:* ${item.zona}${sindicaturaText}`,
    `📞 *WhatsApp / Tel:* ${item.telefono}`
  ];

  if (item.descripcion) {
    lines.push(`📝 *Especialidad:* ${item.descripcion}`);
  }
  if (item.cobertura) {
    lines.push(`🚗 *Cobertura:* ${item.cobertura}`);
  }
  if (item.horario) {
    lines.push(`🕒 *Horario:* ${item.horario}`);
  }
  if (item.enlaceTrabajos) {
    lines.push(`📸 *Fotos de trabajos reales:* ${item.enlaceTrabajos}`);
  }

  lines.push(``);
  lines.push(`👉 *Ver ficha completa y ubicación en el mapa:*`);
  lines.push(finalUrl);

  return lines.join('\n');
}

async function shareOficioViaWhatsApp(workerId) {
  const item = state.oficios.find(o => String(o.id) === String(workerId));
  if (!item) return;

  const currentUrl = (typeof window !== 'undefined' && window.location)
    ? `${window.location.origin}${window.location.pathname}?id=${encodeURIComponent(item.id)}`
    : `https://oficiosahome.org/?id=${encodeURIComponent(item.id)}`;

  const shareText = formatOficioShareText(item, currentUrl);

  // 1. Priorizar navigator.share (acción nativa móvil para WhatsApp y grupos con 1 toque)
  if (navigator && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: `${item.nombre} - ${item.oficio} | Oficios Ahome`,
        text: shareText,
        url: currentUrl
      });
      showToast('¡Ficha compartida exitosamente!', '📲');
      return;
    } catch (err) {
      // Si el usuario canceló la acción nativa de compartir, no mostramos error
      if (err && (err.name === 'AbortError' || (err.message && (err.message.includes('abort') || err.message.includes('cancel'))))) {
        return;
      }
      console.warn('navigator.share no se completó, usando fallback de WhatsApp directo:', err);
    }
  }

  // 2. Fallback directo a WhatsApp (Web / App) con mensaje predeterminado
  try {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    showToast('Abriendo WhatsApp para compartir...', '💬');
  } catch (e) {
    // 3. Fallback a portapapeles en caso de bloqueo de ventanas emergentes
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareText).then(() => {
        showToast('¡Mensaje copiado! Pégalo en tu grupo de WhatsApp.', '📋');
      });
    } else {
      prompt('Copia este mensaje para compartirlo en WhatsApp:', shareText);
    }
  }
}

// Compatibilidad retroactiva
function shareOficio(workerId) {
  return shareOficioViaWhatsApp(workerId);
}

// ============================================================================
// GESTIÓN DE TEMA / MODO OSCURO (OPCIÓN 8)
// ============================================================================
function initTheme() {
  const savedTheme = localStorage.getItem('ahome_theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
  
  if (isDark) {
    document.documentElement.classList.add('dark');
    state.theme = 'dark';
  } else {
    document.documentElement.classList.remove('dark');
    state.theme = 'light';
  }
  updateThemeIcons();

  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('ahome_theme')) {
        if (e.matches) {
          document.documentElement.classList.add('dark');
          state.theme = 'dark';
        } else {
          document.documentElement.classList.remove('dark');
          state.theme = 'light';
        }
        updateThemeIcons();
      }
    });
  }
}

function updateThemeIcons() {
  const isDark = document.documentElement.classList.contains('dark');
  const icon = isDark ? '☀️' : '🌙';
  document.querySelectorAll('.theme-icon').forEach(el => {
    el.textContent = icon;
  });
}

function toggleTheme() {
  const isDark = document.documentElement.classList.toggle('dark');
  state.theme = isDark ? 'dark' : 'light';
  try {
    localStorage.setItem('ahome_theme', state.theme);
  } catch (e) {}
  updateThemeIcons();
  showToast(isDark ? '🌙 Modo oscuro activado (Ahorro de batería)' : '☀️ Modo claro activado', isDark ? '🌙' : '☀️');
}

// ============================================================================
// GESTIÓN DE FAVORITOS / MIS OFICIOS DE CONFIANZA (OPCIÓN 1)
// ============================================================================
function initFavorites() {
  try {
    const saved = JSON.parse(localStorage.getItem('ahome_favoritos') || '[]');
    state.favorites = new Set(Array.isArray(saved) ? saved.map(String) : []);
  } catch (err) {
    console.warn('Error al leer ahome_favoritos de localStorage:', err);
    state.favorites = new Set();
  }
  updateFavoritesCountBadges();
}

function updateFavoritesCountBadges() {
  const count = state.favorites.size;
  if (elements.favoritesCountBadge) elements.favoritesCountBadge.textContent = count;
  if (elements.favoritesCountBadgeMobile) elements.favoritesCountBadgeMobile.textContent = count;
  if (elements.favoritesCountBadgeQuick) elements.favoritesCountBadgeQuick.textContent = count;

  const isFilterActive = state.onlyFavorites;
  const favBtns = [elements.btnToggleFavorites, elements.btnToggleFavoritesMobile, elements.btnFilterFavorites];
  favBtns.forEach(btn => {
    if (!btn) return;
    if (isFilterActive) {
      btn.classList.add('bg-amber-100', 'text-amber-900', 'border-amber-400', 'ring-2', 'ring-amber-400/40');
    } else {
      btn.classList.remove('bg-amber-100', 'text-amber-900', 'border-amber-400', 'ring-2', 'ring-amber-400/40');
    }
  });
}

function isFavorite(workerId) {
  return state.favorites.has(String(workerId));
}

function toggleFavorite(workerId, event) {
  if (event) event.stopPropagation();
  const idStr = String(workerId);
  const wasFav = state.favorites.has(idStr);
  
  if (wasFav) {
    state.favorites.delete(idStr);
  } else {
    state.favorites.add(idStr);
  }
  
  try {
    localStorage.setItem('ahome_favoritos', JSON.stringify([...state.favorites]));
  } catch (err) {
    console.warn('Error al guardar ahome_favoritos en localStorage:', err);
  }

  updateFavoritesCountBadges();
  updateFavoriteButtonsInDOM(idStr);

  const item = state.oficios.find(o => String(o.id) === idStr);
  const nombre = item ? item.nombre : 'Oficio';
  
  if (wasFav) {
    showToast(`${nombre} eliminado de tus guardados`, '🗑️');
  } else {
    showToast(`⭐ ${nombre} guardado en tus oficios de confianza`, '⭐');
  }

  if (state.onlyFavorites) {
    applyFilters();
  }
}

function updateFavoriteButtonsInDOM(workerId) {
  const isFav = state.favorites.has(String(workerId));
  const buttons = document.querySelectorAll(`.btn-fav-${workerId}`);
  buttons.forEach(btn => {
    if (isFav) {
      btn.classList.remove('text-zinc-400', 'hover:text-amber-500');
      btn.classList.add('text-amber-500', 'hover:text-amber-600');
      btn.setAttribute('title', 'Quitar de mis oficios de confianza');
      btn.innerHTML = `
        <svg class="w-5 h-5 fill-amber-400 stroke-amber-500 scale-110 transition-transform" viewBox="0 0 24 24" stroke-width="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
      `;
    } else {
      btn.classList.remove('text-amber-500', 'hover:text-amber-600');
      btn.classList.add('text-zinc-400', 'hover:text-amber-500');
      btn.setAttribute('title', 'Guardar en mis oficios de confianza');
      btn.innerHTML = `
        <svg class="w-5 h-5 fill-none stroke-current transition-transform" viewBox="0 0 24 24" stroke-width="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
      `;
    }
  });
}

function toggleFavoritesFilter() {
  state.onlyFavorites = !state.onlyFavorites;
  if (state.onlyFavorites && state.favorites.size === 0) {
    showToast('Aún no has guardado favoritos. Toca la ⭐ en cualquier tarjeta para tenerla a la mano.', '⭐');
  }
  updateFavoritesCountBadges();
  applyFilters();
}

// ============================================================================
// GENERACIÓN Y DESCARGA DE VCARD 3.0 (.VCF) PARA CONTACTOS (OPCIÓN 3)
// ============================================================================
function downloadVCard(workerId) {
  const item = state.oficios.find(o => String(o.id) === String(workerId));
  if (!item) return;

  const rawPhone = String(item.telefono || '').replace(/\D/g, '');
  const cleanPhone = rawPhone.length === 10 ? `+52 ${rawPhone.substring(0,3)} ${rawPhone.substring(3,6)} ${rawPhone.substring(6)}` : `+52 ${rawPhone}`;
  const cleanDesc = (item.descripcion || '').replace(/\r?\n/g, ' ');
  const shareUrl = `https://oficiosahome.org/?id=${item.id}`;

  const vcard = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${item.nombre} (${item.oficio})`,
    `N:${item.nombre};;;;`,
    'ORG:Oficios Ahome',
    `TITLE:${item.oficio} - Ahome`,
    `TEL;TYPE=CELL,VOICE,PREF:${cleanPhone}`,
    `NOTE:Oficios Ahome • Zona: ${item.zona} (${item.sindicatura || 'Ahome'}) • ${cleanDesc} • Horario: ${item.horario || 'No especificado'}`,
    `URL:${shareUrl}`,
    `CATEGORIES:Oficios Ahome,${item.oficio}`,
    'END:VCARD'
  ].join('\r\n');

  try {
    const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = (item.nombre || 'contacto').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '_');
    a.href = url;
    a.download = `${safeName}_oficios_ahome.vcf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('📇 Contacto descargado. Ábrelo para agregarlo a tu agenda.', '📱');
  } catch (err) {
    console.error('Error al generar vCard:', err);
    showToast('No se pudo generar el archivo de contacto.', '❌');
  }
}

// ============================================================================
// GENERADOR DE CARTEL COMUNITARIO CON CÓDIGO QR IMPRIMIBLE (OPCIÓN 5)
// ============================================================================
function openPosterModal(workerId) {
  const item = state.oficios.find(o => String(o.id) === String(workerId));
  if (!item) return;

  const rawPhone = String(item.telefono || '').replace(/\D/g, '');
  const displayPhone = rawPhone.length === 10 
    ? `${rawPhone.substring(0, 3)} ${rawPhone.substring(3, 6)} ${rawPhone.substring(6)}`
    : rawPhone;
  const icon = OFICIO_ICONS[item.oficio] || '🛠️';

  const badgeEl = document.getElementById('poster-oficio-badge');
  const nameEl = document.getElementById('poster-worker-name');
  const zonaEl = document.getElementById('poster-zona');
  const phoneEl = document.getElementById('poster-phone');
  const horarioEl = document.getElementById('poster-horario');
  const descEl = document.getElementById('poster-descripcion');
  const urlEl = document.getElementById('poster-url');
  const qrContainer = document.getElementById('poster-qr-container');

  if (badgeEl) badgeEl.textContent = `${icon} ${item.oficio.toUpperCase()}`;
  if (nameEl) nameEl.textContent = item.nombre.toUpperCase();
  if (zonaEl) zonaEl.textContent = `${item.zona} • ${item.sindicatura || 'Los Mochis, Sinaloa'}`;
  if (phoneEl) phoneEl.textContent = displayPhone || '668 000 0000';
  if (horarioEl) horarioEl.textContent = item.horario || 'Lunes a Sábado';
  if (descEl) descEl.textContent = item.descripcion || 'Servicios profesionales y atención directa.';
  if (urlEl) urlEl.textContent = `oficiosahome.org/?id=${item.id}`;

  if (qrContainer) {
    qrContainer.innerHTML = '';
    const shareUrl = `https://oficiosahome.org/?id=${encodeURIComponent(item.id)}`;
    if (typeof QRCode !== 'undefined') {
      try {
        new QRCode(qrContainer, {
          text: shareUrl,
          width: 160,
          height: 160,
          colorDark: '#0f172a',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.H
        });
      } catch (err) {
        console.warn('Error con QRCode:', err);
      }
    }
  }

  const modalPoster = document.getElementById('modal-poster');
  if (modalPoster) {
    modalPoster.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
  }
}

function closePosterModal() {
  const modalPoster = document.getElementById('modal-poster');
  if (modalPoster) {
    modalPoster.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }
}

function printPoster() {
  window.print();
}

function initPosterListeners() {
  const btnClose = document.getElementById('btn-close-poster');
  if (btnClose) {
    btnClose.addEventListener('click', closePosterModal);
  }
  const modalPoster = document.getElementById('modal-poster');
  if (modalPoster) {
    modalPoster.addEventListener('click', (e) => {
      if (e.target === modalPoster) closePosterModal();
    });
  }
}

// ============================================================================
// MODO AUXILIO RÁPIDO NOCTURNO 24 HORAS (OPCIÓN 6)
// ============================================================================
function toggleAuxilioNocturno() {
  state.auxilioNocturno = !state.auxilioNocturno;
  updateAuxilioNocturnoUI();
  applyFilters();
}

function updateAuxilioNocturnoUI() {
  const isActive = state.auxilioNocturno;
  if (elements.auxilioNocturnoBanner) {
    if (isActive) {
      elements.auxilioNocturnoBanner.classList.remove('hidden');
    } else {
      elements.auxilioNocturnoBanner.classList.add('hidden');
    }
  }

  if (elements.btnAuxilioNocturno) {
    if (isActive) {
      elements.btnAuxilioNocturno.classList.remove('text-rose-700', 'bg-rose-50', 'dark:bg-rose-950/40', 'dark:text-rose-300');
      elements.btnAuxilioNocturno.classList.add('bg-rose-600', 'text-white', 'border-rose-700', 'shadow-md', 'scale-[1.03]');
    } else {
      elements.btnAuxilioNocturno.classList.remove('bg-rose-600', 'text-white', 'border-rose-700', 'shadow-md', 'scale-[1.03]');
      elements.btnAuxilioNocturno.classList.add('text-rose-700', 'bg-rose-50', 'dark:bg-rose-950/40', 'dark:text-rose-300');
    }
  }

  if (isActive) {
    showToast('🚨 Modo Auxilio Nocturno 24h activado. Prioriza llamada celular directa.', '🚨');
  } else {
    showToast('Modo auxilio desactivado', '✓');
  }
}

function initAuxilioNocturnoListeners() {
  if (elements.btnAuxilioNocturno) {
    elements.btnAuxilioNocturno.addEventListener('click', toggleAuxilioNocturno);
  }
}

window.getOficioPhotos = getOficioPhotos;
window.openFichaModal = openFichaModal;
window.closeFichaModal = closeFichaModal;
window.switchFichaModalPhoto = switchFichaModalPhoto;
window.nextFichaModalPhoto = nextFichaModalPhoto;
window.prevFichaModalPhoto = prevFichaModalPhoto;
window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;
window.setLightboxIndex = setLightboxIndex;
window.nextLightboxPhoto = nextLightboxPhoto;
window.prevLightboxPhoto = prevLightboxPhoto;
window.toggleCardExpansion = toggleCardExpansion;
window.shareOficio = shareOficio;
window.shareOficioViaWhatsApp = shareOficioViaWhatsApp;
window.formatOficioShareText = formatOficioShareText;
window.focusWorkerOnMap = focusWorkerOnMap;
window.getEnlaceTrabajosInfo = getEnlaceTrabajosInfo;
window.openWhatsAppQuoteModal = openWhatsAppQuoteModal;
window.closeWhatsAppQuoteModal = closeWhatsAppQuoteModal;
window.compileWhatsAppQuoteMessage = compileWhatsAppQuoteMessage;
window.selectQuoteSuggestion = selectQuoteSuggestion;
window.syncDatabaseToOfflineCache = syncDatabaseToOfflineCache;
window.calculateDistanceKm = calculateDistanceKm;
window.formatLivePhoneNumber = formatLivePhoneNumber;
window.applyQuickSearch = applyQuickSearch;
window.clearSingleFilter = clearSingleFilter;
window.toggleFavorite = toggleFavorite;
window.isFavorite = isFavorite;
window.toggleFavoritesFilter = toggleFavoritesFilter;
window.downloadVCard = downloadVCard;
window.openPosterModal = openPosterModal;
window.closePosterModal = closePosterModal;
window.printPoster = printPoster;
window.toggleAuxilioNocturno = toggleAuxilioNocturno;
window.toggleTheme = toggleTheme;

// ============================================================================
// SISTEMA DE GEOLOCALIZACIÓN Y DISTRIBUCIÓN ORBITAL DE OFICIOS
// ============================================================================

// Mapa indexado normalizado para resolución exacta e instantánea en O(1)
const NORMALIZED_ZONA_MAP = new Map();

function initNormalizedZonaMap() {
  NORMALIZED_ZONA_MAP.clear();
  for (const [key, coords] of Object.entries(AHOME_ZONA_COORDS)) {
    const norm = normalizeText(key).trim();
    if (norm && !NORMALIZED_ZONA_MAP.has(norm)) {
      NORMALIZED_ZONA_MAP.set(norm, coords);
    }
  }
}

/**
 * Obtiene las coordenadas base exactas de una sindicatura, colonia o ejido de Ahome.
 * Garantiza coincidencia 100% fiel y evita colisiones entre nombres similares (ej. Álamos Country vs Los Álamos).
 */
function getBaseCoordsForZona(zona) {
  if (!zona) return [...AHOME_DEFAULT_CENTER];
  const normInput = normalizeText(zona).trim();
  if (!normInput) return [...AHOME_DEFAULT_CENTER];

  if (NORMALIZED_ZONA_MAP.size === 0) {
    initNormalizedZonaMap();
  }

  // 1. Coincidencia directa O(1) en el mapa normalizado
  if (NORMALIZED_ZONA_MAP.has(normInput)) {
    return [...NORMALIZED_ZONA_MAP.get(normInput)];
  }

  // 2. Limpieza de prefijos comunes ("fracc.", "fraccionamiento", "colonia", "col.", "ejido", "residencial")
  const stripped = normInput
    .replace(/^(fracc\.|fraccionamiento|colonia|col\.|ejido|comunidad|sindicatura|campo pesquero)\s+/i, '')
    .trim();
  if (stripped && NORMALIZED_ZONA_MAP.has(stripped)) {
    return [...NORMALIZED_ZONA_MAP.get(stripped)];
  }

  // 3. Intento con prefijo canónico "fracc. "
  const withFracc = `fracc. ${stripped || normInput}`;
  const withFraccNorm = normalizeText(withFracc);
  if (NORMALIZED_ZONA_MAP.has(withFraccNorm)) {
    return [...NORMALIZED_ZONA_MAP.get(withFraccNorm)];
  }

  // 4. Si el input contiene la clave de zona, preferir la clave MÁS LARGA
  // (ej. "Fracc. Álamos Country" contiene "alamos country" y "alamos"; elegimos "alamos country")
  const containingKeys = Object.keys(AHOME_ZONA_COORDS)
    .filter(k => {
      const nk = normalizeText(k).trim();
      return nk && normInput.includes(nk);
    })
    .sort((a, b) => b.length - a.length);

  if (containingKeys.length > 0) {
    return [...AHOME_ZONA_COORDS[containingKeys[0]]];
  }

  // 5. Si la clave contiene el input, preferir la más cercana en longitud
  const reverseKeys = Object.keys(AHOME_ZONA_COORDS)
    .filter(k => {
      const nk = normalizeText(k).trim();
      return nk && nk.includes(normInput);
    })
    .sort((a, b) => a.length - b.length);

  if (reverseKeys.length > 0) {
    return [...AHOME_ZONA_COORDS[reverseKeys[0]]];
  }

  return [...AHOME_DEFAULT_CENTER];
}

/**
 * Distribución circular/orbital a escala de barrio/colonia para que múltiples oficios
 * en la misma colonia circunden el centro en un radio seguro (~70m a 110m) sin salirse
 * a colonias contiguas y sin encimarse en el mismo punto exacto.
 */
function getCircularOffsetCoords(baseCoords, indexInLocation, totalInLocation) {
  if (totalInLocation <= 1) {
    return [baseCoords[0], baseCoords[1]];
  }

  // Radio orbital en grados: ~72m para 2 a 4 oficios, ~111m para 5 a 8 oficios
  let R = 0.00065; // ~72 metros en latitud de Los Mochis
  let angle = 0;

  if (totalInLocation <= 4) {
    R = 0.00065; // ~72m
    // Empieza al Norte (12:00) y avanza en sentido horario
    angle = (Math.PI / 2) - (2 * Math.PI * indexInLocation) / totalInLocation;
  } else if (totalInLocation <= 8) {
    R = 0.0010; // ~111m
    angle = (Math.PI / 2) - (2 * Math.PI * indexInLocation) / totalInLocation;
  } else {
    // Si hay más de 8 oficios en la misma colonia: dos anillos concéntricos
    if (indexInLocation < 4) {
      R = 0.00065;
      angle = (Math.PI / 2) - (2 * Math.PI * indexInLocation) / 4;
    } else {
      const remaining = totalInLocation - 4;
      const remIndex = indexInLocation - 4;
      R = 0.0012; // ~133m
      angle = (Math.PI / 2) - (2 * Math.PI * remIndex) / remaining;
    }
  }

  // Corrección esférica para la latitud de Ahome (~25.8° N)
  const latRad = (baseCoords[0] * Math.PI) / 180;
  const offsetLat = R * Math.sin(angle);
  const offsetLng = (R / Math.cos(latRad)) * Math.cos(angle);

  return [
    Number((baseCoords[0] + offsetLat).toFixed(5)),
    Number((baseCoords[1] + offsetLng).toFixed(5))
  ];
}

/**
 * Obtiene la coordenada precisa asignada a un oficio según su zona
 */
function getCoordsForZona(zona) {
  const base = getBaseCoordsForZona(zona);
  const norm = normalizeText(zona);
  const existingCount = (state.oficios || []).filter(o => o && normalizeText(o.zona) === norm).length;
  return getCircularOffsetCoords(base, existingCount, existingCount + 1);
}

window.getBaseCoordsForZona = getBaseCoordsForZona;
window.getCircularOffsetCoords = getCircularOffsetCoords;

// ============================================================================
// GESTIÓN DE SUBIDA Y VISTA PREVIA DE FOTOS MÚLTIPLES
// ============================================================================
function compressImageFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 900;
        const MAX_HEIGHT = 900;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(null);
      img.src = event.target.result;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

function renderUploadedPhotosPreview() {
  if (!elements.fotoPreviewContainer || !elements.fotoPreviewGrid) return;

  const count = state.currentUploadedPhotos.length;
  const labelBtn = document.getElementById('label-foto-btn-text');
  const limitBadge = document.getElementById('foto-limit-badge');

  if (count === 0) {
    elements.fotoPreviewContainer.classList.add('hidden');
    elements.fotoPreviewGrid.innerHTML = '';
    if (labelBtn) labelBtn.textContent = 'Seleccionar fotos (hasta 5 fotos)';
    if (limitBadge) {
      limitBadge.textContent = 'Máx. 5 fotos';
      limitBadge.className = 'text-[11px] text-zinc-500 font-medium';
    }
    return;
  }

  elements.fotoPreviewContainer.classList.remove('hidden');
  if (elements.fotoPreviewCount) {
    if (count >= MAX_OFICIO_PHOTOS) {
      elements.fotoPreviewCount.innerHTML = `<span class="text-emerald-700 font-bold">${count} de ${MAX_OFICIO_PHOTOS} fotos</span> (Límite máximo alcanzado):`;
    } else {
      elements.fotoPreviewCount.innerHTML = `<span class="text-zinc-900 font-bold">${count} de ${MAX_OFICIO_PHOTOS} fotos</span> listas para publicar:`;
    }
  }

  if (labelBtn) {
    if (count >= MAX_OFICIO_PHOTOS) {
      labelBtn.textContent = 'Límite de 5 fotos alcanzado';
    } else {
      const remaining = MAX_OFICIO_PHOTOS - count;
      labelBtn.textContent = `Agregar más fotos (${remaining} disponibles)`;
    }
  }

  if (limitBadge) {
    if (count >= MAX_OFICIO_PHOTOS) {
      limitBadge.textContent = '5 de 5 (completo)';
      limitBadge.className = 'text-[11px] text-emerald-700 font-bold';
    } else {
      limitBadge.textContent = `${count}/5 fotos`;
      limitBadge.className = 'text-[11px] text-zinc-500 font-medium';
    }
  }

  elements.fotoPreviewGrid.innerHTML = state.currentUploadedPhotos.map((photo, idx) => `
    <div class="relative group/thumb rounded-xl overflow-hidden border border-zinc-200 bg-zinc-900 h-24 shadow-2xs">
      <img src="${escapeHtml(photo)}" alt="Foto subida ${idx + 1}" class="w-full h-full object-cover">
      <span class="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] font-mono px-1.5 py-0.5 rounded">
        ${idx + 1}/5
      </span>
      <button 
        type="button" 
        onclick="window.removeUploadedPhoto(${idx})" 
        class="absolute top-1 right-1 w-6 h-6 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center transition cursor-pointer shadow-md"
        title="Quitar esta foto"
      >
        ✕
      </button>
    </div>
  `).join('');
}

function removeUploadedPhoto(idx) {
  if (idx >= 0 && idx < state.currentUploadedPhotos.length) {
    state.currentUploadedPhotos.splice(idx, 1);
    renderUploadedPhotosPreview();
    showToast('Foto eliminada', '🗑️');
  }
}

window.removeUploadedPhoto = removeUploadedPhoto;

function initPhotoUploadListeners() {
  if (!elements.regFotoFile) return;

  // Subida múltiple de archivos desde el dispositivo con tope de 5 fotos
  elements.regFotoFile.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const availableSlots = MAX_OFICIO_PHOTOS - state.currentUploadedPhotos.length;
    if (availableSlots <= 0) {
      showToast('Ya has alcanzado el límite máximo de 5 fotos', '⚠️');
      elements.regFotoFile.value = '';
      return;
    }

    let filesToProcess = files;
    if (files.length > availableSlots) {
      filesToProcess = files.slice(0, availableSlots);
      showToast(`Puedes subir hasta 5 fotos en total. Se agregaron ${availableSlots} fotos.`, 'ℹ️');
    }

    for (const file of filesToProcess) {
      if (!file.type.startsWith('image/')) continue;
      const dataUrl = await compressImageFile(file);
      if (dataUrl && state.currentUploadedPhotos.length < MAX_OFICIO_PHOTOS) {
        state.currentUploadedPhotos.push(dataUrl);
      }
    }
    renderUploadedPhotosPreview();
    elements.regFotoFile.value = '';
    const newTotal = state.currentUploadedPhotos.length;
    showToast(`${newTotal} de ${MAX_OFICIO_PHOTOS} fotos cargadas`, '📸');
  });

  // URL manual de imagen con tope de 5 fotos
  if (elements.regFotoUrl) {
    const addUrlPhoto = () => {
      const url = elements.regFotoUrl.value.trim();
      if (!url) return;
      if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('./')) {
        return;
      }
      if (state.currentUploadedPhotos.length >= MAX_OFICIO_PHOTOS) {
        showToast('Ya has alcanzado el límite máximo de 5 fotos', '⚠️');
        return;
      }
      if (!state.currentUploadedPhotos.includes(url)) {
        state.currentUploadedPhotos.push(url);
        renderUploadedPhotosPreview();
        elements.regFotoUrl.value = '';
        showToast(`Foto agregada (${state.currentUploadedPhotos.length} de ${MAX_OFICIO_PHOTOS})`, '🔗');
      }
    };

    elements.regFotoUrl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addUrlPhoto();
      }
    });

    elements.regFotoUrl.addEventListener('blur', () => {
      addUrlPhoto();
    });
  }

  // Quitar todas las fotos
  if (elements.btnRemoveAllFotos) {
    elements.btnRemoveAllFotos.addEventListener('click', () => {
      state.currentUploadedPhotos = [];
      if (elements.regFotoFile) elements.regFotoFile.value = '';
      if (elements.regFotoUrl) elements.regFotoUrl.value = '';
      renderUploadedPhotosPreview();
      showToast('Fotos removidas', '🗑️');
    });
  }
}

// ============================================================================
// GESTIÓN DE RED Y SERVICE WORKER (PWA)
// ============================================================================
function initNetworkListeners() {
  function updateStatus() {
    state.isOnline = navigator.onLine;
    if (elements.networkStatus) {
      if (state.isOnline) {
        elements.networkStatus.className = 'inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800/60';
        elements.networkStatus.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Conectado';
        elements.offlineBanner.classList.add('hidden');
      } else {
        elements.networkStatus.className = 'inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-950 text-amber-300 border border-amber-800/60';
        elements.networkStatus.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Modo sin conexión (Llamadas celulares activas)';
        elements.offlineBanner.classList.remove('hidden');
        showToast('Modo sin conexión garantizado: Puedes ver teléfonos y llamar por red celular', '📞');
      }
    }
  }

  window.addEventListener('online', updateStatus);
  window.addEventListener('offline', updateStatus);
  updateStatus();
}

function initServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then((reg) => {
          console.log('[PWA] Service Worker registrado exitosamente con scope:', reg.scope);

          // Detectar si ya hay un worker esperando
          if (reg.waiting) {
            showPwaUpdateBanner(reg.waiting);
          }

          // Escuchar cuando se encuentre una actualización
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  showPwaUpdateBanner(newWorker);
                }
              });
            }
          });
        })
        .catch((err) => {
          console.warn('[PWA] Error al registrar Service Worker:', err);
        });

      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    });
  }
}

function showPwaUpdateBanner(worker) {
  const banner = document.getElementById('pwa-update-banner');
  const btnReload = document.getElementById('btn-pwa-reload');
  if (banner) {
    banner.classList.remove('hidden');
    banner.classList.add('flex');
  }
  if (btnReload && worker) {
    btnReload.onclick = () => {
      worker.postMessage({ type: 'SKIP_WAITING' });
    };
  }
}

function initPwaInstall() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    state.deferredPrompt = e;
    if (elements.btnInstallPwa) {
      elements.btnInstallPwa.classList.remove('hidden');
      elements.btnInstallPwa.classList.add('inline-flex');
    }
  });

  if (elements.btnInstallPwa) {
    elements.btnInstallPwa.addEventListener('click', async () => {
      if (!state.deferredPrompt) return;
      state.deferredPrompt.prompt();
      const choiceResult = await state.deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        showToast('¡Gracias por instalar Oficios Ahome!', '⭐');
      }
      state.deferredPrompt = null;
      elements.btnInstallPwa.classList.add('hidden');
    });
  }

  window.addEventListener('appinstalled', () => {
    console.log('[PWA] Oficios Ahome fue instalada en el dispositivo.');
    if (elements.btnInstallPwa) elements.btnInstallPwa.classList.add('hidden');
    showToast('Aplicación instalada en tu pantalla principal', '📱');
  });
}

// ============================================================================
// CARGA Y PERSISTENCIA DE DATOS (OFFLINE CACHE GARANTIZADO)
// ============================================================================
/**
 * Guarda en caché la última versión descargada de la base de datos de forma garantizada:
 * 1. En LocalStorage (acceso síncrono instantáneo).
 * 2. En CacheStorage (Web Cache API) bajo ./oficios.json para que el Service Worker lo sirva offline.
 * 3. Notifica al Service Worker activo por postMessage.
 */
async function syncDatabaseToOfflineCache(data) {
  if (!Array.isArray(data)) return;

  // 1. Guardar en LocalStorage
  try {
    localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(data));
  } catch (e) {
    console.warn('[Offline Cache] Error al guardar en LocalStorage:', e);
  }

  // 2. Guardar en CacheStorage bajo ./oficios.json
  try {
    if ('caches' in window) {
      const cache = await caches.open(SW_CACHE_NAME);
      const jsonString = JSON.stringify(data);
      const response = new Response(jsonString, {
        status: 200,
        statusText: 'OK',
        headers: {
          'Content-Type': 'application/json',
          'X-Offline-Database-Count': String(data.length),
          'X-Offline-Timestamp': new Date().toISOString()
        }
      });
      await cache.put('./oficios.json', response);
      console.log(`[Offline Cache] Base de datos guardada en CacheStorage (${data.length} oficios garantizados sin conexión).`);
    }
  } catch (err) {
    console.warn('[Offline Cache] Error al escribir en CacheStorage:', err);
  }

  // 3. Notificar al Service Worker activo
  try {
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_DATABASE',
        payload: data
      });
    }
  } catch (err) {
    // Si aún no hay controller activo, se ignora limpiamente
  }
}

async function loadOficiosData() {
  const cached = localStorage.getItem(STORAGE_KEY_DATA);
  const webhookUrl = localStorage.getItem(STORAGE_KEY_URL) || DEFAULT_SCRIPT_URL;

  // 1. Mostrar caché local si existe
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        state.oficios = parsed;
        applyFilters();
      }
    } catch (e) {
      console.warn('Error al parsear caché local:', e);
    }
  }

  // 2. Obtener siempre la versión autoritativa de oficios.json
  try {
    const fetchUrl = `./oficios.json?t=${Date.now()}`;
    const res = await fetch(fetchUrl);
    if (res.ok) {
      const defaultData = await res.json();
      if (Array.isArray(defaultData)) {
        state.oficios = defaultData;
        syncDatabaseToOfflineCache(state.oficios);
        applyFilters();
        console.log(`[Oficios Ahome] Base de datos sincronizada (${state.oficios.length} oficios activos).`);
      }
    }
  } catch (err) {
    console.warn('Error al cargar oficios.json base, intentando fallback:', err);
    try {
      const resFallback = await fetch('oficios.json');
      if (resFallback.ok) {
        const defaultData = await resFallback.json();
        if (Array.isArray(defaultData)) {
          state.oficios = defaultData;
          syncDatabaseToOfflineCache(state.oficios);
          applyFilters();
        }
      }
    } catch (e2) {}
  }

  // 3. Si hay webhook configurado y conexión a internet, consultar Google Sheets
  if (navigator.onLine && webhookUrl) {
    try {
      const response = await fetch(webhookUrl, { method: 'GET' });
      if (response.ok) {
        const liveData = await response.json();
        if (Array.isArray(liveData)) {
          state.oficios = liveData;
          syncDatabaseToOfflineCache(state.oficios);
          applyFilters();
        }
      }
    } catch (err) {
      console.log('No se pudo conectar a Google Sheets, usando base local:', err);
    }
  }

  checkSharedWorkerParam();

  // Polling en vivo en segundo plano cada 30 segundos si la pestaña está activa
  if (typeof window !== 'undefined' && !window._liveSheetSyncInterval) {
    window._liveSheetSyncInterval = setInterval(() => {
      if (navigator.onLine && !document.hidden) {
        const currentUrl = localStorage.getItem(STORAGE_KEY_URL) || DEFAULT_SCRIPT_URL;
        if (currentUrl) {
          fetch(currentUrl, { method: 'GET' })
            .then(res => res.ok ? res.json() : null)
            .then(freshData => {
              if (Array.isArray(freshData)) {
                const prevLength = state.oficios.length;
                state.oficios = freshData;
                syncDatabaseToOfflineCache(freshData);
                applyFilters();
                if (freshData.length !== prevLength) {
                  console.log(`[Tiempo Real] Base sincronizada en vivo: ${freshData.length} oficios.`);
                }
              }
            })
            .catch(() => {});
        }
      }
    }, 30000);
  }
}

function checkSharedWorkerParam() {
  try {
    if (typeof window === 'undefined' || !window.location) return;
    const urlParams = new URLSearchParams(window.location.search);
    const workerId = urlParams.get('id');
    if (!workerId) return;

    const worker = state.oficios.find(o => String(o.id) === String(workerId));
    if (worker) {
      setTimeout(() => {
        openFichaModal(worker.id);
        focusWorkerOnMap(worker.id);
        showToast(`Mostrando recomendación de ${worker.nombre}`, '🛠️');
      }, 350);
    }
  } catch (e) {
    console.warn('Error al procesar parámetro ?id:', e);
  }
}

function mergeOficios(remoteList, localList) {
  const map = new Map();
  remoteList.forEach(item => {
    if (item && item.nombre && item.telefono) {
      map.set(item.id || item.telefono, item);
    }
  });
  localList.forEach(item => {
    if (item && item.nombre && item.telefono) {
      const key = item.id || item.telefono;
      if (!map.has(key)) {
        map.set(key, item);
      }
    }
  });
  return Array.from(map.values());
}

// ============================================================================
// FILTRADO REACTIVO Y BÚSQUEDA
// ============================================================================
function normalizeText(text) {
  if (!text) return '';
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function applyFilters() {
  const query = normalizeText(state.searchQuery);
  const selectedOficio = state.selectedOficio;
  const selectedZona = state.selectedZona;
  const onlyEmergencias = state.onlyEmergencias;

  state.filteredOficios = state.oficios.filter(item => {
    // Filtro por Favoritos (Opción 1)
    if (state.onlyFavorites) {
      if (!state.favorites.has(String(item.id))) return false;
    }

    // Filtro por Modo Auxilio Rápido Nocturno (Opción 6)
    if (state.auxilioNocturno) {
      if (!item.emergencias) return false;
    }

    // Filtro por Oficio
    if (selectedOficio !== 'todos') {
      if (item.oficio !== selectedOficio) return false;
    }

    // Filtro por Zona / Sindicatura / Ejido
    if (selectedZona !== 'todas') {
      const itemZona = normalizeText(item.zona + ' ' + (item.sindicatura || '') + ' ' + (item.cobertura || ''));
      const targetZona = normalizeText(selectedZona);
      if (!itemZona.includes(targetZona)) return false;
    }

    // Filtro por Emergencias 24h
    if (onlyEmergencias) {
      if (!item.emergencias) return false;
    }

    // Filtro por Palabra Clave / Búsqueda con soporte de sinónimos populares
    if (query) {
      const nombreNorm = normalizeText(item.nombre);
      const oficioNorm = normalizeText(item.oficio);
      const zonaNorm = normalizeText(item.zona + ' ' + (item.sindicatura || '') + ' ' + (item.cobertura || ''));
      const descNorm = normalizeText(item.descripcion);
      const palabrasNorm = Array.isArray(item.palabrasClave)
        ? item.palabrasClave.map(normalizeText).join(' ')
        : normalizeText(item.palabrasClave);

      const combinedText = `${nombreNorm} ${oficioNorm} ${zonaNorm} ${descNorm} ${palabrasNorm}`;
      const searchTerms = query.split(/\s+/).filter(Boolean);
      
      const matchesAllTerms = searchTerms.every(term => {
        // 1. Coincidencia directa en texto combinado (nombre, oficio, zona, descripción, palabras clave)
        if (combinedText.includes(term)) return true;

        // 2. Coincidencia con regionalismos asociados a la categoría del oficio
        const categoryTerms = OFICIO_REGIONALISMS[item.oficio];
        if (categoryTerms) {
          const hasRegionalMatch = categoryTerms.some(ct => {
            const normCt = normalizeText(ct);
            return normCt === term || (normCt.length >= 4 && (normCt.includes(term) || term.includes(normCt)));
          });
          if (hasRegionalMatch) return true;
        }

        // 3. Diccionario cruzado de sinónimos específicos
        const synonyms = SEARCH_SYNONYMS[term];
        if (synonyms) {
          // Si el sinónimo apunta al nombre del oficio (ej. "porton" -> "herreria")
          if (synonyms.some(syn => oficioNorm.includes(normalizeText(syn)))) {
            return true;
          }
          // Si algún sinónimo coincide en el texto combinado
          if (synonyms.some(syn => combinedText.includes(normalizeText(syn)))) {
            return true;
          }
        }

        return false;
      });
      if (!matchesAllTerms) return false;
    }

    return true;
  });

  // Cálculo de distancias y ordenamiento por cercanía GPS si está activo
  if (state.userCoords && Array.isArray(state.userCoords)) {
    const [uLat, uLng] = state.userCoords;
    state.filteredOficios.forEach(item => {
      if (typeof item.lat === 'number' && typeof item.lng === 'number') {
        item.distanceKm = calculateDistanceKm(uLat, uLng, item.lat, item.lng);
      } else {
        item.distanceKm = null;
      }
    });

  } else {
    state.filteredOficios.forEach(item => {
      delete item.distanceKm;
    });
  }

  state.cardsPage = 1;
  renderCards(state.filteredOficios);
  updateMapMarkers(state.filteredOficios);
  updateResultsCount();
  updateResetButtonVisibility();
  renderActiveFilterChips();
}

function renderActiveFilterChips() {
  if (!elements.activeFiltersBar || !elements.activeFilterChips) return;
  
  const chips = [];

  if (state.onlyFavorites) {
    chips.push({
      type: 'favorites',
      label: '⭐ Mis Favoritos',
      tooltip: 'Mostrar todos los oficios'
    });
  }

  if (state.auxilioNocturno) {
    chips.push({
      type: 'auxilioNocturno',
      label: '🚨 Modo Auxilio Nocturno 24h',
      tooltip: 'Desactivar modo auxilio nocturno'
    });
  }
  
  if (state.searchQuery && state.searchQuery.trim()) {
    chips.push({
      type: 'search',
      label: `🔍 "${state.searchQuery.trim()}"`,
      tooltip: 'Quitar término de búsqueda'
    });
  }
  
  if (state.selectedOficio !== 'todos') {
    const icon = OFICIO_ICONS[state.selectedOficio] || '🛠️';
    chips.push({
      type: 'oficio',
      label: `${icon} ${state.selectedOficio}`,
      tooltip: 'Mostrar todos los oficios'
    });
  }
  
  if (state.selectedZona !== 'todas') {
    chips.push({
      type: 'zona',
      label: `📍 ${state.selectedZona}`,
      tooltip: 'Mostrar todo el municipio'
    });
  }
  
  if (state.onlyEmergencias && !state.auxilioNocturno) {
    chips.push({
      type: 'emergencias',
      label: '🚨 Solo urgencias 24h',
      tooltip: 'Mostrar horarios regulares y 24h'
    });
  }
  
  if (chips.length === 0) {
    elements.activeFiltersBar.classList.add('hidden');
    elements.activeFilterChips.innerHTML = '';
  } else {
    elements.activeFiltersBar.classList.remove('hidden');
    elements.activeFilterChips.innerHTML = chips.map(chip => `
      <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 text-xs font-semibold shadow-2xs">
        <span>${escapeHtml(chip.label)}</span>
        <button 
          type="button" 
          onclick="window.clearSingleFilter('${chip.type}')" 
          class="w-4 h-4 rounded-full bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-100 flex items-center justify-center font-bold text-[10px] transition cursor-pointer"
          title="${escapeHtml(chip.tooltip)}"
          aria-label="${escapeHtml(chip.tooltip)}"
        >✕</button>
      </span>
    `).join('');
  }
}

function clearSingleFilter(type) {
  if (type === 'favorites') {
    state.onlyFavorites = false;
    updateFavoritesCountBadges();
  } else if (type === 'auxilioNocturno') {
    state.auxilioNocturno = false;
    updateAuxilioNocturnoUI();
  } else if (type === 'search') {
    state.searchQuery = '';
    if (elements.searchInput) elements.searchInput.value = '';
    if (elements.btnClearSearch) elements.btnClearSearch.classList.add('hidden');
  } else if (type === 'oficio') {
    state.selectedOficio = 'todos';
    if (elements.selectOficio) elements.selectOficio.value = 'todos';
  } else if (type === 'zona') {
    state.selectedZona = 'todas';
    if (elements.selectZona) elements.selectZona.value = 'todas';
  } else if (type === 'emergencias') {
    state.onlyEmergencias = false;
    if (elements.checkEmergencias) elements.checkEmergencias.checked = false;
  }
  applyFilters();
}

function applyQuickSearch(term) {
  state.searchQuery = term;
  if (elements.searchInput) {
    elements.searchInput.value = term;
    elements.searchInput.focus();
  }
  if (elements.btnClearSearch) {
    elements.btnClearSearch.classList.remove('hidden');
  }
  applyFilters();
  const cardsSec = document.getElementById('seccion-directorio');
  if (cardsSec) {
    cardsSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}


function updateResultsCount() {
  const count = state.filteredOficios.length;
  const total = state.oficios.length;
  
  // Actualizar contador en tiempo real en la tarjeta Bento Hero
  const statVerified = document.getElementById('stat-verified-count');
  if (statVerified) {
    statVerified.textContent = String(total);
  }

  const heroExploreText = document.getElementById('hero-explore-text');
  if (heroExploreText) {
    heroExploreText.textContent = total > 0 
      ? `Explorar mapa interactivo y directorio de ${total} oficios`
      : 'Explorar mapa interactivo y directorio comunitario';
  }

  if (count === 0) {
    elements.resultsCount.textContent = '0 oficios encontrados';
  } else if (count === 1) {
    elements.resultsCount.innerHTML = `Mostrando <strong class="text-zinc-900 dark:text-white font-bold">1</strong> oficio disponible`;
  } else if (count === total && !state.searchQuery && state.selectedOficio === 'todos' && state.selectedZona === 'todas' && !state.onlyEmergencias && !state.onlyFavorites && !state.auxilioNocturno) {
    elements.resultsCount.innerHTML = `Directorio con <strong class="text-zinc-900 dark:text-white font-bold">${total}</strong> oficios activos en Ahome`;
  } else {
    elements.resultsCount.innerHTML = `Mostrando <strong class="text-zinc-900 dark:text-white font-bold">${count}</strong> de ${total} oficios`;
  }
}

function updateResetButtonVisibility() {
  const hasActiveFilters = 
    state.searchQuery !== '' || 
    state.selectedOficio !== 'todos' || 
    state.selectedZona !== 'todas' || 
    state.onlyEmergencias ||
    state.onlyFavorites ||
    state.auxilioNocturno;

  if (hasActiveFilters) {
    elements.btnResetFilters.classList.remove('hidden');
  } else {
    elements.btnResetFilters.classList.add('hidden');
  }
}

function resetAllFilters() {
  state.searchQuery = '';
  state.selectedOficio = 'todos';
  state.selectedZona = 'todas';
  state.onlyEmergencias = false;
  state.onlyFavorites = false;
  state.auxilioNocturno = false;
  updateFavoritesCountBadges();
  updateAuxilioNocturnoUI();

  elements.searchInput.value = '';
  elements.btnClearSearch.classList.add('hidden');
  elements.selectOficio.value = 'todos';
  elements.selectZona.value = 'todas';
  elements.checkEmergencias.checked = false;

  applyFilters();
  if (state.map) {
    state.map.setView(AHOME_DEFAULT_CENTER, AHOME_DEFAULT_ZOOM, { animate: true });
  }
  showToast('Filtros restablecidos', '🔄');
}

// ============================================================================
// RENDERIZADO DE TARJETAS (CON SOPORTE DE FOTO)
// ============================================================================
const CARDS_PER_PAGE = 12;

function renderCards(list) {
  elements.cardsContainer.innerHTML = '';

  if (list.length === 0) {
    elements.cardsContainer.classList.add('hidden');
    elements.emptyState.classList.remove('hidden');

    const emptyTitle = elements.emptyState.querySelector('h3');
    const emptyDesc = elements.emptyState.querySelector('p');
    if (state.oficios.length === 0) {
      if (emptyTitle) emptyTitle.textContent = '¡Sé el primero en sumar tu oficio a Ahome!';
      if (emptyDesc) emptyDesc.textContent = 'El directorio cívico está listo. Registra tu taller, oficio o servicio de forma 100% gratuita para aparecer en el mapa y recibir clientes de tu colonia.';
    } else {
      if (emptyTitle) emptyTitle.textContent = 'No encontramos oficios con estos filtros';
      if (emptyDesc) emptyDesc.textContent = 'Intenta con otra palabra clave, selecciona "Todas las categorías" o elimina el filtro de zona.';
    }
    return;
  }

  elements.cardsContainer.classList.remove('hidden');
  elements.emptyState.classList.add('hidden');

  const fragment = document.createDocumentFragment();
  const visibleCount = state.cardsPage * CARDS_PER_PAGE;
  const itemsToRender = list.slice(0, visibleCount);

  itemsToRender.forEach(oficio => {
    const card = createCardElement(oficio);
    fragment.appendChild(card);
  });

  if (list.length > visibleCount) {
    const remaining = list.length - visibleCount;
    const loadMoreContainer = document.createElement('div');
    loadMoreContainer.className = 'col-span-full flex flex-col items-center justify-center pt-6 pb-2 space-y-2';
    loadMoreContainer.innerHTML = `
      <button 
        type="button" 
        onclick="window.loadMoreCards()" 
        class="px-6 py-3 bg-[#09090b] dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 font-mono font-bold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
        title="Cargar más oficios en la lista"
      >
        <span>Mostrar más prestadores (${remaining} restantes)</span>
        <span>▾</span>
      </button>
      <span class="text-[11px] text-zinc-400 font-mono">Mostrando ${visibleCount} de ${list.length} disponibles</span>
    `;
    fragment.appendChild(loadMoreContainer);
  }

  elements.cardsContainer.appendChild(fragment);
}

function loadMoreCards() {
  state.cardsPage++;
  renderCards(state.filteredOficios);
}

window.loadMoreCards = loadMoreCards;

function createCardElement(item) {
  const article = document.createElement('article');
  article.className = 'bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800 card-transition hover:border-zinc-400 dark:hover:border-zinc-600 hover:shadow-hover flex flex-col space-y-3.5 relative group transition-all duration-200 w-full';

  const icon = OFICIO_ICONS[item.oficio] || '🛠️';
  const rawPhone = String(item.telefono || '').replace(/\D/g, '');
  const displayPhone = rawPhone.length === 10 
    ? `${rawPhone.substring(0, 3)} ${rawPhone.substring(3, 6)} ${rawPhone.substring(6)}`
    : rawPhone;

  const waMessage = encodeURIComponent(`Hola ${item.nombre}, vi tu contacto en Oficios Ahome y me gustaría cotizar un trabajo contigo.`);
  const waUrl = `https://wa.me/52${rawPhone}?text=${waMessage}`;
  const telUrl = `tel:${rawPhone}`;

  const isFav = isFavorite(item.id);
  const destCoords = (typeof item.lat === 'number' && typeof item.lng === 'number')
    ? [item.lat, item.lng]
    : getBaseCoordsForZona(item.zona || 'Centro');
  const dirUrl = `https://www.google.com/maps/dir/?api=1&destination=${destCoords[0]},${destCoords[1]}`;

  const photos = getOficioPhotos(item);
  const enlaceTrabajosInfo = getEnlaceTrabajosInfo(item.enlaceTrabajos);

  let tagsHtml = '';
  if (item.palabrasClave && item.palabrasClave.length > 0) {
    const keywords = Array.isArray(item.palabrasClave)
      ? item.palabrasClave
      : item.palabrasClave.split(',').map(s => s.trim());
    
    tagsHtml = keywords.slice(0, 3).map(kw => `
      <span class="inline-block px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-950 dark:hover:text-white border border-zinc-200 dark:border-zinc-700 cursor-pointer transition" data-tag="${escapeHtml(kw)}">
        #${escapeHtml(kw)}
      </span>
    `).join(' ');
  }

  const emergencyBadge = item.emergencias
    ? `<span class="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border border-zinc-700 dark:border-zinc-300 shadow-2xs" title="Atiende urgencias fuera de horario">
         <span>🚨</span> Urgencias 24h
       </span>`
    : '';

  // Renderizado de Fotos en la Tarjeta
  let photoSection = '';
  if (photos.length > 0) {
    const mainPhoto = photos[0];
    const hasMultiplePhotos = photos.length > 1;

    photoSection = `
      <div class="relative -mt-1 mb-1">
        <!-- Foto Principal con Clic a Visor Completo -->
        <div 
          class="w-full h-44 sm:h-48 max-h-48 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-200 dark:border-zinc-800 relative group/img cursor-pointer shadow-soft"
          onclick="window.openLightbox('${escapeHtml(item.id)}', 0)"
          title="Toca para ver ${hasMultiplePhotos ? `las ${photos.length} fotos` : 'la foto'} en tamaño completo"
        >
          <img 
            src="${escapeHtml(mainPhoto)}" 
            alt="Trabajo de ${escapeHtml(item.nombre)}" 
            class="w-full h-full object-cover group-hover/img:scale-105 transition duration-300"
            loading="lazy"
            decoding="async"
          >
          <div class="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-80 group-hover/img:opacity-95 transition"></div>

          <!-- Badge de cantidad de fotos disponibles -->
          <span class="absolute top-2.5 left-2.5 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-black/85 text-white backdrop-blur-xs flex items-center gap-1.5 shadow-md border border-white/20">
            <span>📷</span> ${photos.length} ${photos.length === 1 ? 'foto disponible' : 'fotos disponibles'}
          </span>

          <!-- Badge de urgencias si aplica -->
          ${emergencyBadge ? `<span class="absolute top-2.5 right-2.5 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-black text-white border border-zinc-700 shadow-md">🚨 Urgencias 24h</span>` : ''}

          <!-- Botón flotante para ver en visor -->
          <div class="absolute bottom-2.5 right-2.5 bg-black/80 hover:bg-zinc-800 text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg backdrop-blur-xs transition flex items-center gap-1 shadow-sm font-mono border border-white/10">
            <span>🔍</span> Ampliar
          </div>
        </div>

        <!-- Tira rápida de todas las miniaturas si tiene más de 1 foto -->
        ${hasMultiplePhotos ? `
          <div class="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1 scrollbar-thin max-h-12">
            <span class="text-[10px] font-mono font-bold text-zinc-400 shrink-0 uppercase tracking-wider">Muestras:</span>
            ${photos.map((p, idx) => `
              <button 
                type="button" 
                onclick="window.openLightbox('${escapeHtml(item.id)}', ${idx})" 
                class="w-12 h-9 rounded-lg overflow-hidden shrink-0 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-900 dark:hover:border-white transition cursor-pointer relative group/thumb shadow-2xs"
                title="Ver foto ${idx + 1} de ${photos.length}"
              >
                <img src="${escapeHtml(p)}" alt="Muestra ${idx + 1}" class="w-full h-full object-cover group-hover/thumb:scale-110 transition" loading="lazy" decoding="async">
              </button>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }

  // Badge de distancia si está calculada
  let distanceBadge = '';
  if (typeof item.distanceKm === 'number' && !isNaN(item.distanceKm)) {
    const distText = item.distanceKm < 1.0 
      ? `🚶 A ${Math.round(item.distanceKm * 1000)} m`
      : `🚗 A ${item.distanceKm.toFixed(1)} km`;
    distanceBadge = `<span class="inline-flex items-center gap-1 text-[10.5px] font-mono font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 shrink-0 shadow-2xs" title="Distancia aproximada en línea recta">${distText}</span>`;
  }

  article.innerHTML = `
    <!-- Contenido Superior -->
    <div class="space-y-2.5">
      ${photoSection}

      <!-- Cabecera de Tarjeta: Oficio, Urgencias y Botón Favoritos -->
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-1.5 flex-wrap">
          <span class="inline-flex items-center gap-1 text-xs font-mono font-bold px-3 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 shadow-2xs">
            <span>${icon}</span>
            <span>${escapeHtml(item.oficio)}</span>
          </span>
          ${photos.length === 0 ? emergencyBadge : ''}
        </div>

        <!-- Botón Guardar en Favoritos -->
        <button 
          type="button" 
          onclick="window.toggleFavorite('${escapeHtml(item.id)}', event)"
          class="btn-fav-${escapeHtml(item.id)} p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition cursor-pointer shrink-0 shadow-2xs ${isFav ? 'text-amber-500' : 'text-zinc-400 hover:text-amber-500'}"
          title="${isFav ? 'Quitar de mis oficios de confianza' : 'Guardar en mis oficios de confianza'}"
          aria-label="Guardar oficio en favoritos"
        >
          ${isFav ? `
            <svg class="w-5 h-5 fill-amber-400 stroke-amber-500 scale-110 transition-transform" viewBox="0 0 24 24" stroke-width="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
          ` : `
            <svg class="w-5 h-5 fill-none stroke-current transition-transform" viewBox="0 0 24 24" stroke-width="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
          `}
        </button>
      </div>

      <!-- Nombre del Prestador / Taller -->
      <h3 class="text-base sm:text-lg font-extrabold text-zinc-950 dark:text-white hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer transition leading-snug line-clamp-2 font-heading" onclick="window.openFichaModal('${escapeHtml(item.id)}')">
        ${escapeHtml(item.nombre)}
      </h3>

      <!-- Ubicación, Ver en Mapa y Cómo Llegar -->
      <div class="flex items-center justify-between gap-2 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
        <div class="flex items-center gap-1.5 truncate">
          <svg class="w-4 h-4 text-zinc-700 dark:text-zinc-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          <span class="text-zinc-800 dark:text-zinc-200 font-semibold font-mono truncate">${escapeHtml(item.zona || 'Ahome')}</span>
          ${item.sindicatura ? `<span class="text-zinc-400 hidden sm:inline font-mono">• ${escapeHtml(item.sindicatura)}</span>` : ''}
          ${distanceBadge}
        </div>

        <div class="flex items-center gap-1.5 shrink-0">
          <button 
            type="button" 
            class="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 px-2.5 py-1 rounded-lg transition border border-zinc-200 dark:border-zinc-700 cursor-pointer shadow-2xs"
            onclick="focusWorkerOnMap('${escapeHtml(item.id)}')"
            title="Ver ubicación en el mapa de Ahome"
          >
            <span>📍</span> Mapa
          </button>
          
          <a 
            href="${dirUrl}"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 px-2.5 py-1 rounded-lg transition border border-zinc-200 dark:border-zinc-700 cursor-pointer shadow-2xs"
            title="Cómo llegar con Google Maps (Ruta paso a paso)"
            onclick="event.stopPropagation()"
          >
            <span>🧭</span> Ruta
          </a>
        </div>
      </div>

      <!-- Breve Descripción con tamaño bloqueado a 3 líneas -->
      <p class="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed pt-0.5 line-clamp-3" title="${escapeHtml(item.descripcion)}">
        ${escapeHtml(item.descripcion)}
      </p>

      <!-- Enlace a Redes Sociales / Presencia Digital -->
      ${enlaceTrabajosInfo ? `
        <div class="pt-1">
          <a 
            href="${escapeHtml(enlaceTrabajosInfo.url)}" 
            target="_blank" 
            rel="noopener noreferrer" 
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 transition shadow-2xs hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto"
            title="Visitar ${escapeHtml(enlaceTrabajosInfo.label)} de ${escapeHtml(item.nombre)}"
            onclick="event.stopPropagation()"
          >
            <span class="text-sm shrink-0">${enlaceTrabajosInfo.icon}</span>
            <span class="truncate">${escapeHtml(enlaceTrabajosInfo.btnText)}</span>
            <svg class="w-3.5 h-3.5 ml-auto sm:ml-1 opacity-70 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
          </a>
        </div>
      ` : ''}
    </div>

    <!-- Sección Inferior: Palabras Clave y Botones de Acción Directa -->
    <div class="space-y-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800">
      
      <!-- Chips de Palabras Clave -->
      ${tagsHtml ? `<div class="flex flex-wrap gap-1.5 max-h-12 overflow-hidden font-mono">${tagsHtml}</div>` : ''}

      <!-- Horario de atención -->
      ${item.horario ? `
        <div class="text-[11px] text-zinc-400 dark:text-zinc-500 flex items-center gap-1 font-mono">
          <svg class="w-3.5 h-3.5 text-zinc-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <span class="truncate">${escapeHtml(item.horario)}</span>
        </div>
      ` : ''}

      <!-- Llamada de Urgencia Destacada en Modo Auxilio Nocturno -->
      ${state.auxilioNocturno && item.emergencias ? `
        <a 
          href="${telUrl}" 
          class="w-full py-2.5 px-3 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-2 transition font-mono"
          title="Llamar urgentemente a ${escapeHtml(item.nombre)}"
        >
          <span class="text-base">🚨</span>
          <span>LLAMAR AHORA (URGENCIA 24H): ${displayPhone}</span>
        </a>
      ` : ''}

      <!-- Botón Único: Ver más detalles (Ficha completa en modal) -->
      <button 
        type="button" 
        onclick="window.openFichaModal('${escapeHtml(item.id)}')" 
        class="w-full py-2.5 px-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-950 dark:hover:text-white text-zinc-800 dark:text-zinc-200 font-mono font-bold rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
        title="Ver más detalles de este oficio"
      >
        <svg class="w-4 h-4 text-zinc-700 dark:text-zinc-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        <span>Ver ficha y fotos</span>
        ${photos.length > 0 ? `<span class="text-[10px] bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold px-2 py-0.5 rounded-full ml-1">📸 ${photos.length} fotos</span>` : ''}
      </button>

      <!-- Acciones Directas: WhatsApp y Llamar -->
      <div class="grid grid-cols-2 gap-2 pt-0.5">
        
        <!-- Botón Primario: WhatsApp en Alto Contraste Negro/Blanco -->
        <button 
          type="button" 
          onclick="window.openWhatsAppQuoteModal('${escapeHtml(item.id)}')" 
          class="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 rounded-xl text-xs font-black shadow-btn transition cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          title="Cotizar trabajo por WhatsApp con mensaje predeterminado"
        >
          <svg class="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
          </svg>
          <span>WhatsApp</span>
        </button>

        <!-- Botón Secundario: Llamar -->
        <a 
          href="${telUrl}" 
          class="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-xl text-xs font-bold border border-zinc-200 dark:border-zinc-700 shadow-2xs transition hover:scale-[1.02] active:scale-[0.98]"
          title="Llamar al teléfono directo"
        >
          <svg class="w-4 h-4 text-zinc-800 dark:text-zinc-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
          <span>Llamar</span>
        </a>

      </div>

      <!-- Barra de acciones secundarias -->
      <div class="flex items-center justify-between gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex-wrap">
        <div class="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
          <span class="font-mono font-medium">📞 ${displayPhone}</span>
          <button 
            type="button" 
            class="text-zinc-400 hover:text-zinc-950 dark:hover:text-white font-semibold transition py-0.5 px-1 flex items-center gap-1 cursor-pointer"
            onclick="copyToClipboard('${rawPhone}', '${escapeHtml(item.nombre)}')"
            title="Copiar número"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg>
            <span>Copiar</span>
          </button>
        </div>

        <div class="flex items-center gap-1.5 flex-wrap">
          <!-- Opción 3: Guardar en Contactos (.vcf) -->
          <button 
            type="button" 
            onclick="window.downloadVCard('${escapeHtml(item.id)}')" 
            class="inline-flex items-center gap-1 py-1 px-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-[11px] font-bold rounded-lg border border-zinc-200 dark:border-zinc-700 transition cursor-pointer shadow-2xs font-mono"
            title="Descargar contacto telefónico en tu celular (.vcf)"
          >
            <span>📇</span>
            <span>Guardar</span>
          </button>

          <!-- Botón Compartir por WhatsApp con 1 toque -->
          <button 
            type="button" 
            onclick="window.shareOficioViaWhatsApp('${escapeHtml(item.id)}')" 
            class="inline-flex items-center gap-1 py-1 px-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-[11px] font-bold rounded-lg border border-zinc-200 dark:border-zinc-700 transition cursor-pointer shadow-2xs shrink-0"
            title="Compartir por WhatsApp con un vecino o grupo"
          >
            <span>📲</span>
            <span>Compartir</span>
          </button>

          <!-- Botón Reportar Novedad / Número Inactivo -->
          <button 
            type="button" 
            onclick="window.reportOficioIssue('${escapeHtml(item.id)}', '${escapeHtml(item.nombre)}')" 
            class="inline-flex items-center gap-0.5 py-1 px-1.5 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 text-[10px] font-mono transition cursor-pointer"
            title="Reportar número fuera de servicio o dato incorrecto"
          >
            <span>⚠️</span>
          </button>
        </div>
      </div>

    </div>
  `;

  const tagElements = article.querySelectorAll('[data-tag]');
  tagElements.forEach(tagEl => {
    tagEl.addEventListener('click', (e) => {
      e.stopPropagation();
      const tag = tagEl.getAttribute('data-tag');
      elements.searchInput.value = tag;
      state.searchQuery = tag;
      elements.btnClearSearch.classList.remove('hidden');
      applyFilters();
      window.scrollTo({ top: elements.searchInput.offsetTop - 100, behavior: 'smooth' });
    });
  });

  return article;
}

// ============================================================================
// EVENT LISTENERS DE FILTROS Y FORMULARIOS
// ============================================================================
function initEventListeners() {
  
  // Búsqueda en tiempo real
  if (elements.searchInput) {
    elements.searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      if (state.searchQuery) {
        if (elements.btnClearSearch) elements.btnClearSearch.classList.remove('hidden');
      } else {
        if (elements.btnClearSearch) elements.btnClearSearch.classList.add('hidden');
      }
      applyFilters();
    });
  }

  // Limpiar búsqueda
  if (elements.btnClearSearch) {
    elements.btnClearSearch.addEventListener('click', () => {
      if (elements.searchInput) elements.searchInput.value = '';
      state.searchQuery = '';
      elements.btnClearSearch.classList.add('hidden');
      applyFilters();
      if (elements.searchInput) elements.searchInput.focus();
    });
  }

  // Select de Oficio
  if (elements.selectOficio) {
    elements.selectOficio.addEventListener('change', (e) => {
      state.selectedOficio = e.target.value;
      applyFilters();
    });
  }

  // Select de Zona
  if (elements.selectZona) {
    elements.selectZona.addEventListener('change', (e) => {
      state.selectedZona = e.target.value;
      applyFilters();
    });
  }

  // Checkbox de Emergencias
  if (elements.checkEmergencias) {
    elements.checkEmergencias.addEventListener('change', (e) => {
      state.onlyEmergencias = e.target.checked;
      applyFilters();
    });
  }

  // Botones reset
  if (elements.btnResetFilters) elements.btnResetFilters.addEventListener('click', resetAllFilters);
  if (elements.btnEmptyReset) elements.btnEmptyReset.addEventListener('click', resetAllFilters);
  if (elements.btnEmptyRegister) elements.btnEmptyRegister.addEventListener('click', openRegisterModal);

  // Apertura de modal de registro
  if (elements.btnOpenRegister) elements.btnOpenRegister.addEventListener('click', openRegisterModal);
  if (elements.btnQuickAddMobile) elements.btnQuickAddMobile.addEventListener('click', openRegisterModal);
  if (elements.btnFloatAdd) elements.btnFloatAdd.addEventListener('click', openRegisterModal);

  // Cierre de modal de registro
  if (elements.btnCloseModal) elements.btnCloseModal.addEventListener('click', closeRegisterModal);
  if (elements.modalRegister) {
    elements.modalRegister.addEventListener('click', (e) => {
      if (e.target === elements.modalRegister) closeRegisterModal();
    });
  }

  // Contador de caracteres en descripción
  if (elements.regDescripcion && elements.charCounter) {
    elements.regDescripcion.addEventListener('input', (e) => {
      const len = e.target.value.length;
      elements.charCounter.textContent = `${len}/150`;
      if (len > 140) {
        elements.charCounter.className = 'text-[11px] font-mono font-bold text-amber-600';
      } else {
        elements.charCounter.className = 'text-[11px] font-mono text-zinc-400';
      }
    });
  }

  // Envío del formulario "Suma tu oficio"
  if (elements.formRegister) {
    elements.formRegister.addEventListener('submit', handleRegisterSubmit);
  }

  // Formateo dinámico en vivo del teléfono (668 123 4567)
  if (elements.regTelefono) {
    elements.regTelefono.addEventListener('input', (e) => {
      e.target.value = formatLivePhoneNumber(e.target.value);
    });
  }



  // Cambio de zona en el formulario con actualización reactiva del mini-mapa
  if (elements.regZona) {
    elements.regZona.addEventListener('change', (e) => {
      const selected = e.target.value;
      if (!selected) {
        if (elements.regZonaHint) {
          elements.regZonaHint.textContent = 'El pin del mapa se ubicará de forma segura en esta zona.';
          elements.regZonaHint.className = 'text-[11px] text-zinc-400 mt-1';
        }
      } else {
        const base = getBaseCoordsForZona(selected);
        setPickerCoords(base[0], base[1], true);
        if (elements.regZonaHint) {
          let extraInfo = '';
          if (selected === 'Álamos Country' || selected === 'Fracc. Álamos Country') {
            extraInfo = ' (Sector Poniente / Mariano Escobedo, Blvd. Pedro Anaya y Las Norias)';
          } else if (selected === 'Los Álamos' || selected === 'Álamos') {
            extraInfo = ' (Sector Oriente / Blvd. Independencia y Las Mañanitas)';
          } else if (selected === 'Virreyes' || selected === 'Los Virreyes') {
            extraInfo = ' (Sector Poniente / Calle Virreyes y Blvd. Pedro Anaya)';
          }
          elements.regZonaHint.textContent = `📍 Ubicación base: ${selected}${extraInfo}. Puedes afinar el marcador en el mapa abajo.`;
          elements.regZonaHint.className = 'text-[11px] text-emerald-600 font-semibold mt-1';
        }
      }
    });
  }

  // Botón "Usar mi GPS"
  if (elements.btnRegUseGps) {
    elements.btnRegUseGps.addEventListener('click', () => {
      if (!navigator.geolocation) {
        alert('Tu navegador o dispositivo no soporta geolocalización por GPS. Puedes arrastrar el pin 📍 en el mapa.');
        return;
      }
      const originalHtml = elements.btnRegUseGps.innerHTML;
      elements.btnRegUseGps.innerHTML = '<span>⏳</span> Obteniendo GPS...';
      elements.btnRegUseGps.disabled = true;

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          elements.btnRegUseGps.innerHTML = originalHtml;
          elements.btnRegUseGps.disabled = false;
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setPickerCoords(lat, lng, true);
          if (elements.regZonaHint) {
            elements.regZonaHint.textContent = '🎯 ¡Ubicación exacta detectada mediante tu GPS!';
            elements.regZonaHint.className = 'text-[11px] text-emerald-700 font-bold mt-1';
          }
          showToast('Ubicación GPS detectada correctamente', '🎯');
        },
        (err) => {
          elements.btnRegUseGps.innerHTML = originalHtml;
          elements.btnRegUseGps.disabled = false;
          console.warn('Geolocation error:', err);
          alert('No se pudo obtener tu ubicación por GPS (asegúrate de otorgar permiso de ubicación). Puedes tocar el mapa o arrastrar el pin 📍 manualmente.');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }

  // Modal de Configuración
  if (elements.btnOpenSettings) elements.btnOpenSettings.addEventListener('click', openSettingsModal);
  if (elements.btnFooterSettings) elements.btnFooterSettings.addEventListener('click', openSettingsModal);
  if (elements.btnCloseSettings) elements.btnCloseSettings.addEventListener('click', closeSettingsModal);
  if (elements.modalSettings) {
    elements.modalSettings.addEventListener('click', (e) => {
      if (e.target === elements.modalSettings) closeSettingsModal();
    });
  }
  if (elements.btnSaveSettings) elements.btnSaveSettings.addEventListener('click', saveSettings);
  if (elements.btnResetCache) elements.btnResetCache.addEventListener('click', resetLocalCache);

  if (elements.btnFooterManifest) {
    elements.btnFooterManifest.addEventListener('click', () => {
      window.open('./manifest.json', '_blank');
    });
  }

  // Modal de Ficha del Oficio
  if (elements.btnCloseFicha) elements.btnCloseFicha.addEventListener('click', closeFichaModal);
  if (elements.modalFicha) {
    elements.modalFicha.addEventListener('click', (e) => {
      if (e.target === elements.modalFicha) closeFichaModal();
    });
  }

  // Modal de Visor de Fotos en Pantalla Completa (Lightbox)
  if (elements.btnCloseLightbox) elements.btnCloseLightbox.addEventListener('click', closeLightbox);
  if (elements.btnPrevLightbox) elements.btnPrevLightbox.addEventListener('click', prevLightboxPhoto);
  if (elements.btnNextLightbox) elements.btnNextLightbox.addEventListener('click', nextLightboxPhoto);
  if (elements.modalLightbox) {
    elements.modalLightbox.addEventListener('click', (e) => {
      if (e.target === elements.modalLightbox || e.target.id === 'modal-lightbox') {
        closeLightbox();
      }
    });
  }

  // Modal de Cotización por WhatsApp
  if (elements.btnCloseQuote) elements.btnCloseQuote.addEventListener('click', closeWhatsAppQuoteModal);
  if (elements.modalQuote) {
    elements.modalQuote.addEventListener('click', (e) => {
      if (e.target === elements.modalQuote) closeWhatsAppQuoteModal();
    });
  }
  if (elements.formQuote) {
    elements.formQuote.addEventListener('submit', (e) => {
      e.preventDefault();
      sendWhatsAppQuote(false);
    });
  }
  if (elements.btnSkipQuote) {
    elements.btnSkipQuote.addEventListener('click', () => {
      sendWhatsAppQuote(true);
    });
  }
  if (elements.quoteTrabajo) {
    elements.quoteTrabajo.addEventListener('input', updateQuotePreview);
  }
  if (elements.quoteColonia) {
    elements.quoteColonia.addEventListener('input', updateQuotePreview);
  }
  const urgenciaBtns = document.querySelectorAll('.quote-urgencia-btn');
  urgenciaBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const urg = btn.getAttribute('data-urgencia');
      if (urg) setQuoteUrgencia(urg);
    });
  });

  // Poblar datalist de zonas en el cotizador
  if (elements.quoteZonasList && typeof AHOME_ZONA_COORDS !== 'undefined') {
    const sortedZones = Object.keys(AHOME_ZONA_COORDS).sort((a, b) => a.localeCompare(b));
    elements.quoteZonasList.innerHTML = sortedZones.map(z => `<option value="${escapeHtml(z)}"></option>`).join('');
  }

  // Modal de Aviso de Privacidad y Términos Cívicos
  if (elements.btnFooterLegalModal) {
    elements.btnFooterLegalModal.addEventListener('click', () => openPrivacyTermsModal('tab-civica'));
  }
  if (elements.btnFooterPrivacy) {
    elements.btnFooterPrivacy.addEventListener('click', () => openPrivacyTermsModal('tab-privacidad'));
  }
  if (elements.btnFooterTerms) {
    elements.btnFooterTerms.addEventListener('click', () => openPrivacyTermsModal('tab-deslinde'));
  }
  if (elements.btnFooterArco) {
    elements.btnFooterArco.addEventListener('click', () => openPrivacyTermsModal('tab-arco'));
  }
  if (elements.btnOpenTermsInline) {
    elements.btnOpenTermsInline.addEventListener('click', () => openPrivacyTermsModal('tab-privacidad'));
  }
  if (elements.btnClosePrivacyTerms) {
    elements.btnClosePrivacyTerms.addEventListener('click', closePrivacyTermsModal);
  }
  if (elements.btnAcceptPrivacyTerms) {
    elements.btnAcceptPrivacyTerms.addEventListener('click', closePrivacyTermsModal);
  }
  if (elements.modalPrivacyTerms) {
    elements.modalPrivacyTerms.addEventListener('click', (e) => {
      if (e.target === elements.modalPrivacyTerms) closePrivacyTermsModal();
    });
  }

  // Modal Sobre Nosotros (PolyLab / Ramsses García)
  if (elements.btnOpenAbout) {
    elements.btnOpenAbout.addEventListener('click', openAboutModal);
  }
  if (elements.btnOpenAboutMobile) {
    elements.btnOpenAboutMobile.addEventListener('click', openAboutModal);
  }
  if (elements.btnCloseAbout) {
    elements.btnCloseAbout.addEventListener('click', closeAboutModal);
  }
  if (elements.btnAboutCloseAction) {
    elements.btnAboutCloseAction.addEventListener('click', closeAboutModal);
  }
  if (elements.modalAbout) {
    elements.modalAbout.addEventListener('click', (e) => {
      if (e.target === elements.modalAbout) closeAboutModal();
    });
  }

  // Pestañas dentro del Modal Legal
  const legalTabBtns = document.querySelectorAll('.legal-tab-btn');
  legalTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-target');
      if (target) switchLegalTab(target);
    });
  });

  // Teclado: Escape y Flechas para navegar por el visor de fotos
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeLightbox();
      closeFichaModal();
      closeWhatsAppQuoteModal();
      closeRegisterModal();
      closeSettingsModal();
      closePrivacyTermsModal();
      closeAboutModal();
    } else if (e.key === 'ArrowRight') {
      if (elements.modalLightbox && !elements.modalLightbox.classList.contains('hidden')) {
        nextLightboxPhoto();
      } else if (elements.modalFicha && !elements.modalFicha.classList.contains('hidden')) {
        nextFichaModalPhoto();
      }
    } else if (e.key === 'ArrowLeft') {
      if (elements.modalLightbox && !elements.modalLightbox.classList.contains('hidden')) {
        prevLightboxPhoto();
      } else if (elements.modalFicha && !elements.modalFicha.classList.contains('hidden')) {
        prevFichaModalPhoto();
      }
    }
  });
}

// ============================================================================
// SELECTOR INTERACTIVO DE UBICACIÓN (GPS + MINI-MAPA CON PIN ARRASTRABLE)
// ============================================================================
function setPickerCoords(lat, lng, updateView = false) {
  const roundedLat = Number(Number(lat).toFixed(6));
  const roundedLng = Number(Number(lng).toFixed(6));

  if (elements.regLat) elements.regLat.value = roundedLat;
  if (elements.regLng) elements.regLng.value = roundedLng;
  if (elements.regCoordsDisplay) {
    elements.regCoordsDisplay.textContent = `${roundedLat.toFixed(5)}, ${roundedLng.toFixed(5)}`;
  }
  if (state.pickerMarker) {
    state.pickerMarker.setLatLng([roundedLat, roundedLng]);
  }
  if (updateView && state.pickerMap) {
    state.pickerMap.setView([roundedLat, roundedLng], Math.max(state.pickerMap.getZoom(), 16), { animate: true });
  }
}

function initOrUpdateRegisterPickerMap() {
  if (!elements.regMapPicker) return;

  const currentLat = parseFloat(elements.regLat ? elements.regLat.value : '') || 25.7928;
  const currentLng = parseFloat(elements.regLng ? elements.regLng.value : '') || -108.9967;

  if (!state.pickerMap) {
    state.pickerMap = L.map(elements.regMapPicker, {
      zoomControl: true,
      attributionControl: false
    }).setView([currentLat, currentLng], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(state.pickerMap);

    const pickerIcon = L.divIcon({
      className: 'custom-picker-pin',
      html: `
        <div style="width:36px;height:48px;position:relative;cursor:grab;display:block;">
          <svg width="36" height="48" viewBox="0 0 36 48" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.5)); display:block;">
            <path d="M18 0C8.059 0 0 8.059 0 18C0 31.5 18 48 18 48C18 48 36 31.5 36 18C36 8.059 27.941 0 18 0Z" fill="#09090b"/>
            <path d="M18 2C9.163 2 2 9.163 2 18C2 30.2 18 45.2 18 45.2C18 45.2 34 30.2 34 18C34 9.163 26.837 2 18 2Z" fill="#27272a"/>
            <circle cx="18" cy="18" r="7" fill="#ffffff"/>
            <circle cx="18" cy="18" r="3.5" fill="#09090b"/>
          </svg>
        </div>
      `,
      iconSize: [36, 48],
      iconAnchor: [18, 48]
    });

    state.pickerMarker = L.marker([currentLat, currentLng], {
      icon: pickerIcon,
      draggable: true
    }).addTo(state.pickerMap);

    // Al arrastrar y soltar el pin
    state.pickerMarker.on('dragend', function (e) {
      const pos = e.target.getLatLng();
      setPickerCoords(pos.lat, pos.lng, false);
      if (elements.regZonaHint) {
        elements.regZonaHint.textContent = '📍 Coordenadas ajustadas manualmente con el pin.';
        elements.regZonaHint.className = 'text-[11px] text-emerald-600 font-semibold mt-1';
      }
    });

    // Al tocar en cualquier punto del mini-mapa
    state.pickerMap.on('click', function (e) {
      state.pickerMap.invalidateSize();
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      state.pickerMarker.setLatLng([lat, lng]);
      setPickerCoords(lat, lng, false);
      if (elements.regZonaHint) {
        elements.regZonaHint.textContent = '📍 Pin colocado en el punto tocado en el mapa.';
        elements.regZonaHint.className = 'text-[11px] text-emerald-600 font-semibold mt-1';
      }
    });
  } else {
    state.pickerMap.invalidateSize();
    state.pickerMarker.setLatLng([currentLat, currentLng]);
    state.pickerMap.setView([currentLat, currentLng], 15);
  }
}

// ============================================================================
// MANEJO DEL FORMULARIO "SUMA TU OFICIO"
// ============================================================================
function openRegisterModal() {
  elements.modalRegister.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');
  document.getElementById('reg-nombre').focus();

  // Si hay una zona preseleccionada en el formulario o en filtros, usar sus coordenadas iniciales
  const currentZona = elements.regZona ? elements.regZona.value : '';
  if (currentZona) {
    const base = getBaseCoordsForZona(currentZona);
    setPickerCoords(base[0], base[1], false);
  } else {
    setPickerCoords(25.7928, -108.9967, false);
  }

  setTimeout(() => {
    initOrUpdateRegisterPickerMap();
  }, 150);
  setTimeout(() => {
    if (state.pickerMap) state.pickerMap.invalidateSize();
  }, 350);
}

function closeRegisterModal() {
  elements.modalRegister.classList.add('hidden');
  document.body.classList.remove('overflow-hidden');
}

async function handleRegisterSubmit(e) {
  e.preventDefault();

  const formData = new FormData(elements.formRegister);

  // 1. Honeypot Anti-Spam: Si el campo oculto contiene datos, descartar silenciosamente
  const honeypot = (formData.get('empresa_verificacion') || '').trim();
  if (honeypot) {
    console.warn('[Anti-Spam] Registro descartado por honeypot.');
    closeRegisterModal();
    return;
  }

  const nombre = formData.get('nombre').trim();
  const oficio = formData.get('oficio');
  const zona = formData.get('zona').trim();
  const rawPhone = (formData.get('telefono') || '').replace(/\D/g, '');
  const cleanPhone = rawPhone.slice(-10);
  const descripcion = formData.get('descripcion').trim();
  const palabrasRaw = formData.get('palabrasClave') || '';
  const emergencias = formData.get('emergencias') === 'on';

  // Sanitización estricta de teléfono mexicano a 10 dígitos numéricos
  if (!/^[1-9][0-9]{9}$/.test(cleanPhone)) {
    alert('Por favor introduce un número de teléfono mexicano válido a 10 dígitos (ej. 668 123 4567).');
    return;
  }

  // Obtener fotos (hasta 5 fotos como máximo)
  const manualUrl = (formData.get('foto') || '').trim();
  const allPhotos = [...state.currentUploadedPhotos];
  if (manualUrl && !allPhotos.includes(manualUrl) && allPhotos.length < MAX_OFICIO_PHOTOS) {
    allPhotos.push(manualUrl);
  }
  const trimmedPhotos = allPhotos.slice(0, MAX_OFICIO_PHOTOS);
  const primaryFoto = trimmedPhotos[0] || '';

  const rawEnlaceTrabajos = (formData.get('enlaceTrabajos') || '').trim();
  const formattedEnlaceTrabajos = rawEnlaceTrabajos
    ? ((rawEnlaceTrabajos.startsWith('http://') || rawEnlaceTrabajos.startsWith('https://')) ? rawEnlaceTrabajos : `https://${rawEnlaceTrabajos}`)
    : '';

  const compromiso = formData.get('compromiso') === 'on';

  if (!compromiso) {
    alert('Por favor confirma el compromiso de responder los mensajes de los vecinos o solicitar tu baja temporal o permanente al WhatsApp 668 395 6301.');
    return;
  }

  const privacyTerms = formData.get('privacyTerms') === 'on';
  if (!privacyTerms) {
    alert('Por favor confirma que has leído y aceptas los Términos Cívicos, Deslinde y el Aviso de Privacidad (LFPDPPP).');
    return;
  }

  const palabrasClave = palabrasRaw
    ? palabrasRaw.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
    : [oficio.toLowerCase(), zona.toLowerCase()];

  // Obtener coordenadas exactas fijadas en el mini-mapa interactivo o GPS
  const latVal = parseFloat(formData.get('lat') || (elements.regLat ? elements.regLat.value : ''));
  const lngVal = parseFloat(formData.get('lng') || (elements.regLng ? elements.regLng.value : ''));

  let finalLat = latVal;
  let finalLng = lngVal;

  if (isNaN(finalLat) || isNaN(finalLng) || finalLat === 0) {
    const fallbackCoords = getBaseCoordsForZona(zona);
    finalLat = fallbackCoords[0];
    finalLng = fallbackCoords[1];
  }

  const nuevoOficio = {
    id: 'ahome-local-' + Date.now(),
    nombre: nombre,
    oficio: oficio,
    zona: zona,
    cobertura: `${zona} y alrededores`,
    telefono: cleanPhone,
    foto: primaryFoto,
    fotos: trimmedPhotos,
    enlaceTrabajos: formattedEnlaceTrabajos,
    descripcion: descripcion,
    palabrasClave: palabrasClave,
    emergencias: emergencias,
    horario: 'Lunes a Sábado',
    lat: Number(finalLat.toFixed(6)),
    lng: Number(finalLng.toFixed(6)),
    fechaRegistro: new Date().toISOString()
  };

  elements.btnSubmitRegister.disabled = true;
  elements.submitSpinner.classList.remove('hidden');
  elements.submitText.textContent = 'Enviando oficio para revisión...';

  // 1. Intentar enviar a Google Apps Script Webhook (Hoja 'Ingresos_Pendientes')
  const webhookUrl = localStorage.getItem(STORAGE_KEY_URL) || DEFAULT_SCRIPT_URL;
  let sentToWebhook = false;

  if (webhookUrl && navigator.onLine) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(nuevoOficio)
      });
      sentToWebhook = true;
      console.log('[Webhook] Oficio enviado a Google Sheets (Ingresos_Pendientes) exitosamente.');
    } catch (err) {
      console.warn('[Webhook] Error al enviar a Google Sheets:', err);
    }
  }

  elements.btnSubmitRegister.disabled = false;
  elements.submitSpinner.classList.add('hidden');
  elements.submitText.textContent = 'Enviar oficio para revisión gratis';
  elements.formRegister.reset();
  elements.charCounter.textContent = '0/150';
  state.currentUploadedPhotos = [];
  renderUploadedPhotosPreview();

  closeRegisterModal();

  // Mensaje claro de confirmación de revisión comunitaria (hasta 24 horas)
  showToast('¡Ficha recibida con éxito! Revisaremos tus datos y la publicaremos en el mapa lo antes posible (puede tardar hasta 24 horas).', '⏳', 7000);
}

// ============================================================================
// MODAL DE CONFIGURACIÓN Y MANTENIMIENTO
// ============================================================================
function openSettingsModal() {
  const currentUrl = localStorage.getItem(STORAGE_KEY_URL) || DEFAULT_SCRIPT_URL;
  elements.inputWebhookUrl.value = currentUrl;
  elements.modalSettings.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');
}

function closeSettingsModal() {
  elements.modalSettings.classList.add('hidden');
  document.body.classList.remove('overflow-hidden');
}

function saveSettings() {
  const newUrl = elements.inputWebhookUrl.value.trim();
  localStorage.setItem(STORAGE_KEY_URL, newUrl);
  closeSettingsModal();
  showToast('Configuración guardada correctamente', '⚙️');
  if (newUrl) loadOficiosData();
}

function resetLocalCache() {
  if (confirm('¿Deseas restablecer la lista de oficios a los datos predeterminados?')) {
    localStorage.removeItem(STORAGE_KEY_DATA);
    loadOficiosData();
    closeSettingsModal();
    showToast('Caché restablecida a valores iniciales', '🧹');
  }
}

// ============================================================================
// MODAL DE AVISO DE PRIVACIDAD, TÉRMINOS CÍVICOS Y DESLINDE LEGAL
// ============================================================================
function openPrivacyTermsModal(targetTabId = 'tab-civica') {
  if (!elements.modalPrivacyTerms) return;
  switchLegalTab(targetTabId);
  elements.modalPrivacyTerms.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');
}

function closePrivacyTermsModal() {
  if (!elements.modalPrivacyTerms) return;
  elements.modalPrivacyTerms.classList.add('hidden');
  document.body.classList.remove('overflow-hidden');
}

function switchLegalTab(targetTabId) {
  const tabButtons = document.querySelectorAll('.legal-tab-btn');
  const tabContents = document.querySelectorAll('.legal-tab-content');
  
  tabButtons.forEach(btn => {
    const target = btn.getAttribute('data-target');
    if (target === targetTabId) {
      btn.className = 'legal-tab-btn px-3 py-2 rounded-lg transition bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-2xs shrink-0 cursor-pointer font-bold';
    } else {
      btn.className = 'legal-tab-btn px-3 py-2 rounded-lg transition text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white shrink-0 cursor-pointer font-bold';
    }
  });

  tabContents.forEach(content => {
    if (content.id === targetTabId) {
      content.classList.remove('hidden');
    } else {
      content.classList.add('hidden');
    }
  });
}

// ============================================================================
// MODAL: SOBRE NOSOTROS (IDEA CIUDADANA POLYLAB / RAMSSES GARCÍA)
// ============================================================================
function openAboutModal() {
  if (!elements.modalAbout) return;
  elements.modalAbout.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');
}

function closeAboutModal() {
  if (!elements.modalAbout) return;
  elements.modalAbout.classList.add('hidden');
  document.body.classList.remove('overflow-hidden');
}

// ============================================================================
// UTILIDADES
// ============================================================================
function copyToClipboard(text, providerName) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(`Teléfono de ${providerName} copiado: ${text}`, '📋');
    }).catch(() => {
      prompt('Copia el número telefónico:', text);
    });
  } else {
    prompt('Copia el número telefónico:', text);
  }
}

function filterByQuickCategory(categoryName) {
  if (!categoryName) return;
  
  if (elements.selectOficio) {
    let matched = false;
    for (let opt of elements.selectOficio.options) {
      if (opt.value.toLowerCase() === categoryName.toLowerCase()) {
        elements.selectOficio.value = opt.value;
        state.selectedOficio = opt.value;
        matched = true;
        break;
      }
    }
    if (!matched) {
      state.selectedOficio = categoryName;
    }
  }

  // Limpiar búsqueda por texto libre si se elige categoría fija
  if (elements.searchInput) {
    elements.searchInput.value = '';
    state.searchQuery = '';
    if (elements.btnClearSearch) elements.btnClearSearch.classList.add('hidden');
  }

  applyFilters();

  const dirSection = document.getElementById('directorio');
  if (dirSection) {
    dirSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  showToast(`Filtrando por: ${categoryName}`, '⚡');
}

window.filterByQuickCategory = filterByQuickCategory;

function escapeHtml(string) {
  if (!string) return '';
  return String(string)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

window.escapeHtml = escapeHtml;

function downloadVCard(id) {
  const item = (state.oficios || []).find(o => String(o.id) === String(id));
  if (!item) return;

  const phone = String(item.telefono || '').replace(/\D/g, '');
  const vcard = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${item.nombre} - ${item.oficio}`,
    `N:${item.oficio};${item.nombre};;;`,
    `ORG:Oficios Ahome;${item.oficio}`,
    `TITLE:${item.oficio}`,
    `TEL;TYPE=CELL,VOICE:${phone}`,
    `ADR;TYPE=WORK:;;${item.zona};Los Mochis;Sinaloa;;México`,
    `NOTE:Contacto comunitario de Oficios Ahome. Servicios: ${item.descripcion || item.oficio}`,
    `URL:https://oficiosahome.org/?id=${encodeURIComponent(item.id)}`,
    'END:VCARD'
  ].join('\r\n');

  const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${item.nombre.replace(/[^a-zA-Z0-9]/g, '_')}_${item.oficio.replace(/[^a-zA-Z0-9]/g, '_')}.vcf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast(`Contacto de ${item.nombre} descargado en formato .vcf`, '📇');
}
window.downloadVCard = downloadVCard;

function shareOficioViaWhatsApp(id) {
  const item = (state.oficios || []).find(o => String(o.id) === String(id));
  if (!item) return;

  const phone = String(item.telefono || '').replace(/\D/g, '');
  const text = `🛠️ *${item.nombre}* (${item.oficio})\n📍 *Zona:* ${item.zona}\n📞 *WhatsApp:* https://wa.me/52${phone}\n\nEncontrado en el Directorio Cívico *Oficios Ahome*:\nhttps://oficiosahome.org/?id=${encodeURIComponent(item.id)}`;
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}
window.shareOficioViaWhatsApp = shareOficioViaWhatsApp;

function reportOficioIssue(id, nombre) {
  const text = `Hola Ramsses, quiero reportar una novedad o número inactivo en la ficha [${id}] - ${nombre} de Oficios Ahome.`;
  const url = `https://wa.me/526683956301?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}
window.reportOficioIssue = reportOficioIssue;

function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}
window.calculateDistanceKm = calculateDistanceKm;

// Atajo universal de teclado [/] para activar el buscador inteligente
document.addEventListener('keydown', (e) => {
  if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
    e.preventDefault();
    if (elements.searchInput) {
      elements.searchInput.focus();
      elements.searchInput.select();
    }
  }
});


