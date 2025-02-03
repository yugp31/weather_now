// Import configuration
import { config } from './config.js';

// API configuration
const API_KEY = config.API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// DOM Elements
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const celsiusBtn = document.getElementById('celsius');
const fahrenheitBtn = document.getElementById('fahrenheit');
const loadingScreen = document.getElementById('loading-screen');

// State
let currentUnit = 'celsius';
let currentCity = '';

// Event Listeners
searchBtn.addEventListener('click', handleSearch);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});
celsiusBtn.addEventListener('click', () => changeUnit('celsius'));
fahrenheitBtn.addEventListener('click', () => changeUnit('fahrenheit'));

// Initialize the app
function init() {
    // Get user's location if possible
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                getWeatherByCoords(position.coords.latitude, position.coords.longitude);
            },
            error => {
                // Default to London if geolocation is denied
                getWeatherByCity('London');
            }
        );
    } else {
        getWeatherByCity('London');
    }
}

// Search handler
async function handleSearch() {
    const city = searchInput.value.trim();
    if (city) {
        showLoading();
        await getWeatherByCity(city);
        hideLoading();
    }
}

// Get weather by coordinates
async function getWeatherByCoords(lat, lon) {
    try {
        showLoading();
        const weatherData = await fetch(
            `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
        );
        const forecastData = await fetch(
            `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
        );

        const weather = await weatherData.json();
        const forecast = await forecastData.json();

        updateUI(weather, forecast);
    } catch (error) {
        showError('Error fetching weather data');
    } finally {
        hideLoading();
    }
}

// Get weather by city name
async function getWeatherByCity(city) {
    try {
        showLoading();
        const weatherData = await fetch(
            `${BASE_URL}/weather?q=${city}&appid=${API_KEY}&units=metric`
        );
        const forecastData = await fetch(
            `${BASE_URL}/forecast?q=${city}&appid=${API_KEY}&units=metric`
        );

        const weather = await weatherData.json();
        const forecast = await forecastData.json();

        if (weather.cod === '404') {
            showError('City not found');
            return;
        }

        currentCity = city;
        updateUI(weather, forecast);
    } catch (error) {
        showError('Error fetching weather data');
    } finally {
        hideLoading();
    }
}

// Update UI with weather data
function updateUI(weather, forecast) {
    // Update current weather
    document.getElementById('city').textContent = weather.name;
    document.getElementById('date').textContent = formatDate(new Date());
    document.getElementById('temp').textContent = formatTemperature(weather.main.temp);
    document.getElementById('description').textContent = capitalizeFirstLetter(weather.weather[0].description);
    document.getElementById('wind').textContent = `${weather.wind.speed} km/h`;
    document.getElementById('humidity').textContent = `${weather.main.humidity}%`;
    document.getElementById('pressure').textContent = `${weather.main.pressure} hPa`;
    
    // Update weather icon
    const iconClass = getWeatherIconClass(weather.weather[0].id);
    document.getElementById('weather-icon').className = `fas ${iconClass}`;

    // Update sunrise/sunset times
    document.getElementById('sunrise').textContent = formatTime(weather.sys.sunrise * 1000);
    document.getElementById('sunset').textContent = formatTime(weather.sys.sunset * 1000);

    // Update forecast
    updateForecast(forecast.list);
}

// Update forecast cards
function updateForecast(forecastList) {
    const forecastContainer = document.getElementById('forecast-container');
    forecastContainer.innerHTML = '';

    // Group forecast by day and get mid-day forecasts
    const dailyForecasts = forecastList
        .filter(item => item.dt_txt.includes('12:00:00'))
        .slice(0, 5);

    dailyForecasts.forEach(forecast => {
        const forecastCard = document.createElement('div');
        forecastCard.className = 'forecast-card';
        
        const date = new Date(forecast.dt * 1000);
        const iconClass = getWeatherIconClass(forecast.weather[0].id);
        
        forecastCard.innerHTML = `
            <div class="forecast-date">${formatDate(date, true)}</div>
            <i class="fas ${iconClass}"></i>
            <div class="forecast-temp">${formatTemperature(forecast.main.temp)}</div>
            <div class="forecast-description">${capitalizeFirstLetter(forecast.weather[0].description)}</div>
        `;
        
        forecastContainer.appendChild(forecastCard);
    });
}

// Change temperature unit
function changeUnit(unit) {
    if (currentUnit === unit) return;
    
    currentUnit = unit;
    celsiusBtn.classList.toggle('active');
    fahrenheitBtn.classList.toggle('active');
    
    // Refresh weather data with new unit
    if (currentCity) {
        getWeatherByCity(currentCity);
    }
}

// Format temperature based on selected unit
function formatTemperature(temp) {
    if (currentUnit === 'fahrenheit') {
        temp = (temp * 9/5) + 32;
    }
    return Math.round(temp) + '°' + (currentUnit === 'celsius' ? 'C' : 'F');
}

// Get weather icon class based on weather ID
function getWeatherIconClass(weatherId) {
    const weatherIcons = {
        200: 'fa-bolt',           // thunderstorm
        300: 'fa-cloud-rain',     // drizzle
        500: 'fa-cloud-showers-heavy', // rain
        600: 'fa-snowflake',      // snow
        700: 'fa-smog',           // atmosphere
        800: 'fa-sun',            // clear
        801: 'fa-cloud-sun',      // few clouds
        802: 'fa-cloud',          // clouds
    };

    const firstDigit = Math.floor(weatherId / 100) * 100;
    return weatherIcons[weatherId] || weatherIcons[firstDigit] || 'fa-cloud';
}

// Utility functions
function formatDate(date, short = false) {
    const options = short 
        ? { weekday: 'short', month: 'short', day: 'numeric' }
        : { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Loading screen functions
function showLoading() {
    loadingScreen.style.display = 'flex';
}

function hideLoading() {
    loadingScreen.style.display = 'none';
}

// Error handling
function showError(message) {
    alert(message);
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', init);