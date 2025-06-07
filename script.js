const form = document.getElementById("churnForm");
const predictionEl = document.getElementById("predictionResult");
const churnValueEl = document.getElementById("churnValue");
const gaugeBar = document.getElementById("gaugeBar");
const insightsEl = document.getElementById("insights");
const loadSampleBtn = document.getElementById("loadSampleBtn");
const exportSingleBtn = document.getElementById("exportSingleBtn");

const csvUpload = document.getElementById("csvUpload");
const exportBatchBtn = document.getElementById("exportBatchBtn");
const clearBatchBtn = document.getElementById("clearBatchBtn");
const batchResultsTable = document.getElementById("batchResultsTable");
const batchSummary = document.getElementById("batchSummary");

let batchData = [];
let batchPredictions = [];

const sampleData = {
  gender: "Female",
  SeniorCitizen: 0,
  Partner: "No",
  Dependents: "No",
  tenure: 12,
  PhoneService: "Yes",
  MultipleLines: "No",
  InternetService: "Fiber optic",
  OnlineSecurity: "No",
  OnlineBackup: "Yes",
  DeviceProtection: "No",
  TechSupport: "No",
  StreamingTV: "Yes",
  StreamingMovies: "No",
  Contract: "Month-to-month",
  PaperlessBilling: "Yes",
  PaymentMethod: "Electronic check",
  MonthlyCharges: 70.35,
  TotalCharges: 845.5
};

// Utility: Validate form inputs roughly (simple checks)
function validateForm() {
  const data = {};
  const formData = new FormData(form);
  for (const [key, value] of formData.entries()) {
    if (!value.trim()) return null;
    data[key] = value.trim();
  }

  // Numeric fields parse
  ["SeniorCitizen", "tenure", "MonthlyCharges", "TotalCharges"].forEach(k => {
    data[k] = parseFloat(data[k]);
    if (isNaN(data[k])) return null;
  });

  return data;
}

function updateGauge(percent, prediction) {
  churnValueEl.textContent = `${percent}%`;
  gaugeBar.setAttribute("stroke-dasharray", `${percent}, 100`);
  gaugeBar.style.stroke = prediction === "Yes" ? "red" : "#00ffe7";
}

