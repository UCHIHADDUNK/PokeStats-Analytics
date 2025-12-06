// app.js (módulo del dashboard)
import {
  makeVisitsLine,
  makeDeviceDoughnut,
  makeEventsBar,
  makeHorizontalBar,
  makeSimpleBar
} from './charts.js';

const TRAFFIC_JSON = "trafficData.json";

let rawData = [];
let charts = {};

// Estado del dashboard (filtros globales)
let dashboardState = {
  // Inicializamos a "all" o al valor del HTML
  dateRange: "all", 
  device: "all",
  country: "all"
};

/* =====================================================
   UTILIDADES
===================================================== */
async function loadData(){
  const res = await fetch(TRAFFIC_JSON);
  const json = await res.json();
  return json;
}

function aggregateByKey(data, key){
  const map = new Map();
  data.forEach(d => {
    // Aseguramos que la clave exista y sea una string
    const k = String(d[key] || '').trim();
    if (k) {
      // Contamos cuántos registros cumplen con ese key
      map.set(k, (map.get(k)||0) + 1);
    }
  });
  return [...map.entries()].sort((a,b)=>b[1]-a[1]);
}

/* =====================================================
   GENERACIÓN DINÁMICA DE FILTROS (NUEVO)
===================================================== */
function populateCountryFilter(data) {
    const countryFilter = document.getElementById("countryFilter");
    
    // Limpiamos las opciones dinámicas previas, dejando solo "Todos" (value="all")
    countryFilter.querySelectorAll('option:not([value="all"])').forEach(option => option.remove());

    // Obtenemos países únicos, asegurándonos de filtrar valores nulos o vacíos
    const uniqueCountries = [...new Set(data.map(d => d.country).filter(c => c))].sort();

    uniqueCountries.forEach(country => {
        const option = document.createElement('option');
        // El valor se almacena en minúsculas para facilitar la lógica de filtrado
        option.value = country.toLowerCase(); 
        // El texto se muestra al usuario con la capitalización original (o la que se desee)
        option.textContent = country; 
        countryFilter.appendChild(option);
    });
}

/* =====================================================
   FILTROS DEL DASHBOARD
===================================================== */
function applyDashboardFilters(data){
  let result = [...data];

  // 1) FILTRO POR FECHA
  if (dashboardState.dateRange !== "all") {
    const days = parseInt(dashboardState.dateRange);

    if (!isNaN(days) && rawData.length > 0) {
      // Obtiene la última fecha REAL del dataset (del rawData original)
      const lastDate = new Date(rawData[rawData.length - 1].date).getTime();
      // Calcula el límite hacia atrás desde esa fecha
      const limit = lastDate - (days * 86400000);

      result = result.filter(d => {
        const t = new Date(d.date).getTime();
        return !isNaN(t) && t >= limit;
      });
    }
  }

  // 2) FILTRO POR PAÍS
  if (dashboardState.country !== "all") {
    const target = dashboardState.country.toLowerCase();
    result = result.filter(d =>
      (d.country || "").toLowerCase() === target
    );
  }

  // 3) FILTRO POR DISPOSITIVO (CORRECCIÓN CLAVE)
  // Filtra los registros que tuvieron visitas en el dispositivo seleccionado.
  if (dashboardState.device !== "all") {
    const targetDevice = dashboardState.device;
    // Usamos `targetDevice` como clave para acceder a device_distribution
    result = result.filter(d => {
        const dist = d.device_distribution || {};
        // Solo conservamos el día si el conteo para ese dispositivo es mayor a cero
        return (dist[targetDevice] || 0) > 0;
    });
  }

  return result;
}

/* =====================================================
   PREPARACIÓN DE SERIES
===================================================== */
function prepareSeries(data){
  if (!data || data.length === 0) {
    // Si no hay datos, devolvemos un conjunto de series vacías para evitar errores
    return {
      labels: [],
      visits: [],
      devices: { mobile: 0, desktop: 0, tablet: 0 },
      events: { keys: ["open_details","dark_mode","type_chart_click","search_used","filter_type","filter_stats"], values: [] },
      topPokemon: { labels: [], values: [] },
      countries: { labels: [], values: [] }
    };
  }

  // Fechas y visitas
  const labels = data.map(d => d.date);
  const visits = data.map(d => d.visits || 0);

  // Dispositivos (SÓLO ACUMULAMOS los datos filtrados)
  let mobile = 0, desktop = 0, tablet = 0;

  data.forEach(d => {
  const dist = d.device_distribution || {};

  if (dashboardState.device === "all" || dashboardState.device === "mobile")
      mobile += dist.mobile || 0;

  if (dashboardState.device === "all" || dashboardState.device === "desktop")
      desktop += dist.desktop || 0;

  if (dashboardState.device === "all" || dashboardState.device === "tablet")
      tablet += dist.tablet || 0;
});

  // Eventos
  const eventKeys = ["open_details","dark_mode","type_chart_click","search_used","filter_type","filter_stats"];
  const eventValues = eventKeys.map(key =>
    data.reduce((acc, d) => acc + (d.events?.[key] || 0), 0)
  );

  // Top Pokémon
  const aggPoke = aggregateByKey(data, "top_pokemon");
  const topPokemonLabels = aggPoke.slice(0,8).map(x => x[0]);
  const topPokemonValues = aggPoke.slice(0,8).map(x => x[1]);

  // Países
  const aggCountry = aggregateByKey(data, "country");
  const countryLabels = aggCountry.map(x => x[0]);
  const countryValues = aggCountry.map(x => x[1]);

  return {
    labels,
    visits,
    devices: { mobile, desktop, tablet },
    events: { keys: eventKeys, values: eventValues },
    topPokemon: { labels: topPokemonLabels, values: topPokemonValues },
    countries: { labels: countryLabels, values: countryValues }
  };
}

