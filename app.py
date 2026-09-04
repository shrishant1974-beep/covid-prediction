import os

from flask import Flask, jsonify, request, send_file
from flask_mysqldb import MySQL

from analysis import calculate_summary, compare_models, forecast_metrics, top_districts

app = Flask(__name__, static_folder=".", static_url_path="")

app.config["MYSQL_HOST"] = os.environ.get("MYSQL_HOST", "localhost")
app.config["MYSQL_USER"] = os.environ.get("MYSQL_USER", "root")
app.config["MYSQL_PASSWORD"] = os.environ.get("MYSQL_PASSWORD", "password")
app.config["MYSQL_DB"] = os.environ.get("MYSQL_DB", "maharashtra_covid")

mysql = MySQL(app)


@app.route("/")
def index():
    return send_file("index.html")


def selected_filters():
    return (
        request.args.get("start_date") or None,
        request.args.get("end_date") or None,
        request.args.get("district") or None,
    )


@app.route("/api/summary")
def get_summary():
    cursor = mysql.connection.cursor()
    try:
        return jsonify(calculate_summary(cursor, *selected_filters()))
    finally:
        cursor.close()


@app.route("/api/analysis")
def get_analysis():
    cursor = mysql.connection.cursor()
    try:
        start_date, end_date, district = selected_filters()
        return jsonify(
            {
                "summary": calculate_summary(cursor, start_date, end_date, district),
                "top_districts": top_districts(cursor, start_date=start_date, end_date=end_date, district=district),
                "forecast": forecast_metrics(cursor, start_date=start_date, end_date=end_date, district=district),
                "accuracy": compare_models(cursor, start_date, end_date, district),
            }
        )
    finally:
        cursor.close()


@app.route("/api/districts")
def get_districts():
    cursor = mysql.connection.cursor()
    cursor.execute(
        """
        SELECT
            d.district_id,
            d.district_name,
            COALESCE(SUM(c.new_cases), 0) AS total_cases,
            COALESCE(SUM(c.daily_deaths), 0) AS total_deaths,
            COALESCE(SUM(c.daily_recovered), 0) AS total_recovered,
            MIN(c.report_date) AS first_report_date,
            MAX(c.report_date) AS last_report_date,
            COUNT(DISTINCT c.report_date) AS reporting_days
        FROM districts d
        LEFT JOIN covid_daily c
            ON c.district_id = d.district_id
            AND c.report_date BETWEEN '2019-01-01' AND '2020-12-31'
        GROUP BY d.district_id, d.district_name
        ORDER BY d.district_name
        """
    )

    rows = cursor.fetchall()
    cursor.close()

    data = []
    for row in rows:
        total_cases = int(row[2])
        total_deaths = int(row[3])
        total_recovered = int(row[4])
        data.append(
            {
                "district_id": int(row[0]),
                "district_name": row[1],
                "district": row[1],
                "total_cases": total_cases,
                "total_deaths": total_deaths,
                "total_recovered": total_recovered,
                "active_cases": total_cases - total_deaths - total_recovered,
                "fatality_rate": round((total_deaths / total_cases) * 100, 2) if total_cases else 0.0,
                "first_report_date": row[5].strftime("%Y-%m-%d") if hasattr(row[5], "strftime") else row[5],
                "last_report_date": row[6].strftime("%Y-%m-%d") if hasattr(row[6], "strftime") else row[6],
                "reporting_days": int(row[7]),
                "has_historical_data": row[5] is not None,
            }
        )

    return jsonify(data)


@app.route("/api/covid")
def get_covid():
    cursor = mysql.connection.cursor()
    conditions = []
    params = []
    start_date, end_date, district = selected_filters()
    if start_date:
        conditions.append("c.report_date >= %s")
        params.append(start_date)
    if end_date:
        conditions.append("c.report_date <= %s")
        params.append(end_date)
    if district and district != "All":
        conditions.append("d.district_name = %s")
        params.append(district)
    where = " AND ".join(conditions) or "1=1"
    cursor.execute(
        f"""
        SELECT
            c.report_date,
            d.district_name,
            c.new_cases,
            c.daily_deaths,
            c.daily_recovered
        FROM covid_daily c
        JOIN districts d
            ON c.district_id = d.district_id
        WHERE {where}
        ORDER BY c.report_date, d.district_name
        """,
        tuple(params),
    )

    rows = cursor.fetchall()
    cursor.close()

    data = [
        {
            "date": row[0].strftime("%Y-%m-%d") if hasattr(row[0], "strftime") else row[0],
            "district": row[1],
            "cases": int(row[2]),
            "deaths": int(row[3]),
            "recovered": int(row[4]),
        }
        for row in rows
    ]

    return jsonify(data)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=False)