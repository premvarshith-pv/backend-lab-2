/**
 * Lab 2: SQLite database and CRUD routes
 * Backend Development Fundamentals · Year II Term II
 * Aurora Deemed To Be University · Faculty: Sai Siva Teja
 * Student: Prem Varshith | Registration Number: 252U1R1200
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable JSON middleware to parse incoming request bodies
app.use(express.json());

// Stable path for SQLite database
// On Vercel (serverless), the app directory is read-only, so we use /tmp/books.db
function getDatabasePath() {
  if (process.env.VERCEL) {
    const tmpDbPath = path.join('/tmp', 'books.db');
    if (!fs.existsSync(tmpDbPath)) {
      const sourceDb = path.join(__dirname, 'books.db');
      if (fs.existsSync(sourceDb)) {
        try {
          fs.copyFileSync(sourceDb, tmpDbPath);
        } catch (e) {
          // ignore copy error
        }
      }
    }
    return tmpDbPath;
  }
  return path.join(__dirname, 'books.db');
}

const defaultDbPath = getDatabasePath();

// Global database connection instance
let db = null;
let dbInitPromise = null;

// Initial 10 sample books to seed into database
const sampleBooks = [
  { title: 'Wings of Fire', author: 'A. P. J. Abdul Kalam', price: 250, pages: 180 },
  { title: 'To Kill a Mockingbird', author: 'Harper Lee', price: 399, pages: 281 },
  { title: '1984', author: 'George Orwell', price: 299, pages: 328 },
  { title: 'The Alchemist', author: 'Paulo Coelho', price: 350, pages: 208 },
  { title: 'Pride and Prejudice', author: 'Jane Austen', price: 220, pages: 279 },
  { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', price: 270, pages: 180 },
  { title: 'Atomic Habits', author: 'James Clear', price: 499, pages: 320 },
  { title: 'The Catcher in the Rye', author: 'J. D. Salinger', price: 310, pages: 234 },
  { title: 'Sapiens: A Brief History of Humankind', author: 'Yuval Noah Harari', price: 550, pages: 443 },
  { title: 'Clean Code', author: 'Robert C. Martin', price: 650, pages: 464 }
];

/**
 * Validate that an ID is a positive integer
 */
function isValidId(id) {
  const num = Number(id);
  return Number.isInteger(num) && num > 0;
}

/**
 * Validate book payload fields
 */
function validateBookPayload(body) {
  const { title, author, price, pages } = body;

  if (typeof title !== 'string' || title.trim() === '') {
    return 'Field "title" must be a non-empty string.';
  }

  if (typeof author !== 'string' || author.trim() === '') {
    return 'Field "author" must be a non-empty string.';
  }

  if (!Number.isInteger(price) || price < 0) {
    return 'Field "price" must be a non-negative integer (>= 0).';
  }

  if (!Number.isInteger(pages) || pages <= 0) {
    return 'Field "pages" must be a positive integer (> 0).';
  }

  return null;
}

/**
 * Ensures database is connected and initialized (essential for Vercel serverless cold starts)
 */
async function ensureDbInitialized(targetDbPath = getDatabasePath()) {
  if (db) return db;
  if (!dbInitPromise) {
    dbInitPromise = (async () => {
      db = await open({
        filename: targetDbPath,
        driver: sqlite3.Database
      });

      await db.exec(`
        CREATE TABLE IF NOT EXISTS book (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          author TEXT NOT NULL,
          price INTEGER NOT NULL CHECK(price >= 0),
          pages INTEGER NOT NULL CHECK(pages > 0)
        );
      `);

      const countResult = await db.get('SELECT COUNT(*) AS count FROM book;');
      if (countResult.count === 0) {
        for (const b of sampleBooks) {
          await db.run(
            'INSERT INTO book (title, author, price, pages) VALUES (?, ?, ?, ?);',
            [b.title, b.author, b.price, b.pages]
          );
        }
      }
      return db;
    })();
  }
  return dbInitPromise;
}

// Serverless middleware to guarantee DB is initialized before executing any route
app.use(async (req, res, next) => {
  try {
    if (!db) {
      await ensureDbInitialized();
    }
    next();
  } catch (err) {
    next(err);
  }
});

// Root welcome route
app.get('/', (req, res) => {
  res.status(200).json({
    project: 'Lab 2: SQLite Database and CRUD Routes',
    university: 'Aurora Deemed To Be University',
    faculty: 'Sai Siva Teja',
    student: 'Prem Varshith (252U1R1200)',
    status: 'Server & SQLite Database Active',
    endpoints: {
      getAllBooks: 'GET /books/',
      getBookById: 'GET /books/:bookId/',
      createBook: 'POST /books/',
      updateBook: 'PUT /books/:bookId/',
      deleteBook: 'DELETE /books/:bookId/'
    }
  });
});

// ========================================================
// CRUD ROUTES
// ========================================================