/* =====================================================
   KPIs
===================================================== */
function updateKPIs(data){
  if (data.length === 0) {
    // Si no hay datos, limpiamos todos los KPIs
    document.getElementById('kpiVisits').textContent = "—";
    document.getElementById('kpiNewUsers').textContent = "—";
    document.getElementById('kpiReturning').textContent = "—";
    document.getElementById('kpiTopPokemon').textContent = "—";
    document.getElementById('kpiTopType').textContent = "—";
    return;
  }
  
  const totalVisits = data.reduce((s,d)=>s + (d.visits||0),0);
  const totalNew = data.reduce((s,d)=>s + (d.new_users||0),0);
  const totalReturning = data.reduce((s,d)=>s + (d.returning_users||0),0);

  const pokeAgg = aggregateByKey(data, "top_pokemon");
  const topPokemon = pokeAgg.length ? pokeAgg[0][0] : "—";

  const typeAgg = aggregateByKey(data, "top_type");
  const topType = typeAgg.length ? typeAgg[0][0] : "—";

  document.getElementById('kpiVisits').textContent = totalVisits;
  document.getElementById('kpiNewUsers').textContent = totalNew;
  document.getElementById('kpiReturning').textContent = totalReturning;
  document.getElementById('kpiTopPokemon').textContent = topPokemon;
  document.getElementById('kpiTopType').textContent = topType;
}

/* =====================================================
   GRÁFICAS
===================================================== */
function renderAllCharts(prep){
  // destruye instancias previas para evitar errores
  Object.values(charts).forEach(c => c?.destroy());
  charts = {}; // Limpiamos el objeto de charts

  charts.visits = makeVisitsLine(
    document.getElementById('visitsLine').getContext('2d'),
    prep.labels,
    prep.visits
  );

  // Solo creamos la gráfica de dispositivos si hay datos de dispositivos
  if (prep.devices.mobile + prep.devices.desktop + prep.devices.tablet > 0) {
    charts.devices = makeDeviceDoughnut(
      document.getElementById('deviceDoughnut').getContext('2d'),
      ['Mobile','Desktop','Tablet'],
      [prep.devices.mobile, prep.devices.desktop, prep.devices.tablet],
      ['#F7D02C','#6390F0','#f7a8d6']
    );
  }

  charts.events = makeEventsBar(
    document.getElementById('eventsBar').getContext('2d'),
    prep.events.keys,
    prep.events.values,
    '#7da3e6'
  );

  charts.top = makeSimpleBar(
    document.getElementById('topPokemonBar').getContext('2d'),
    prep.topPokemon.labels,
    prep.topPokemon.values,
    '#8dd3c7'
  );

  charts.countries = makeHorizontalBar(
    document.getElementById('countriesBar').getContext('2d'),
    prep.countries.labels,
    prep.countries.values,
    '#b79ec9'
  );
}

/* =====================================================
   ACTUALIZAR TODO EL DASHBOARD
===================================================== */
function updateDashboard(){
  const filtered = applyDashboardFilters(rawData);
  
  // Manejo de estado vacío: si no hay datos después de filtrar
  if (filtered.length === 0) {
      updateKPIs([]); // Limpia KPIs
      const emptyPrep = prepareSeries([]); 
      renderAllCharts(emptyPrep); // Destruye y renderiza gráficos vacíos
      return;
  }

  updateKPIs(filtered);
  const prep = prepareSeries(filtered);
  renderAllCharts(prep);
}

/* =====================================================
   INICIALIZACIÓN
===================================================== */
async function init(){
  rawData = await loadData();
  
  // 1. Generar opciones de país dinámicamente
  populateCountryFilter(rawData);

  // 2. Establecer el estado inicial del filtro de fecha basado en el HTML
  // Aseguramos que el estado inicial sea el valor del <select> por defecto (ej. "7")
  const initialDateFilter = document.getElementById("dateFilter").value;
  dashboardState.dateRange = initialDateFilter;

  // Última fecha
  const lastDate = rawData.length ? rawData[rawData.length-1].date : '—';
  document.getElementById('lastUpdate').textContent = `Último registro: ${lastDate}`;

  // 3. Renderizar el dashboard inicial
  updateDashboard();

  // -------- EVENT LISTENERS PARA FILTROS --------
  document.getElementById("dateFilter").addEventListener("change", e => {
    dashboardState.dateRange = e.target.value;
    updateDashboard();
  });

  document.getElementById("deviceFilter").addEventListener("change", e => {
    dashboardState.device = e.target.value;
    updateDashboard();
  });

  document.getElementById("countryFilter").addEventListener("change", e => {
    dashboardState.country = e.target.value;
    updateDashboard();
  });

  // Dark mode
  document.getElementById('darkModeToggle').addEventListener('click', () => {
    document.body.classList.toggle('dark');
    document.getElementById('darkModeToggle').textContent =
      document.body.classList.contains('dark') ? '☀️' : '🌙';
  });

  // Volver a la Pokédex
  document.getElementById('goToPokedex').addEventListener('click', () => {
    window.location.href = "https://pokestatsanalyzer.netlify.app";
  });
}

init();