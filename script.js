document.getElementById("churnForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());

  // Convert numeric values
  data.SeniorCitizen = parseInt(data.SeniorCitizen);
  data.tenure = parseInt(data.tenure);
  data.MonthlyCharges = parseFloat(data.MonthlyCharges);
  data.TotalCharges = parseFloat(data.TotalCharges);

  const resultDiv = document.getElementById("result");
  resultDiv.innerHTML = "Predicting...";

  try {
    const res = await fetch("https://customer-churn-api-ako5.onrender.com/predict", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    if (!res.ok) throw new Error("API call failed");

    const result = await res.json();
    resultDiv.innerHTML = `
      <p><strong>Prediction:</strong> ${result.prediction}</p>
      <p><strong>Probability:</strong></p>
      <ul>
        <li>Churn: ${result.probability.Churn}</li>
        <li>No Churn: ${result.probability["No Churn"]}</li>
      </ul>
    `;
  } catch (error) {
    resultDiv.innerHTML = "<p style='color:red;'>Error occurred while predicting.</p>";
    console.error(error);
  }
});
