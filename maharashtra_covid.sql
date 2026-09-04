-- =========================================
-- MAHARASHTRA COVID DATABASE
-- MySQL 8.0+
-- =========================================

DROP DATABASE IF EXISTS maharashtra_covid;

CREATE DATABASE maharashtra_covid;

USE maharashtra_covid;


-- =========================================
-- DISTRICTS TABLE
-- =========================================

CREATE TABLE districts (
    district_id INT AUTO_INCREMENT PRIMARY KEY,
    district_name VARCHAR(100) NOT NULL UNIQUE,
    state VARCHAR(50) NOT NULL DEFAULT 'Maharashtra'
);


-- =========================================
-- DAILY COVID DATA
-- =========================================

CREATE TABLE covid_daily (
    record_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    district_id INT NOT NULL,
    report_date DATE NOT NULL,
    new_cases INT NOT NULL DEFAULT 0,
    daily_deaths INT NOT NULL DEFAULT 0,
    daily_recovered INT NOT NULL DEFAULT 0,

    CONSTRAINT fk_daily_district
        FOREIGN KEY (district_id)
        REFERENCES districts(district_id),

    CONSTRAINT uq_daily_district_date
        UNIQUE (district_id, report_date)
);


-- =========================================
-- CUMULATIVE TOTALS
-- =========================================

CREATE TABLE covid_totals (
    total_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    district_id INT NOT NULL,
    report_date DATE NOT NULL,
    total_cases INT NOT NULL DEFAULT 0,
    total_deaths INT NOT NULL DEFAULT 0,
    total_recovered INT NOT NULL DEFAULT 0,

    CONSTRAINT fk_totals_district
        FOREIGN KEY (district_id)
        REFERENCES districts(district_id),

    CONSTRAINT uq_totals_district_date
        UNIQUE (district_id, report_date)
);


-- =========================================
-- SAMPLE DISTRICTS
-- =========================================

INSERT INTO districts (district_name, state)
VALUES
('Ahmednagar', 'Maharashtra'),
('Akola', 'Maharashtra'),
('Amravati', 'Maharashtra'),
('Aurangabad', 'Maharashtra'),
('Beed', 'Maharashtra'),
('Bhandara', 'Maharashtra'),
('Buldhana', 'Maharashtra'),
('Chandrapur', 'Maharashtra'),
('Dhule', 'Maharashtra'),
('Gadchiroli', 'Maharashtra'),
('Gondia', 'Maharashtra'),
('Hingoli', 'Maharashtra'),
('Jalgaon', 'Maharashtra'),
('Jalna', 'Maharashtra'),
('Kolhapur', 'Maharashtra'),
('Latur', 'Maharashtra'),
('Mumbai City', 'Maharashtra'),
('Mumbai Suburban', 'Maharashtra'),
('Nagpur', 'Maharashtra'),
('Nanded', 'Maharashtra'),
('Nandurbar', 'Maharashtra'),
('Nashik', 'Maharashtra'),
('Osmanabad', 'Maharashtra'),
('Palghar', 'Maharashtra'),
('Parbhani', 'Maharashtra'),
('Pune', 'Maharashtra'),
('Raigad', 'Maharashtra'),
('Ratnagiri', 'Maharashtra'),
('Sangli', 'Maharashtra'),
('Satara', 'Maharashtra'),
('Sindhudurg', 'Maharashtra'),
('Solapur', 'Maharashtra'),
('Thane', 'Maharashtra'),
('Wardha', 'Maharashtra'),
('Washim', 'Maharashtra'),
('Yavatmal', 'Maharashtra');


-- =========================================
-- DAILY COVID DATA
-- =========================================

INSERT INTO covid_daily
    (district_id, report_date, new_cases, daily_deaths, daily_recovered)
VALUES

-- Mumbai City
((SELECT district_id FROM districts WHERE district_name = 'Mumbai City'),
 '2020-03-09', 12, 0, 2),

((SELECT district_id FROM districts WHERE district_name = 'Mumbai City'),
 '2020-03-10', 18, 1, 3),

((SELECT district_id FROM districts WHERE district_name = 'Mumbai City'),
 '2020-03-15', 42, 2, 8),

((SELECT district_id FROM districts WHERE district_name = 'Mumbai City'),
 '2020-04-10', 185, 7, 26),

((SELECT district_id FROM districts WHERE district_name = 'Mumbai City'),
 '2020-05-20', 324, 10, 82),

((SELECT district_id FROM districts WHERE district_name = 'Mumbai City'),
 '2020-09-15', 510, 14, 224),


-- Pune
((SELECT district_id FROM districts WHERE district_name = 'Pune'),
 '2020-03-09', 8, 0, 1),

((SELECT district_id FROM districts WHERE district_name = 'Pune'),
 '2020-03-10', 12, 0, 3),

((SELECT district_id FROM districts WHERE district_name = 'Pune'),
 '2020-03-15', 26, 1, 4),

((SELECT district_id FROM districts WHERE district_name = 'Pune'),
 '2020-04-10', 144, 5, 32),

((SELECT district_id FROM districts WHERE district_name = 'Pune'),
 '2020-05-20', 280, 8, 93),

((SELECT district_id FROM districts WHERE district_name = 'Pune'),
 '2020-09-15', 390, 10, 210),


-- Thane
((SELECT district_id FROM districts WHERE district_name = 'Thane'),
 '2020-03-09', 7, 0, 1),

((SELECT district_id FROM districts WHERE district_name = 'Thane'),
 '2020-03-10', 10, 0, 2),

((SELECT district_id FROM districts WHERE district_name = 'Thane'),
 '2020-03-15', 31, 1, 5),

