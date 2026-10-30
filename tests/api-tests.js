/**
 * Automated Test Suite for Lab 2 CRUD Routes
 * Tests all 5 endpoints, validations, and edge cases.
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { app, initializeDBAndServer } = require('../app');

const TEST_DB_PATH = path.join(__dirname, 'test-books.db');
let serverInstance = null;
let baseUrl = '';
let dbInstance = null;

if (fs.existsSync(TEST_DB_PATH)) {
  try {
    fs.unlinkSync(TEST_DB_PATH);
  } catch (e) {}
}

let passed = 0;
let failed = 0;

async function test(name, fn) {
  process.stdout.write(`  [TEST] ${name} ... `);
  try {
    await fn();
    console.log('PASSED [OK]');
    passed++;
  } catch (err) {
    console.log('FAILED [X]');
    console.error(`         ${err.message}`);
    failed++;
  }
}

async function run() {
  console.log('====================================================');
  console.log('Running Lab 2 Automated Test Suite');
  console.log('====================================================\n');

  process.env.NODE_ENV = 'test';
  const { db } = await initializeDBAndServer(TEST_DB_PATH, 0);
  dbInstance = db;

  await new Promise((resolve) => {
    serverInstance = app.listen(0, () => {
      const port = serverInstance.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      console.log(`Test server running at ${baseUrl}\n`);
      resolve();
    });
  });

  let createdId = null;

  try {
    // 1. GET /books/ returns 200 and all 10 books
    await test('GET /books/ returns 200 and seeded books array', async () => {
      const res = await fetch(`${baseUrl}/books`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert(Array.isArray(data));
      assert.strictEqual(data.length, 10);
    });

    // 2. GET /books/:bookId/ returns specific book
    await test('GET /books/1/ returns book with ID 1', async () => {
      const res = await fetch(`${baseUrl}/books/1/`);
      assert.strictEqual(res.status, 200);
      const book = await res.json();
      assert.strictEqual(book.id, 1);
      assert.strictEqual(book.title, 'Wings of Fire');
    });

    // 3. GET /books/:bookId/ with invalid ID returns 400
    await test('GET /books/abc/ returns 400 Bad Request', async () => {
      const res = await fetch(`${baseUrl}/books/abc/`);
      assert.strictEqual(res.status, 400);
      const body = await res.json();
      assert(body.error);
    });

    // 4. GET /books/:bookId/ with non-existent ID returns 404
    await test('GET /books/999999/ returns 404 Not Found', async () => {
      const res = await fetch(`${baseUrl}/books/999999/`);
      assert.strictEqual(res.status, 404);
      const body = await res.json();
      assert(body.error);
    });

    // 5. POST /books/ creates a book and returns 201
    await test('POST /books/ creates a new book and returns 201 Created', async () => {
      const payload = {
        title: 'Computer Networks',
        author: 'Andrew S. Tanenbaum',
        price: 799,
        pages: 960
      };
      const res = await fetch(`${baseUrl}/books/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      assert.strictEqual(res.status, 201);
      const book = await res.json();
      assert(book.id);
      assert.strictEqual(book.title, payload.title);
      assert.strictEqual(book.author, payload.author);
      assert.strictEqual(book.price, payload.price);
      assert.strictEqual(book.pages, payload.pages);
      createdId = book.id;
    });

    // 6. POST /books/ validation fails with missing fields -> 400
    await test('POST /books/ with missing fields returns 400 Bad Request', async () => {
      const payload = { title: 'No Author Book' };
      const res = await fetch(`${baseUrl}/books/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      assert.strictEqual(res.status, 400);
    });

    // 7. POST /books/ validation fails with negative price -> 400
    await test('POST /books/ with negative price returns 400 Bad Request', async () => {
      const payload = {
        title: 'Invalid Book',
        author: 'Author',
        price: -100,
        pages: 200
      };
      const res = await fetch(`${baseUrl}/books/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      assert.strictEqual(res.status, 400);
    });

    // 8. GET /books/:bookId/ fetches the newly created book
    await test('GET /books/:id/ returns newly created book', async () => {
      assert(createdId, 'createdId must exist');
      const res = await fetch(`${baseUrl}/books/${createdId}/`);
      assert.strictEqual(res.status, 200);
      const book = await res.json();
      assert.strictEqual(book.id, createdId);
      assert.strictEqual(book.title, 'Computer Networks');
    });

    // 9. PUT /books/:bookId/ updates existing book -> 200
    await test('PUT /books/:id/ updates existing book and returns 200 OK', async () => {
      const updated = {
        title: 'Computer Networks (6th Edition)',
        author: 'Andrew S. Tanenbaum',
        price: 899,
        pages: 980
      };
      const res = await fetch(`${baseUrl}/books/${createdId}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      assert.strictEqual(res.status, 200);
      const book = await res.json();
      assert.strictEqual(book.id, createdId);
      assert.strictEqual(book.title, updated.title);
      assert.strictEqual(book.price, updated.price);
    });

    // 10. PUT /books/:bookId/ with invalid data returns 400
    await test('PUT /books/:id/ with invalid pages returns 400 Bad Request', async () => {
      const invalid = {
        title: 'Updated Title',
        author: 'Author',
        price: 500,
        pages: -10 // invalid
      };
      const res = await fetch(`${baseUrl}/books/${createdId}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalid)
      });
      assert.strictEqual(res.status, 400);
    });

    // 11. DELETE /books/:bookId/ removes the book -> 200
    await test('DELETE /books/:id/ deletes book and returns 200 OK', async () => {
      const res = await fetch(`${baseUrl}/books/${createdId}/`, {
        method: 'DELETE'
      });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.message, 'Book deleted successfully');
    });

    // 12. GET /books/:bookId/ after deletion returns 404
    await test('GET /books/:id/ after deletion returns 404 Not Found', async () => {
      const res = await fetch(`${baseUrl}/books/${createdId}/`);
      assert.strictEqual(res.status, 404);
    });

    // 13. DELETE /books/999999/ returns 404
    await test('DELETE /books/999999/ returns 404 Not Found', async () => {
      const res = await fetch(`${baseUrl}/books/999999/`, {
        method: 'DELETE'
      });
      assert.strictEqual(res.status, 404);
    });

  } finally {
    if (serverInstance) {
      await new Promise((resolve) => serverInstance.close(resolve));
    }
    if (dbInstance) {
      try {
        await dbInstance.close();
      } catch (e) {}
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
    if (fs.existsSync(TEST_DB_PATH)) {
      try {
        fs.unlinkSync(TEST_DB_PATH);
      } catch (e) {}
    }
  }

  console.log('\n====================================================');
  console.log(`Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

