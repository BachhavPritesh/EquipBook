# EquipBook Backend API

Express + MongoDB REST API for the **EquipBook – Equipment & Resource Booking System**.

The API is designed to match the existing Next.js frontend: field names, booking statuses, role names, and the demo catalogue IDs all line up with the frontend fixtures.

## What is included

- JWT authentication with register, login, profile, and password change
- Five roles: `student`, `employee`, `faculty`, `manager`, `admin`
- Role-based access control for catalogue management, bookings, users, and dashboards
- Category and resource CRUD with validation and automatic asset tags
- Booking workflow: `pending → approved | rejected | cancelled`, plus `completed`
- Overlap-aware availability checks
- User dashboard and staff/admin dashboard
- Idempotent seed script with 8 demo users and 17 demo resources
- End-to-end API test script and a profile regression test

## Tech stack

| Layer | Choice |
| --- | --- |
| Runtime | Node.js **20.19+** |
| Framework | Express 5 |
| Database | MongoDB with Mongoose 9 |
| Auth | JSON Web Tokens (7-day expiry) |
| Passwords | bcryptjs (10 salt rounds) |
| Security | Helmet, CORS, express-rate-limit |

## Quick start

```bash
cd EquipBook/backend
npm install
cp .env.example .env    # then fill in MONGO_URI and JWT_SECRET
npm run seed            # creates demo users, categories, and resources
npm run dev             # starts on http://localhost:5000
```

Check that the API and database are healthy:

```bash
curl http://localhost:5000/api/health
```

```json
{
  "success": true,
  "message": "EquipBook API is running",
  "data": { "database": "connected", "timestamp": "2026-11-17T15:00:00.000Z" }
}
```

Production start (no file watching):

```bash
npm start
```

## Environment variables

Copy `.env.example` to `.env` and set the values:

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | No | API port. Defaults to `5000`. |
| `NODE_ENV` | No | `development` or `production`. |
| `CLIENT_URL` | No | Allowed CORS origin. Defaults to `http://localhost:3000`. |
| `MONGO_URI` | **Yes** | MongoDB connection string (local or Atlas). |
| `JWT_SECRET` | **Yes** | Long random secret used to sign tokens. The server exits if missing. |

If you use MongoDB Atlas, allow your current IP in **Atlas → Network Access** before connecting.

## Demo accounts

`npm run seed` creates these accounts. The password for all of them is `demo1234`.

| Name | Email | Role |
| --- | --- | --- |
| Aarav Mehta | `aarav.mehta@northbridge.edu` | student |
| Priya Nair | `priya.nair@northbridge.edu` | manager |
| Maya Chen | `maya.chen@northbridge.edu` | faculty |
| Daniel Okafor | `daniel.okafor@northbridge.edu` | employee |
| Sofia Ramirez | `sofia.ramirez@northbridge.edu` | student |
| Liam Patel | `liam.patel@northbridge.edu` | student |
| Emma Johansson | `emma.johansson@northbridge.edu` | faculty |
| Noah Williams | `noah.williams@northbridge.edu` | employee |

`manager` and `admin` are the staff roles. Only an admin can change another user's role; there is no seeded admin, so promote a demo user directly in MongoDB if you need to test that endpoint:

```js
db.users.updateOne(
  { email: "priya.nair@northbridge.edu" },
  { $set: { role: "admin" } }
)
```

## Roles and permissions

| Action | student / employee / faculty | manager | admin |
| --- | --- | --- | --- |
| Register / login / view own profile | Yes | Yes | Yes |
| Browse categories and resources | Yes | Yes | Yes |
| Create a booking | Yes | Yes | Yes |
| View / cancel own bookings | Yes | Yes | Yes |
| View own dashboard | Yes | Yes | Yes |
| View all bookings | No | Yes | Yes |
| Approve / reject bookings, edit admin notes | No | Yes | Yes |
| View all users | No | Yes | Yes |
| Create / update / delete categories and resources | No | Yes | Yes |
| Change user roles | No | No | Yes |

Extra safety rules:

- Public registration only accepts `student`, `employee`, or `faculty`. It cannot create staff accounts.
- Staff cannot approve or reject their own booking.
- Only pending bookings can be cancelled or decided.
- The last remaining admin cannot be demoted.

## API conventions

