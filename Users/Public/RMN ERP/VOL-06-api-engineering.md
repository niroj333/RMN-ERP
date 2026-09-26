# RMN ERP Specification — Volume 06: API Engineering

**Status:** AUTHORITATIVE  
**Version:** 1.0.0  
**Context:** Defines the engineering standard for all REST endpoints in the RMN ERP modular monolith.  
**Related Documents:** EWP-0001 (Core Foundations), EWP-0002 (Identity & Access)

---

## 1. API Versioning

All API endpoints must be versioned in the URL path. 

**Rule 1.1:** The version format is `/api/v{major}/...`. 
**Rule 1.2:** The initial major version is `v1`. Example: `/api/v1/users`.
**Rule 1.3:** Minor and patch versions do not appear in the URL. Non-breaking changes (adding fields, endpoints) are applied directly to the current major version.
**Rule 1.4:** Breaking changes require a new major version (e.g., `/api/v2/...`). Old versions must be deprecated gracefully with at least a 6-month sunset period.
**Rule 1.5:** Endpoints may optionally accept an `X-API-Version` header for fine-grained minor version routing if required in the future, but path-based major versioning is mandatory.

---

## 2. Request Standards

**Rule 2.1: Content Types**
All request bodies must use `Content-Type: application/json` unless specifically uploading files (where `multipart/form-data` is allowed).

**Rule 2.2: Headers**
Clients must include the following headers on every request:
- `Accept: application/json`
- `X-Correlation-ID: <uuid>` (If absent, the gateway/server will generate one)

**Rule 2.3: Request Body Conventions**
- Use `camelCase` for all JSON keys.
- Do not wrap the request payload in a `data` envelope. The top-level object is the payload.

---

## 3. Response Envelope

To ensure consistency, all successful API responses must be wrapped in a standard envelope.

**Rule 3.1: Single Resource**
```json
{
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Jane Doe",
    "createdAt": "2026-09-23T17:00:00Z"
  }
}
```

**Rule 3.2: Collection (List)**
Collections must include a `pagination` object.
```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Jane Doe"
    }
  ],
  "pagination": {
    "hasMore": true,
    "nextCursor": "eyJpZCI6I...",
    "total": 150
  }
}
```

**Rule 3.3: Empty Responses**
For operations that return no content (e.g., `DELETE`), return a `204 No Content` HTTP status code with an empty response body.

---

## 4. Error Contract

All errors must return the standard error envelope. This is non-negotiable.