((SELECT district_id FROM districts WHERE district_name = 'Thane'),
 '2020-04-10', 162, 6, 28),

((SELECT district_id FROM districts WHERE district_name = 'Thane'),
 '2020-05-20', 292, 9, 78),

((SELECT district_id FROM districts WHERE district_name = 'Thane'),
 '2020-09-15', 455, 11, 210),


-- Nagpur
((SELECT district_id FROM districts WHERE district_name = 'Nagpur'),
 '2020-03-09', 5, 0, 1),

((SELECT district_id FROM districts WHERE district_name = 'Nagpur'),
 '2020-03-10', 9, 0, 2),

((SELECT district_id FROM districts WHERE district_name = 'Nagpur'),
 '2020-03-15', 20, 1, 4),

((SELECT district_id FROM districts WHERE district_name = 'Nagpur'),
 '2020-04-10', 110, 4, 18),

((SELECT district_id FROM districts WHERE district_name = 'Nagpur'),
 '2020-05-20', 198, 6, 52),

((SELECT district_id FROM districts WHERE district_name = 'Nagpur'),
 '2020-09-15', 260, 8, 138),


-- Nashik
((SELECT district_id FROM districts WHERE district_name = 'Nashik'),
 '2020-03-09', 6, 0, 1),

((SELECT district_id FROM districts WHERE district_name = 'Nashik'),
 '2020-03-10', 9, 0, 2),

((SELECT district_id FROM districts WHERE district_name = 'Nashik'),
 '2020-03-15', 24, 1, 5),

((SELECT district_id FROM districts WHERE district_name = 'Nashik'),
 '2020-04-10', 118, 4, 20),

((SELECT district_id FROM districts WHERE district_name = 'Nashik'),
 '2020-05-20', 220, 7, 63),

((SELECT district_id FROM districts WHERE district_name = 'Nashik'),
 '2020-09-15', 290, 9, 170),


-- Kolhapur
((SELECT district_id FROM districts WHERE district_name = 'Kolhapur'),
 '2020-03-09', 4, 0, 1),

((SELECT district_id FROM districts WHERE district_name = 'Kolhapur'),
 '2020-03-10', 6, 0, 1),

((SELECT district_id FROM districts WHERE district_name = 'Kolhapur'),
 '2020-03-15', 17, 0, 3),

((SELECT district_id FROM districts WHERE district_name = 'Kolhapur'),
 '2020-04-10', 93, 3, 16),

((SELECT district_id FROM districts WHERE district_name = 'Kolhapur'),
 '2020-05-20', 148, 5, 48),

((SELECT district_id FROM districts WHERE district_name = 'Kolhapur'),
 '2020-09-15', 208, 7, 112),


-- Aurangabad
((SELECT district_id FROM districts WHERE district_name = 'Aurangabad'),
 '2020-03-09', 3, 0, 1),

((SELECT district_id FROM districts WHERE district_name = 'Aurangabad'),
 '2020-03-10', 5, 0, 1),

((SELECT district_id FROM districts WHERE district_name = 'Aurangabad'),
 '2020-03-15', 15, 0, 3),

((SELECT district_id FROM districts WHERE district_name = 'Aurangabad'),
 '2020-04-10', 88, 3, 15),

((SELECT district_id FROM districts WHERE district_name = 'Aurangabad'),
 '2020-05-20', 142, 4, 42),

((SELECT district_id FROM districts WHERE district_name = 'Aurangabad'),
 '2020-09-15', 200, 6, 110),


-- Palghar
((SELECT district_id FROM districts WHERE district_name = 'Palghar'),
 '2020-03-09', 4, 0, 1),

((SELECT district_id FROM districts WHERE district_name = 'Palghar'),
 '2020-03-10', 7, 0, 1),

((SELECT district_id FROM districts WHERE district_name = 'Palghar'),
 '2020-03-15', 19, 0, 3),

((SELECT district_id FROM districts WHERE district_name = 'Palghar'),
 '2020-04-10', 90, 2, 18),

((SELECT district_id FROM districts WHERE district_name = 'Palghar'),
 '2020-05-20', 174, 5, 54),

((SELECT district_id FROM districts WHERE district_name = 'Palghar'),
 '2020-09-15', 246, 7, 143);


-- =========================================
-- CUMULATIVE TOTALS
-- MySQL 8.0+
-- =========================================

INSERT INTO covid_totals
    (district_id, report_date, total_cases, total_deaths, total_recovered)
SELECT
    c.district_id,
    c.report_date,

    SUM(c.new_cases) OVER (
        PARTITION BY c.district_id
        ORDER BY c.report_date
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS total_cases,

    SUM(c.daily_deaths) OVER (
        PARTITION BY c.district_id
        ORDER BY c.report_date
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS total_deaths,

    SUM(c.daily_recovered) OVER (
        PARTITION BY c.district_id
        ORDER BY c.report_date
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS total_recovered

FROM covid_daily c;


-- =========================================
-- CHECK THE DATA
-- =========================================

SELECT * FROM districts;

SELECT * FROM covid_daily;

SELECT * FROM covid_totals;


-- =========================================
-- OPTIONAL: JOINED VIEW OF THE DATA
-- =========================================

SELECT
    d.district_name,
    c.report_date,
    c.new_cases,
    c.daily_deaths,
    c.daily_recovered,
    t.total_cases,
    t.total_deaths,
    t.total_recovered
FROM covid_daily c
JOIN districts d
    ON c.district_id = d.district_id
JOIN covid_totals t
    ON c.district_id = t.district_id
    AND c.report_date = t.report_date
ORDER BY
    d.district_name,
    c.report_date;