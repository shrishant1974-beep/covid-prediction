const dashboardState = {
    covidData: [],
    districtData: [],
    charts: {}
};

const HISTORICAL_START = "2019-01-01";
const HISTORICAL_END = "2020-12-31";

let districtMap;
let districtLayer;
let selectedDistrictLayer;
let selectedDistrict = null;

const API_BASE = window.location.protocol === "file:"
    ? "http://127.0.0.1:5000"
    : window.location.origin;

async function fetchJson(endpoint) {
    const urls = [
        `${API_BASE}${endpoint}`,
        `http://127.0.0.1:5000${endpoint}`
    ];

    for (const url of urls) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                continue;
            }
            return await response.json();
        } catch (error) {
            // Try the next URL if the first one is unavailable.
        }
    }

    throw new Error(`Could not fetch ${endpoint}`);
}

function formatNumber(value) {
    return new Intl.NumberFormat("en-IN").format(value || 0);
}

function updateMetricCard(selector, value, suffix = "") {
    const element = document.querySelector(selector);
    if (!element) return;
    element.textContent = `${formatNumber(value)}${suffix}`;
}

function populateSummaryCards(summary) {
    updateMetricCard(".stat-card.blue h2", summary.total_cases);
    updateMetricCard(".stat-card.red h2", summary.total_deaths);
    updateMetricCard(".stat-card.green h2", summary.total_recovered);
    updateMetricCard(".stat-card.orange h2", summary.active_cases);
    updateMetricCard(".stat-card.purple h2", summary.fatality_rate, "%");
}

function populatePrediction(forecast) {
    if (!forecast) return;

    document.getElementById("predictedCases").textContent = formatNumber(forecast.predicted_daily_cases);
    document.getElementById("predictedDeaths").textContent = formatNumber(forecast.predicted_daily_deaths);
    document.getElementById("predictedRecovered").textContent = formatNumber(forecast.predicted_daily_recovered);
    document.getElementById("predictionHistory").textContent =
        `Linear trend from ${forecast.history_days} database reporting days; next ${forecast.days} days`;
}

function populateAccuracy(accuracy) {
    const element = document.getElementById("predictionAccuracy");
    if (!element || !accuracy || accuracy.tested_days === 0) return;
    element.textContent = `MAE: Linear ${accuracy.linear_trend} | Moving average ${accuracy.moving_average}`;
}

function filterQuery() {
    const params = new URLSearchParams();
    const district = document.getElementById("districtSelect")?.value || "All";
    const startDate = document.getElementById("startDate")?.value;
    const endDate = document.getElementById("endDate")?.value;
    if (district !== "All") params.set("district", district);
    if (startDate) params.set("start_date", startDate);
    if (endDate) params.set("end_date", endDate);
    return params.toString() ? `?${params.toString()}` : "";
}

