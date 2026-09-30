# Trucebol — instrucciones para futuras actualizaciones

Leer README.md y CHANGELOG.md antes de editar. Las correcciones del usuario prevalecen sobre las propuestas del chat.

## Nexo

Juego para compartir con amigos sin presión. Sin cuenta regresiva ni turnos apurados. El jugador observa, piensa, organiza su once y cierra el turno cuando quiere. La demo actual es local; no presentarla como online.

## Decisiones firmes

- Nombre: **Trucebol**, nunca Tregua.
- Demo para 2–4 equipos; modo solo con rivales simulados y hot-seat en el mismo dispositivo.
- 3 acciones. Reorganizar titulares/banco es gratis, incluso a 0 acciones.
- 11 titulares, banco ilimitado, AVG de titulares.
- Empate reparte el territorio entre los dos equipos.
- Economía reservada pero desactivada en v0.1.0. No añadir monedas o compras reales sin un nuevo pedido.
- Versionado visible, changelog, README y este documento; tutorial explica función, coste, requisitos y límites de cada nueva mecánica.
- Mobile-first: botones alcanzables, selección exacta, confirmación de pintura, sin gestos que confundan desplazamiento con acciones.

## Pendientes

Territorio inicial y si un partido continúa/cierra el turno **no se resolvieron**. Los valores iniciales son experimentales y configurables. No convertirlos en reglas definitivas sin consultar. Victoria global, temporada y balance tampoco están cerrados.

## Integridad

RNG y partidos persistidos: nunca regenerar un resultado al ver una crónica o recargar. Un frente por pareja por ronda. Resolver contra el mapa actualizado después de cada partido, no contra una lista vieja de frentes. Bots deben terminar exactamente su propio turno, incluyendo la variante de partido que lo corta. Guardado inválido debe permitir iniciar de nuevo sin romper la pantalla.

## Entrega

`npm test`, verificar interfaz móvil/escritorio y offline. Subir a main cuando el usuario lo pida; Pages corre vía workflow. No afirmar que el enlace está publicado hasta confirmar despliegue. Documentar limitaciones reales. No añadir servicios, claves o dependencias innecesarias.
