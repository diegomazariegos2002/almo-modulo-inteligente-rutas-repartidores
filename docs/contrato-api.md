# Contrato de la API

Fuente de verdad del contrato HTTP entre `backend/` y `frontend/`. La documentación
interactiva (Swagger) vive en `/api/docs` cuando el backend está corriendo.

- **Base URL:** `/api` (el frontend siempre llama rutas relativas; en desarrollo `ng serve`
  las reenvía al backend con un proxy y en Docker lo hace nginx).
- **Formato:** JSON. Fechas en ISO 8601 UTC (`2026-09-30T18:00:00.000Z`).
- **Autenticación:** `Authorization: Bearer <accessToken>` en todo excepto `POST /auth/login`
  y `GET /health`.
- **Idioma de los mensajes:** español por defecto; `Accept-Language: en` los devuelve en inglés.

## 1. Roles y permisos

| Permiso                      | CLIENTE | REPARTIDOR | ADMIN |
| ---------------------------- | :-----: | :--------: | :---: |
| `rutas:orden:crear`          |   sí    |            |       |
| `rutas:orden:listar`         |   sí    |     sí     |  sí   |
| `rutas:orden:cambiar-estado` |         |     sí     |       |
| `rutas:ruta:leer`            |         |     sí     |  sí   |
| `rutas:repartidor:listar`    |         |            |  sí   |

Además del permiso se valida la **pertenencia del recurso**:

- Un `CLIENTE` solo ve las órdenes que él creó.
- Un `REPARTIDOR` solo ve las órdenes que tiene asignadas, solo lee **su** ruta y solo cambia
  el estado de **sus** paradas.
- `ADMIN` (despacho) es de solo lectura: ve todas las órdenes y la ruta de cualquier repartidor.

## 2. Cuentas de demostración (seed)

| Rol        | Correo                  | Nombre         | Vinculado a  |
| ---------- | ----------------------- | -------------- | ------------ |
| CLIENTE    | `cliente@almo.test`     | Cliente Demo   | —            |
| REPARTIDOR | `repartidor1@almo.test` | Ana López      | repartidor 1 |
| REPARTIDOR | `repartidor2@almo.test` | Bruno Castillo | repartidor 2 |
| REPARTIDOR | `repartidor3@almo.test` | Carla Méndez   | repartidor 3 |
| ADMIN      | `admin@almo.test`       | Despacho Demo  | —            |

Contraseña de todas las cuentas de demostración: `Rutas2026*`

## 3. Estados

| Código                 | Descripción             | Aplica a   |
| ---------------------- | ----------------------- | ---------- |
| `PENDIENTE_ASIGNACION` | Pendiente de Asignación | Orden      |
| `ASIGNADA`             | Asignada                | Orden      |
| `EN_RUTA`              | En Ruta                 | Orden      |
| `ENTREGADA`            | Entregada               | Orden      |
| `DISPONIBLE`           | Disponible              | Repartidor |
| `EN_RUTA`              | En ruta                 | Repartidor |

Transiciones válidas de una orden: `PENDIENTE_ASIGNACION → ASIGNADA → EN_RUTA → ENTREGADA`.

## 4. Formato de las respuestas

**Lecturas (`GET`)**: devuelven el recurso tal cual.

**Escrituras (`POST`, `PATCH`)**: devuelven un sobre con mensaje para mostrar al usuario
(excepto `POST /auth/login`, que devuelve el token directamente).

```json
{ "statusCode": 201, "code": "CREATED", "message": "Orden ORD-000006 asignada a Ana López.", "data": {} }
```

**Errores**: siempre con la misma forma. `details` solo aparece en errores de validación.

```json
{
  "statusCode": 400,
  "code": "VALIDACION.ENTRADA_INVALIDA",
  "message": "Los datos enviados no son válidos.",
  "timestamp": "2026-09-30T18:00:00.000Z",
  "details": [{ "campo": "peso", "mensaje": "El peso debe ser mayor que 0 y no superar 50 kg." }]
}
```