function loadTable(data) {
    const table = document.getElementById("covidTable");
    if (!table) return;

    table.innerHTML = "";

    const historicalRows = data
        .filter((row) => (
            row.date >= HISTORICAL_START
            && row.date <= HISTORICAL_END
        ))
        .filter((row, index, rows) => (
            index === rows.findIndex((candidate) => (
                candidate.district === row.district
                && candidate.date === row.date
            ))
        ));

    historicalRows.forEach((row) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${row.date}</td>
            <td>${row.district}</td>
            <td>${row.cases}</td>
            <td>${row.deaths}</td>
            <td>${row.recovered}</td>
        `;
        table.appendChild(tr);
    });
}

function populateDistrictOptions() {
    const select = document.getElementById("districtSelect");
    if (!select) return;

    const districts = [...new Set(dashboardState.covidData.map((row) => row.district))].sort();
    const currentValue = select.value || "All";

    select.innerHTML = '<option value="All">All Maharashtra</option>';

    districts.forEach((district) => {
        const option = document.createElement("option");
        option.value = district;
        option.textContent = district;
        select.appendChild(option);
    });

    select.value = districts.includes(currentValue) ? currentValue : "All";
}

function getFilteredRows() {
    const selected = document.getElementById("districtSelect")?.value || "All";

    if (selected === "All") {
        return dashboardState.covidData;
    }

    return dashboardState.covidData.filter((row) => row.district === selected);
}

async function filterDistrict() {
    const query = filterQuery();
    try {
        const [covidData, analysis] = await Promise.all([
            fetchJson(`/api/covid${query}`),
            fetchJson(`/api/analysis${query}`)
        ]);
        dashboardState.covidData = covidData;
        populateSummaryCards(analysis.summary);
        populatePrediction(analysis.forecast);
        populateAccuracy(analysis.accuracy);
        loadTable(covidData);
        renderCharts(covidData);
    } catch (error) {
        console.error("Filtered analysis failed:", error);
    }
}

function resetFilter() {
    const select = document.getElementById("districtSelect");
    if (select) select.value = "All";
    document.getElementById("startDate").value = "2020-03-09";
    document.getElementById("endDate").value = "2022-01-20";
    filterDistrict();
}

function renderCharts(data) {
    const labels = data.map((row) => row.date);
    const cases = data.map((row) => row.cases);
    const deaths = data.map((row) => row.deaths);
    const recovered = data.map((row) => row.recovered);

    const chartConfig = (title, color, values) => ({
        type: "line",
        data: {
            labels,
            datasets: [{
                label: title,
                data: values,
                borderColor: color,
                backgroundColor: color + "33",
                borderWidth: 2,
                tension: 0.35,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
        }
    });

    if (!dashboardState.charts.cases) {
        dashboardState.charts.cases = new Chart(document.getElementById("casesChart"), chartConfig("Daily Cases", "#4f46e5", cases));
    } else {
        dashboardState.charts.cases.data.labels = labels;
        dashboardState.charts.cases.data.datasets[0].data = cases;
        dashboardState.charts.cases.update();
    }

    if (!dashboardState.charts.deaths) {
        dashboardState.charts.deaths = new Chart(document.getElementById("deathsChart"), chartConfig("Daily Deaths", "#ef4444", deaths));
    } else {
        dashboardState.charts.deaths.data.labels = labels;
        dashboardState.charts.deaths.data.datasets[0].data = deaths;
        dashboardState.charts.deaths.update();
    }

    if (!dashboardState.charts.recovered) {
        dashboardState.charts.recovered = new Chart(document.getElementById("recoveredChart"), chartConfig("Daily Recovered", "#22c55e", recovered));
    } else {
        dashboardState.charts.recovered.data.labels = labels;
        dashboardState.charts.recovered.data.datasets[0].data = recovered;
        dashboardState.charts.recovered.update();
    }
}

function districtKey(name) {
    return String(name || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/ahilyanagar|ahmednagar|ahmadnagar/g, "ahmednagar")
        .replace(/chhatrapati sambhajinagar|aurangabad/g, "aurangabad")
        .replace(/dharashiv|osmanabad/g, "osmanabad")
        .replace(/bid/g, "beed")
        .replace(/buldana/g, "buldhana")
        .replace(/gondiya/g, "gondia")
        .replace(/raigarh/g, "raigad")
        .replace(/mumbai city|mumbai suburban|mumbai/g, "mumbai")
        .replace(/[^a-z0-9]/g, "");
}

function getDistrictStats(name) {
    const key = districtKey(name);
    const matches = dashboardState.districtData.filter((district) => districtKey(district.district_name) === key);

    if (matches.length === 1) return matches[0];
    if (!matches.length) {
        return {
            district_name: name,
            total_cases: 0,
            total_deaths: 0,
            total_recovered: 0,
            active_cases: 0,
            fatality_rate: 0,
            first_report_date: null,
            last_report_date: null,
            reporting_days: 0,
            has_historical_data: false
        };
    }

    const combined = matches.reduce((total, district) => ({
        district_name: name,
        total_cases: total.total_cases + district.total_cases,
        total_deaths: total.total_deaths + district.total_deaths,
        total_recovered: total.total_recovered + district.total_recovered,
        active_cases: total.active_cases + district.active_cases,
        reporting_days: total.reporting_days + district.reporting_days,
        first_report_date: total.first_report_date < district.first_report_date ? total.first_report_date : district.first_report_date,
        last_report_date: total.last_report_date > district.last_report_date ? total.last_report_date : district.last_report_date
    }));
    combined.fatality_rate = combined.total_cases
        ? (combined.total_deaths / combined.total_cases) * 100
        : 0;
    combined.has_historical_data = matches.some((district) => district.has_historical_data);
    return combined;
}

function renderDistrictTooltip(stats) {
    const tooltip = document.getElementById("districtTooltip");
    if (!tooltip || !stats) return;

    const availability = stats.has_historical_data === false
        ? "No historical records available"
        : "Historical records available";

    tooltip.innerHTML = `
        <span class="selected-district-label">Selected District</span>
        <strong class="selected-district-name">${stats.district_name}</strong>
        <span class="district-info-title">COVID-19 Information</span>
        <span>COVID-19 Period: <b>2019–2020</b></span>
        <span class="district-data-status">${availability}</span>
        <span>Total Cases: <b>${formatNumber(stats.total_cases)}</b></span>
        <span>Total Deaths: <b>${formatNumber(stats.total_deaths)}</b></span>
        <span>Total Recovered: <b>${formatNumber(stats.total_recovered)}</b></span>
        <span>Active Cases: <b>${formatNumber(stats.active_cases)}</b></span>
        <span>Fatality Rate: <b>${Number(stats.fatality_rate || 0).toFixed(2)}%</b></span>
        <span>First Report: <b>${stats.first_report_date || "No reports in period"}</b></span>
        <span>Last Report: <b>${stats.last_report_date || "No reports in period"}</b></span>
        <span>Reporting Days: <b>${formatNumber(stats.reporting_days)}</b></span>
    `;
    tooltip.hidden = false;
}

function showDistrictPlaceholder() {
    const tooltip = document.getElementById("districtTooltip");
    if (!tooltip) return;
    tooltip.innerHTML = `
        <span class="selected-district-label">Selected District</span>
        <strong class="selected-district-name">None</strong>
        <span class="district-info-title">Select a district on the map to view COVID-19 information.</span>
        <span>COVID-19 Period: <b>2019–2020</b></span>
        <span class="district-data-status">Click a district on the map</span>
        <span>Total Cases: <b>—</b></span>
        <span>Total Deaths: <b>—</b></span>
        <span>Total Recovered: <b>—</b></span>
        <span>Active Cases: <b>—</b></span>
        <span>Fatality Rate: <b>—</b></span>
        <span>First Report: <b>—</b></span>
        <span>Last Report: <b>—</b></span>
        <span>Reporting Days: <b>—</b></span>
    `;
    tooltip.hidden = false;
}

function districtPopupContent(stats) {
    const availability = stats.has_historical_data === false
        ? "No historical records available"
        : "Historical records available";
    return `
        <strong>District: ${stats.district_name}</strong>
        <span>COVID-19 Period: <b>2019–2020</b></span>
        <span class="district-data-status">${availability}</span>
        <span>Total Cases: <b>${formatNumber(stats.total_cases)}</b></span>
        <span>Total Deaths: <b>${formatNumber(stats.total_deaths)}</b></span>
        <span>Total Recovered: <b>${formatNumber(stats.total_recovered)}</b></span>
        <span>Active Cases: <b>${formatNumber(stats.active_cases)}</b></span>
        <span>Fatality Rate: <b>${Number(stats.fatality_rate || 0).toFixed(2)}%</b></span>
        <span>First Report: <b>${stats.first_report_date || "No reports in period"}</b></span>
        <span>Last Report: <b>${stats.last_report_date || "No reports in period"}</b></span>
        <span>Reporting Days: <b>${formatNumber(stats.reporting_days)}</b></span>
    `;
}

async function loadDistrictMap() {
    const mapElement = document.getElementById("districtMap");
    if (!mapElement || typeof L === "undefined") return;
    const mapStatus = document.getElementById("districtMapStatus");

    districtMap = L.map(mapElement, {
        zoomControl: false,
        attributionControl: true,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        touchZoom: false,
        boxZoom: false,
        keyboard: false,
        dragging: false
    });
    showDistrictPlaceholder();
    districtMap.on("click", () => {
        if (!selectedDistrictLayer) return;
        const selectedPath = selectedDistrictLayer.getElement?.() || selectedDistrictLayer._path;
        selectedPath?.classList.remove("district-selected");
        districtLayer.resetStyle(selectedDistrictLayer);
        selectedDistrictLayer.closePopup();
        selectedDistrictLayer = null;
        selectedDistrict = null;
        showDistrictPlaceholder();
    });
    const geoJsonUrl = "https://raw.githubusercontent.com/Shelby8818/geojson/main/MAHARASHTRA_DISTRICTS.geojson";
    const response = await fetch(geoJsonUrl);
    if (!response.ok) throw new Error("Could not fetch district boundaries");
    const geoJson = await response.json();

    districtLayer = L.geoJSON(geoJson, {
        style: () => ({ color: "#5142bd", weight: 1.2, fillColor: "#d9d5fb", fillOpacity: 0.78 }),
        onEachFeature: (feature, layer) => {
            const districtName = feature.properties?.dtname || feature.properties?.district || "Unknown district";
            const stats = getDistrictStats(districtName);
            layer.bindTooltip(districtName, { sticky: true });
            layer.bindPopup(districtPopupContent(stats), { closeButton: false, className: "historical-district-popup" });
            layer.on({
                mouseover: (event) => {
                    event.target.setStyle({ weight: 3, color: "#e85d75", fillColor: "#f3a8b3", fillOpacity: 0.92 });
                    const path = event.target.getElement?.() || event.target._path;
                    path?.classList.add("district-hovered");
                    event.target.bringToFront();
                    renderDistrictTooltip(stats);
                    event.target.openPopup();
                },
                mouseout: (event) => {
                    const path = event.target.getElement?.() || event.target._path;
                    path?.classList.remove("district-hovered");
                    if (event.target === selectedDistrictLayer) {
                        path?.classList.add("district-selected");
                        event.target.setStyle({ weight: 4, color: "#b4235a", fillColor: "#f06b85", fillOpacity: 0.98 });
                        return;
                    }
                    districtLayer.resetStyle(event.target);
                    event.target.closePopup();
                },
                click: (event) => {
                    L.DomEvent.stopPropagation(event.originalEvent);
                    if (selectedDistrictLayer && selectedDistrictLayer !== event.target) {
                        const previousPath = selectedDistrictLayer.getElement?.() || selectedDistrictLayer._path;
                        previousPath?.classList.remove("district-selected");
                        districtLayer.resetStyle(selectedDistrictLayer);
                        selectedDistrictLayer.closePopup();
                    }

                    selectedDistrictLayer = event.target;
                    selectedDistrict = districtName;
                    const selectedPath = selectedDistrictLayer.getElement?.() || selectedDistrictLayer._path;
                    selectedPath?.classList.add("district-selected");
                    selectedDistrictLayer.setStyle({ weight: 4, color: "#b4235a", fillColor: "#f06b85", fillOpacity: 0.98 });
                    renderDistrictTooltip(stats);
                    selectedDistrictLayer.openPopup();

                    const select = document.getElementById("districtSelect");
                    const matched = dashboardState.covidData.find((row) => districtKey(row.district) === districtKey(districtName));
                    if (select && matched) {
                        select.value = matched.district;
                        filterDistrict();
                    }
                }
            });
        }
    }).addTo(districtMap);

    districtMap.fitBounds(districtLayer.getBounds(), { padding: [12, 12] });
    if (mapStatus) {
        mapStatus.textContent = "36 Maharashtra districts loaded. Click a district to select it.";
    }
}

async function loadDashboard() {
    try {
        const [covidData, summary, districtData, analysis] = await Promise.all([
            fetchJson("/api/covid"),
            fetchJson("/api/summary"),
            fetchJson("/api/districts"),
            fetchJson("/api/analysis")
        ]);

        dashboardState.covidData = Array.isArray(covidData) ? covidData : [];
        dashboardState.districtData = Array.isArray(districtData) ? districtData : [];
        populateSummaryCards(summary);
        populatePrediction(analysis.forecast);
        populateAccuracy(analysis.accuracy);
        populateDistrictOptions();
        loadTable(dashboardState.covidData);
        renderCharts(dashboardState.covidData);
        try {
            await loadDistrictMap();
        } catch (mapError) {
            console.error("Historical district map load failed:", mapError);
            const mapStatus = document.getElementById("districtMapStatus");
            if (mapStatus) {
                mapStatus.textContent = "District map could not load. Check the network connection and refresh.";
            }
        }
    } catch (error) {
        console.error("Dashboard load failed:", error);
        const table = document.getElementById("covidTable");
        if (table) {
            table.innerHTML = '<tr><td colspan="5">No data available</td></tr>';
        }
    }
}

function printReport() {
    window.print();
}

window.addEventListener("DOMContentLoaded", loadDashboard);