- **Base URL:** `http://localhost:5000/api`
- **Content type:** `application/json`
- **Auth header:** `Authorization: Bearer <token>`
- **Dates:** `YYYY-MM-DD`
- **Times:** `HH:mm` (24-hour)
- **IDs:** MongoDB ObjectIds are returned as `id` (and for bookings also `userId` / `resourceId`). Category IDs are strings such as `cat-av`.

### Success envelope

```json
{
  "success": true,
  "message": "Human-readable result",
  "data": {}
}
```

### Error envelope

```json
{
  "success": false,
  "message": "What went wrong"
}
```

### Common status codes

| Code | Meaning |
| --- | --- |
| `200` | Request succeeded |
| `201` | Record created |
| `400` | Validation error or bad input |
| `401` | Missing, invalid, or expired token |
| `403` | Authenticated but not allowed |
| `404` | Record not found |
| `409` | Conflict (duplicate, unavailable, wrong status) |
| `429` | Rate limit exceeded (300 requests / 15 minutes / IP) |

---

## Endpoints

### Health

#### `GET /api/health`

Public. Confirms the API and database connection are up.

---

### Authentication

#### `POST /api/auth/register`

Public. Creates a regular user and returns a token.

```json
{
  "name": "New Student",
  "email": "new.student@northbridge.edu",
  "password": "secret123",
  "confirmPassword": "secret123",
  "phone": "+1 (415) 555-0100",
  "department": "Computer Science",
  "role": "student"
}
```

Notes:

- `name`, `email`, and `password` are required.
- Password minimum is 8 characters.
- `confirmPassword` is optional, but must match when provided.
- `role` is optional and defaults to `student`; allowed values are `student`, `employee`, `faculty`.

Response `201`:

```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "user": { "id": "...", "name": "New Student", "email": "...", "role": "student" },
    "token": "eyJhbGciOi..."
  }
}
```

#### `POST /api/auth/login`

Public.

```json
{ "email": "aarav.mehta@northbridge.edu", "password": "demo1234" }
```

Response `200` contains `data.user` and `data.token`.

#### `GET /api/auth/me`

Private. Returns the current user.

#### `PUT /api/auth/me`

Private. Updates the profile. `name` is required (2–80 characters); `department` (≤100) and `phone` (≤30) are optional.

```json
{
  "name": "Aarav Mehta",
  "department": "Computer Science",
  "phone": "+1 (415) 555-0142"
}
```

#### `PUT /api/auth/password`

Private. Changes the password.

```json
{
  "currentPassword": "demo1234",
  "newPassword": "newsecret123",
  "confirmPassword": "newsecret123"
}
```

`confirmPassword` is optional but must match when provided. The new password must differ from the current one.

---

### Users (staff)

All routes require a token. `manager` and `admin` can list and inspect users; only `admin` can change roles.

#### `GET /api/users?search=&role=`

- `search` matches name, email, department, or phone (case-insensitive).
- `role` accepts any of the five roles, or `all`.

Response:

```json
{
  "success": true,
  "message": "Users loaded successfully",
  "data": {
    "count": 8,
    "users": [{ "id": "...", "name": "Aarav Mehta", "email": "...", "role": "student" }]
  }
}
```

#### `GET /api/users/:id`

Returns one user.

#### `PUT /api/users/:id/role`

Admin only.

```json
{ "role": "manager" }
```

Rejected with `403` when changing your own role; `409` when demoting the last admin.

---

### Categories

Reads are public. Writes require `manager` or `admin`.

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/categories` | Public | List categories, sorted by name |
| `GET` | `/api/categories/:id` | Public | Get one category |
| `POST` | `/api/categories` | Staff | Create a category |
| `PUT` | `/api/categories/:id` | Staff | Update a category |
| `DELETE` | `/api/categories/:id` | Staff | Delete an empty category |

Create / update body:

```json
{
  "name": "Audio & Visual",
  "description": "Cameras, microphones, and recording equipment."
}
```

Notes:

- `name`: 2–60 characters, unique (case-insensitive).
- `description`: 10–300 characters.
- IDs are generated from the name, e.g. `Audio & Visual` → `cat-audio-visual`.
- A category containing resources cannot be deleted (`409`).

---

### Resources

Reads are public. Writes require `manager` or `admin`.

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/resources` | Public | List/search resources |
| `GET` | `/api/resources/:id` | Public | Get one resource |
| `POST` | `/api/resources` | Staff | Create a resource |
| `PUT` | `/api/resources/:id` | Staff | Update a resource |
| `DELETE` | `/api/resources/:id` | Staff | Delete a resource |

