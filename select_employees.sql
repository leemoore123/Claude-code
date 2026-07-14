-- Author: Lee Moore
-- Select the name and email of employees in the Marketing department,
-- ordered by hire date with the newest hires first
SELECT name, email
FROM employees
WHERE department = 'Marketing'
ORDER BY hire_date DESC;
