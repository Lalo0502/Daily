# Daily Ticket Management System

Sistema de gestión de tickets para turnos de trabajo nocturno con seguimiento en tiempo real.

## ✨ Características

- 📊 **Atlas**: Vista general de tickets con filtros avanzados y paginación
- 🎯 **Now**: Gestión de turnos diarios con tracking de tickets
- 🔄 **Real-time Updates**: Sincronización automática con Supabase
- 🌙 **Night Shift Support**: Manejo especial de turnos nocturnos que cruzan medianoche
- 🎨 **Diseño Moderno**: Interfaz minimalista con animaciones suaves
- ✅ **Auto-completion**: Marca automática de tickets completados cuando están resueltos

## 🛠️ Tecnologías

- **React 18** con TypeScript
- **Vite** para build ultra-rápido
- **Tailwind CSS** para estilos
- **shadcn/ui** para componentes
- **Supabase** para backend y tiempo real
- **React Router** para navegación

## 📦 Instalación

## 📦 Instalación

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
# Crea un archivo .env con tus credenciales de Supabase:
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_key_de_supabase

# Ejecutar en desarrollo
npm run dev

# Build para producción
npm run build
```

## 📊 Base de Datos

El proyecto requiere las siguientes tablas en Supabase:

- `tickets` - Información de tickets
- `ticket_comments` - Comentarios en tickets
- `shifts` - Turnos de trabajo
- `shift_tickets` - Relación entre turnos y tickets

Ver `DATABASE_SETUP.md` para el SQL completo de configuración.

## 🎯 Páginas Principales

### Atlas (`/atlas`)
Vista general de todos los tickets con:
- Filtros por estado, CTI y assignee
- Paginación (10 tickets por página)
- Búsqueda por ID externo
- Background animado con blobs

### Now (`/now`)
Gestión de turno actual:
- Inicio/fin de turno
- Agregar tickets al turno
- Marcar como completados
- Progress bar en tiempo real
- Auto-sync con estado de tickets

### Ticket Details (`/atlas/:id`)
Vista detallada de ticket:
- Edición de campos
- Sistema de comentarios
- Timeline de actividad
- Quick actions

## 🚀 Características Técnicas

- **Optimistic UI Updates**: Actualizaciones instantáneas con rollback en caso de error
- **Real-time Subscriptions**: 3 suscripciones concurrentes en NowPage
- **Night Shift Logic**: `getCurrentShiftDate()` maneja turnos que cruzan medianoche
- **Bidirectional Sync**: Auto-complete cuando status = "resolved"
- **Glassmorphism**: Efectos modernos de transparencia y blur

## 📝 Scripts Disponibles

```bash
npm run dev          # Desarrollo con hot reload
npm run build        # Build para producción
npm run preview      # Preview del build
npm run lint         # Ejecutar ESLint
```

## 🎨 Personalización

El proyecto usa Tailwind CSS con configuración custom:
- Animaciones personalizadas (`animate-blob`)
- Delays escalonados para animaciones
- Componentes de shadcn/ui personalizados

## 📄 Licencia

MIT

---

Desarrollado con ❤️ para gestión de turnos nocturnos