#### List query parameters

| Parameter | Values | Description |
| --- | --- | --- |
| `search` | text | Matches name, asset tag, location, or description |
| `categoryId` | category ID or `all` | Filter by category |
| `location` | location or `all` | Filter by exact location |
| `availability` | `all` (default), `available`, `unavailable`, `maintenance` | Availability filter |
| `status` | same as `availability` | Alias kept for API clients |
| `sort` | `newest` (default), `name-asc`, `name-desc`, `availability` | Sort order |

`available` means status is `available` and stock is greater than zero. `unavailable` includes resources explicitly marked unavailable and resources with zero stock, but excludes maintenance items.

#### Resource shape

```json
{
  "id": "000000000000000000000101",
  "assetTag": "EQ-AV-0142",
  "name": "Sony A7 IV Cinema Kit",
  "description": "Full-frame mirrorless camera kit ...",
  "categoryId": "cat-av",
  "location": "Media Lab 2",
  "image": "https://images.unsplash.com/photo-...",
  "totalQuantity": 6,
  "availableQuantity": 3,
  "status": "available",
  "instructions": "Charge both batteries before use ...",
  "requirements": ["Completed media safety induction", "..."],
  "createdAt": "2026-11-17T15:01:24.266Z",
  "updatedAt": "2026-11-17T15:01:24.266Z"
}
```

#### Create / update body

`PUT` validates the same full payload as `POST` (it replaces the editable fields).

```json
{
  "name": "Sony A7 IV Cinema Kit",
  "description": "Full-frame mirrorless camera kit with two prime lenses.",
  "categoryId": "cat-av",
  "location": "Media Lab 2",
  "image": "https://images.unsplash.com/photo-1519183071298-a2962be90b8e",
  "totalQuantity": 6,
  "availableQuantity": 3,
  "status": "available",
  "instructions": "Charge both batteries before use and return the case.",
  "requirements": ["Media safety induction", "Valid student ID"]
}
```

Validation:

- `name`: 2–80 characters
- `description`: 20–600 characters
- `location`: 2–100 characters
- `image`: valid `http`/`https` URL, ≤500 characters
- `totalQuantity`: integer 1–500
- `availableQuantity`: integer 0–500, and ≤ `totalQuantity`
- `status`: `available`, `unavailable`, or `maintenance`
- `instructions`: 10–600 characters
- `requirements`: non-empty list of strings, combined ≤600 characters

`assetTag` is generated automatically and is not accepted from clients. It follows `EQ-<CATEGORY-PREFIX>-<SEQUENCE>`, e.g. `EQ-AV-0143`.

---

### Availability

#### `GET /api/availability`

Private (any logged-in user).

Query parameters:

| Parameter | Required | Example |
| --- | --- | --- |
| `resourceId` | Yes | `000000000000000000000101` |
| `quantity` | Yes | `2` |
| `startDate` | Yes | `2026-12-01` |
| `endDate` | Yes | `2026-12-03` |
| `startTime` | Yes | `09:00` |
| `endTime` | Yes | `17:00` |

Example:

```bash
curl "http://localhost:5000/api/availability?resourceId=000000000000000000000101&quantity=2&startDate=2026-12-01&endDate=2026-12-01&startTime=09:00&endTime=17:00" \
  -H "Authorization: Bearer <token>"
```

Response:

```json
{
  "success": true,
  "message": "The requested quantity is available",
  "data": {
    "resource": {
      "id": "000000000000000000000101",
      "name": "Sony A7 IV Cinema Kit",
      "totalQuantity": 6,
      "availableQuantity": 3,
      "status": "available"
    },
    "requestedQuantity": 2,
    "alreadyBooked": 0,
    "availableQuantity": 3,
    "canBook": true,
    "window": {
      "startDate": "2026-12-01",
      "endDate": "2026-12-01",
      "startTime": "09:00",
      "endTime": "17:00"
    }
  }
}
```

### How availability is calculated

`resource.availableQuantity` is the **base stock**. It is not decremented when a booking is approved.

For a requested window:

```
available = base availableQuantity
          − sum(quantity of approved bookings that overlap the window)
```

