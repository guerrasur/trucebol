# Changelog

## 0.2.0 — 2026-09-30

- Plan Cóndor centrado en partidos, con referencias de 7a0 y New Star Soccer pero sin mecánicas jugables dentro del encuentro.
- Simulación 100% automática basada en atributos individuales, posición natural, puesto ocupado y azar ponderado.
- Atributos ATQ, PAS, DEF y ARQ para cada jugador.
- Perfil del XI por ataque, mediocampo, defensa y arquero.
- Jugar fuera de posición reduce el aporte del futbolista.
- Nuevo informe con posesión, remates, tiros al arco, xG, atajadas, goles, asistencias, figura y minuto a minuto.
- Rendimientos individuales posteriores al partido.
- Migración de partidas v0.1 sin borrar progreso.
- Se mantienen como experimentales el territorio inicial y el momento exacto en que se disputa el partido.

## 0.1.0 — 2026-09-30

- Primera demo local con 2–4 equipos y rivales simulados offline.
- Grilla 8×8 configurable, 3 acciones, expansión por lados y confirmación de casilla.
- Titulares y banco, AVG, cambios gratis, fichajes y paquetes de cinco sin economía monetaria.
- Frentes configurables y partidos deterministas con azar, minutos, goleadores y crónica.
- Conquista de zona conectada y reparto igual del empate; clasificación y goleadores.
- Inicio y momento del partido como opciones experimentales, preservando decisiones pendientes.
- Tutorial, resumen de rivales, guardado local, cache offline y aviso/activación de updates.
- Documentación y workflow de pruebas/despliegue en GitHub Pages.
- Corrección durante pruebas: revalidar cada frente después de que un partido cambie el mapa; evitar que un bot juegue el turno ajeno cuando un partido corta el suyo.
