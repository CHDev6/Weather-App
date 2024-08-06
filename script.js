// Event listener for the 'get-weather-btn' button to fetch weather data for the city entered
document.getElementById('get-weather-btn').addEventListener('click', function() {
    const city = document.getElementById('city-input').value;
    if (city) {
        const normalizedCity = normalizeString(city);
        getWeather(normalizedCity);
    } else {
        alert('Your city may not be in the database or there could be a type error.');
    }
});
 
// Event listener for the window to fetch weater data when it detects an "Enter" key press
window.addEventListener('keyup', function(e) {
    if (e.code === "Enter") {
        document.getElementById('get-weather-btn').click();
    }
});

// Event listener for the 'auto-weather-btn' button to detect city from the users location and fetch weather data
document.getElementById('auto-weather-btn').addEventListener('click', function() {
    detectCityAndGetWeather();
});

// Event listener for the 'home-btn' button to reload the page
document.getElementById('home-btn').addEventListener('click', function() {
    location.reload();
});

// Function to detect the city based on the users geolocation and then grab the corresponding API data for that city
async function detectCityAndGetWeather() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            try {
                const city = await getCityFromCoordinates(lat, lon);
                console.log(`Detected city: ${city}`);
                if (city) {
                    const normalizedCity = normalizeString(city);
                    await getWeather(normalizedCity);
                } else {
                    alert('Could not determine the city based on your location.');
                }
            } catch (error) {
                console.error('Error getting city from coordinates:', error);
                alert('Error determining city from your location.');
            }
        }, (error) => {
            console.error('Geolocation error:', error);
            alert('Could not get your location.');
        });
    } else {
        alert('Geolocation is not supported by this browser.');
    }
}

// Function to get the city name from latitude and longitude using the Nominatim API
async function getCityFromCoordinates(lat, lon) {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        console.log('Data from Nominatim:', data);

        if (data && data.address) {
            return data.address.city || data.address.town || data.address.village || null;
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error fetching city from coordinates:', error);
        return null;
    }
}

// Function to fetch and display weather data for a given city using this free weather API I found 
// (manual weather retrieval method) 
async function getWeather(city) {
    const apiKey = '1aab47e637594b2cbc8155535243107'; // Replace with your WeatherAPI key
    const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${city}&days=2`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        console.log('Weather data:', data);

        if (data && data.location && data.forecast && data.forecast.forecastday) {
            // Hide the title_main
            document.querySelector('.title_main').classList.add('hidden');

            // Hide the main UI and show the weather info
            document.getElementById('main-ui').classList.add('hidden');

            document.getElementById('weather-info').classList.remove('hidden');
            document.getElementById('home-btn').classList.remove('hidden');

            // Display city name
            document.getElementById('city-name').textContent = data.location.name;

            // Add to todays hourly table
            populateHourlyTable(data.forecast.forecastday[0].hour, 'today');

            // Add to todays weather description (sunny, rainy, cloudy, etc.)
            document.getElementById('weather-description-today-table').textContent = `${data.forecast.forecastday[0].day.condition.text}`;
            document.getElementById('weather-description-today-table').className = `weather-description ${getWeatherClass(data.forecast.forecastday[0].day.condition.text.toLowerCase())}`;

            // Add to tomorrows hourly table
            populateHourlyTable(data.forecast.forecastday[1].hour, 'tomorrow');

            // Add to tomorrows weather description
            document.getElementById('weather-description-tomorrow-table').textContent = `${data.forecast.forecastday[1].day.condition.text}`;
            document.getElementById('weather-description-tomorrow-table').className = `weather-description ${getWeatherClass(data.forecast.forecastday[1].day.condition.text.toLowerCase())}`;
        } else {
            alert('City not found or data is unavailable');
        }
    } catch (error) {
        console.error('Error fetching weather data:', error);
        alert('Error fetching weather data');
    }
}

// Function to add all weather data to the table for todays and tommorow
// In 3 hour intervals
function populateHourlyTable(hours, day) {
    const tableBodyId = day === 'today' ? 'hourly-table-body-today' : 'hourly-table-body-tomorrow';
    const tableBody = document.getElementById(tableBodyId);
    tableBody.innerHTML = ''; // Clear any existing rows

    function formatTime(hour) {
        const date = new Date(hour.time);
        let hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        const strTime = hours + ':' + (minutes < 10 ? '0' : '') + minutes + ' ' + ampm;
        return strTime;
    }

    hours.filter((_, index) => index % 3 === 0).forEach(hour => {
        const row = document.createElement('tr');
        const timeCell = document.createElement('td');
        timeCell.textContent = formatTime(hour);
        const tempCell = document.createElement('td');
        tempCell.textContent = `${hour.temp_c}°C`;
        row.appendChild(timeCell);
        row.appendChild(tempCell);
        tableBody.appendChild(row);
    });
}

// Function to get the CSS class based on the weather condition description
function getWeatherClass(condition) {
    if (condition.includes('sunny') || condition.includes('clear')) {
        return 'sunny';
    } else if (condition.includes('cloudy') || condition.includes('overcast')) {
        return 'cloudy';
    } else if (condition.includes('rainy') || condition.includes('rain')) {
        return 'rainy';
    } else {
        return ''; // Default or other condition
    }
}

// Function to get rid of any special accents on letters since API doesn't include them
function normalizeString(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}