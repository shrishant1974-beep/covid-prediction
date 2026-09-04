from __future__ import annotations


def _filters(start_date=None, end_date=None, district=None, alias="c"):
    clauses = []
    params = []
    if start_date:
        clauses.append(f"{alias}.report_date >= %s")
        params.append(start_date)
    if end_date:
        clauses.append(f"{alias}.report_date <= %s")
        params.append(end_date)
    if district and district != "All":
        clauses.append(f"d.district_name = %s")
        params.append(district)
    return (" AND ".join(clauses) or "1=1"), params


def calculate_summary(cursor, start_date=None, end_date=None, district=None):
    where, params = _filters(start_date, end_date, district)
    cursor.execute(
        f"""
        SELECT
            COALESCE(SUM(c.new_cases), 0),
            COALESCE(SUM(c.daily_deaths), 0),
            COALESCE(SUM(c.daily_recovered), 0)
        FROM covid_daily c
        JOIN districts d ON c.district_id = d.district_id
        WHERE {where}
        """,
        tuple(params),
    )
    total_cases, total_deaths, total_recovered = cursor.fetchone()

    active_cases = max(int(total_cases) - int(total_deaths) - int(total_recovered), 0)
    fatality_rate = round((int(total_deaths) / int(total_cases)) * 100, 2) if total_cases else 0.0

    return {
        "total_cases": int(total_cases),
        "total_deaths": int(total_deaths),
        "total_recovered": int(total_recovered),
        "active_cases": active_cases,
        "fatality_rate": float(fatality_rate),
    }


def top_districts(cursor, limit=5, start_date=None, end_date=None, district=None):
    where, params = _filters(start_date, end_date, district, alias="c")
    cursor.execute(
        f"""
        SELECT
            d.district_name,
            SUM(c.new_cases) AS total_cases,
            SUM(c.daily_deaths) AS total_deaths,
            SUM(c.daily_recovered) AS total_recovered
        FROM covid_daily c
        JOIN districts d
            ON c.district_id = d.district_id
        WHERE {where}
        GROUP BY d.district_name
        ORDER BY total_cases DESC
        LIMIT %s
        """,
        tuple(params + [limit]),
    )
    return [
        {
            "district": row[0],
            "total_cases": int(row[1]),
            "total_deaths": int(row[2]),
            "total_recovered": int(row[3]),
        }
        for row in cursor.fetchall()
    ]


def forecast_metrics(cursor, days=7, history_days=14, start_date=None, end_date=None, district=None):
    where, params = _filters(start_date, end_date, district)
    join = "JOIN districts d ON c.district_id = d.district_id" if district and district != "All" else ""
    cursor.execute(
        f"""
        SELECT
            report_date,
            SUM(new_cases),
            SUM(daily_deaths),
            SUM(daily_recovered)
        FROM covid_daily c
        {join}
        WHERE {where}
        GROUP BY report_date
        ORDER BY report_date DESC
        LIMIT %s
        """,
        tuple(params + [history_days]),
    )
    rows = list(reversed(cursor.fetchall()))

    if not rows:
        return {
            "days": days,
            "predicted_daily_cases": 0,
            "predicted_daily_deaths": 0,
            "predicted_daily_recovered": 0,
            "history_days": 0,
        }

    def predict(column_index):
        values = [float(row[column_index] or 0) for row in rows]
        if len(values) == 1:
            return max(round(values[0]), 0)

        x_values = range(len(values))
        x_mean = sum(x_values) / len(values)
        y_mean = sum(values) / len(values)
        denominator = sum((x - x_mean) ** 2 for x in x_values)
        slope = sum((x - x_mean) * (y - y_mean) for x, y in zip(x_values, values)) / denominator
        intercept = y_mean - slope * x_mean
        forecast = intercept + slope * (len(values) + days - 1)
        return max(round(forecast), 0)

    return {
        "days": days,
        "predicted_daily_cases": predict(1),
        "predicted_daily_deaths": predict(2),
        "predicted_daily_recovered": predict(3),
        "history_days": len(rows),
    }


def compare_models(cursor, start_date=None, end_date=None, district=None, history_days=14):
    where, params = _filters(start_date, end_date, district)
    join = "JOIN districts d ON c.district_id = d.district_id" if district and district != "All" else ""
    cursor.execute(
        f"""
        SELECT report_date, SUM(new_cases), SUM(daily_deaths), SUM(daily_recovered)
        FROM covid_daily c
        {join}
        WHERE {where}
        GROUP BY report_date
        ORDER BY report_date
        LIMIT %s
        """,
        tuple(params + [history_days]),
    )
    rows = cursor.fetchall()
    if len(rows) < 3:
        return {"linear_trend": None, "moving_average": None, "tested_days": 0}

    split = max(2, int(len(rows) * 0.7))
    split = min(split, len(rows) - 1)
    errors = {"linear_trend": [], "moving_average": []}

    for index in range(split, len(rows)):
        training = rows[:index]
        for column_index, metric in ((1, "cases"), (2, "deaths"), (3, "recovered")):
            values = [float(row[column_index] or 0) for row in training]
            actual = float(rows[index][column_index] or 0)
            if len(values) == 1:
                linear = values[0]
            else:
                x_mean = (len(values) - 1) / 2
                y_mean = sum(values) / len(values)
                denominator = sum((x - x_mean) ** 2 for x in range(len(values)))
                slope = sum((x - x_mean) * (y - y_mean) for x, y in enumerate(values)) / denominator
                linear = y_mean - slope * x_mean + slope * len(values)
            moving_average = sum(values[-min(7, len(values)):]) / min(7, len(values))
            errors["linear_trend"].append(abs(linear - actual))
            errors["moving_average"].append(abs(moving_average - actual))

    return {
        "linear_trend": round(sum(errors["linear_trend"]) / len(errors["linear_trend"]), 2),
        "moving_average": round(sum(errors["moving_average"]) / len(errors["moving_average"]), 2),
        "tested_days": len(rows) - split,
    }
