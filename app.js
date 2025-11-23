// app.js (módulo)
import {
  makeVisitsLine,
  makeDeviceDoughnut,
  makeEventsBar,
  makeHorizontalBar,
  makeSimpleBar
} from './charts.js';

const TRAFFIC_JSON = "trafficData.json";

let charts = {};

async function loadData(){
  const res = await fetch(TRAFFIC_JSON);
  const json = await res.json();
  return json;
}

function sum(arr, key){
  return arr.reduce((s, r) => s + (r[key] || 0), 0);
}

function aggregateByKey(data, key){
  const map = new Map();
  data.forEach(d => {
    const k = d[key];
    map.set(k, (map.get(k)||0) + 1);
  });
  return [...map.entries()].sort((a,b)=>b[1]-a[1]);
}

function prepareSeries(data){
  // labels (fechas) y visitas
  const labels = data.map(d=>d.date);
  const visits = data.map(d=>d.visits);

  // devices (sum over days)
  const totalMobile = sum(data.map(d => d.device_distribution.mobile || 0), v => v);
  // but simpler: sum per object:
  const mobile = data.reduce((s,d)=>s + (d.device_distribution.mobile||0),0);
  const desktop = data.reduce((s,d)=>s + (d.device_distribution.desktop||0),0);
  const tablet = data.reduce((s,d)=>s + (d.device_distribution.tablet||0),0);

  // events totals
  const eventKeys = ["open_details","dark_mode","type_chart_click","search_used","filter_type","filter_stats"];
  const eventsTotal = eventKeys.map(k => data.reduce((s,d)=>s + (d.events[k]||0),0));

  // top pokemons
  const topP = aggregateByKey(data, 'top_pokemon'); // [ [name,count], ... ]
  const topPokemonLabels = topP.slice(0,8).map(x=>x[0]);
  const topPokemonValues = topP.slice(0,8).map(x=>x[1]);

  // countries
  const countriesAgg = aggregateByKey(data, 'country');
  const countryLabels = countriesAgg.map(x=>x[0]);
  const countryValues = countriesAgg.map(x=>x[1]);

  return {
    labels, visits,
    devices: { mobile, desktop, tablet },
    events: { keys:eventKeys, values: eventsTotal },
    topPokemon: { labels: topPokemonLabels, values: topPokemonValues },
    countries: { labels: countryLabels, values: countryValues }
  };
}

function updateKPIs(data){
  const totalVisits = data.reduce((s,d)=>s + (d.visits||0),0);
  const totalNew = data.reduce((s,d)=>s + (d.new_users||0),0);
  const totalReturning = data.reduce((s,d)=>s + (d.returning_users||0),0);

  // top pokemon overall
  const pokeAgg = aggregateByKey(data, 'top_pokemon');
  const topPokemon = pokeAgg.length ? pokeAgg[0][0] : '—';

  // top type
  const typeAgg = aggregateByKey(data, 'top_type');
  const topType = typeAgg.length ? typeAgg[0][0] : '—';

  document.getElementById('kpiVisits').textContent = totalVisits;
  document.getElementById('kpiNewUsers').textContent = totalNew;
  document.getElementById('kpiReturning').textContent = totalReturning;
  document.getElementById('kpiTopPokemon').textContent = topPokemon;
  document.getElementById('kpiTopType').textContent = topType;
}

function renderAllCharts(prep){
  // Visits line
  const ctxVisits = document.getElementById('visitsLine').getContext('2d');
  charts.visits = makeVisitsLine(ctxVisits, prep.labels, prep.visits);

  // devices
  const ctxDevices = document.getElementById('deviceDoughnut').getContext('2d');
  charts.devices = makeDeviceDoughnut(ctxDevices,
    ['Mobile','Desktop','Tablet'],
    [prep.devices.mobile, prep.devices.desktop, prep.devices.tablet],
    ['#F7D02C','#6390F0','#f7a8d6']
  );

  // events
  const ctxEvents = document.getElementById('eventsBar').getContext('2d');
  charts.events = makeEventsBar(ctxEvents, prep.events.keys, prep.events.values, '#7da3e6');

  // top pokemon
  const ctxTop = document.getElementById('topPokemonBar').getContext('2d');
  charts.top = makeSimpleBar(ctxTop, prep.topPokemon.labels, prep.topPokemon.values, '#8dd3c7');

  // countries
  const ctxCountries = document.getElementById('countriesBar').getContext('2d');
  charts.countries = makeHorizontalBar(ctxCountries, prep.countries.labels, prep.countries.values, '#b79ec9');
}

async function init(){
  const data = await loadData();

  // last update (latest day)
  const lastDate = data.length ? data[data.length-1].date : '—';
  document.getElementById('lastUpdate').textContent = `Último registro: ${lastDate}`;

  // update KPIs
  updateKPIs(data);

  // prepare series
  const prep = prepareSeries(data);

  // render charts
  renderAllCharts(prep);

  // Dark mode button
  document.getElementById('darkModeToggle').addEventListener('click', () => {
    document.body.classList.toggle('dark');
    const btn = document.getElementById('darkModeToggle');
    btn.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
  });

  // nav buttons
  document.getElementById('goToPokedex').addEventListener('click', () => {
    window.location.href = "https://pokestatsanalyzer.netlify.app";
});

}

init();
