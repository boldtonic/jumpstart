# Cómo usar Jumpstart

Jumpstart se instala en tu agente y se usa dentro del proyecto que estás construyendo. Lee el contexto disponible, busca implementaciones open source y te propone qué piezas combinar, conservar, simplificar e integrar. Si eliges una opción o le delegas la decisión, continúa con la implementación, las pruebas y la atribución.

El producto tiene una skill portable y un servidor MCP complementario. Comparten las mismas instrucciones; cada aplicación tiene su forma de descubrirlas e invocarlas.

## Instalación de la skill

Desde la carpeta del repositorio Jumpstart, con Node.js 22.20 o posterior:

```sh
npx skills@1.7.0 add . --skill jumpstart --agent codex claude-code cursor --global
```

Incluye solo los agentes que uses. El [instalador Skills](https://github.com/vercel-labs/skills) coloca la skill donde cada uno la reconoce. `--global` la hace disponible en todos tus proyectos; sin esa opción se instala en el proyecto desde el que ejecutas el comando. También puedes copiar la carpeta completa `skills/jumpstart` al directorio de skills de tu agente, sin usar Node.js.

Por ejemplo, Claude Code reconoce la instalación personal en `~/.claude/skills/jumpstart`. El ZIP `dist/jumpstart-skill.zip` contiene esa carpeta, con sus referencias y herramientas.

## Uso normal

Abre tu producto en el agente habitual. Por ejemplo, abre Sideread si quieres investigar componentes para Sideread.

En **Claude Code**, escribe:

```text
/jumpstart Revisa este proyecto y busca piezas open source para la importación de documentos. Recomiéndame qué combinarías, qué simplificarías y cómo lo integrarías.
```

En **Codex**, escribe:

```text
$jumpstart Revisa este proyecto y busca piezas open source para la importación de documentos. Recomiéndame qué combinarías, qué simplificarías y cómo lo integrarías.
```

Si acabas de instalarla y no aparece, abre una sesión nueva del agente. En Claude Code debe aparecer como `/jumpstart`.

La frase después del nombre es libre. Son mensajes al agente, no comandos de Terminal. No necesitas abrir `SKILL.md`. Si la conversación ya deja claro el producto, puedes invocar Jumpstart sin repetir el briefing. Si falta el objetivo, te preguntará qué producto o función quieres construir.

En otros clientes compatibles con Agent Skills se usa su mecanismo nativo. Algunos agentes también pueden activar la skill por relevancia, según su descripción. Una instalación en Claude Code no instala automáticamente la skill en otros productos de Claude ni en otras aplicaciones.

## El resultado

Recibes un menú breve con una recomendación y alternativas: qué aporta cada repo, qué partes usaríamos, qué sobra, cómo encajan entre sí, qué trabajo evitaríamos y qué falta por comprobar. Puede proponer piezas de varios repos para construir un producto propio.

Después puedes responder:

```text
Integra la opción A, conservando nuestra interfaz. Selecciona las piezas necesarias, aligera lo que sobre, prueba el flujo completo y conserva los créditos.
```

El agente continúa trabajando en ese proyecto. También puedes autorizar desde el principio que elija e implemente por ti. La skill usa la conversación y los archivos accesibles; no conoce automáticamente todos tus otros chats.

## Si tu aplicación usa MCP

Conecta el [servidor MCP de Jumpstart](mcp_server/README.md) y pide a la IA que use Jumpstart para tu producto. El servidor expone el flujo, búsquedas con `gh` e inspección de repos; la IA del cliente interpreta los resultados y realiza las tareas para las que tenga herramientas.

No todos los clientes muestran los prompts MCP como comandos `/...`. Por eso también existe una herramienta `jumpstart_guide` para cargar las instrucciones. Si el cliente no puede editar ni ejecutar código, podrá darte el menú y el plan. Los clientes web que solo conectan servidores HTTPS remotos requieren un despliegue adicional; aquí se proporciona un servidor local.

## Dónde se desarrolla y dónde se usa

La carpeta del repositorio contiene el código, las pruebas y los paquetes de distribución de Jumpstart. Las instalaciones personales permiten usarla desde otros proyectos; no tienes que abrir el repositorio Jumpstart cada vez.

La [especificación Agent Skills](https://agentskills.io/specification) define el formato portable. La [documentación de Claude Code](https://code.claude.com/docs/en/skills) explica `/jumpstart` y sus directorios de descubrimiento. La [guía MCP](mcp_server/README.md) contiene los comandos de conexión y los límites verificados.