**Rule 4.1: Error Shape**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid data.",
    "details": [
      {
        "field": "email",
        "message": "Must be a valid email address."
      }
    ],
    "correlationId": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2026-09-23T17:00:00Z"
  }
}
```

**Rule 4.2: Standard Error Codes**
- `INTERNAL_SERVER_ERROR`: Unhandled exceptions.
- `VALIDATION_ERROR`: Request body/query fails schema validation.
- `UNAUTHORIZED`: Missing or invalid authentication.
- `FORBIDDEN`: Authenticated, but lacks required permissions.
- `NOT_FOUND`: Resource does not exist.
- `CONFLICT`: Resource state prevents the action (e.g., duplicate unique key).
- `RATE_LIMIT_EXCEEDED`: Too many requests.
- `UNPROCESSABLE_ENTITY`: Syntactically correct but semantically invalid (e.g., business rule violation).

---

## 5. HTTP Status Code Usage

Use the exact HTTP status codes below. Do not invent new mappings.

- **200 OK:** Successful GET, PUT, PATCH, or POST (if not creating a resource).
- **201 Created:** Successful POST that creates a new resource.
- **204 No Content:** Successful DELETE or action with no return payload.
- **400 Bad Request:** Malformed request syntax or validation error (preferred: 422 for business rules).
- **401 Unauthorized:** Missing or invalid session/credentials.
- **403 Forbidden:** Valid session, but insufficient privileges.
- **404 Not Found:** Endpoint or resource ID does not exist.
- **409 Conflict:** State conflict (e.g., soft-deleted record exists, unique constraint violation).
- **422 Unprocessable Entity:** Validation failure or business rule violation.
- **429 Too Many Requests:** Rate limit exceeded.
- **500 Internal Server Error:** Unexpected backend failure.

---

## 6. Pagination

**Rule 6.1: Cursor-Based Pagination (Default)**
Public and high-volume endpoints must use cursor-based pagination to prevent performance degradation on deep offsets.
- **Query Params:** `?limit=50&cursor=eyJpZ...`
- **Response Shape:** Includes `pagination.nextCursor` and `pagination.hasMore`.

**Rule 6.2: Offset-Based Pagination (Admin/Internal Only)**
Only allowed for low-volume admin tables where sorting by multiple random columns is necessary.
- **Query Params:** `?page=1&pageSize=50`
- **Response Shape:** Includes `pagination.page`, `pagination.pageSize`, `pagination.total`.

---

## 7. Filtering & Sorting

**Rule 7.1: Filtering**
Use query parameters that match resource field names.
- Exact match: `?status=ACTIVE`
- Multiple values: `?status=ACTIVE,PENDING`
- Range (if supported): `?createdAt[gte]=2026-01-01`

**Rule 7.2: Sorting**
Use the `sort` query parameter with a comma-separated list of fields. Prefix with `-` for descending order.
- Example: `?sort=-createdAt,name`

**Rule 7.3: Searching**
Use the `q` query parameter for generic full-text search across predefined fields.
- Example: `?q=jane+doe`

---

## 8. Validation Errors

Validation must occur at the route level using Drizzle/Zod schemas before hitting the controller/service layer.

**Rule 8.1:** Return `422 Unprocessable Entity` for schema validation failures.
**Rule 8.2:** The `details` array in the error response must provide the exact path.
```json
"details": [
  {
    "field": "user.address.zipCode",
    "message": "String must contain at least 5 character(s)"
  }
]
```

---

## 9. Correlation ID

**Rule 9.1: Propagation**
Every request must be tagged with a Correlation ID (`X-Correlation-ID`). If the client does not provide one, the Fastify middleware must generate a standard UUIDv4.

**Rule 9.2: Logging**
The Correlation ID must be injected into the logger context (e.g., Pino) and included in every log entry associated with the request lifecycle.

**Rule 9.3: Downstream**
The Correlation ID must be passed down into all event payloads (Outbox/Redis Streams) to trace asynchronous processing.

---

## 10. Date/Time

**Rule 10.1: ISO 8601 Format**
All dates and times in requests and responses must conform to ISO 8601 extended format.
- Datetime: `2026-09-23T17:00:00Z`
- Date only: `2026-09-23`

**Rule 10.2: Timezones**
All timestamps must be stored in PostgreSQL as `TIMESTAMPTZ` and transmitted over the API in UTC (`Z`). Local time display is the responsibility of the client.

---

## 11. Authentication & Authorization Responses

**Rule 11.1: Authentication (401)**
If the `httpOnly` secure session cookie is missing, expired, or invalid, immediately return `401 Unauthorized`. Do not reveal whether an account exists.

**Rule 11.2: Authorization (403)**
If the session is valid but the user lacks the required role or permission for the endpoint, return `403 Forbidden`. The error message must clearly state that access is denied, but should avoid leaking internal permission structures.

---

## 12. Rate Limiting

**Rule 12.1: Headers**
Rate limiting middleware (backed by Redis) must append the following headers to all API responses:
- `X-RateLimit-Limit`: Maximum requests permitted per window.
- `X-RateLimit-Remaining`: Requests remaining in the current window.
- `X-RateLimit-Reset`: Unix timestamp when the window resets.

**Rule 12.2: Exceeding Limits**
When limits are exceeded, immediately terminate the request and return `429 Too Many Requests` with a `Retry-After` header indicating seconds until reset.

---

## 13. Health & Readiness

As per EWP-0001, health and readiness are distinct concepts. These endpoints are exempt from rate limiting and authentication.

**Rule 13.1: `/health` (Liveness)**
Returns `200 OK` if the Node.js process is running and accepting connections.
```json
{
  "status": "UP",
  "uptime": 3600,
  "timestamp": "2026-09-23T17:00:00Z"
}
```

**Rule 13.2: `/ready` (Readiness)**
Returns `200 OK` only if the application is fully ready to serve traffic (PostgreSQL and Redis connections are established). Returns `503 Service Unavailable` otherwise.
```json
{
  "status": "READY",
  "checks": {
    "database": "UP",
    "redis": "UP"
  },
  "timestamp": "2026-09-23T17:00:00Z"
}
```

---

## 14. API Documentation

**Rule 14.1: OpenAPI 3.1**
All API routes must be documented using the Fastify Swagger plugin, compliant with OpenAPI 3.1 specifications.

**Rule 14.2: Auto-generation**
Documentation must be auto-generated from Zod/TypeBox schemas used for request/response validation. Do not maintain separate, decoupled documentation files.

**Rule 14.3: Swagger UI**
Swagger UI must be exposed at `/api/docs` in development and staging environments. It must be disabled in production.

---

## 15. CORS & Security Headers

**Rule 15.1: Fastify Helmet**
All endpoints must be protected by standard security headers using `@fastify/helmet`.
- `Strict-Transport-Security` (HSTS)
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`

**Rule 15.2: CORS**
Cross-Origin Resource Sharing (CORS) must be strictly configured to allow requests only from authorized frontend domains (e.g., `*.rmn.local`, `app.rmn.com`). `Access-Control-Allow-Credentials: true` is required for `httpOnly` cookie support.
