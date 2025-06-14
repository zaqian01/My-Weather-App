document.addEventListener('DOMContentLoaded', () => {
    // === DOM Elements ===
    const cityInput = document.getElementById('city-input');
    const searchButton = document.getElementById('search-button');
    const currentLocationButton = document.getElementById('current-location-button');
    const loadingSpinner = document.getElementById('loading-spinner');
    const weatherDisplay = document.getElementById('weather-display');
    const cityNameElem = document.getElementById('city-name');
    const weatherIconElem = document.getElementById('weather-icon');
    const temperatureElem = document.getElementById('temperature');
    const descriptionElem = document.getElementById('description');
    const humidityElem = document.getElementById('humidity');
    const windSpeedElem = document.getElementById('wind-speed');
    const pressureElem = document.getElementById('pressure');
    const sunriseElem = document.getElementById('sunrise');
    const sunsetElem = document.getElementById('sunset');
    const visibilityElem = document.getElementById('visibility');
    const errorMessageElem = document.getElementById('error-message');
    const forecastDisplay = document.getElementById('forecast-display');
    const forecastContainer = document.querySelector('.forecast-items-container');

    // === API Key & Base URLs ===
    const API_KEY = '8edd1348ded29bebc3e83d11d73f6288';
    const CURRENT_WEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';
    const FORECAST_BASE_URL = 'https://api.openweathermap.org/data/2.5/forecast';

    // === Helper Functions ===
    function showLoading() {
        loadingSpinner.style.display = 'flex';
        weatherDisplay.style.display = 'none';
        forecastDisplay.style.display = 'none';
        errorMessageElem.style.display = 'none';
    }

    function hideLoading() {
        loadingSpinner.style.display = 'none';
    }

    function showError(message) {
        errorMessageElem.textContent = message;
        errorMessageElem.style.display = 'block';
        weatherDisplay.style.display = 'none';
        forecastDisplay.style.display = 'none';
        hideLoading();
    }

    function formatTime(timestamp) {
        const date = new Date(timestamp * 1000);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }); // Changed to 'en-US' and 12-hour format
    }

    function getDayName(timestamp) {
        const date = new Date(timestamp * 1000);
        return date.toLocaleDateString('en-US', { weekday: 'short' }); // Changed to 'en-US'
    }

    // === Main Function: Fetch Current Weather Data ===
    async function getWeatherData(query, type = 'city') {
        showLoading();

        let url;
        if (type === 'city') {
            if (!query) {
                showError('City name cannot be empty!');
                return;
            }
            url = `${CURRENT_WEATHER_BASE_URL}?q=${query}&appid=${API_KEY}&units=metric&lang=en`; // Changed lang to 'en'
        } else if (type === 'coords') {
            const { lat, lon } = query;
            url = `${CURRENT_WEATHER_BASE_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=en`; // Changed lang to 'en'
        }

        try {
            const response = await fetch(url);
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('City not found. Please try again!');
                }
                throw new Error(`An error occurred: ${response.statusText} (${response.status})`);
            }
            const data = await response.json();
            displayWeatherData(data);
            getWeatherForecast(data.coord.lat, data.coord.lon);
        } catch (error) {
            console.error('Error fetching weather data:', error);
            showError(error.message);
        } finally {
            hideLoading();
        }
    }

    // === Main Function: Fetch Weather Forecast Data ===
    async function getWeatherForecast(lat, lon) {
        const url = `${FORECAST_BASE_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=en`; // Changed lang to 'en'

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch forecast: ${response.statusText}`);
            }
            const data = await response.json();
            displayWeatherForecast(data);
        } catch (error) {
            console.error('Error fetching forecast data:', error);
            // Could display a separate error message for the forecast if desired
        }
    }

    // === Function to Display Current Weather Data ===
    function displayWeatherData(data) {
        if (!data || !data.main || !data.weather || data.weather.length === 0) {
            showError('Incomplete weather data.');
            return;
        }

        cityNameElem.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${data.name}, ${data.sys.country}`;
        temperatureElem.textContent = `${Math.round(data.main.temp)}°C`;
        descriptionElem.textContent = data.weather[0].description;

        const iconCode = data.weather[0].icon;
        weatherIconElem.src = `https://openweathermap.org/img/wn/${iconCode}@4x.png`;
        weatherIconElem.alt = data.weather[0].description;
        weatherIconElem.style.display = 'block';

        humidityElem.textContent = `${data.main.humidity}%`;
        windSpeedElem.textContent = `${(data.wind.speed * 3.6).toFixed(1)} km/h`;
        pressureElem.textContent = `${data.main.pressure} hPa`;
        sunriseElem.textContent = formatTime(data.sys.sunrise);
        sunsetElem.textContent = formatTime(data.sys.sunset);
        visibilityElem.textContent = `${(data.visibility / 1000).toFixed(1)} km`;

        weatherDisplay.style.display = 'block';
        weatherDisplay.style.opacity = '1';
        weatherDisplay.style.transform = 'translateY(0)';
    }

    // === Function to Display Weather Forecast ===
    function displayWeatherForecast(data) {
        forecastContainer.innerHTML = '';
        const dailyForecasts = {};

        // Filter data to get one forecast per day (usually around noon)
        data.list.forEach(item => {
            const date = new Date(item.dt * 1000);
            const dayKey = date.toLocaleDateString('en-US', { day: 'numeric', month: 'numeric', year: 'numeric' }); // Changed to 'en-US'

            // Only take one forecast per day (e.g., 12:00-15:00)
            if (!dailyForecasts[dayKey] && date.getHours() >= 12 && date.getHours() <= 15) {
                dailyForecasts[dayKey] = item;
            }
        });

        // Display only the next 5 days
        const forecastDays = Object.values(dailyForecasts).slice(0, 5);

        forecastDays.forEach(item => {
            const date = new Date(item.dt * 1000);
            const dayName = getDayName(item.dt);
            const iconCode = item.weather[0].icon;
            const tempMax = Math.round(item.main.temp_max);
            const tempMin = Math.round(item.main.temp_min);

            const forecastItem = document.createElement('div');
            forecastItem.classList.add('forecast-item');
            forecastItem.innerHTML = `
                <p class="day-name">${dayName}</p>
                <img src="https://openweathermap.org/img/wn/${iconCode}@2x.png" alt="${item.weather[0].description}">
                <p class="temp-max-min">${tempMax}°C / ${tempMin}°C</p>
                <p>${item.weather[0].description}</p>
            `;
            forecastContainer.appendChild(forecastItem);
        });

        if (forecastDays.length > 0) {
            forecastDisplay.style.display = 'block';
            forecastDisplay.style.opacity = '1';
            forecastDisplay.style.transform = 'translateY(0)';
        } else {
            forecastDisplay.style.display = 'none';
        }
    }

    // === Feature: Geolocation ===
    function getCurrentLocationWeather() {
        showLoading();
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                getWeatherData({ lat, lon }, 'coords');
            }, error => {
                console.error('Error getting location:', error);
                let message = 'Unable to retrieve your location.';
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        message += ' Location permission denied.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        message += ' Location information is unavailable.';
                        break;
                    case error.TIMEOUT:
                        message += ' The request to get user location timed out.';
                        break;
                    case error.UNKNOWN_ERROR:
                        message += ' An unknown error occurred.';
                        break;
                }
                showError(message + ' Please try searching for a city manually.');
            });
        } else {
            showError('Geolocation is not supported by this browser.');
        }
    }

    // === Event Listeners ===
    searchButton.addEventListener('click', () => {
        const city = cityInput.value.trim();
        getWeatherData(city, 'city');
    });

    cityInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            const city = cityInput.value.trim();
            getWeatherData(city, 'city');
        }
    });

    currentLocationButton.addEventListener('click', getCurrentLocationWeather);

    // Load weather for a default city on startup
    getWeatherData('London', 'city'); // Changed default city to London
});