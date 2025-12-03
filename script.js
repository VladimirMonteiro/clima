const API_BASE = "https://api.open-meteo.com/v1/forecast";

// ELEMENTOS
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const geoBtn = document.getElementById("geoBtn");
const currentInfo = document.getElementById("currentInfo");
const forecastContainer = document.getElementById("forecastContainer");
const themeToggle = document.getElementById("themeToggle");

let tempChart, humidityChart;

// --- EVENTOS ---
searchBtn.addEventListener("click", () => {
  if (cityInput.value.trim() !== "") getCityCoords(cityInput.value);
});

geoBtn.addEventListener("click", getByGeolocation);

themeToggle.addEventListener("change", () => {
  document.body.classList.toggle("dark");
  document.body.classList.toggle("light");
});

// Busca coordenadas pelo nome
async function getCityCoords(city) {
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`
    );
    const data = await res.json();

    if (!data.results) {
      currentInfo.innerHTML = "Cidade não encontrada!";
      return;
    }

    const { latitude, longitude, name, country } = data.results[0];

    fetchWeather(latitude, longitude, name, country);
  } catch (e) {
    console.error(e);
  }
}

// Busca usando geolocalização
function getByGeolocation() {
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      fetchWeather(pos.coords.latitude, pos.coords.longitude, "Sua localização");
    },
    () => alert("Permita o acesso à localização!")
  );
}

// Busca clima
async function fetchWeather(lat, lon, label = "Cidade") {
  const url = `${API_BASE}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,relative_humidity_2m_max,relative_humidity_2m_min&timezone=auto`;

  const res = await fetch(url);
  const data = await res.json();

  renderCurrent(data.current, label);
  renderForecast(data.daily);
  renderCharts(data.daily);
}

// Renderiza clima atual
function renderCurrent(current, label) {
  currentInfo.innerHTML = `
      <h3>${label}</h3>
      <p>Temperatura: <strong>${current.temperature_2m}°C</strong></p>
      <p>Umidade: <strong>${current.relative_humidity_2m}%</strong></p>
  `;
}

// Renderiza previsão
function renderForecast(daily) {
  forecastContainer.innerHTML = "";

  daily.time.slice(0, 5).forEach((day, i) => {

    const dateObj = new Date(day);
    const weekday = dateObj.toLocaleDateString("pt-BR", { weekday: "short" });
    const number = dateObj.getDate();

    const temp = daily.temperature_2m_max[i];
    let icon = "bi-cloud";

    if (temp > 30) icon = "bi-sun-fill";
    else if (temp > 22) icon = "bi-brightness-high-fill";
    else if (temp < 18) icon = "bi-cloud-rain-heavy-fill";

    const html = `
      <div class="col-6 col-md-2">
        <div class="day-card">

          <div class="day-icon">
            <i class="bi ${icon}"></i>
          </div>

          <div class="day-title">
            ${weekday.toUpperCase()} • ${number}
          </div>

          <div class="temp-max">
            ${daily.temperature_2m_max[i]}°C
          </div>

          <div class="temp-min">
            Min: ${daily.temperature_2m_min[i]}°C
          </div>

          <div class="mt-2">
            <small>Umidade: ${daily.relative_humidity_2m_max[i]}%</small>
          </div>

        </div>
      </div>
    `;

    forecastContainer.insertAdjacentHTML("beforeend", html);
  });
}



// Gráficos
function renderCharts(daily) {

  const labels = daily.time.slice(0, 5);
  const tempMax = daily.temperature_2m_max.slice(0, 5);
  const humidityMax = daily.relative_humidity_2m_max.slice(0, 5);

  // Temperatura
  if (tempChart) tempChart.destroy();
  tempChart = new Chart(document.getElementById("tempChart"), {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Temperatura Máxima",
        data: tempMax,
        borderWidth: 2
      }]
    }
  });

  // Umidade
  if (humidityChart) humidityChart.destroy();
  humidityChart = new Chart(document.getElementById("humidityChart"), {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Umidade Máxima",
        data: humidityMax,
        borderWidth: 2
      }]
    }
  });
}
