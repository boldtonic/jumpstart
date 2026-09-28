# Segunda revisión — 28 de septiembre de 2026

Registro de la revisión inicial del día. La revisión final de portabilidad y su estado vigente están en [PORTABILITY.es.md](PORTABILITY.es.md); sustituyen el enfoque de uso centrado en Codex de este registro.

## Resultado

El proyecto se ha trasladado de IDEATION a `~/Dropbox/FREE/CODE/jumpstart`. Se verificaron los hashes de los 33 archivos del traslado. La copia instalada en el directorio personal de skills de Codex sigue siendo independiente de la carpeta del proyecto.

La revisión encontró problemas de orientación y empaquetado, y se han corregido:

1. **Destino del trabajo ambiguo.** Una invocación sin contexto podía llevar al agente a tratar la propia carpeta de Jumpstart como producto objetivo. Ahora se resuelve el objetivo antes de investigar y se pide una sola aclaración cuando falta.
2. **Invocación junto con una petición sobre la propia skill.** Se explicita que adjuntar Jumpstart no sustituye una petición de explicación, revisión, instalación, traslado o edición por una investigación de repos.
3. **Uso poco claro.** El README mezclaba instalación, chat y herramientas de terminal. Ahora distingue el proyecto fuente, la copia instalada y el chat/código del producto donde se utiliza. Se añadió [una guía en español](../USO.es.md).
4. **Menú demasiado denso.** El ejemplo previo contenía casi mil palabras. La guía ahora orienta a un primer menú de 300–500 palabras, con la evidencia extensa en un documento enlazado. El ejemplo histórico se conserva como registro de aquella prueba.
5. **Licencia en la carpeta distribuible.** La instalación anterior y el ZIP incluían LICENSE, pero copiar directamente `skills/jumpstart` como indicaba el README la omitía. La carpeta fuente de la skill ahora incluye su licencia y el ZIP se reconstruye con ella.

## Comprobaciones ejecutadas

- 20 tests de herramientas: pasan en Python 3.9.6.
- 7 tests del ejemplo de integración: pasan en Python 3.11.15.
- Validación de estructura de la skill y enlaces locales de documentación.
- Validación estricta de la procedencia del ejemplo.
- Comparación de contenido entre la skill fuente, el ZIP reconstruido y la instalación personal.
- Comprobación de que no quedan dependencias de la antigua ubicación de IDEATION dentro de la skill.

Los revisores independientes confirmaron los tests de herramientas y señalaron los problemas de selección del objetivo y densidad del menú antes de que sus sesiones alcanzaran el límite de uso. La revisión, las correcciones y las comprobaciones finales se completaron en la tarea principal.

## Qué está probado y qué no

La instalación en Codex está activa: el usuario pudo adjuntar la skill a esta conversación. La investigación con GitHub y una integración de dos librerías se ejecutaron en la primera validación; los tests de esa integración se han vuelto a ejecutar aquí. Las nuevas instrucciones de selección del objetivo se revisaron con los escenarios descritos, sin atribuirles una nueva prueba autónoma completa.

No se ha demostrado todavía la extracción y simplificación de módulos muy acoplados de varios productos grandes. La calidad de ese trabajo sigue dependiendo del agente, del código y de pruebas específicas del producto. La portabilidad de las instrucciones no equivale a una instalación de Claude Code ya probada. Estos límites no impiden usar la skill; delimitan la evidencia disponible.
