# Trucebol · v0.1.0

Fútbol entre trincheras. Primera demo web local: expandir el barrio, mejorar el once y resolver fronteras jugando partidos. Sin reloj y sin presión: cada jugador cierra su turno cuando decide.

## Probar

- Demo: https://guerrasur.github.io/trucebol/ (GitHub Pages, cuando termine el workflow).
- Elegir **Yo contra equipos simulados** para jugar solo, o **Amigos en el mismo dispositivo** para 2–4 personas por turnos. No hay todavía conexión online entre dispositivos.
- No requiere cuenta, backend ni instalación. Después de la primera carga completa se puede jugar sin internet; el guardado es local a cada navegador.

Desarrollo: `npm start` y abrir http://localhost:4173. Pruebas: `npm test` (Node 22+). No hay dependencias npm de producción.

## Reglas de la demo

| Acción/sistema | Coste | Disponibilidad y efecto |
|---|---|---|
| Pintar | 1 acción | Una casilla libre junto a territorio propio por un lado. Seleccionar y confirmar; no diagonales ni pintura sobre rivales. |
| Fichar | 1 acción | Elegir uno de cuatro jugadores. Entra al banco y se renueva esa oferta. Sin precio monetario en v0.1.0. |
| Abrir paquete | 1 acción | Cinco jugadores al banco. Por jugador: común 52–77 (80%), destacado 78–89 (18%), figura 90–98 (2%). |
| Reorganizar | Gratis | Intercambiar un titular y un suplente; disponible incluso sin acciones. 11 titulares y banco ilimitado. |
| AVG | Gratis | Promedio redondeado de los 11 titulares. Las posiciones orientan, sin penalización por posición en esta demo. |
| Frente | Automático | Por defecto, 3 casillas propias que tocan a un rival. Cuenta desde cualquiera de los dos lados. Necesita al menos 4 casillas de frontera y una zona conectada disputable. |
| Partido | Sin acción extra | AVG + azar; guarda resultado, minutos, goleadores, crónica y territorio anterior/posterior. Máximo uno por pareja en cada ronda. |
| Territorio disputado | Según resultado | Una zona conectada de 4 o 6 casillas de ambos clubes, alrededor del centro del frente. El ganador obtiene la zona; con empate se reparte exactamente por mitades. |
| Liga | Según resultado | Victoria 3, empate 1 cada uno, derrota 0. PJ/G/E/P/GF/GC/PTS; desempate por diferencia de gol y goles a favor. |
| Cerrar turno | Gratis | Decisión del jugador. Reinicia 3 acciones para el siguiente; las sobrantes no se acumulan. La ronda avanza al completar todos los equipos. |

Hay tutorial completo dentro del juego, mapa con zoom por botones y scroll nativo, confirmación antes de pintar o abandonar acciones, resumen de los rivales y crónicas consultables sin volver a sortear.

## Decisiones del chat de diseño

Referencia: `6abd1249-bdc0-83e9-96e8-c0c4b479c061`, 30/09/2026. Se recuperaron reglas mediante contexto personal; no se obtuvo una transcripción íntegra del chat. Las últimas correcciones del usuario tienen prioridad sobre propuestas anteriores.

**Aprobado:** nombre visible Trucebol; 2–4 equipos; poder simular rivales para pruebas offline; reorganizar gratis; empate divide territorio; economía preparada sin implementarse; móvil primero, versionado visible, updates, documentación y controles táctiles claros.

**Pendiente, expuesto como opción experimental al crear partida:**

- Inicio con 1, 3 o 4 casillas; 3 es un valor de prueba, no una decisión final.
- Partido al cerrar el turno (valor de prueba), inmediato continuando el turno o inmediato cerrando el turno. Ninguna variante se declara definitiva.
- Tamaño 8×8 por defecto (también 10×10 y 12×12) y umbral 3 (también 2 o 4).

**Sin definición final:** condición de victoria global, duración de liga, balance, regla exacta de geometría de conquista y efectos por posición. Se ofrece una partida abierta sin imponer una victoria por dominio o por temporada. Un equipo sin territorio puede mejorar su plantel pero no expandirse; no se inventó una regla de reaparición. El reparto de empate usa zonas pares para no adjudicar una casilla extra arbitrariamente.

## Arquitectura y futuras versiones

- `src/engine.js`: reglas puras, RNG determinista guardado, rivales y validación del estado; no depende de DOM ni Firebase.
- `src/app.js`: SPA, mapa, planteles, mercado de prueba, liga, tutorial y crónicas.
- `src/storage.js`: adaptador localStorage; punto de sustitución para Firebase. No es multijugador online aún.
- `economy.enabled: false`: reservado en el estado. No hay saldo, precios, cobros ni recompensas monetarias.
- `sw.js`: cache offline versionada; activación de nuevas versiones a petición del jugador. `version.json` y botón de versión/changelog.
- `tests/engine.test.js`: pruebas del motor, incluyendo simulación de 40 rondas con 2–4 equipos y las tres variantes de partido.
- `.github/workflows/pages.yml`: pruebas y despliegue a Pages al subir a `main`; solo publica archivos de la app. Pages debe estar habilitado con fuente GitHub Actions; la habilitación automática depende de los permisos del repositorio.

Para una actualización, sincronizar `package.json`, `VERSION`, `version.json`, cache del service worker, notas en la interfaz y `CHANGELOG.md`. No resetear guardados por un cambio meramente visual: agregar migraciones cuando cambie el esquema. Para online, usar transacciones/versiones de turno, validar identidad y autoridad, generar resultados una sola vez y compartir el RNG/partidos; no confiar en escrituras libres desde el cliente.
