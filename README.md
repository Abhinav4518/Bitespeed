# Bitespeed Backend Task: Identity Reconciliation

This is a RESTful web service built for Bitespeed to handle customer identity reconciliation. It links multiple orders made with varying contact information (emails and phone numbers) to a single, consolidated customer profile.

### 🚀 Live Endpoint
**Base URL:** `https://bitespeed-1-27n4.onrender.com/`  
**API Endpoint:** `https://bitespeed-1-27n4.onrender.com/identify` (Accepts `POST` requests)

*(Note: As this is hosted on a free Render tier, the initial request might take up to 50 seconds to spin up if the server is sleeping. Subsequent requests will be fast.)*

---

## 🛠 Tech Stack
* **Runtime:** Node.js
* **Framework:** Express.js
* **Language:** TypeScript
* **ORM:** Prisma (v6)
* **Database:** SQLite (Chosen for seamless local setup and zero external dependencies)

---

## 📖 The Core Logic
The service maintains a single relational `Contact` table. Contacts are linked together if they share either an email or a phone number. The oldest contact in a cluster is designated as the **"primary"**, while all subsequently linked contacts are marked as **"secondary"**.

The `/identify` endpoint handles three main scenarios:
1. **Brand New Customer:** If an incoming request has no matching email or phone number in the database, a new `primary` contact is created.
2. **Adding New Information:** If the request shares *either* an email or phone number with an existing profile, but introduces a new piece of contact info, a `secondary` contact is created and linked to the primary profile.
3. **Consolidating Profiles:** If a request contains an email belonging to one primary contact and a phone number belonging to *another* primary contact, the system merges them. The older profile remains `primary`, and the newer profile is demoted to `secondary`.

---

## 📡 API Documentation

### `POST /identify`
Consolidates customer contact details.

**Request Body (JSON):**
```json
{
  "email": "doc@hillvalley.edu",
  "phoneNumber": "123456"
}
