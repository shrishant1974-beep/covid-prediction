# Maharashtra COVID Analytics

This project is a Flask + MySQL analytics dashboard for Maharashtra COVID data.

## Architecture

- GitHub Pages: frontend only
- Render / Railway: Flask API backend
- Cloud MySQL-compatible database: persistent data source

GitHub Pages does not run Python or MySQL. The dashboard data and district map require the Flask backend and a live database.

## Local development

1. Create a MySQL database named `maharashtra_covid`.
2. Import `maharashtra_covid.sql`.
3. Set environment variables:

```bash
set MYSQL_HOST=localhost
set MYSQL_USER=root
set MYSQL_PASSWORD=password
set MYSQL_DB=maharashtra_covid
set MYSQL_PORT=3306
```

4. Run the app:

```bash
python app.py
```

5. Open:

```text
http://127.0.0.1:5000/
```

## Production deployment

### 1. Create the database
Create a MySQL-compatible database service and import `maharashtra_covid.sql`.

### 2. Deploy the Flask backend
Use Render or Railway and deploy this repository.

Use:

```bash
gunicorn app:app --bind 0.0.0.0:$PORT
```

Set these environment variables in the hosting platform:

- `MYSQL_HOST`
- `MYSQL_PORT`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `MYSQL_DB`
- `PORT`

### 3. Configure the frontend API URL
Edit `script.js` and set:

```js
window.COVID_API_BASE = "https://YOUR-BACKEND-URL";
```

Example:

```js
window.COVID_API_BASE = "https://covid-prediction.onrender.com";
```

### 4. Deploy the frontend to GitHub Pages
Deploy the static frontend to GitHub Pages after the backend is live.

### 5. Test the app
Check:

- `/api/health`
- `/api/covid`
- `/api/summary`
- `/api/districts`
- `/api/analysis`

The GitHub Pages frontend should call the deployed backend, not localhost or 127.0.0.1.
