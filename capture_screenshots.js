const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, 'public', 'screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function run() {
  console.log("Iniciando Puppeteer...");
  const browser = await puppeteer.launch({
    headless: "new",
    defaultViewport: { width: 375, height: 812, isMobile: true } // Simular vista móvil (iPhone X) ya que la app está diseñada para celular
  });
  const page = await browser.newPage();
  
  // Interceptar la redirección de login si la hay (asumiremos que podemos ver las páginas directamente 
  // o usaremos local storage / cookies si es necesario. Dado que estamos en modo DEMO por defecto, 
  // debería mostrar la UI sin requerir un flujo complejo de auth, o bien simularemos el estado).
  
  // Habilitar Local Storage para modo DEMO si es necesario
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('demoMode', 'true');
    localStorage.setItem('userRole', 'coach'); 
  });

  console.log("Visitando Portal del Entrenador (Asistencia)...");
  await page.goto('http://localhost:3000/dashboard/coach', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000)); // Esperar renderizado y fetch de demo
  
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'coach_asistencia.png'), fullPage: true });
  console.log("Captura: Asistencia del Entrenador guardada.");

  console.log("Cambiando a pestaña de Evaluación...");
  // Buscar el botón que cambia a la pestaña de evaluación (normalmente dice 'Evaluación y Salud' o similar)
  // Vamos a forzar un click en el tab de evaluación
  await page.evaluate(() => {
    const tabs = document.querySelectorAll('button');
    tabs.forEach(tab => {
      if(tab.textContent.includes('Evaluación')) tab.click();
    });
  });
  await new Promise(r => setTimeout(r, 1000));
  
  // Seleccionar el primer alumno si el select existe
  await page.evaluate(() => {
    const select = document.querySelector('select');
    if(select && select.options.length > 1) {
      select.selectedIndex = 1;
      const event = new Event('change', { bubbles: true });
      select.dispatchEvent(event);
    }
  });
  await new Promise(r => setTimeout(r, 1000));
  
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'coach_evaluacion_salud.png'), fullPage: true });
  console.log("Captura: Evaluación y Estado Físico guardada.");

  console.log("Visitando Portal del Padre...");
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('demoMode', 'true');
    localStorage.setItem('userRole', 'parent'); 
  });
  await page.goto('http://localhost:3000/dashboard/parent', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'padre_desarrollo.png'), fullPage: true });
  console.log("Captura: Desarrollo Deportivo del Padre guardada.");

  await browser.close();
  console.log("Proceso completado.");
}

run().catch(console.error);