| HTTP | `code`                               | Cuándo                                                        |
| ---- | ------------------------------------ | ------------------------------------------------------------- |
| 400  | `VALIDACION.ENTRADA_INVALIDA`        | Cuerpo o query con campos faltantes, no numéricos o fuera de rango |
| 401  | `AUTH.CREDENCIALES_INVALIDAS`        | Correo o contraseña incorrectos en el login                   |
| 401  | `AUTH.NO_AUTENTICADO`                | Falta el token, está mal formado o expiró                     |
| 403  | `AUTH.PERMISO_DENEGADO`              | El rol no tiene el permiso del endpoint                       |
| 403  | `AUTH.RECURSO_AJENO`                 | El recurso existe pero pertenece a otro usuario               |
| 404  | `RUTAS.ORDEN_NO_ENCONTRADA`          | El folio no existe                                            |
| 404  | `RUTAS.REPARTIDOR_NO_ENCONTRADO`     | El id de repartidor no existe                                 |
| 409  | `RUTAS.TRANSICION_ESTADO_INVALIDA`   | El cambio de estado no es válido desde el estado actual       |
| 500  | `INTERNAL_SERVER_ERROR`              | Error no controlado                                           |

## 5. Recursos

### 5.1 Orden

```json
{
  "folio": "ORD-000003",
  "lat": 14.6229,
  "lng": -90.5155,
  "peso": 4.5,
  "direccion": "Zona 4, Ciudad de Guatemala",
  "estado": "ASIGNADA",
  "estadoDescripcion": "Asignada",
  "repartidor": { "id": 1, "nombre": "Ana López" },
  "secuenciaRuta": 1,
  "creadaEn": "2026-09-30T15:00:00.000Z",
  "actualizadaEn": "2026-09-30T15:00:01.000Z",
  "historial": [
    { "estado": "PENDIENTE_ASIGNACION", "estadoDescripcion": "Pendiente de Asignación", "fecha": "2026-09-30T15:00:00.000Z" },
    { "estado": "ASIGNADA", "estadoDescripcion": "Asignada", "fecha": "2026-09-30T15:00:01.000Z" }
  ]
}
```

- `peso` en kilogramos. `direccion` es una referencia de texto opcional (`null` si no se envió).
- `repartidor` y `secuenciaRuta` son `null` mientras la orden está `PENDIENTE_ASIGNACION`;
  `secuenciaRuta` vuelve a `null` cuando la orden está `ENTREGADA`.
- `historial` va en orden cronológico ascendente: una entrada por cada cambio de estado.

### 5.2 Ruta de un repartidor

```json
{
  "repartidor": {
    "id": 1,
    "nombre": "Ana López",
    "estado": "DISPONIBLE",
    "estadoDescripcion": "Disponible",
    "lat": 14.6417,
    "lng": -90.5133,
    "capacidadKg": 50,
    "cargaKg": 7.5
  },
  "paradas": [
    {
      "secuencia": 1,
      "folio": "ORD-000003",
      "lat": 14.6229,
      "lng": -90.5155,
      "peso": 4.5,
      "direccion": "Zona 4, Ciudad de Guatemala",
      "estado": "ASIGNADA",
      "estadoDescripcion": "Asignada",
      "distanciaDesdeAnteriorKm": 2.1,
      "distanciaAcumuladaKm": 2.1
    }
  ],
  "totalParadas": 1,
  "distanciaTotalKm": 2.1,
  "calculadaEn": "2026-09-30T15:00:01.000Z"
}
```

- `paradas` solo incluye paradas pendientes (`ASIGNADA` o `EN_RUTA`), ya en el orden optimizado.
- `distanciaDesdeAnteriorKm` de la primera parada es la distancia desde la posición actual del
  repartidor. Las distancias son en línea recta (Haversine), redondeadas a 2 decimales.
