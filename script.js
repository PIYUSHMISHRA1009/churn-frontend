document.getElementById("churnForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const loading = document.getElementById("loadingIndicator");
  const resultCard = document.getElementById("resultCard");
  loading.classList.remove("hidden");
  resultCard.classList.add("hidden");

  const formData = new FormData(this);
  const data = {};
  formData.forEach((value, key) => (data[key] = isNaN(value) ? value : Number(value)));

  try {
    const response = await fetch("https://customer-churn-api-ako5.onrender.com/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    const { prediction, probability } = result;

    const churnProbability = (probability.Churn * 100).toFixed(1);
    const circle = document.getElementById("circle-bar");
    const percentageText = document.getElementById("probabilityText");
    circle.setAttribute("stroke-dasharray", `${churnProbability}, 100`);
    percentageText.textContent = `${churnProbability}%`;

    const label = document.getElementById("predictionLabel");
    const risk = document.getElementById("riskLevel");
    const insight = document.getElementById("insightMessage");

    if (prediction === "Yes") {
      label.textContent = "Customer Likely to Churn";
      label.className = "high-risk";
    } else {
      label.textContent = "Customer Will Stay";
      label.className = "low-risk";
    }

    const prob = probability.Churn;
    if (prob > 0.7) {
      risk.textContent = "High Risk";
      risk.className = "high-risk";
      insight.textContent = "🛑 Immediate retention action recommended!";
    } else if (prob > 0.4) {
      risk.textContent = "Moderate Risk";
      risk.className = "medium-risk";
      insight.textContent = "⚠️ Monitor this customer closely.";
    } else {
      risk.textContent = "Low Risk";
      risk.className = "low-risk";
      insight.textContent = "✅ Customer seems loyal.";
    }

    resultCard.classList.remove("hidden");
  } catch (error) {
    alert("Prediction failed. Please try again.");
  } finally {
    loading.classList.add("hidden");
  }
});
