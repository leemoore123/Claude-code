# Claude-code

A small collection of example scripts and queries by Lee Moore.

## Contents

| File | Language | Description |
|------|----------|-------------|
| `hello_claude.py` | Python | Prints `Hello Claude` |
| `hello_world.py` | Python | Prints a greeting in 5 languages using a loop |
| `hello_world.js` | JavaScript | Prints a greeting in 5 languages using a loop |
| `reverse_string.py` | Python | Function that reverses a string |
| `isPrime.js` | JavaScript | Function that checks whether a number is prime |
| `rename_files.py` | Python | Renames all files in a folder by adding a `project_` prefix |
| `select_employees.sql` | SQL | Selects name and email of Marketing employees, newest hires first |

## Getting the code

```bash
git clone https://github.com/leemoore123/Claude-code.git
cd Claude-code
git checkout claude/hello-claude-script-p8rqnb
```

## Running the code

### Python scripts

Requires Python 3 (check with `python3 --version`).

```bash
python3 hello_claude.py            # prints "Hello Claude"
python3 hello_world.py             # greeting in 5 languages
python3 reverse_string.py          # prints a reversed string
python3 rename_files.py <folder>   # add "project_" prefix to files in <folder>
```

`rename_files.py` requires a folder path argument, for example:

```bash
python3 rename_files.py ./my_folder
```

It skips sub-folders, ignores files that already have the prefix, and will not
overwrite an existing file.

### JavaScript files

Requires Node.js (check with `node --version`).

```bash
node hello_world.js   # greeting in 5 languages
node isPrime.js       # prints the prime numbers from 0 to 20
```

To reuse `isPrime` in your own code:

```javascript
const isPrime = require("./isPrime.js");
console.log(isPrime(7)); // true
```

### SQL query

`select_employees.sql` runs against a database that has an `employees` table.

```bash
sqlite3 mydatabase.db < select_employees.sql     # SQLite
psql -d mydatabase -f select_employees.sql       # PostgreSQL
mysql mydatabase < select_employees.sql          # MySQL
```

You can also paste the query into any database GUI (DBeaver, pgAdmin,
MySQL Workbench, etc.) and run it there.

## Installing the tools

- **Python:** https://python.org/downloads
- **Node.js:** https://nodejs.org