- Una ruta sin paradas es válida: `paradas: []`, `totalParadas: 0`, `distanciaTotalKm: 0`.

### 5.3 Repartidor (listado de despacho)

```json
{
  "id": 1,
  "nombre": "Ana López",
  "estado": "DISPONIBLE",
  "estadoDescripcion": "Disponible",
  "lat": 14.6417,
  "lng": -90.5133,
  "capacidadKg": 50,
  "cargaKg": 7.5,
  "paradasPendientes": 2
}
```

## 6. Endpoints

### `POST /api/auth/login` — público

Petición: `{ "correo": "cliente@almo.test", "password": "…" }`

Respuesta `200`:

```json
{
  "accessToken": "eyJhbGciOi…",
  "tokenType": "Bearer",
  "expiresIn": 28800,
  "usuario": {
    "id": "cmf0000000000000000000001",
    "nombre": "Cliente Demo",
    "correo": "cliente@almo.test",
    "rol": "CLIENTE",
    "repartidorId": null,
    "permisos": ["rutas:orden:crear", "rutas:orden:listar"]
  }
}
```

Errores: `400` validación, `401 AUTH.CREDENCIALES_INVALIDAS`.

### `POST /api/ordenes` — `rutas:orden:crear`

Petición:

```json
{ "lat": 14.6229, "lng": -90.5155, "peso": 4.5, "direccion": "Zona 4, Ciudad de Guatemala" }
```

| Campo       | Regla                                              |
| ----------- | -------------------------------------------------- |
| `lat`       | Número, obligatorio, entre -90 y 90                |
| `lng`       | Número, obligatorio, entre -180 y 180              |
| `peso`      | Número, obligatorio, mayor que 0 y hasta 50 (kg)   |
| `direccion` | Texto opcional, máximo 120 caracteres              |

Respuesta `201` con el sobre de escritura y `data` = Orden.

- Si se asignó: `data.estado = "ASIGNADA"`, con `repartidor` y `secuenciaRuta`.
- Si no hay repartidor disponible con capacidad: `data.estado = "PENDIENTE_ASIGNACION"`.
  **No es un error**: la orden queda en cola y se asigna sola cuando un repartidor se libera.

Errores: `400`, `401`, `403`.

### `GET /api/ordenes?estado=&page=&limit=` — `rutas:orden:listar`

| Query    | Regla                                                       |
| -------- | ----------------------------------------------------------- |
| `estado` | Opcional. Uno de los cuatro códigos de estado de orden      |
| `page`   | Opcional, entero ≥ 1. Por defecto `1`                       |
| `limit`  | Opcional, entero entre 1 y 100. Por defecto `10`            |

Respuesta `200`, de la más reciente a la más antigua:

```json
{
  "data": [],
  "meta": { "total": 5, "page": 1, "limit": 10, "totalPages": 1, "hasNextPage": false, "hasPreviousPage": false }
}
```

Una página fuera de rango devuelve `data: []` con el `meta` correcto. Errores: `400`, `401`, `403`.

### `GET /api/ordenes/{folio}` — `rutas:orden:listar`

Respuesta `200` = Orden. Errores: `401`, `403 AUTH.RECURSO_AJENO`, `404 RUTAS.ORDEN_NO_ENCONTRADA`.

### `PATCH /api/ordenes/{folio}/estado` — `rutas:orden:cambiar-estado`

Petición: `{ "estado": "EN_RUTA" }` o `{ "estado": "ENTREGADA" }`

- `EN_RUTA`: el repartidor **sale a ruta**. La salida es un evento del repartidor, no de un
  paquete: todas sus órdenes `ASIGNADA` pasan a `EN_RUTA` y él queda `EN_RUTA` (deja de recibir
  órdenes nuevas hasta terminar).
- `ENTREGADA`: marca la parada como entregada. Si el repartidor aún no había salido a ruta, la
  salida se registra en ese mismo momento. Al entregar su última parada el repartidor vuelve a
  `DISPONIBLE` y se le asignan las órdenes que estaban en cola.

