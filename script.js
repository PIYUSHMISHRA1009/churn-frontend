document.getElementById('churnForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const formData = new FormData(this);
  const data = {};
  formData.forEach((val, key) => data[key] = isNaN(val) ? val : (val.includes('.') ? parseFloat(val) : parseInt(val)));

  const resultDiv = document.getElementById('result');
  resultDiv.textContent = "⏳ Predicting...";

  try {
    const response = await fetch('https://customer-churn-api-ako5.onrender.com/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error('Prediction failed.');

    const result = await response.json();
    resultDiv.innerHTML = `
      <p>📊 Prediction: <strong>${result.prediction}</strong></p>
      <p>🟡 Probability of Churn: <strong>${(result.probability["Churn"] * 100).toFixed(2)}%</strong></p>
    `;
  } catch (err) {
    resultDiv.textContent = "❌ Error predicting churn. Try again later.";
  }
});
