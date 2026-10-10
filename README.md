# Oficios Ahome 🛠️🇲🇽

> [Español](#oficios-ahome-️) | [English](#oficios-ahome---english-overview)

---

> **Directorio cívico, mapa interactivo y plataforma comunitaria de código abierto para el Municipio de Ahome, Sinaloa.**  
> Conexión directa Persona a Persona (P2P) vía WhatsApp y llamada telefónica. Cero comisiones, cero intermediarios, acceso garantizado sin internet (PWA) y 100% gratuito para siempre.

Una iniciativa de software cívico e impacto social desarrollada por **[PolyLab Studio](https://polylab-web-cliente.onrender.com/)** — **Ramsses García** en Los Mochis, Sinaloa.

---

[![Dominio Oficial](https://img.shields.io/badge/Web%20App-oficiosahome.online-09090B?style=for-the-badge&logo=google-chrome&logoColor=white)](https://oficiosahome.online/)
[![GitHub Pages](https://img.shields.io/badge/Hosted%20on-GitHub%20Pages-09090B?style=for-the-badge&logo=github&logoColor=white)](https://oficiosahome.online/)
[![OSI MIT License](https://img.shields.io/badge/License-MIT%20(OSI)-09090B?style=for-the-badge&logo=open-source-initiative&logoColor=white)](./LICENSE)
[![Contributor Covenant](https://img.shields.io/badge/Code%20of%20Conduct-v2.1-09090B?style=for-the-badge)](./CODE_OF_CONDUCT.md)
[![PWA Ready](https://img.shields.io/badge/PWA-Offline--First%20v6.0-09090B?style=for-the-badge&logo=pwa&logoColor=white)](https://oficiosahome.online/)
[![Zero Backend](https://img.shields.io/badge/Backend-Serverless%20Google%20Sheets-27272A?style=for-the-badge&logo=google-sheets&logoColor=white)](https://sheets.new)
[![Data Quality](https://img.shields.io/badge/Oficios%20Verificados-288%20(100%25)-09090B?style=for-the-badge)](./scripts/validate-data.js)

---

## 🔬 Acerca de PolyLab Studio

**PolyLab** es un estudio mexicano independiente de **diseño, fabricación aditiva y software cívico**, nacido en Los Mochis, Sinaloa. No nos entendemos como un simple servicio de impresión ni como una tienda genérica de souvenirs: somos una **marca de diseño contemporáneo** que utiliza la tecnología para crear objetos y soluciones que combinan **arte, funcionalidad, geometría y estética**.

> *“Un lugar donde creamos cosas para mundos que aún no existen.”*

**Oficios Ahome** nace como el brazo de **responsabilidad social y tecnología cívica** de PolyLab: aplicamos exactamente el mismo rigor de ingeniería, diseño editorial monocromático y optimización de producto que usamos en el laboratorio para construir herramientas digitales útiles y gratuitas que beneficien a nuestro municipio.

---

## ✨ Características Principales de la Plataforma

### 🗺️ 1. Mapa Cívico Interactivo con Agrupamiento Inteligente
- **OpenStreetMap + Leaflet.js:** Cero costos de API keys (sin Google Maps API).
- **Marker Clustering (`Leaflet.markercluster`):** Agrupa automáticamente los 288 oficios en burbujas numéricas interactivas para evitar saturación de pantalla al hacer zoom out.
- **Distribución Orbital Anti-Superposición:** Distribuye a los trabajadores de una misma colonia en radios calculados mediante trigonometría para que ningún marcador tape a otro.
- **Selector de Ubicación con Pin Arrastrable & GPS:** Permite a nuevos trabajadores posicionar su taller o cobertura con precisión métrica.

### ⚡ 2. Modo Sin Conexión Garantizado (PWA Offline v4.0)
- **Service Worker con Estrategia Stale-While-Revalidate:** Guarda la base de datos completa (`oficios.json`), todas las páginas y fotos en el almacenamiento local del teléfono.
- **Llamadas Celulares Directas sin Datos:** Si te quedas sin megas en la calle o hay fallas de red, puedes abrir la app y presionar **"Llamar"** para comunicarte por la red celular tradicional (GSM/VoLTE).

### 🛡️ 3. Validación y Sincronización Manual Controlada
- **Revisión y Aprobación 1 a 1:** Ningún oficio se publica automáticamente. Todos los registros entran a la hoja de staging para ser validados por el administrador.
- **Sincronización Bajo Demanda:** El flujo de GitHub Actions se ejecuta de forma manual (`workflow_dispatch`) o mediante `sync.bat` únicamente cuando hay cambios verificados.

### 💬 4. Trato Directo Persona a Persona (P2P)
- **Cero comisiones ni intermediarios:** El precio, alcance y pago se acuerdan directamente entre cliente y prestador.
- **Compartir por WhatsApp con 1 Toque:** Enlace directo con formato enriquecido para recomendar trabajadores a vecinos y familiares.

### 📇 5. Guardar en Contactos (vCard 3.0 Offline)
- Genera dinámicamente archivos `.vcf` en memoria del navegador (`Blob`) para añadir al plomero, electricista o cerrajero a la agenda nativa del celular con un solo toque.

### 🖨️ 6. Carteles Comunitarios Imprimibles con Código QR
- Generador de pósteres vecinales para pegar en tiendas de abarrotes, postes o casetas.
- Integra `qrcode.min.js` localmente para funcionar 100% sin internet. Estilos `@media print` optimizados en alto contraste y blanco/negro.

### 🚨 7. Modo Auxilio Nocturno 24 Horas
- Filtro de un solo toque que aísla de inmediato a prestadores con disponibilidad de urgencias nocturnas (fugas de agua, cortos eléctricos, cerrajería automotriz).

### ⭐ 8. Mis Oficios de Confianza (Favoritos)
- Sistema de guardado local persistente en `localStorage` para tener a la mano a tus trabajadores recomendados sin necesidad de crear cuentas.

---

## 📁 Estructura del Repositorio

```text
Barrio/
├── .github/
│   ├── workflows/
│   │   └── sync-sheets.yml      # Sincronización controlada con GitHub Actions
│   └── ISSUE_TEMPLATE/          # Plantillas de reporte de número inactivo y propuesta de oficios
├── scripts/
│   └── validate-data.js         # Validador de calidad y esquema de datos (Linter)
├── index.html                   # Directorio principal, mapa Leaflet y buscador
├── sobre-nosotros.html          # Historia, manifiesto PolyLab y narrativa en 1ª persona
├── terminos-y-privacidad.html   # Marco legal cívico, deslinde y Derechos ARCO (LFPDPPP)
├── app.js                       # Lógica reactiva PWA, geolocalización, clustering y filtros
├── sw.js                        # Service Worker v4.0 para funcionamiento sin conexión
├── manifest.json                # Manifiesto PWA para instalación en Android, iOS y PC
├── oficios.json                 # Base de datos local (288 oficios en 7 sindicaturas)
├── google-apps-script.js        # Webhook serverless para sincronización con Google Sheets
├── CODE_OF_CONDUCT.md           # Código de Conducta bilingüe (Contributor Covenant 2.1)
├── LICENSE                      # Licencia MIT aprobada por la OSI
├── CNAME                        # Dominio personalizado oficial (oficiosahome.online)
├── robots.txt                   # Directivas para motores de búsqueda y Googlebot
├── sitemap.xml                  # Mapa del sitio para indexación SEO
├── qrcode.min.js                # Librería local para generación de códigos QR offline
├── server.js                    # Servidor HTTP local ligero en Node.js (desarrollo)
├── icons/                       # Iconografía vectorial y resoluciones PWA (192px, 512px)
└── images/                      # Activos de marca y fotografías reales de oficios
```

---

## 🚀 Cómo Ejecutar en Local

No requiere frameworks pesados ni dependencias complejas:

### Opción 1: Con Node.js (Servidor incluido)
```bash
node server.js
```
Abre en tu navegador: `http://localhost:3000`

### Opción 2: Validar calidad de la base de datos
```bash
node scripts/validate-data.js
```

---

## 🤝 Código de Conducta

Este proyecto se rige por el estándar **Contributor Covenant v2.1** para garantizar un entorno seguro, respetuoso, inclusivo y libre de acoso para toda la comunidad de desarrollo y usuarios. Puedes consultar el documento completo en [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).

---

## 🌐 Infraestructura & Código Abierto

Este proyecto cívico y sin fines de lucro está alojado y desplegado gracias al programa de soporte para código abierto de **[Netlify](https://www.netlify.com)**:

[![Deploys by Netlify](https://www.netlify.com/v3/img/components/netlify-color-accent.svg)](https://www.netlify.com)

---

## 📄 Licencia y Naturaleza Cívica (Uso No Comercial)

Este proyecto es una iniciativa de **software cívico y beneficio comunitario sin fines de lucro** desarrollada por **Ramsses García (PolyLab)**. 

Se distribuye bajo la **[Licencia MIT](./LICENSE)** (aprobada por la **Open Source Initiative - OSI**). Es de uso libre y gratuito para la comunidad, auditoría pública y réplica solidaria en otros municipios.

---
---

# Oficios Ahome - English Overview

> **Civic directory, interactive map, and open-source community platform for the Municipality of Ahome, Sinaloa, Mexico.**  
> Direct Person-to-Person (P2P) connection via WhatsApp and phone calls. Zero commissions, zero middlemen, guaranteed offline access (PWA), and 100% free forever.

A civic technology and social impact initiative developed by **[PolyLab Studio](https://polylab-web-cliente.onrender.com/)** — **Ramsses García** in Los Mochis, Sinaloa.

---

## 🔬 About PolyLab Studio

**PolyLab** is an independent Mexican design, additive manufacturing, and civic software studio based in Los Mochis, Sinaloa. We view our work not as a generic 3D printing shop or souvenir maker, but as a **contemporary design brand** leveraging technology to create solutions combining **art, function, geometry, and aesthetics**.

> *“A place where we create things for worlds that do not yet exist.”*

**Oficios Ahome** is PolyLab's **civic tech and social responsibility** flagship: we apply the exact same engineering rigor, monochromatic editorial design, and performance optimizations we use in our physical studio to build useful, open digital public goods for our local community.

---

## ✨ Key Platform Features

### 🗺️ 1. Interactive Civic Map with Smart Clustering
- **OpenStreetMap + Leaflet.js:** Zero proprietary API key fees (no Google Maps API dependency).
- **Marker Clustering (`Leaflet.markercluster`):** Automatically groups workers into numerical bubbles to prevent screen clutter during zoom-out.
- **Anti-Collision Orbital Distribution:** Spatially separates workers within the same neighborhood using trigonometric radius distribution.
- **Location Selector with Draggable Pin & GPS:** Empowers new tradespeople to position their workshops or service coverage with sub-meter accuracy.

### ⚡ 2. Guaranteed Offline Access (PWA Offline v4.0)
- **Service Worker with Stale-While-Revalidate:** Caches the full database (`oficios.json`), HTML views, assets, and photos directly on the user's mobile device.
- **Direct Cellular Calls without Mobile Data:** If a user runs out of cellular data on the street, they can open the app offline and tap **"Call"** via standard GSM/VoLTE cellular networks.

### 🛡️ 3. Controlled Manual Review & Synchronization
- **1-on-1 Manual Approval:** No listing is automatically published. Every submission enters an administrative staging sheet for human review.
- **On-Demand Synchronization:** GitHub Actions sync runs on-demand via `workflow_dispatch` or the local `sync.bat` script only when changes are confirmed.

### 💬 4. Direct Person-to-Person (P2P) Deals
- **Zero commissions or transaction fees:** Scope, quotes, and payment terms are negotiated directly between the resident and the worker.
- **1-Tap WhatsApp Sharing:** Pre-formatted message sharing to easily recommend trusted plumbers, electricians, or locksmiths to neighbors and family.

### 📇 5. Save to Contacts (vCard 3.0 Offline)
- Dynamically creates `.vcf` files in the browser (`Blob`) to save contact details directly to the device's native address book with one tap.

### 🖨️ 6. Printable Community Posters with Offline QR
- Poster generator for physical bulletin boards in corner stores, gates, and community kiosks.
- Bundles `qrcode.min.js` locally for 100% offline generation. High-contrast `@media print` styles for clean black-and-white printing.

### 🚨 7. 24/7 Night Emergency Mode
- Instant 1-tap filter that isolates providers with emergency nighttime availability (pipe leaks, power outages, automotive lockouts).

### ⭐ 8. Trusted Favorites
- Persistent `localStorage` bookmarking system to keep trusted tradespeople at your fingertips without creating user accounts.

---

## 🚀 Local Development Setup

No complex frameworks or heavy dependencies required:

### Option 1: Run with Node.js
```bash
node server.js
```
Open in your browser: `http://localhost:3000`

### Option 2: Validate Data Quality & Schema
```bash
node scripts/validate-data.js
```

---

## 🤝 Code of Conduct

This project is governed by the **Contributor Covenant v2.1** standard to ensure a safe, welcoming, respectful, and harassment-free environment for all contributors and users. Read the full document at [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).

---

## 🌐 Infrastructure & Open Source Sponsorship

This non-profit civic project is hosted and deployed with the generous open-source support of **[Netlify](https://www.netlify.com)**:

[![Deploys by Netlify](https://www.netlify.com/v3/img/components/netlify-color-accent.svg)](https://www.netlify.com)

---

## 📄 License & Non-Commercial Civic Purpose

This project is an open **non-profit civic technology initiative** developed by **Ramsses García (PolyLab)**.

It is licensed under the **[MIT License](./LICENSE)** (approved by the **Open Source Initiative - OSI**). Free for community audit, public benefit, and non-commercial municipal replication across Mexico and Latin America.