Respuesta `200` con el sobre de escritura y `data` = Orden actualizada.

Errores: `400`, `401`, `403 AUTH.PERMISO_DENEGADO`, `403 AUTH.RECURSO_AJENO`,
`404 RUTAS.ORDEN_NO_ENCONTRADA`, `409 RUTAS.TRANSICION_ESTADO_INVALIDA`.

### `GET /api/repartidores/{id}/ruta` — `rutas:ruta:leer`

`id` es un entero. Respuesta `200` = Ruta de un repartidor.

Errores: `400` (id no numérico), `401`, `403 AUTH.RECURSO_AJENO` (un repartidor pide la ruta de
otro), `404 RUTAS.REPARTIDOR_NO_ENCONTRADO`.

### `GET /api/repartidores` — `rutas:repartidor:listar`

Respuesta `200` = arreglo de Repartidor (listado de despacho), ordenado por `id`.

### `GET /api/health` — público

Respuesta `200`: `{ "status": "ok", "checks": { "database": "up", "cache": "up" } }`

## 7. Zonas de referencia (selector del formulario)

El formulario de creación ofrece esta lista para no escribir coordenadas a mano; al elegir una
zona se llenan `lat`, `lng` y `direccion`. Las coordenadas son aproximadas.

| Zona                          | lat     | lng      |
| ----------------------------- | ------- | -------- |
| Zona 1 — Centro Histórico     | 14.6417 | -90.5133 |
| Zona 4 — Cuatro Grados Norte  | 14.6229 | -90.5155 |
| Zona 7 — Kaminal Juyú         | 14.6340 | -90.5500 |
| Zona 9 — Torre del Reformador | 14.6050 | -90.5220 |
| Zona 10 — Zona Viva           | 14.5995 | -90.5069 |
| Zona 11 — Calzada Roosevelt   | 14.6130 | -90.5540 |
| Zona 12 — Ciudad Universitaria| 14.5870 | -90.5460 |
| Zona 13 — Aeropuerto          | 14.5833 | -90.5275 |
| Zona 14 — Las Américas        | 14.5870 | -90.5120 |
| Zona 15 — Vista Hermosa       | 14.5930 | -90.4890 |
| Zona 16 — Cayalá              | 14.6090 | -90.4850 |
| Mixco — San Cristóbal         | 14.6000 | -90.6000 |
| Villa Nueva — Centro          | 14.5270 | -90.5880 |

## 8. Datos precargados (seed)

| Repartidor | Nombre         | Posición inicial | Capacidad | Estado     |
| ---------- | -------------- | ---------------- | --------- | ---------- |
| 1          | Ana López      | Zona 1           | 50 kg     | DISPONIBLE |
| 2          | Bruno Castillo | Zona 10          | 60 kg     | DISPONIBLE |
| 3          | Carla Méndez   | Zona 11          | 40 kg     | EN_RUTA    |

| Folio      | Destino | Peso   | Estado    | Repartidor | Secuencia |
| ---------- | ------- | ------ | --------- | ---------- | --------- |
| ORD-000001 | Zona 11 | 3.0 kg | ENTREGADA | 3          | —         |
| ORD-000002 | Zona 12 | 6.0 kg | EN_RUTA   | 3          | 1         |
| ORD-000003 | Zona 4  | 4.5 kg | ASIGNADA  | 1          | 1         |
| ORD-000004 | Zona 7  | 3.0 kg | ASIGNADA  | 1          | 2         |
| ORD-000005 | Zona 14 | 8.0 kg | ASIGNADA  | 2          | 1         |

Todas las órdenes precargadas pertenecen a `cliente@almo.test`. El estado sembrado es coherente
con las reglas: cada orden está con el repartidor disponible más cercano que le correspondía y
cada ruta está en el orden que calcula el optimizador (Carla ya entregó ORD-000001, por eso su
posición actual es el destino de esa orden).
