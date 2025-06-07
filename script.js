document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("churnForm");
  const loading = document.getElementById("loading");
  const resultsSection = document.getElementById("results");
  const summaryDiv = document.getElementById("summary");

  // Chart.js instances
  let churnGaugeChart = null;
  let factorsChart = null;
  let trendChart = null;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    // Show loading, hide results
    loading.hidden = false;
    resultsSection.hidden = true;
    summaryDiv.textContent = "";

    // Gather form data
    const formData = new FormData(form);
    const data = {};
    formData.forEach((val, key) => {
      // Cast numeric values where needed
      if (["SeniorCitizen", "tenure"].includes(key)) data[key] = Number(val);
      else if (["MonthlyCharges", "TotalCharges"].includes(key))
        data[key] = parseFloat(val);
      else data[key] = val;
    });

    try {
      const response = await fetch(
        "https://customer-churn-api-ako5.onrender.com/predict",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );
      if (!response.ok)
        throw new Error(`API error: ${response.status} ${response.statusText}`);

      const result = await response.json();

      loading.hidden = true;
      resultsSection.hidden = false;

      // Animate and render gauge chart
      renderChurnGauge(result.probability.Churn);

      // Render key factors chart (dummy data for demonstration)
      const topFactors = getDummyTopFactors(result.prediction);
      renderFactorsChart(topFactors);

      // Render summary text
      renderSummaryText(result.prediction, topFactors);

      // Hide historical trends for now (or implement if desired)
      document.querySelector(".historical-trends").hidden = true;

    } catch (error) {
      loading.hidden = true;
      resultsSection.hidden = true;
      alert("Prediction failed: " + error.message);
      console.error(error);
    }
  });

  function renderChurnGauge(churnProb) {
    const ctx = document.getElementById("churnGauge").getContext("2d");
    if (churnGaugeChart) churnGaugeChart.destroy();

    const percent = Math.round(churnProb * 100);

    churnGaugeChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Churn Risk", "Safe"],
        datasets: [
          {
            data: [percent, 100 - percent],
            backgroundColor: [
              `rgba(${Math.min(255, 2.55 * percent)}, ${Math.floor(255 - 2.55 * percent)}, 0, 0.85)`, // green to red gradient
              "rgba(40,40,60,0.3)",
            ],
            borderWidth: 0,
            cutout: "75%",
          },
        ],
      },
      options: {
        rotation: -90,
        circumference: 180,
        animation: {
          animateRotate: true,
          duration: 1500,
          easing: "easeOutCubic",
        },
        plugins: {
          tooltip: { enabled: true, callbacks: {
            label: (ctx) => `Churn Risk: ${percent}%`,
          }},
          legend: { display: false },
        },
      },
    });

    // Update gauge label with % value
    const label = document.getElementById("gaugeLabel");
    label.textContent = `Churn Risk: ${percent}%`;
  }

  function renderFactorsChart(factors) {
    const ctx = document.getElementById("factorsChart").getContext("2d");
    if (factorsChart) factorsChart.destroy();

    const labels = factors.map((f) => f.feature);
    const values = factors.map((f) => f.importance);

    factorsChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Impact",
            data: values,
            backgroundColor: "rgba(74, 144, 226, 0.8)",
            borderRadius: 5,
          },
        ],
      },
      options: {
        indexAxis: "y",
        scales: {
          x: { beginAtZero: true },
          y: { beginAtZero: true },
        },
        plugins: {
          tooltip: { enabled: true },
          legend: { display: false },
        },
        animation: {
          duration: 1200,
          easing: "easeOutQuart",
        },
      },
    });
  }

  function renderSummaryText(prediction, factors) {
    const summary = prediction === "Yes"
      ? `⚠️ The customer is likely to churn. Top factors: ${factors
          .map((f) => f.feature)
          .join(", ")}.`
      : `✅ The customer is likely to stay. Keep up the great service!`;
    summaryDiv.textContent = summary;
  }

  // Dummy data generator for key factors
  // In real usage, replace this by your API response with feature importance
  function getDummyTopFactors(prediction) {
    if (prediction === "Yes") {
      return [
        { feature: "Contract: Month-to-month", importance: 7 },
        { feature: "Monthly Charges", importance: 5 },
        { feature: "Internet Service: Fiber optic", importance: 3 },
      ];
    } else {
      return [
        { feature: "Contract: Two year", importance: 7 },
        { feature: "Senior Citizen: No", importance: 5 },
        { feature: "Tech Support: Yes", importance: 3 },
      ];
    }
  }
});
