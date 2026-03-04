

## Plan: Truncar nombres largos en la lista de proyectos del sidebar

**Problema:** Cuando el nombre del proyecto es muy largo, el elemento se expande y empuja el botón de duplicar fuera de vista.

**Solución:** Agregar `truncate` (que aplica `text-overflow: ellipsis; overflow: hidden; white-space: nowrap`) al `<p>` del nombre del proyecto en el sidebar, y limitar su ancho con `max-w` para que nombres largos se corten con "...". El nombre completo se mostrará como tooltip al hacer hover.

**Archivo:** `src/components/layout/AppSidebar.tsx`

- El `<p>` del nombre ya tiene `truncate`, pero el contenedor padre no tiene un ancho fijo que lo fuerce a truncar. Se ajustará el contenedor del botón del proyecto para que tenga `overflow-hidden` y un ancho limitado, asegurando que `truncate` funcione correctamente junto al botón de duplicar.
- Cambiar el layout del item de proyecto para usar `flex` con el nombre ocupando el espacio disponible (`flex-1 min-w-0`) y el botón de duplicar con tamaño fijo, garantizando que el texto se trunque antes de chocar con el botón.