- Only `approved` bookings count. `pending` requests do not reserve stock.
- Two windows overlap when `bookingStart < requestedEnd` and `bookingEnd > requestedStart`; touching endpoints do not overlap.
- The result is clamped to zero.
- Approving a booking re-runs this calculation, so two managers cannot over-approve the same stock.

---

### Bookings

All booking routes require a token. Regular users see and modify only their own records; staff see everything.

#### `POST /api/bookings`

Any logged-in user. Creates a `pending` request after checking availability.

```json
{
  "resourceId": "000000000000000000000101",
  "purpose": "Record interviews for the student documentary project.",
  "startDate": "2026-12-01",
  "endDate": "2026-12-01",
  "startTime": "09:00",
  "endTime": "17:00",
  "quantity": 1,
  "notes": "Collecting from the Media Lab at 08:45."
}
```

Validation:

- `purpose`: 10–240 characters
- `quantity`: whole number 1–50, and ≤ the resource's `totalQuantity`
- `notes`: ≤500 characters
- End must be after start
- Resource must exist and have status `available`
- Requested quantity must fit the dynamically calculated availability (`409` otherwise)

The server generates a reference such as `EQ-2026-0001`.

#### `GET /api/bookings`

Query parameters:

| Parameter | Who | Description |
| --- | --- | --- |
| `status` | Everyone | `pending`, `approved`, `rejected`, `cancelled`, `completed`, or `all` |
| `resourceId` | Everyone | Filter by resource |
| `userId` | Staff only | Filter by booking user (ignored for regular users) |

Regular users are always scoped to their own bookings.

Response:

```json
{
  "success": true,
  "message": "Bookings loaded successfully",
  "data": {
    "count": 1,
    "bookings": [
      {
        "id": "...",
        "bookingReference": "EQ-2026-0001",
        "user": { "id": "...", "name": "Aarav Mehta", "email": "..." },
        "userId": "...",
        "resource": { "id": "...", "name": "Sony A7 IV Cinema Kit", "assetTag": "EQ-AV-0142" },
        "resourceId": "...",
        "purpose": "Record interviews ...",
        "startDate": "2026-12-01",
        "endDate": "2026-12-01",
        "startTime": "09:00",
        "endTime": "17:00",
        "quantity": 1,
        "status": "pending",
        "notes": "Collecting from the Media Lab at 08:45.",
        "adminNotes": "",
        "createdAt": "2026-11-17T15:10:00.000Z",
        "updatedAt": "2026-11-17T15:10:00.000Z"
      }
    ]
  }
}
```

#### `GET /api/bookings/:id`

Owner or staff. Others receive `403`.

#### `PUT /api/bookings/:id/cancel`

Owner only, pending only. Sets status to `cancelled` and records `decisionAt`. Staff cannot cancel someone else's booking through this route.

#### `PUT /api/bookings/:id/approve`

Staff only. Pending only. Cannot approve your own booking.

```json
{ "adminNotes": "Approved. Collect from the Media Lab." }
```

`adminNotes` is optional (≤500 characters). The API re-checks resource status and overlapping availability before approving.

#### `PUT /api/bookings/:id/reject`

Staff only. Pending only. Cannot reject your own booking.

```json
{ "adminNotes": "The requested dates overlap a maintenance window." }
```

A reason is required: 5–500 characters.

#### `PUT /api/bookings/:id/notes`

Staff only. Replaces `adminNotes` (≤500 characters) on any booking.

---

### Dashboards

#### `GET /api/dashboard/user`

Any logged-in user. Returns their booking counts and five most recent bookings.

```json
{
  "success": true,
  "message": "User dashboard loaded successfully",
  "data": {
    "stats": {
      "totalBookings": 4,
      "pendingBookings": 1,
      "approvedBookings": 2,
      "rejectedBookings": 0,
      "cancelledBookings": 1,
      "completedBookings": 0,
      "rejectedOrCancelled": 1
    },
    "recentBookings": []
  }
}
```

#### `GET /api/dashboard/admin`

Staff only (`manager` or `admin`). Returns platform-wide counts, recent bookings, and an inventory summary.

