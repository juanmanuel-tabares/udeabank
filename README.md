# UdeaBank

Sistema bancario elemental desarrollado como Laboratorio 1 de Arquitectura de
Software (Universidad de Antioquia). Consta de una API REST en Spring Boot y una
aplicación web en React que la consume.

**Funciones:** gestión de clientes (consultar, crear, actualizar y eliminar),
transferencias de dinero entre cuentas e histórico de transacciones por cliente.

---

## Requisitos

| Componente | Versión |
| --- | --- |
| JDK | 17 o superior |
| MySQL | 8 o superior |
| Node.js | 20 o superior |

---

## Configuración

Las credenciales de la base de datos **no están en el repositorio**. Se leen de
un archivo `.env` en la raíz, que cada quien crea a partir de la plantilla:

```bash
cp .env.example .env
```

Luego edita `.env` con tus datos:

```properties
DB_HOST=localhost
DB_PORT=3306
DB_NAME=udeabank
DB_USERNAME=tu_usuario
DB_PASSWORD=tu_contrasena
```

Spring Boot carga este archivo mediante `spring.config.import` en
`src/main/resources/application.properties`. Como alternativa puedes exportar
esas mismas variables en el entorno, sin crear el archivo; las variables de
entorno tienen precedencia sobre el `.env`.

Crea la base de datos antes del primer arranque (las tablas las genera Hibernate):

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS udeabank;"
```

---

## Ejecución

**Backend** — desde la raíz del proyecto:

```bash
./mvnw spring-boot:run
```

Queda en `http://localhost:8080`.

**Frontend** — en otra terminal:

```bash
cd frontend && npm install && npm run dev
```

Queda en `http://localhost:5173`. En desarrollo, el servidor de Vite reenvía
`/api` al backend, de modo que no interviene CORS. El detalle de la
configuración del cliente está en [`frontend/README.md`](frontend/README.md).

---

## API

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/api/customers` | Lista todos los clientes |
| `GET` | `/api/customers/{id}` | Consulta un cliente |
| `POST` | `/api/customers` | Crea un cliente |
| `PUT` | `/api/customers/{id}` | Actualiza un cliente (parcial) |
| `DELETE` | `/api/customers/{id}` | Elimina un cliente |
| `POST` | `/api/transactions` | Registra una transferencia |
| `GET` | `/api/transactions/{accountNumber}` | Histórico de una cuenta |

El histórico se consulta por **número de cuenta**, no por identificador de
cliente. Las transferencias usan el cuerpo
`{ senderAccountNumber, receiverAccountNumber, amount }`.

---

## Estructura

```
.
├─ src/main/java/com/udea/lab1arq/
│  ├─ controller/   CustomerController · TransactionController
│  ├─ service/      reglas de negocio y validación
│  ├─ repository/   Spring Data JPA
│  ├─ entity/       Customer · Transaction
│  ├─ DTO/          objetos de transferencia
│  ├─ mapper/       MapStruct
│  └─ config/       CorsConfig
├─ frontend/        aplicación React + Vite + Tailwind
└─ docs/            informe del laboratorio (HTML y DOCX)
```

---

## Problemas frecuentes

**`Unable to determine Dialect without JDBC metadata` al arrancar.** Falta el
archivo `.env` o alguna de sus variables. Cópialo de `.env.example` y verifica
que `DB_USERNAME` y `DB_PASSWORD` tengan valor.

**`Access denied for user`.** Las credenciales del `.env` no coinciden con las
de tu servidor MySQL.

**`403 Invalid CORS request` desde el navegador.** El frontend está en un origen
que la política no acepta. `CorsConfig` admite cualquier puerto de `localhost`;
si publicas el frontend en otro host, añádelo a `allowedOriginPatterns`.

---

## Documentación

El informe del laboratorio, con la arquitectura, el procedimiento y las pruebas
realizadas, está en [`docs/`](docs/) en formato HTML y Word.