// Call the real API to get prediction
async function getPrediction(data) {
  try {
    const response = await fetch("https://customer-churn-api-ako5.onrender.com/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error("Network response not ok");
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Prediction API error:", error);
    return null;
  }
}

// Show insights (mocked for demo)
function showInsights(data) {
  // This can be dynamic from model if available.
  const insights = `
    <strong>Insights:</strong>
    <ul>
      <li>Contract type affects churn risk significantly.</li>
      <li>Fiber optic users have a slightly higher churn probability.</li>
      <li>Month-to-month contracts increase churn likelihood.</li>
    </ul>`;
  insightsEl.innerHTML = insights;
}

// Fill form with sample data
function fillSampleData() {
  for (const key in sampleData) {
    const input = form.elements[key];
    if (input) {
      input.value = sampleData[key];
    }
  }
}

// Export single prediction to CSV
function exportSingleCSV(data, churn, probability) {
  const csvRows = [];
  const headers = [...Object.keys(data), "Churn", "Probability"];
  csvRows.push(headers.join(","));

  const row = [...Object.values(data), churn, probability];
  csvRows.push(row.join(","));

  const csvContent = csvRows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "churn_prediction.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// Event listeners
form.addEventListener("submit", async e => {
  e.preventDefault();
  predictionEl.textContent = "🔄 Predicting...";
  churnValueEl.textContent = "--%";
  gaugeBar.setAttribute("stroke-dasharray", "0, 100");
  insightsEl.innerHTML = "";

  const data = validateForm();
  if (!data) {
    predictionEl.textContent = "❌ Invalid input data.";
    return;
  }

  const result = await getPrediction(data);
  if (!result) {
    predictionEl.textContent = "❌ Prediction failed.";
    return;
  }

  const percent = Math.round(result.probability.Churn * 100);
  updateGauge(percent, result.prediction);
  predictionEl.textContent = result.prediction === "Yes"
    ? "⚠️ High Churn Risk!"
    : "✅ Low Churn Risk";

  showInsights(data);
});

loadSampleBtn.addEventListener("click", () => {
  fillSampleData();
});

exportSingleBtn.addEventListener("click", () => {
  const data = validateForm();
  if (!data) {
    alert("Please fill valid data to export.");
    return;
  }
  const resultText = predictionEl.textContent;
  const prediction = resultText.includes("High") ? "Yes" : "No";
  const probabilityText = churnValueEl.textContent;
  exportSingleCSV(data, prediction, probabilityText);
});

// ===================
// Batch Prediction Logic
// ===================

csvUpload.addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function (event) {
    const text = event.target.result;
    batchData = parseCSV(text);
    if (!batchData.length) {
      alert("No valid data found in CSV.");
      return;
    }

    batchPredictions = [];
    batchSummary.textContent = "Predicting batch data, please wait...";

    for (let i = 0; i < batchData.length; i++) {
      const prediction = await getPrediction(batchData[i]);
      if (prediction) {
        batchPredictions.push({
          ...batchData[i],
          Churn: prediction.prediction,
          Probability: (prediction.probability.Churn * 100).toFixed(2) + "%"
        });
      } else {
        batchPredictions.push({
          ...batchData[i],
          Churn: "Error",
          Probability: "N/A"
        });
      }
    }

    displayBatchResults();
    exportBatchBtn.disabled = false;
    batchSummary.textContent = `Batch prediction complete: ${batchPredictions.length} rows processed.`;
  };
  reader.readAsText(file);
});

exportBatchBtn.addEventListener("click", () => {
  if (!batchPredictions.length) return;
  exportBatchCSV(batchPredictions);
});

clearBatchBtn.addEventListener("click", () => {
  batchData = [];
  batchPredictions = [];
  batchResultsTable.style.display = "none";
  batchSummary.textContent = "";
  csvUpload.value = "";
  exportBatchBtn.disabled = true;
});

// Parse CSV to array of objects
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.trim());
  const rows = lines.slice(1);

  return rows.map(line => {
    const values = line.split(",").map(v => v.trim());
    const obj = {};
    headers.forEach((h, i) => {
      // Convert numbers if possible
      let val = values[i];
      if (!isNaN(val) && val !== "") {
        val = parseFloat(val);
      }
      obj[h] = val;
    });
    return obj;
  });
}

// Display batch results in table
function displayBatchResults() {
  const theadTr = batchResultsTable.querySelector("thead tr");
  const tbody = batchResultsTable.querySelector("tbody");

  // Clear previous
  theadTr.innerHTML = "";
  tbody.innerHTML = "";

  if (batchPredictions.length === 0) {
    batchResultsTable.style.display = "none";
    return;
  }

  // Build headers dynamically
  const headers = Object.keys(batchPredictions[0]);
  headers.forEach(header => {
    const th = document.createElement("th");
    th.textContent = header;
    theadTr.appendChild(th);
  });

  // Build rows
  batchPredictions.forEach(row => {
    const tr = document.createElement("tr");
    headers.forEach(header => {
      const td = document.createElement("td");
      td.textContent = row[header];
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  batchResultsTable.style.display = "table";
}

// Export batch results to CSV
function exportBatchCSV(data) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(",")];

  data.forEach(row => {
    const values = headers.map(h => {
      const val = row[h];
      if (typeof val === "string" && val.includes(",")) {
        return `"${val}"`;
      }
      return val;
    });
    csvRows.push(values.join(","));
  });

  const csvContent = csvRows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "batch_churn_predictions.csv";
  a.click();
  URL.revokeObjectURL(url);
}
