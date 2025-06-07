const form = document.getElementById('churn-form');
const resultSection = document.getElementById('result-section');
const churnProbabilityBar = document.getElementById('churn-probability-bar');
const churnProbabilityText = document.getElementById('churn-probability-text');
const keyFactorsList = document.getElementById('key-factors-list');
const loadingIndicator = document.getElementById('loading-indicator');
const errorMessage = document.getElementById('error-message');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorMessage.style.display = 'none';
  resultSection.style.display = 'none';
  loadingIndicator.style.display = 'block';

  // Collect data from inputs
  const data = {
    gender: form.gender.value,
    SeniorCitizen: parseInt(form.SeniorCitizen.value),
    Partner: form.Partner.value,
    Dependents: form.Dependents.value,
    tenure: parseInt(form.tenure.value),
    PhoneService: form.PhoneService.value,
    MultipleLines: form.MultipleLines.value,
    InternetService: form.InternetService.value,
    OnlineSecurity: form.OnlineSecurity.value,
    OnlineBackup: form.OnlineBackup.value,
    DeviceProtection: form.DeviceProtection.value,
    TechSupport: form.TechSupport.value,
    StreamingTV: form.StreamingTV.value,
    StreamingMovies: form.StreamingMovies.value,
    Contract: form.Contract.value,
    PaperlessBilling: form.PaperlessBilling.value,
    PaymentMethod: form.PaymentMethod.value,
    MonthlyCharges: parseFloat(form.MonthlyCharges.value),
    TotalCharges: parseFloat(form.TotalCharges.value),
  };

  try {
    const response = await fetch('https://customer-churn-api-ako5.onrender.com/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.statusText}`);
    }

    const result = await response.json();

    loadingIndicator.style.display = 'none';
    resultSection.style.display = 'block';

    // Show churn probability bar (width = churn probability * 100%)
    const churnProb = result.probability.Churn;
    churnProbabilityBar.style.width = `${churnProb * 100}%`;
    churnProbabilityText.textContent = `Churn Probability: ${(churnProb * 100).toFixed(1)}%`;

    // Phase 1: no key factors yet
    keyFactorsList.innerHTML = '<li>N/A (Coming soon)</li>';

  } catch (error) {
    loadingIndicator.style.display = 'none';
    errorMessage.textContent = `Prediction failed: ${error.message}`;
    errorMessage.style.display = 'block';
  }
});
