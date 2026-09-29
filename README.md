# Oficios Ahome 🛠️🇲🇽

> **Directorio cívico, mapa interactivo y plataforma comunitaria de código abierto para el Municipio de Ahome, Sinaloa.**  
> Conexión directa Persona a Persona (P2P) vía WhatsApp y llamada telefónica. Cero comisiones, cero intermediarios, acceso garantizado sin internet (PWA) y 100% gratuito para siempre.

Una iniciativa de software cívico e impacto social desarrollada por **[PolyLab Studio](https://polylab-web-cliente.onrender.com/)** — **Ramsses García** en Los Mochis, Sinaloa.

---

[![Live Demo](https://img.shields.io/badge/Web%20App-oficiosahome.netlify.app-00C7B7?style=for-the-badge&logo=netlify&logoColor=white)](https://oficiosahome.netlify.app/)
[![PWA Ready](https://img.shields.io/badge/PWA-Offline--First%20v3.1-10b981?style=for-the-badge&logo=pwa&logoColor=white)](https://oficiosahome.netlify.app/)
[![Zero Backend](https://img.shields.io/badge/Backend-Serverless%20Google%20Sheets-0284c7?style=for-the-badge&logo=google-sheets&logoColor=white)](https://sheets.new)
[![Open Source](https://img.shields.io/badge/License-MIT%20Civic-64748b?style=for-the-badge&logo=open-source-initiative&logoColor=white)](./LICENSE)
[![Tests Passing](https://img.shields.io/badge/Tests-23%2F23%20Passed%20(100%25)-16a34a?style=for-the-badge)](./test_coords.js)
[![Coverage](https://img.shields.io/badge/Coverage-7%20Sindicaturas%20%2B%20150%2B%20Zonas-090a0f?style=for-the-badge)](./oficios.json)

---

## 🔬 Acerca de PolyLab

**PolyLab** es un estudio mexicano independiente de **diseño, fabricación e impresión artística en 3D**, nacido en Los Mochis, Sinaloa. No es un servicio de maquila de modelos descargados ni una tienda de souvenirs: es una **marca de diseño contemporáneo** que utiliza la fabricación digital para crear objetos que combinan **arte, funcionalidad, geometría, tecnología y estética**.

> *“Un lugar donde creamos cosas para mundos que aún no existen.”*

**Oficios Ahome** nace como el brazo de **responsabilidad social y tecnología cívica** de PolyLab: aplicamos exactamente el mismo rigor de ingeniería, diseño editorial y optimización de producto que usamos en el laboratorio para construir herramientas digitales útiles y gratuitas que beneficien a nuestro municipio.

---

## ✨ Características Principales

### 🗺️ 1. Mapa Cívico Interactivo con Agrupamiento Inteligente
- **OpenStreetMap + Leaflet.js:** Cero costos de API keys (sin Google Maps API).
- **Marker Clustering (`Leaflet.markercluster`):** Agrupa automáticamente los 288 oficios en burbujas numéricas interactivas para evitar saturación de pantalla al hacer zoom out.
- **Distribución Orbital Anti-Superposición:** Distribuye a los trabajadores de una misma colonia en radios calculados mediante trigonometría para que ningún pin tape a otro.
- **Selector de Ubicación con Pin Arrastrable & GPS:** Permite a nuevos trabajadores posicionar su taller o cobertura con precisión métrica.

### ⚡ 2. Modo Sin Conexión Garantizado (PWA Offline)
- **Service Worker v3.1 + CacheStorage:** Guarda la base de datos completa (`oficios.json`) y la interfaz en el almacenamiento local del teléfono.
- **Llamadas Celulares Directas sin Datos:** Si te quedas sin megas en la calle o hay fallas de red, puedes abrir la app y presionar **"Llamar"** para comunicarte por la red celular tradicional (GSM/VoLTE).

### 💬 3. Trato Directo Persona a Persona (P2P)
- **Cero comisiones ni intermediarios:** El precio, alcance y pago se acuerdan directamente entre cliente y prestador.
- **Generador de Mensajes Claros de Cotización:** Modal con 3 casillas interactivas (¿Qué necesitas reparar?, Colonia/Ubicación, ¿Para cuándo?) que compila un mensaje de WhatsApp claro, educado y listo para enviar.

### 📇 4. Guardar en Contactos (vCard 3.0 Offline)
- Genera dinámicamente archivos `.vcf` en memoria del navegador (`Blob`) para añadir al plomero, electricista o cerrajero a la agenda nativa del celular con un solo toque.

### 🖨️ 5. Carteles Comunitarios Imprimibles con Código QR
- Generador de pósteres vecinales para pegar en tiendas de abarrotes, postes o casetas.
- Integra `qrcode.min.js` localmente para funcionar 100% sin internet. Estilos `@media print` optimizados en alto contraste y blanco/negro.

### 🚨 6. Modo Auxilio Nocturno 24 Horas
- Filtro de un solo toque que aísla de inmediato a prestadores con disponibilidad de urgencias nocturnas (fugas de agua, cortos eléctricos, cerrajería automotriz).

### ⭐ 7. Mis Oficios de Confianza (Favoritos)
- Sistema de guardado local persistente en `localStorage` para tener a la mano a tus trabajadores recomendados sin necesidad de crear cuentas.

### 🌙 8. Modo Oscuro & Diseño PolyLab Studio
- Paleta neutra inspirada en papel de estudio (`#fcfbf9`), negro brutalista (`#090a0f`) y verde esmeralda (`#164e37`).
- Filtro nocturno con inversión de teselas en el mapa para ahorro de batería en pantallas OLED.

---

## 📁 Estructura del Repositorio

```text
Barrio/
├── index.html               # Directorio principal, mapa Leaflet y buscador
├── sobre-nosotros.html      # Historia, manifiesto PolyLab y narrativa en 1ª persona
├── terminos-y-privacidad.html # Marco legal cívico, deslinde y Derechos ARCO (LFPDPPP)
├── app.js                   # Lógica reactiva PWA, geolocalización, clustering y filtros
├── sw.js                    # Service Worker para funcionamiento sin conexión
├── manifest.json            # Manifiesto PWA para instalación en Android, iOS y PC
├── oficios.json             # Base de datos local (288 oficios en 7 sindicaturas)
├── google-apps-script.js    # Webhook serverless para sincronización con Google Sheets
├── qrcode.min.js            # Librería local para generación de códigos QR offline
├── server.js                # Servidor HTTP local ligero en Node.js (desarrollo)
├── test_coords.js           # Suite de pruebas automatizadas (23 suites de validación)
├── icons/                   # Iconografía vectorial y resoluciones PWA (192px, 512px)
└── images/                  # Activos de marca e imágenes de referencia
```

---

## 🚀 Cómo Ejecutar en Local

No requiere compiladores pesados ni dependencias externas:

### Opción 1: Con Node.js (Servidor incluido)
```bash
node server.js
```
Abre en tu navegador: `http://localhost:3000`

### Opción 2: Con Python
```bash
python -m http.server 8000
```
Abre en tu navegador: `http://localhost:8000`

### Opción 3: Con Live Server de VS Code
Haz clic derecho en `index.html` ➔ **"Open with Live Server"**.

---

## 🧪 Ejecución de Pruebas Automatizadas

El proyecto incluye 23 suites de pruebas que validan coordenadas geográficas, resolución de sinónimos barriales, sintaxis JSON, Service Worker y componentes UI:

```bash
node test_coords.js
```

**Resultado esperado:**
```text
✓ oficios.json parsed successfully (288 oficios)
✓ Loaded 169 zones in AHOME_ZONA_COORDS
✓ All Álamos Country variations resolve to exact [25.7805, -109.0215]
✓ WhatsApp contact section (668 395 6301) verified
✓ Generador de mensaje claro para cotización verificado
✓ Modo sin conexión garantizado (Offline Cache) verificado
✓ Selector Interactivo de Ubicación verificado
✓ Cálculo de Distancia Real (Fórmula Haversine) verificado
✓ 📇 Guardar en Contactos (Opción 3) verificado
✓ 🖨️ Cartel Comunitario Imprimible con QR (Opción 5) verificado
✓ 🚨 Modo Auxilio Nocturno 24h (Opción 6) verificado
✓ 🌙 Modo Oscuro y Ahorro de Batería (Opción 8) verificado
✓ 💡 Sobre Nosotros (sobre-nosotros.html & PolyLab Studio Aesthetic) verificado

======================================================
ALL 23 TEST SUITES PASSED PERFECTLY (100%)!
======================================================
```

---

## 🌐 Cómo Publicar en Internet (100% Gratis)

### A. Netlify Drop (La más rápida: 10 segundos)
1. Entra a **[app.netlify.com/drop](https://app.netlify.com/drop)**.
2. Arrastra la carpeta completa del proyecto `Barrio`.
3. Tu sitio quedará publicado de inmediato con HTTPS gratuito (ej. `https://oficios-ahome.netlify.app`).

### B. GitHub Pages (Recomendado para código abierto)
1. Crea un repositorio en GitHub (ej. `oficios-ahome`).
2. Sube tus archivos (`git push origin main`).
3. En el repositorio ve a **Settings** ➔ **Pages** ➔ Selecciona la rama `main` y la carpeta `/ (root)`.

### C. Cloudflare Pages
1. Entra a **[pages.cloudflare.com](https://pages.cloudflare.com/)**.
2. Conecta tu repositorio o sube la carpeta para despliegue global ultrarrápido con ancho de banda ilimitado.

---

## 📊 Conexión con Google Sheets (Base de Datos Gratuita)

Para que las altas del formulario *"Sumar oficio"* se guarden en una hoja de Google Sheets en tiempo real:

1. Crea una hoja en [Google Sheets](https://sheets.new).
2. Ve a **Extensiones** ➔ **Apps Script**.
3. Pega el código de [`google-apps-script.js`](./google-apps-script.js).
4. Ejecuta la función `initialSetup` para crear encabezados automáticos.
5. Haz clic en **Implementar** ➔ **Nueva implementación** (Tipo: *Aplicación web*, Acceso: *Cualquier usuario*).
6. Copia la URL terminada en `/exec`.
7. En la app web de Oficios Ahome, toca el ícono de engranaje de configuración y pega tu URL de Apps Script.

---

## 🔍 Auditoría Técnica, Privacidad y Seguridad

La plataforma fue diseñada bajo el principio de **transparencia técnica radical** (*Verifiable & Auditable Civic Tech*). Cualquier desarrollador, auditor de seguridad, autoridad o ciudadano puede verificar de forma independiente los siguientes compromisos en el código fuente:

### 1. Auditoría de Red y Cero Rastreadores (Zero-Tracking / Zero-Adware)
- **Sin scripts de vigilancia comercial:** La plataforma **no contiene** Google Analytics, Facebook Pixel, Hotjar, TikTok SDKs ni ninguna librería de rastreo o telemetría invasiva.
- **Verificación en tiempo real:** Al abrir las herramientas de desarrollador (`F12` ➔ pestaña *Network* o *Red*), se puede comprobar que la aplicación únicamente solicita recursos locales y las teselas cartográficas abiertas de OpenStreetMap.

### 2. Principio de Minimización de Datos (LFPDPPP)
- En estricto cumplimiento con la **Ley Federal de Protección de Datos Personales en Posesión de los Particulares**:
  - **No se recaban domicilios particulares íntimos:** Únicamente la colonia o sindicatura de cobertura comercial.
  - **No se solicitan credenciales bancarias ni RFC/CURP.**
  - **Cero comercialización:** Los datos registrados jamás se venderán, alquilarán ni transferirán a bases de datos publicitarias ni despachos de cobranza.

### 3. Procesamiento 100% en el Lado del Cliente (Client-Side Privacy)
- **Generación de vCard (.vcf):** Se compila directamente en la memoria RAM del navegador del usuario mediante JavaScript (`Blob`), sin pasar por ningún servidor intermediario.
- **Generación de Códigos QR:** Se procesa de forma nativa en el dispositivo con la librería local `qrcode.min.js`, garantizando funcionamiento sin internet y privacidad total.

### 4. Auditoría de Rendimiento y Accesibilidad (Web Vitals)
- **Tiempo de carga inicial:** < 400 ms en redes 4G estándar.
- **Tamaño de transferencia:** < 180 KB (gzip).
- **Compatibilidad universal:** Diseñada para ejecutarse con fluidez en teléfonos Android de gama de entrada, tablets, computadoras y dispositivos iOS.

### 5. Suite de Pruebas Automatizadas (23 Tests Integrados)
El archivo [`test_coords.js`](./test_coords.js) ejecuta 23 suites de pruebas automatizadas que auditan:
- Coordenadas e integridad de los 288 oficios en formato JSON.
- Mapeo y resolución geográfica de las 152 colonias, fraccionamientos y sindicaturas de Ahome.
- Fórmulas trigonométricas de separación orbital de pines y cálculo de distancia real Haversine.
- Caché del Service Worker y almacenamiento offline.

---

## 🏛️ Autoría, Créditos y Reconocimientos

### 🚀 Dirección, Arquitectura y Desarrollo Principal
- **Creador y Desarrollador:** **[Ramsses García](mailto:gmramgarcia@gmail.com)** — Fundador y Diseñador Principal en PolyLab.
- **Estudio de Diseño:** **[PolyLab Studio](https://polylab-web-cliente.onrender.com/)** — Estudio mexicano independiente de diseño, fabricación aditiva e innovación digital, con sede en Los Mochis, Sinaloa, México.

---

### 📦 Tecnologías y Bibliotecas de Código Abierto (Open Source)
Oficios Ahome se construye sobre los hombros de grandes proyectos de la comunidad mundial de software libre:

| Tecnología / Recurso | Autoría / Proyecto | Licencia | Uso en el Proyecto |
| :--- | :--- | :--- | :--- |
| **OpenStreetMap** | © OpenStreetMap contributors | Open Database License (ODbL) | Cartografía comunitaria abierta sin costos de API |
| **Leaflet.js** | Vladimir Agafonkin & Contributors | BSD 2-Clause | Renderizado e interactividad del mapa cívico |
| **Leaflet.markercluster** | Dave Leaver & Contributors | MIT License | Agrupación inteligente y escalabilidad de 288+ pines |
| **Tailwind CSS** | Tailwind Labs Inc. | MIT License | Sistema de diseño atómico y responsivo |
| **QRCode.js** | David Shim (davidshimjs) | MIT License | Generación offline de códigos QR para carteles |
| **Space Grotesk** | Florian Karsten | SIL Open Font License | Tipografía de visualización y títulos del estudio |
| **JetBrains Mono** | JetBrains s.r.o. | Apache License 2.0 | Tipografía monoespaciada para metadatos y coordenadas |
| **Inter** | Rasmus Andersson | SIL Open Font License | Tipografía para lectura de textos y fichas de oficio |

---

### 🤝 Agradecimientos Comunitarios
- **A las maestras y maestros de oficios de Ahome:** Plomeros, electricistas, albañiles, carpinteros, cerrajeros, soldadores, herreros, mecánicos y jardineros de Los Mochis, Topolobampo, Villa de Ahome, Higuera de Zaragoza, San Miguel Zapotitlán, El Guayabo y El Carrizo, cuyo trabajo sostiene todos los días a nuestras familias y hogares.
- **A la comunidad de software cívico de México y Latinoamérica:** Por inspirar herramientas que demuestran que la tecnología puede y debe ser un bien común al servicio de la gente.

---

## 📜 Declaración de Independencia y Deslinde

**Iniciativa Ciudadana Independiente:** Oficios Ahome es un proyecto autónomo de software libre y beneficio social impulsado por **PolyLab**. No forma parte, no representa ni recibe financiamiento del H. Ayuntamiento de Ahome ni de ninguna dependencia gubernamental o partido político.

---

## ⚖️ Licencia de Software

El código fuente de esta plataforma se distribuye bajo la **[Licencia MIT (MIT License)](./LICENSE)**:

```text
Copyright (c) 2025-2026 Ramsses García / POLYLAB

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```