/**
 * ROUTE 1: GET /books/
 * Purpose: Retrieve all books from the database
 */
app.get('/books', async (req, res, next) => {
  try {
    const books = await db.all('SELECT id, title, author, price, pages FROM book ORDER BY id ASC;');
    res.status(200).json(books);
  } catch (error) {
    next(error);
  }
});

/**
 * ROUTE 2: GET /books/:bookId/
 * Purpose: Retrieve a single book by ID
 */
app.get('/books/:bookId', async (req, res, next) => {
  const { bookId } = req.params;

  if (!isValidId(bookId)) {
    return res.status(400).json({ error: 'Invalid book ID. Must be a positive integer.' });
  }

  try {
    const book = await db.get(
      'SELECT id, title, author, price, pages FROM book WHERE id = ?;',
      [Number(bookId)]
    );

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.status(200).json(book);
  } catch (error) {
    next(error);
  }
});

/**
 * ROUTE 3: POST /books/
 * Purpose: Add a new book to the database
 */
app.post('/books', async (req, res, next) => {
  const validationError = validateBookPayload(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const { title, author, price, pages } = req.body;

  try {
    const result = await db.run(
      'INSERT INTO book (title, author, price, pages) VALUES (?, ?, ?, ?);',
      [title.trim(), author.trim(), price, pages]
    );

    const newBook = {
      id: result.lastID,
      title: title.trim(),
      author: author.trim(),
      price: price,
      pages: pages
    };

    res.status(201).json(newBook);
  } catch (error) {
    next(error);
  }
});

/**
 * ROUTE 4: PUT /books/:bookId/
 * Purpose: Update an existing book by its ID
 */
app.put('/books/:bookId', async (req, res, next) => {
  const { bookId } = req.params;

  if (!isValidId(bookId)) {
    return res.status(400).json({ error: 'Invalid book ID. Must be a positive integer.' });
  }

  const validationError = validateBookPayload(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const { title, author, price, pages } = req.body;

  try {
    const existingBook = await db.get('SELECT id FROM book WHERE id = ?;', [Number(bookId)]);
    if (!existingBook) {
      return res.status(404).json({ error: 'Book not found' });
    }

    await db.run(
      'UPDATE book SET title = ?, author = ?, price = ?, pages = ? WHERE id = ?;',
      [title.trim(), author.trim(), price, pages, Number(bookId)]
    );

    const updatedBook = {
      id: Number(bookId),
      title: title.trim(),
      author: author.trim(),
      price: price,
      pages: pages
    };

    res.status(200).json(updatedBook);
  } catch (error) {
    next(error);
  }
});

/**
 * ROUTE 5: DELETE /books/:bookId/
 * Purpose: Remove a book from the database by ID
 */
app.delete('/books/:bookId', async (req, res, next) => {
  const { bookId } = req.params;

  if (!isValidId(bookId)) {
    return res.status(400).json({ error: 'Invalid book ID. Must be a positive integer.' });
  }

  try {
    const result = await db.run('DELETE FROM book WHERE id = ?;', [Number(bookId)]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.status(200).json({ message: 'Book deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Internal Error:', err.message);
  res.status(500).json({ error: 'Internal Server Error' });
});

/**
 * Asynchronous initialization function for local execution & test runner
 */
async function initializeDBAndServer(customDbPath = defaultDbPath, customPort = PORT) {
  try {
    db = await open({
      filename: customDbPath,
      driver: sqlite3.Database
    });
    console.log(`Connected to SQLite database at: ${customDbPath}`);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS book (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        price INTEGER NOT NULL CHECK(price >= 0),
        pages INTEGER NOT NULL CHECK(pages > 0)
      );
    `);
    console.log('Database table "book" verified.');

    const countResult = await db.get('SELECT COUNT(*) AS count FROM book;');
    if (countResult.count === 0) {
      console.log('Seeding 10 sample books...');
      for (const b of sampleBooks) {
        await db.run(
          'INSERT INTO book (title, author, price, pages) VALUES (?, ?, ?, ?);',
          [b.title, b.author, b.price, b.pages]
        );
      }
      console.log('10 sample books successfully seeded.');
    } else {
      console.log(`Table "book" already has ${countResult.count} records. Skipping seed.`);
    }

    let server = null;
    if (customPort !== 0 && process.env.NODE_ENV !== 'test') {
      server = app.listen(customPort, () => {
        console.log(`Server running successfully at http://localhost:${customPort}/`);
      });
    }

    return { server, db };
  } catch (error) {
    console.error('Initialization error:', error.message);
    process.exit(1);
  }
}

// Start database and server if file is executed directly
if (require.main === module) {
  initializeDBAndServer();
}

// Export app directly for Vercel serverless function compatibility
module.exports = app;
module.exports.app = app;
module.exports.initializeDBAndServer = initializeDBAndServer;
module.exports.sampleBooks = sampleBooks;
