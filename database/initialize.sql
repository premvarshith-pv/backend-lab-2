-- Lab 2: SQLite Database Initialization Script
-- Aurora Deemed To Be University - Year II Term II
-- Student: Prem Varshith (252U1R1200)

CREATE TABLE IF NOT EXISTS book (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  price INTEGER NOT NULL CHECK(price >= 0),
  pages INTEGER NOT NULL CHECK(pages > 0)
);

-- Insert 10 sample books
INSERT INTO book (title, author, price, pages) VALUES
  ('Wings of Fire', 'A. P. J. Abdul Kalam', 250, 180),
  ('To Kill a Mockingbird', 'Harper Lee', 399, 281),
  ('1984', 'George Orwell', 299, 328),
  ('The Alchemist', 'Paulo Coelho', 350, 208),
  ('Pride and Prejudice', 'Jane Austen', 220, 279),
  ('The Great Gatsby', 'F. Scott Fitzgerald', 270, 180),
  ('Atomic Habits', 'James Clear', 499, 320),
  ('The Catcher in the Rye', 'J. D. Salinger', 310, 234),
  ('Sapiens: A Brief History of Humankind', 'Yuval Noah Harari', 550, 443),
  ('Clean Code', 'Robert C. Martin', 650, 464);

