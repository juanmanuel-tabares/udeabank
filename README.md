# UdeaBank

[![CI/CD Pipeline](https://github.com/juanmanuel-tabares/udeabank/actions/workflows/build.yml/badge.svg)](https://github.com/juanmanuel-tabares/udeabank/actions/workflows/build.yml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=juanmanuel-tabares_udeabank&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=juanmanuel-tabares_udeabank)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=juanmanuel-tabares_udeabank&metric=coverage)](https://sonarcloud.io/summary/new_code?id=juanmanuel-tabares_udeabank)
[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=juanmanuel-tabares_udeabank&metric=bugs)](https://sonarcloud.io/summary/new_code?id=juanmanuel-tabares_udeabank)
[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=juanmanuel-tabares_udeabank&metric=code_smells)](https://sonarcloud.io/summary/new_code?id=juanmanuel-tabares_udeabank)
[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=juanmanuel-tabares_udeabank&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=juanmanuel-tabares_udeabank)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=juanmanuel-tabares_udeabank&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=juanmanuel-tabares_udeabank)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=juanmanuel-tabares_udeabank&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=juanmanuel-tabares_udeabank)
[![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=juanmanuel-tabares_udeabank&metric=sqale_index)](https://sonarcloud.io/summary/new_code?id=juanmanuel-tabares_udeabank)
[![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=juanmanuel-tabares_udeabank&metric=ncloc)](https://sonarcloud.io/summary/new_code?id=juanmanuel-tabares_udeabank)

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
| Docker | Opcional, para construir la imagen |

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
DB_SSL_MODE=DISABLED
```

`DB_SSL_MODE` controla el TLS de la conexión: `DISABLED` en local y `REQUIRED`
para un MySQL administrado como Aiven. Si la base de datos no existe, el driver
la crea al conectarse.

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
| `GET` | `/api/health` | Health check (`HEALTH CHECK OK!`) |
| `GET` | `/api/version` | Versión y commit desplegado |

El histórico se consulta por **número de cuenta**, no por identificador de
cliente. Las transferencias usan el cuerpo
`{ senderAccountNumber, receiverAccountNumber, amount }`.

---

## Pruebas

```bash
./mvnw clean verify
```

Las pruebas usan H2 en memoria (`src/test/resources/application.properties`),
así que no necesitan MySQL. JaCoCo deja el reporte de cobertura en
`target/site/jacoco/index.html`.

| Tipo | Clases |
| --- | --- |
| Unitarias (Mockito) | `CustomerServiceTest`, `TransactionServiceTest` |
| Controladores (MockMvc) | `CustomerControllerTest`, `TransactionControllerTest`, `AppInfoControllerTest` |
| Integración (H2) | `TransferFlowIntegrationTest`, `Lab1arqApplicationTests` |

---

## CI/CD

El pipeline está en [`.github/workflows/build.yml`](.github/workflows/build.yml)
y se ejecuta en cada push a `main` o `develop`, en cada pull request hacia
`main` y de forma manual desde la pestaña **Actions**.

```
Unit tests ──► SonarCloud analysis ──► Build (JAR) ──► Docker image ──► Deploy to Render
```

| Job | Qué hace |
| --- | --- |
| Unit tests | `mvn test` con JaCoCo; publica el reporte de cobertura como artefacto |
| SonarCloud analysis | `mvn verify` + análisis estático y cobertura en SonarCloud |
| Build | `mvn package` y publica `udeabank.jar` como artefacto |
| Docker image | Empaqueta ese JAR con el `Dockerfile` y lo sube a Docker Hub (en los PR solo construye) |
| Deploy to Render | Solo en `main`: dispara el Deploy Hook de Render y espera a que `/api/version` muestre el commit nuevo |

Etiquetas de la imagen `udeabank` en Docker Hub: `latest` (solo `main`), el
nombre de la rama (`main`, `develop`) y `sha-<commit>`.

**Flujo de ramas (trunk based):** los cambios se hacen en `develop`, se abre un
pull request hacia `main`, el pipeline valida el PR y, con todos los checks en
verde, se hace el merge. El push a `main` publica `latest` y despliega.

**Secretos y variables del repositorio** (Settings → Secrets and variables → Actions):

| Nombre | Tipo | Uso |
| --- | --- | --- |
| `SONAR_TOKEN` | Secret | Token de SonarCloud |
| `DOCKER_USERNAME` | Secret | Usuario de Docker Hub |
| `DOCKER_PASSWORD` | Secret | Access token de Docker Hub |
| `RENDER_DEPLOY_HOOK_URL` | Secret | Deploy Hook del servicio en Render |
| `RENDER_SERVICE_URL` | Variable | URL pública del servicio, para la prueba de humo |

---

## Docker

```bash
./mvnw -B package -DskipTests
docker build -t udeabank .
docker run -p 8080:8080 --env-file .env -e DB_HOST=host.docker.internal udeabank
```

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
