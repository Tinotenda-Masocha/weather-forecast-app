const searchInput = document.querySelector(".search-input");
const locationButton = document.querySelector(".location-button");
const currentWeatherDiv = document.querySelector(".current-weather");
const hourlyWeatherDiv = document.querySelector(
  ".hourly-weather .weather-list",
);

if (!currentWeatherDiv) console.warn("Missing .current-weather element in DOM");
if (!hourlyWeatherDiv)
  console.warn(
    "Missing hourly weather list element: .hourly-weather .weather-list",
  );

// Weather codes for mapping to custom icons
const weatherCodes = {
  clear: [1000],
  clouds: [1003, 1006, 1009],
  mist: [1030, 1135, 1147],
  rain: [
    1063, 1150, 1153, 1168, 1171, 1180, 1183, 1198, 1201, 1240, 1243, 1246,
    1273, 1276,
  ],
  moderate_heavy_rain: [1186, 1189, 1192, 1195, 1243, 1246],
  snow: [
    1066, 1069, 1072, 1114, 1117, 1204, 1207, 1210, 1213, 1216, 1219, 1222,
    1225, 1237, 1249, 1252, 1255, 1258, 1261, 1264, 1279, 1282,
  ],
  thunder: [1087, 1279, 1282],
  thunder_rain: [1273, 1276],
};

const displayHourlyForecast = (hourlyData) => {
  if (!hourlyWeatherDiv) {
    console.warn("Cannot render hourly forecast: container not found");
    return;
  }

  if (!Array.isArray(hourlyData) || hourlyData.length === 0) {
    hourlyWeatherDiv.innerHTML = "<p>No hourly data available.</p>";
    return;
  }

  const currentHourTimestamp = new Date().setMinutes(0, 0, 0);
  const next24HoursTimestamp = currentHourTimestamp + 24 * 60 * 60 * 1000;

  const next24HoursData = hourlyData.filter((item) => {
    const forecastTime = new Date(item.time).getTime();
    return (
      forecastTime >= currentHourTimestamp &&
      forecastTime <= next24HoursTimestamp
    );
  });

  const hourlyHTML = next24HoursData
    .map((item) => {
      const temperature = Math.round(item.temp_c ?? item.temp ?? 0);
      const time = (item.time || "").split(" ")[1] || "--:--";
      const weatherIcon = Object.keys(weatherCodes).find((icon) =>
        weatherCodes[icon].includes(item.condition?.code),
      );

      return `<li class="weather-item">
            <p class="time">${time.substring(0, 5)}</p>
            <img src="icons/${weatherIcon || "clear"}.svg" class="weather-icon" />
            <p class="temp">${temperature}°C</p>
          </li>`;
    })
    .join("");

  hourlyWeatherDiv.innerHTML = hourlyHTML;
  console.log("Hourly forecast HTML:", hourlyHTML);
};

const getWeatherDetails = async (cityName) => {
  if (window.innerWidth < 768 && searchInput) searchInput.blur(); // Hide keyboard on mobile after search
  document.body.classList.remove("show-no-results");

  const API_URL = `/weather/${encodeURIComponent(cityName)}`;

  try {
    const response = await fetch(API_URL);
    const data = await response.json();

    if (!data || !data.current) {
      throw new Error("Malformed API response: missing 'current' property");
    }

    const temperature = Math.floor(data.current.temp_c);
    const description = data.current.condition?.text || "";
    const weatherIcon = Object.keys(weatherCodes).find((icon) =>
      weatherCodes[icon].includes(data.current.condition?.code),
    );

    const iconName = weatherIcon || "clear";
    const weatherIconEl =
      currentWeatherDiv && currentWeatherDiv.querySelector(".weather-icon");
    if (weatherIconEl) weatherIconEl.src = `icons/${iconName}.svg`;
    const tempEl =
      currentWeatherDiv && currentWeatherDiv.querySelector(".temperature");
    if (tempEl) tempEl.innerHTML = `${temperature}<span>°C</span>`;
    const descEl =
      currentWeatherDiv && currentWeatherDiv.querySelector(".description");
    if (descEl) descEl.innerText = description;

    const combineHourlyData = [
      ...(data.forecast?.forecastday?.[0]?.hour || []),
      ...(data.forecast?.forecastday?.[1]?.hour || []),
    ];

    displayHourlyForecast(combineHourlyData);
    console.log("Success!", combineHourlyData);

    if (searchInput) searchInput.value = data.location.name;
  } catch (error) {
    document.body.classList.add("show-no-results");
    console.log(error);
  }
};

// Set up the weather request for a specified city name (used for both search and location-based requests)
const setupWeatherRequest = (cityName) => {
  getWeatherDetails(cityName);
};

// Handle user input in search field
if (searchInput) {
  searchInput.addEventListener("keyup", (e) => {
    const cityName = searchInput.value.trim();
    if (e.key == "Enter" && cityName) {
      getWeatherDetails(cityName);
    }
  });
}

// Get user's location and fetch weather for that location when the location button is clicked
if (locationButton) {
  locationButton.addEventListener("click", () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          getWeatherDetails(`${latitude},${longitude}`);
        },
        (error) => {
          console.error("Error getting location:", error);
        },
      );
    }
  });
}

// Initial weather request for a default city (optional)
setupWeatherRequest("Bulawayo");
