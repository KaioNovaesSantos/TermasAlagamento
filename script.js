const OPENWEATHER_API_KEY = "06743c9842aa603ffe1d3fdfd0ce71da";
const LATITUDE = -23.6714875;  // Jurubatuba - SP
const LONGITUDE = -46.696401;
let map;

function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: LATITUDE, lng: LONGITUDE },
        zoom: 15
    });

    fetchWeatherData();
    setInterval(fetchWeatherData, 300000); // Atualiza a cada 5 minutos
}

async function fetchWeatherData() {
    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${LATITUDE}&lon=${LONGITUDE}&appid=${OPENWEATHER_API_KEY}&units=metric`;
        const response = await fetch(url);
        const data = await response.json();
        const rainVolume = data.rain ? data.rain["1h"] || 0 : 0;

        updateAlert(rainVolume);
    } catch (error) {
        console.error("Erro ao obter dados meteorológicos:", error);
    }
}

function updateAlert(rainVolume) {
    const alertBox = document.getElementById("alert-box");

    if (rainVolume === 0) {
        alertBox.innerText = "Tempo seco. Sem risco de alagamento.";
        alertBox.className = "alert-green";
    } else if (rainVolume > 0 && rainVolume <= 5) {
        alertBox.innerText = `Chuva fraca (${rainVolume} mm/h). Sem risco de alagamento.`;
        alertBox.className = "alert-green";
    } else if (rainVolume > 5 && rainVolume <= 15) {
        alertBox.innerText = `Chuva moderada (${rainVolume} mm/h). Atenção!`;
        alertBox.className = "alert-yellow";
    } else {
        alertBox.innerText = `Chuva intensa (${rainVolume} mm/h). Risco alto de alagamento!`;
        alertBox.className = "alert-red";

        // Envia e-mail de alerta
        emailjs.send("service_y1t2fhg", "alerta_chuva", {
            to_name: "Piloto Jurubatuba",
            to_email: "miguelgobetti@gmail.com",
            rain_volume: rainVolume,
            time: new Date().toLocaleString("pt-BR")
        }).then(() => {
            console.log("E-mail de alerta enviado.");
        }).catch((error) => {
            console.error("Erro ao enviar e-mail:", error);
        });

        // Envia alerta por SMS
        sendSMSAlert(rainVolume);
    }
}

async function sendSMSAlert(rainVolume) {
    try {
        const response = await fetch("https://alerta-chuva.cloudfunctions.net/sendRainAlert", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                rain_volume: rainVolume,
                location: "Jurubatuba - SP",
                time: new Date().toLocaleString("pt-BR")
            })
        });

        if (response.ok) {
            console.log("Alerta SMS enviado com sucesso");
        } else {
            console.error("Falha ao enviar alerta SMS");
        }
    } catch (error) {
        console.error("Erro na chamada do webhook:", error);
    }
}
