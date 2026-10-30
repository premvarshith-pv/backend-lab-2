# Browser (Chrome) & API Screenshots Guide for Lab 2

This folder contains the screenshots showing the API running in Google Chrome and the terminal as required by the lab syllabus.

## Screenshots Checklist

The following 10 screenshots are saved in this directory:

| File Name | Method & Endpoint | Description | Status Code |
| :--- | :--- | :--- | :--- |
| `01-get-all-books.png` | `GET http://localhost:3000/books/` | Retrieve all books in Chrome | `200 OK` |
| `02-get-book-by-id.png` | `GET http://localhost:3000/books/1/` | Retrieve book 1 in Chrome | `200 OK` |
| `03-get-book-invalid-id.png` | `GET http://localhost:3000/books/abc/` | Error case: non-numeric ID | `400 Bad Request` |
| `04-get-book-not-found.png` | `GET http://localhost:3000/books/999999/` | Error case: non-existent ID | `404 Not Found` |
| `05-post-create-book.png` | `POST http://localhost:3000/books/` | Add a new book (Chrome DevTools) | `201 Created` |
| `06-post-validation-error.png`| `POST http://localhost:3000/books/` | Error case: invalid payload | `400 Bad Request` |
| `07-put-update-book.png` | `PUT http://localhost:3000/books/1/` | Update book in Chrome DevTools | `200 OK` |
| `08-delete-book.png` | `DELETE http://localhost:3000/books/1/` | Delete book in Chrome DevTools | `200 OK` |
| `09-delete-not-found.png` | `DELETE http://localhost:3000/books/999999/` | Delete non-existent ID | `404 Not Found` |
| `10-automated-tests.png` | `npm test` | Automated tests run in terminal | 13 Passed |

---

## Chrome Verification Details

- **GET Endpoints:** Run directly in Google Chrome browser address bar (`http://localhost:3000/books/`, etc.) displaying structured JSON.
- **POST / PUT / DELETE Endpoints:** Executed via Google Chrome DevTools Console/Network using asynchronous `fetch()` API with headers and JSON payloads, showing the respective HTTP response codes (`201 Created`, `200 OK`, `400 Bad Request`, `404 Not Found`).
- **Automated Tests:** Executed via `npm test` verifying all 13 scenarios passing.
