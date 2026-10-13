# Secure Notes API

An Express and MongoDB REST API for private notes, public posts, and admin user management. It uses ES modules, Mongoose, JWT authentication, bcryptjs, and Zod validation.

## Setup

1. Use Node.js 20 or newer and a MongoDB Atlas database.
2. Run `npm install`.
3. Copy `.env.example` to `.env` and replace the placeholders with your own values. Keep `.env` private.
4. Run `npm run seed:admin` to create or update the first admin.
5. Run `npm run dev` for development, or `npm start` without watch mode.
6. Check `GET /health` for `{ "status": "ok" }`.

The API connects to MongoDB before listening. Mongoose builds the declared indexes at startup (`autoIndex: true`).

## Environment variables

| Variable | Purpose |
| --- | --- |
| `PORT` | HTTP port, for example `5000` |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret used to sign and verify one-day tokens |
| `FRONTEND_URL` | Allowed CORS origin |
| `ADMIN_EMAIL` | Email for `seed:admin` |
| `ADMIN_PASSWORD` | Password for `seed:admin` |

`ADMIN_EMAIL` and `ADMIN_PASSWORD` are needed only when running `seed:admin`. The script creates an admin if the email is absent. Otherwise it sets that user's role to `admin` and replaces the password hash using bcrypt cost 12. It never prints the password.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run with Node watch mode |
| `npm start` | Run the API normally |
| `npm run seed:admin` | Create or update the admin from env values |
| `npm run explain` | Print execution statistics for the main queries and aggregations |

`npm run explain` needs a reachable database. It prints the winning stage, index name, `totalDocsExamined`, and `nReturned` for each query. It chooses a user with both notes and posts if one exists; otherwise it uses any user. On an empty database, it uses an unused ObjectId for filtered examples.

## API

Send protected requests with `Authorization: Bearer <token>`. Login returns a token that expires after one day. JSON errors use `{ "error": { "message": "..." } }`; invalid input also includes validation details. Invalid ObjectIds return 400. Auth routes are rate limited.

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| GET | `/health` | Public | Health response |
| POST | `/api/auth/register` | Public | Register as `user`, regardless of any submitted role |
| POST | `/api/auth/login` | Public | Get `{ token, user }` |
| GET | `/api/auth/me` | Bearer | Get the current user |
| POST | `/api/notes` | Bearer | Create a private note |
| GET | `/api/notes` | Bearer | List own notes |
| GET | `/api/notes/:id` | Bearer | Get own note |
| PATCH | `/api/notes/:id` | Bearer | Update own note |
| DELETE | `/api/notes/:id` | Bearer | Delete own note |
| GET | `/api/admin/notes` | Admin | List all notes; optional `owner=<userId>` |
| POST | `/api/admin/users` | Admin | Create a user or admin |
| GET | `/api/admin/users` | Admin | List users; optional `email=<email>` |
| GET | `/api/admin/users/:id` | Admin | Get a user |
| PATCH | `/api/admin/users/:id` | Admin | Update a user |
| DELETE | `/api/admin/users/:id` | Admin | Delete a user, their notes, and their posts |
| GET | `/api/admin/users/grouped-by-interests` | Admin | Group users; optional `interest=<interest>` |
| POST | `/api/posts` | Bearer | Create a post |
| DELETE | `/api/posts/:id` | Author or admin | Delete a post |
| GET | `/api/posts` | Public | List posts |
| GET | `/api/users/:id/posts` | Public | List one user's posts and safe user fields |

List endpoints accept `page` (default 1) and `limit` (default 10, maximum 50). Standard lists return `{ data, pagination: { page, limit, total, totalPages } }`. The user-posts aggregation returns `hasMore` and sets `total` and `totalPages` to `null` because it only fetches one page plus a lookahead post. A missing user returns 404. Accessing another user's note also returns 404.

## Indexes

All listed indexes are declared with `schema.index()`; MongoDB also provides its default `_id` index for every collection.

| Index | Query it supports | Why no other index is needed |
| --- | --- | --- |
| `User { email: 1 }`, unique | Login, duplicate email enforcement, admin email filter | Exact email lookup uses this index; unfiltered users use `_id`. |
| `User { interests: 1 }`, multikey | First `$match` of filtered interest grouping | No additional index is needed for the unfiltered grouping, since it must read every user. |
| `Note { owner: 1, _id: -1 }` | Own notes and admin owner filter, newest first | Admin all-notes list and single-note reads use the default `_id` index. |
| `Post { author: 1, _id: -1 }` | User-posts `$lookup` and one author's newest posts | Public all-posts list and single-post reads use the default `_id` index. |

## Design decisions

- Lists sort by `_id` descending because ObjectIds are time ordered and the default `_id` index already supports newest-first order. A separate `createdAt` index would add write cost without helping these queries.
- Limits above 50 are rejected to bound response size and database work. They are not silently reduced.
- User-posts uses one `$lookup` with `limit + 1` to detect `hasMore`. It cannot report an exact total from that limited lookup, so `total` and `totalPages` are `null`.
- Successful DELETE requests return HTTP 204 because there is no response body to send.
- The multikey interests index helps only when the grouping has an initial interest `$match`. The unfiltered grouping must examine all users.
