const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/generate-plan", (req, res) => {
  const { hours } = req.body;

  const subjects = [
    "Chemistry",
    "Mathematics",
    "Physics",
    "Computer Application",
    "English",
    "Hindi"
  ];

  const perSubject = (hours / subjects.length).toFixed(1);

  let plan = [];
  let start = 9;

  subjects.forEach(sub => {
    let end = start + parseFloat(perSubject);

    plan.push({
      subject: sub,
      time: `${start}:00 - ${end.toFixed(1)}:00`
    });

    start = end;
  });

  res.json({ plan });
});

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});

