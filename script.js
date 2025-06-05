const apiURL = "https://customer-churn-api-ako5.onrender.com/predict";

const schemaFields = {
  gender: "select",
  SeniorCitizen: "number",
  Partner: "select",
  Dependents: "select",
  tenure: "number",
  PhoneService: "select",
  MultipleLines: "select",
  InternetService: "select",
  OnlineSecurity: "select",
  OnlineBackup: "select",
  DeviceProtection: "select",
  TechSupport: "select",
  StreamingTV: "select",
  StreamingMovies: "select",
  Contract: "select",
  PaperlessBilling: "select",
  PaymentMethod: "select",
  MonthlyCharges: "number",
  TotalCharges: "number"
};

const options = {
  gender: ["Male", "Female"],
  Partner: ["Yes", "No"],
  Dependents: ["Yes", "No"],
  PhoneService: ["Yes", "No"],
  MultipleLines: ["Yes", "No", "No phone service"],
  InternetService: ["DSL", "Fiber optic", "No"],
  OnlineSecurity: ["Yes", "No", "No internet service"],
  OnlineBackup: ["Yes", "No", "No internet service"],
  DeviceProtection: ["Yes", "No", "No internet service"],
  TechSupport: ["Yes", "No", "No internet service"],
  StreamingTV: ["Yes", "No", "No internet service"],
  StreamingMovies: ["Yes", "No", "No internet service"],
  Contract: ["Month-to-month", "One year", "Two year"],
  PaperlessBilling: ["Yes", "No"],
  PaymentMethod: [
    "Electronic check",
    "Mailed check",
    "Bank transfer (automatic)",
    "Credit card (automatic)"
  ]
};

window.onload = () => {
  const form = document.getElementById("churnForm");

  // Dynamically build form inputs
  Object.entries(schemaFields).forEach(([key, type]) => {
    const wrapper = document.createElement("div");
    wrapper.className = "flex flex-col";

    const label = document.createElement("label");
    label.innerText = key;
    label.className = "text-sm font-semibold mb-1 capitalize";

    let input;
    if (type === "select") {
      input = document.createElement("select");
      input.className = "p-2 border rounded";
      options[key].forEach((opt) => {
        const option = document.createElement("option");
        option.value = opt;
        option.innerText = opt;
        input.appendChild(option);
      });
    } else {
      input = document.createElement("input");
      input.type = "number";
      input.step = "any";
      input.className = "p-2 border rounded";
    }

    input.id = key;
    input.name = key;
    wrapper.appendChild(label);
    wrapper.appendChild(input);
    form.appendChild(wrapper);
  });

  // Predict on submit
  form.onsubmit = async (e) => {
    e.preventDefault();

    const data = {};
    Object.keys(schemaFields).forEach((key) => {
      const val = document.getElementById(key).value;
      data[key] = schemaFields[key] === "number" ? parseFloat(val) : val;
    });

    document.getElementById("loader").classList.remove("hidden");
    document.getElementById("result").classList.add("hidden");

    try {
      const res = await fetch(apiURL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });

      const json = await res.json();
      showResult(json);
    } catch (err) {
      alert("Prediction failed. Please try again.");
    } finally {
      document.getElementById("loader").classList.add("hidden");
    }
  };

  // Load sample
  document.getElementById("fillSample").onclick = () => {
    const sample = {
      gender: "Female",
      SeniorCitizen: 0,
      Partner: "Yes",
      Dependents: "No",
      tenure: 5,
      PhoneService: "Yes",
      MultipleLines: "No",
      InternetService: "DSL",
      OnlineSecurity: "Yes",
      OnlineBackup: "No",
      DeviceProtection: "Yes",
      TechSupport: "No",
      StreamingTV: "No",
      StreamingMovies: "No",
      Contract: "Month-to-month",
      PaperlessBilling: "Yes",
      PaymentMethod: "Electronic check",
      MonthlyCharges: 75.35,
      TotalCharges: 355.2
    };

    for (const key in sample) {
      const el = document.getElementById(key);
      if (el) el.value = sample[key];
    }
  };
};

function showResult(data) {
  const pred = data.prediction;
  const prob = data.probability;

  document.getElementById("predictionText").innerText = `Churn Prediction: ${pred}`;
  document.getElementById("result").classList.remove("hidden");

  const churnProb = prob["Churn"];
  const noChurnProb = prob["No Churn"];

  document.getElementById("probabilityBar").style.width = `${noChurnProb * 100}%`;
  document.getElementById("probabilityBar").className =
    "h-4 rounded-full transition-all " + (pred === "Yes" ? "bg-red-500" : "bg-green-500");

  document.getElementById("probabilityLabel").innerText = `Churn: ${(churnProb * 100).toFixed(
    1
  )}%, No Churn: ${(noChurnProb * 100).toFixed(1)}%`;
}
