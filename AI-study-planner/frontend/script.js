async function generatePlan() {
  const hours = document.getElementById("hours").value;

  const res = await fetch("http://localhost:5000/generate-plan", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ hours })
  });

  const data = await res.json();

  let output = "<h2>Your Study Plan:</h2>";

  data.plan.forEach(item => {
    output += `
      <div class="card">
        <h3>${item.subject}</h3>
        <p>${item.time}</p>
      </div>
    `;
  });

  document.getElementById("output").innerHTML = output;
}
