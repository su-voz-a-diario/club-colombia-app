# Manual de Usuario y Guía de Demostración: Web App Club Colombia

Esta plataforma está diseñada para modernizar y facilitar el día a día de la **Escuela de Fútbol Club Colombia**. Reemplaza las planillas de asistencia en papel, las libretas de calificaciones y los cobros manuales difíciles de rastrear, por un sistema digital automático que funciona en computadoras y teléfonos celulares.

A continuación, te explicamos de forma muy sencilla qué hace cada sección y cómo puedes probarla en la demo:

---

## 🏠 1. La Página de Entrada (Landing Page)
Es la cara pública de la escuela en internet. Aquí los nuevos padres pueden informarse e inscribirse.
*   **Tablón de Anuncios:** En la parte de arriba hay una sección especial para mensajes importantes (por ejemplo, si se suspende un entrenamiento por lluvia). Este mensaje lo escribe el administrador y cambia al instante.
*   **Tarjetas Interactivas (Demos):** En la sección de "Módulos Diseñados para la Excelencia", puedes hacer clic en cualquiera de las 3 tarjetas para ver una simulación interactiva:
    1.  *Credencial QR:* Simula cómo se escanea el pase de entrada de un niño en las canchas.
    2.  *Evaluación Táctica:* Muestra el gráfico de habilidades y te permite modificar los valores con botones para ver cómo se redibuja en vivo.
    3.  *Periodo de Gracia:* Explica de forma visual la línea de tiempo de cobros y suspensiones automáticas.

---

## 📝 2. Proceso de Inscripción de un Alumno Nuevo
Es el camino que sigue un papá desde su celular para registrar a su hijo:
1.  Haz clic en **"Inscripción en Línea"** (esquina superior derecha).
2.  Escribe el nombre del papá, del niño y selecciona su fecha de nacimiento.
3.  **Asignación de Categoría:** El sistema calcula la edad del niño automáticamente y le asigna su grupo (por ejemplo, si nació en 2017, le asigna la categoría *Sub-10 Competitivo* y le muestra sus horarios de entrenamiento).
4.  **Reporte de Pago Directo:** El sistema abre una ventana con los datos de transferencia del club (CLABE BBVA) y la opción de reportar pago por transferencia o en efectivo con el Profe Luis López.
5.  **Activación de Credencial:** Al reportar el pago, el sistema reactiva la **Credencial QR activa** del menor para que pueda ingresar al entrenamiento.

---

## 🛠️ 3. Panel del Administrador (Profe Luis López)
Es el centro de control de la escuela. Únicamente el Profe Luis López tiene acceso a este panel para administrar todo el club.
*   **Control de Alumnos (Overrides):** Muestra la lista de niños inscritos. Si un niño tiene un nivel muy alto y el cuerpo técnico decide promoverlo a una categoría mayor (aunque no tenga la edad todavía), el administrador hace clic en **"Override"**, elige el nuevo grupo y escribe el motivo. El sistema congelará este cambio a mano.
*   **Control de Mora (Mensualidades):** Si deseas ver qué pasa cuando alguien no paga a tiempo, haz clic en el botón verde **"Auditar Mora & Enviar Avisos"**. El sistema buscará a los alumnos que lleven más de 5 días hábiles de retraso en su pago, **suspenderá automáticamente su QR de acceso** (se pondrá en rojo) y les enviará un cobro automático por WhatsApp.
*   **Enviar Comunicados:** Escribe un aviso en la caja de texto y haz clic en enviar. Verás que **este aviso aparece inmediatamente en la página principal** para todos los usuarios.

---

## ⚽ 4. Aplicación de Cancha para Entrenadores
Es la herramienta móvil que usan los profesores directamente en el campo de fútbol con su celular.
*   **Asistencia Rápida:** Muestra la lista de los niños de su categoría. El profesor solo toca una letra para marcar: **P** (Presente), **A** (Ausente) o **J** (Justificado). Al terminar, presiona guardar. No más papel ni lapiceros.
*   **Calificaciones Técnicas (Ficha):** Permite calificar de 1 a 10 las 6 habilidades del alumno (Velocidad, Pase, Regate, Tiro, Físico y Disciplina) usando barras deslizantes muy sencillas.
*   **Observaciones Tácticas:** El entrenador escribe comentarios sobre el posicionamiento, la disciplina y las metas del menor en el cuadro de texto. Al usar su celular, el teclado móvil nativo ofrece dictado por voz automático y preciso para evitar la escritura manual bajo el sol. Al presionar "Publicar", el reporte se envía de inmediato al perfil del papá.

---

## 👤 5. Portal para Padres y Alumnos
Es la zona privada donde los papás controlan todo lo relacionado con su hijo.
*   **Credencial Digital QR:** Es el pase de entrada del niño. 
    *   *Si la mensualidad está al día:* Sale en **Verde (Activo)** con un láser de escaneo.
    *   *Si la mensualidad tiene mora:* El QR se bloquea en **Rojo (Suspendido)**. Justo abajo se activan los datos para la transferencia bancaria directa o el aviso de pago en efectivo. Al reportar el pago, el QR se reactiva a color verde al instante.
*   **Seguimiento Deportivo:** Muestra el gráfico de radar (telaraña) con las notas y calificaciones que el entrenador le puso al menor en el portal de entrenadores, permitiendo ver el avance de su nivel técnico mes a mes.
*   **Historial de Cuenta:** Lista las mensualidades pagadas y pendientes para llevar un control claro del dinero.
