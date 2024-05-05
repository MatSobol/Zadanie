var validate = require("jsonschema").validate;
const { ping } = require("./tcpPing.js");
const fs = require("fs");

const url = new URL("https://tvgo.orange.pl/gpapi/status");
const hostname = url.hostname;
const repetitions = 10;
const timeOffset = 5 * 1000;

const schema = {
  type: "object",
  properties: {
    ahS: { type: "string" },
    aS: { type: "string" },
    gS: { type: "string" },
    iaS: { type: "string" },
    lS: { type: "string" },
    nS: { type: "string" },
  },
  required: ["ahS", "aS", "gS", "iaS", "lS", "nS"],
};

const pingMeasure = ping(hostname);

const formatTime = (time) => {
  const year = time.getFullYear();
  const month = String(time.getMonth() + 1).padStart(2, "0");
  const day = String(time.getDate()).padStart(2, "0");

  const hour = String(time.getHours()).padStart(2, "0");
  const minute = String(time.getMinutes()).padStart(2, "0");
  const seconds = String(time.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} | ${hour}:${minute}:${seconds}`;
};

const formatPing = (pingValues, time) => {
  return `Czas: ${formatTime(time)}. Ilość wysłanych pakietów: ${
    pingValues.packetCount
  }, odebranych: ${pingValues.receivedPacketCount}, straconych: ${
    pingValues.lostPacketCount
  }. Czas błądzenia pakietów minimalny: ${pingValues.minTime} ms, maksymalny: ${
    pingValues.maxTime
  } ms i średni: ${pingValues.avgTime} ms`;
};

const writeToFile = (text) => {
  fs.appendFile("log.txt", text + "\n", function (err) {
    if (err) {
      console.log("Nie można zapisac do pliku");
    }
  });
};

const printResult = (result, latency) => {
  let time = new Date();
  const text = `Czas: ${formatTime(
    time
  )}. Wysłano żądanie Get. Opóźnienie zapytania: ${latency} ms. Prawidłowy kod odpowiedzi: ${
    result[0]
  }. Odpowiedź to JSON: ${result[1]}. Prawidłowa struktura: ${result[2]}.`;
  console.log(text);
  writeToFile(text);
};

const validateResponse = async (response) => {
  let result = ["nie", "nie", "nie"];
  if (response.status === 200) {
    result[0] = "tak";
    if (response.headers.get("content-type").includes("json")) {
      result[1] = "tak";
      const data = await response.json();
      if (validate(data, schema).valid) {
        result[2] = "tak";
      }
    }
  }
  return result;
};

let counter = 0;
const interval = setInterval(async () => {
  if (counter === repetitions) {
    const currentTime = new Date();
    const formattedPing = formatPing(pingMeasure.stop(), currentTime);
    writeToFile(formattedPing);
    console.log(formattedPing);
    clearInterval(interval);
    return;
  }
  const sendDate = new Date().getTime();
  fetch(url, {
    method: "GET",
    signal: AbortSignal.timeout(2000),
  })
    .then(async(response) => {
      let time = new Date();
      const latency = time.getTime() - sendDate;
      const testResult = await validateResponse(response, latency);
      printResult(testResult, latency);
    })
    .catch((error) => {
      let time = new Date();
      const latency = time.getTime() - sendDate;
      const text = `Czas: ${formatTime(
        time
      )}. Wysłano żądanie Get. Opoznienie zapytania: ${latency} ms. Brak odpowiedzi, poniewaz wystapil blad podczas zadania.`;
      console.log(text);
      writeToFile(text);
    });
  counter++;
}, timeOffset);