```json
{
  "success": true,
  "message": "Admin dashboard loaded successfully",
  "data": {
    "stats": {
      "totalUsers": 8,
      "totalResources": 17,
      "totalBookings": 0,
      "pendingBookings": 0,
      "approvedBookings": 0,
      "rejectedBookings": 0,
      "cancelledBookings": 0,
      "completedBookings": 0
    },
    "recentBookings": [],
    "resourceSummary": {
      "totalResources": 17,
      "totalUnits": 108,
      "availableUnits": 83,
      "fullyBooked": 0,
      "maintenance": 1,
      "lowStock": 1
    }
  }
}
```

`lowStock` counts non-maintenance resources whose available stock is greater than zero but at or below 25% of total stock.

---

## Seed script

```bash
npm run seed
```

The script is idempotent: running it twice updates the same records instead of duplicating them. It seeds:

- 5 categories (`cat-av`, `cat-computing`, `cat-presentation`, `cat-media`, `cat-research`)
- 8 demo users
- 17 demo resources, including one maintenance item with zero stock

Fixed IDs match the frontend mock data, so existing demo links keep working after switching to the API. The seed does **not** create bookings and does not reset data it does not own.

## Testing

Start the API first (`npm run dev` or `npm start`), then in another terminal:

```bash
npm run test:api
npm run test:profile
```

- `test:api` creates temporary users/resources/bookings, exercises the full workflow and permission rules, then deletes what it created. It prints each step and ends with `All API integration tests passed.`
- `test:profile` is a focused regression test for the profile update flow.

The test scripts read `MONGO_URI` from `.env` and call the running server at `http://localhost:5000`.

## Project structure

```
backend/
├── config/
│   └── db.js                  MongoDB connection helper
├── controllers/
│   ├── authController.js      Register, login, profile, password
│   ├── bookingController.js   Bookings + availability logic
│   ├── categoryController.js  Category CRUD
│   ├── dashboardController.js User/admin dashboard data
│   ├── resourceController.js  Resource CRUD + filtering
│   └── userController.js      Staff user list + role updates
├── middleware/
│   ├── authMiddleware.js      protect / authorize
│   └── errorMiddleware.js     notFound + global error handler
├── models/
│   ├── Booking.js
│   ├── Category.js
│   ├── Resource.js
│   └── User.js
├── routes/                    One router per resource
├── scripts/
│   ├── test-api.mjs
│   └── test-profile.mjs
├── utils/
│   └── httpError.js
├── seed-data.js               Demo fixtures
├── seed.js                    Idempotent seed runner
├── server.js                  App entry point
└── package.json
```

## Connecting the Next.js frontend

No frontend files were changed in this backend pass. To connect the UI:

1. Create `EquipBook/frontend/.env.local`:

   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

2. Send the JWT on protected calls:

   ```ts
   const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bookings`, {
     headers: { Authorization: `Bearer ${token}` },
   });
   ```

3. Store the token after login (`localStorage`, a cookie, or your existing auth context) and handle `401` by redirecting to the login page.
4. Replace the direct `mock-data` imports with API calls. Seeded IDs match the fixtures, so category/resource links and demo bookings keep the same identifiers.
5. Keep date/time values as `YYYY-MM-DD` and `HH:mm` strings; the API validates those formats.

Default CORS allows `http://localhost:3000`. If the frontend runs on another port, update `CLIENT_URL`.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `JWT_SECRET is missing` on startup | Add `JWT_SECRET` to `backend/.env`. |
| `MONGO_URI is missing` | Add `MONGO_URI` to `backend/.env`. |
| Server exits after a connection error | Check the Atlas connection string and allow your IP in Atlas Network Access. |
| Browser blocked by CORS | Set `CLIENT_URL` to the exact frontend origin and restart the API. |
| `401` on a protected route | Send `Authorization: Bearer <token>` with a token from login/register. |
| `429 Too many requests` | The API allows 300 requests per IP per 15 minutes; wait and retry. |
| Seed reports an email conflict | A different user already owns one of the demo emails. Resolve it manually, then rerun. |
| Port 5000 already in use | Set `PORT` in `.env` and update the frontend API URL. |

## Notes

- Passwords are hashed with bcrypt and never returned by the API.
- Resource images are URLs; there is no file upload endpoint.
- Booking references are generated per year and are unique.
- Resource `availableQuantity` is base stock. Real-time availability comes from `/api/availability` and the booking endpoints.
- There are no automated emails or background jobs; all state changes happen through the API.
