const axios = require('axios');

class WeatherController {
    constructor() {
        // Bind the method to ensure 'this' context is preserved
        this.getLondonWeather = this.getLondonWeather.bind(this);
        this.getWeatherInfo = this.getWeatherInfo.bind(this);
        
        // OpenWeatherMap API configuration
        this.weatherConfig = {
            apiKey: 'fd3e7f24cbab1043672e6e04564f3d99',
            baseUrl: 'https://api.openweathermap.org/data/2.5',
            city: 'London',
            country: 'UK'
        };

        // OpenMeteo API configuration (fallback)
        this.openMeteoConfig = {
            baseUrl: 'https://api.open-meteo.com/v1',
            latitude: 51.5074,
            longitude: -0.1278
        };
        
        // Static fallback data in case both APIs fail
        this.fallbackData = {
            temperature: 15,
            feelsLike: 14,
            humidity: 75,
            windSpeed: 4.5,
            description: "scattered clouds",
            icon: "03d",
            timestamp: new Date().toISOString(),
            isLive: false,
            location: 'London, UK',
            coordinates: {
                lat: 51.5074,
                lng: -0.1278
            },
            note: "Using static fallback data"
        };
    }

    async getLondonWeather(req, res) {
        try {
            console.log('Attempting to fetch weather data from OpenWeatherMap API...');
            
            try {
                // First try OpenWeatherMap API
                const response = await axios.get(`${this.weatherConfig.baseUrl}/weather`, {
                    params: {
                        q: `${this.weatherConfig.city},${this.weatherConfig.country}`,
                        appid: this.weatherConfig.apiKey,
                        units: 'metric'
                    },
                    timeout: 10000
                });

                if (response.data) {
                    const weatherData = {
                        temperature: Math.round(response.data.main.temp),
                        feelsLike: Math.round(response.data.main.feels_like),
                        humidity: response.data.main.humidity,
                        windSpeed: response.data.wind.speed,
                        description: response.data.weather[0].description,
                        icon: response.data.weather[0].icon,
                        timestamp: new Date().toISOString(),
                        isLive: true,
                        location: `${this.weatherConfig.city}, ${this.weatherConfig.country}`,
                        coordinates: {
                            lat: response.data.coord.lat,
                            lng: response.data.coord.lon
                        },
                        note: "Live weather data from OpenWeatherMap"
                    };

                    console.log('Successfully fetched weather data from OpenWeatherMap:', JSON.stringify(weatherData, null, 2));
                    return res.json(weatherData);
                }
            } catch (openWeatherError) {
                console.error('OpenWeatherMap API Error:', openWeatherError.message);
                console.log('Falling back to OpenMeteo API...');
            }

            // If OpenWeatherMap fails, try OpenMeteo API
            const openMeteoResponse = await axios.get(`${this.openMeteoConfig.baseUrl}/forecast`, {
                params: {
                    latitude: this.openMeteoConfig.latitude,
                    longitude: this.openMeteoConfig.longitude,
                    current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code',
                    timezone: 'auto'
                },
                timeout: 10000
            });

            if (openMeteoResponse.data && openMeteoResponse.data.current) {
                const current = openMeteoResponse.data.current;
                const weatherInfo = this.getWeatherInfo(current.weather_code);
                
                const weatherData = {
                    temperature: Math.round(current.temperature_2m),
                    feelsLike: Math.round(current.temperature_2m), // OpenMeteo doesn't provide feels_like
                    humidity: Math.round(current.relative_humidity_2m),
                    windSpeed: current.wind_speed_10m,
                    description: weatherInfo.description,
                    icon: weatherInfo.icon,
                    timestamp: new Date().toISOString(),
                    isLive: true,
                    location: 'London, UK',
                    coordinates: {
                        lat: this.openMeteoConfig.latitude,
                        lng: this.openMeteoConfig.longitude
                    },
                    note: "Live weather data from OpenMeteo"
                };

                console.log('Successfully fetched weather data from OpenMeteo:', JSON.stringify(weatherData, null, 2));
                return res.json(weatherData);
            }

            throw new Error('No data received from either API');
        } catch (error) {
            console.error('Weather API Error:', error.message);
            console.error('Error stack:', error.stack);
            
            // Use static fallback data
            console.log('Using static fallback data:', JSON.stringify(this.fallbackData, null, 2));
            res.json(this.fallbackData);
        }
    }

    // Helper method to map weather codes to descriptions and icons
    getWeatherInfo(code, isDay = 1) {
        const suffix = isDay ? 'd' : 'n';
        
        // Weather code mapping based on OpenMeteo documentation
        const weatherMap = {
            0: { description: "clear sky", icon: `01${suffix}` },
            1: { description: "mainly clear", icon: `02${suffix}` },
            2: { description: "partly cloudy", icon: `03${suffix}` },
            3: { description: "overcast", icon: `04${suffix}` },
            45: { description: "foggy", icon: `50${suffix}` },
            48: { description: "depositing rime fog", icon: `50${suffix}` },
            51: { description: "light drizzle", icon: `09${suffix}` },
            53: { description: "moderate drizzle", icon: `09${suffix}` },
            55: { description: "dense drizzle", icon: `09${suffix}` },
            61: { description: "slight rain", icon: `10${suffix}` },
            63: { description: "moderate rain", icon: `10${suffix}` },
            65: { description: "heavy rain", icon: `10${suffix}` },
            71: { description: "slight snow", icon: `13${suffix}` },
            73: { description: "moderate snow", icon: `13${suffix}` },
            75: { description: "heavy snow", icon: `13${suffix}` },
            77: { description: "snow grains", icon: `13${suffix}` },
            80: { description: "slight rain showers", icon: `09${suffix}` },
            81: { description: "moderate rain showers", icon: `09${suffix}` },
            82: { description: "violent rain showers", icon: `09${suffix}` },
            85: { description: "slight snow showers", icon: `13${suffix}` },
            86: { description: "heavy snow showers", icon: `13${suffix}` },
            95: { description: "thunderstorm", icon: `11${suffix}` },
            96: { description: "thunderstorm with slight hail", icon: `11${suffix}` },
            99: { description: "thunderstorm with heavy hail", icon: `11${suffix}` }
        };

        return weatherMap[code] || { description: "unknown", icon: `50${suffix}` };
    }
}

module.exports = new WeatherController(); 