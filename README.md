# shalom-app

Frontend Angular 18 del ecosistema Shalom.

## Requisitos

- Node.js 20+
- npm 10+
- shalom-auth en ejecución (puerto 8081)
- shalom-core en ejecución (puerto 8082) para probar `/api/health`

## Variables de entorno

Configuradas en `src/environments/`:

| Archivo | `apiAuthUrl` | `apiCoreUrl` |
|---------|--------------|--------------|
| `environment.ts` | `http://localhost:8081` | `http://localhost:8082` |
| `environment.prod.ts` | Ajustar en despliegue | Ajustar en despliegue |

## Levantar la aplicación

```bash
npm install
ng serve
```

Abrir [http://localhost:4200](http://localhost:4200)

## Credenciales demo

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| `admin` | `admin123` | ADMIN |
| `direccion` | `admin123` | DIRECCION |

## Rutas

| Ruta | Protección |
|------|------------|
| `/login` | Pública |
| `/app/inicio` | `authGuard` |
| `/app/usuarios` | `authGuard` + `roleGuard` |

## Probar login end-to-end

1. Ejecutar scripts SQL y levantar `shalom-auth` y `shalom-core`
2. Abrir `http://localhost:4200/login`
3. Ingresar con `admin` / `admin123`
4. En **Inicio**, pulsar **Probar /api/health** — debe responder `status: ok`
5. Ir a **Usuarios** y verificar listado paginado
6. Cerrar sesión e intentar acceder a `/app/inicio` — redirige a login

## Estructura

```
src/app/
├── core/           # Auth, guards, interceptors, services
├── features/
│   ├── auth/login/
│   ├── inicio/
│   ├── layout/main-layout/
│   └── usuarios/
└── environments/
```

## Diseño

Paleta y tipografía basadas en `DESIGN.md`:
- Primary: `#006671`
- Fuentes: Hanken Grotesk (títulos), Inter (cuerpo), JetBrains Mono (datos)
