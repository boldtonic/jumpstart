# Review general cerrado — 28 de septiembre de 2026

## Dictamen

Jumpstart tiene un núcleo funcional de investigación, recomendación e integración selectiva. El problema principal de esta revisión era la experiencia de instalación y uso: la documentación la presentaba como algo propio de Codex, pese a que el producto debía servir a distintos agentes. Se ha corregido el núcleo y la documentación, y se ha añadido un adaptador MCP que comparte ese núcleo.

La revisión de hoy queda cerrada para el alcance local revisado: skill, herramientas, ejemplo, servidor MCP, documentación y distribución. Esto no certifica el comportamiento de todos los modelos y clientes ni una integración compleja que todavía no se ha ejecutado.

## Hallazgos y resolución

| Prioridad | Hallazgo | Resolución |
|---|---|---|
| P1 | La explicación centrada en “adjuntar” en Codex no representaba el producto portable ni el uso nativo de Claude Code. | README y guía española reescritos: instalación por cliente, `/jumpstart` en Claude Code, `$jumpstart` en Codex y mecanismos nativos en otros agentes. Instrucciones compartidas independientes del proveedor. |
| P2 | Los clientes MCP carecían de una entrada al flujo y las herramientas. | Adaptador local con un prompt, cuatro herramientas y guías como recursos; lee directamente los archivos del núcleo. El cliente aporta contexto, modelo y herramientas de edición. |
| P2 | Un archivo con una línea de más de 16.000 caracteres quedaba cortado sin forma de recuperar el final. | Paginación por caracteres dentro de la ventana de líneas, cursor de continuación y metadatos explícitos. Prueba que reconstruye la línea completa. |
| P2 | Una búsqueda podía guardar 120 candidatos pero permitir leer solo los primeros 60. | Paginación de candidatos y árboles filtrados; pruebas que recuperan todas las entradas. |
| P2 | Invocar la skill sin contexto podía confundir su carpeta con el producto objetivo; una petición sobre Jumpstart podía desviarse a buscar repos. | Resolución explícita del encargo y del producto antes de investigar. Una pregunta esencial solo si falta el objetivo. |
| P2 | El menú inicial era demasiado extenso para elegir. | Guía de 300–500 palabras con la evidencia extensa fuera del primer menú. |
| P2 | Copiar la carpeta fuente podía omitir la licencia incluida en otros paquetes. | Licencia dentro de la skill; distribución e instalaciones comparadas con el núcleo. |

El revisor independiente reprodujo los dos defectos de paginación. La tarea principal aplicó las correcciones y comprobó sus regresiones. No se atribuye una segunda aprobación independiente a la versión corregida.

## Verificación ejecutada

| Comprobación | Resultado |
|---|---|
| Herramientas de investigación y procedencia, Python 3.9.6 | 20 tests pasan |
| Integración real Markdown + sanitizador, Python 3.11.15 | 7 tests pasan |
| Servidor y protocolo MCP, SDK oficial 2.2.0 | 13 tests pasan, incluidos proceso stdio real, prompts, recursos, errores y paginación |
| Skill | Validador local correcto; frontmatter mínimo compatible con ese validador |
| Procedencia del ejemplo | Validación estricta correcta, sin advertencias |
| Instalador externo Skills 1.7.0 | Detectó Jumpstart desde la raíz y desde su carpeta; comprobadas opciones de agentes y ámbito |
| MCP Streamable HTTP real | Enumeró cuatro herramientas y leyó la guía; proceso detenido al terminar |
| MCP stdio con GitHub real | Búsqueda pública, inspección fijada a commit y lectura de cinco líneas correctas |
| Empaquetado e instalaciones locales | Comprobación de hashes contra la fuente; skill ZIP y paquete MCP verificados |

La prueba de transporte/GitHub quedó registrada antes de la corrección de paginación; las pruebas de regresión y protocolo se ejecutaron después. [Evidencia del smoke test](evidence/mcp-smoke.json).

El validador local antiguo no aceptaba el campo opcional estándar `compatibility`; se retiró, manteniendo los requisitos en la documentación. No se modificó el validador para obtener un resultado positivo.

## Compatibilidad que se puede afirmar

- **Codex:** skill disponible en la instalación personal; fuente e instalación sincronizadas.
- **Claude Code:** skill personal instalada y descubrimiento nativo comprobado mediante el protocolo de inicialización del SDK oficial: el CLI devolvió `jumpstart` en su lista de comandos. Cero mensajes al modelo. El MCP también está registrado y `claude mcp get jumpstart` informó “Connected”.
- **Otros clientes Agent Skills:** formato compartido y ruta de instalación mediante el instalador externo; no se afirma una prueba completa en cada cliente.
- **MCP local:** runtime permanente instalado en el proyecto y registrado en Codex, Claude Code y Claude Desktop. El cliente oficial arrancó correctamente el comando guardado de cada aplicación; la configuración de Claude Desktop también completó una búsqueda real en GitHub. Las sesiones abiertas deben recargar su configuración; no se cerraron aplicaciones a la fuerza.
- **Clientes que solo aceptan MCP remoto:** necesitarían un despliegue HTTPS autenticado. No hay un servicio alojado publicado.

## Lo que queda por demostrar o publicar

1. Una evaluación de la calidad del menú generado por Claude Code y otro cliente. El descubrimiento de la skill y el arranque del MCP ya están comprobados; esa evaluación adicional no es necesaria para instalar e invocar Jumpstart.
2. Extracción y simplificación de módulos acoplados de varios repos grandes. La demo actual prueba composición de dos librerías mediante sus APIs.
3. Publicación del repositorio para ofrecer una URL de instalación pública. El proyecto sigue local en CODE.

Estos puntos delimitan la validación y distribución; no se presentan como pruebas ya pasadas. No se han medido ahorros de tokens, horas ni porcentajes de deuda técnica.

## Uso vigente

La [guía de uso](../USO.es.md) explica instalación e invocación. La [guía MCP](../mcp_server/README.md) contiene los comandos de conexión. El [registro inicial de hoy](SECOND_REVIEW.es.md) y la [primera validación](RESULTS.md) se conservan como historial.

## Cierre de disponibilidad local

La skill está disponible en Codex y Claude Code. El MCP está instalado y registrado en los tres clientes locales presentes: Codex, Claude Code y Claude Desktop. La instalación no depende de entornos temporales. [Descubrimiento nativo de Claude Code](evidence/claude-skill-discovery.json) y [comprobación de las configuraciones guardadas](evidence/installed-clients.json).

Los paquetes se han regenerado desde esa versión. Para instalación pública con una URL compartible, solo falta autorizar y ejecutar la publicación del repositorio; no falta código de instalación local.

Las 40 pruebas pasan también con las dependencias de MCP y del ejemplo instaladas juntas en un entorno limpio, como hará GitHub Actions. La prueba de arranque stdio usa ahora un directorio temporal del sistema en lugar de una ruta exclusiva de macOS. El workflow está preparado; su ejecución alojada comienza al publicar el repositorio.
