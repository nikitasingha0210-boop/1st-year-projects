const API_KEY = "your-api-key-here";

async function generatePlan() {
  const hours = document.getElementById("hours").value;

  if (!hours || hours < 1 || hours > 24) {
    showError("Please enter a valid number of hours (1–24).");
    return;
  }

  const output = document.getElementById("output");
  output.innerHTML = `
    <div class="plan-card" style="text-align:center; padding: 48px 32px;">
      <div class="loader"></div>
      <p style="color: var(--text-secondary); margin-top: 20px; font-size: 15px;">
        Building your perfect study plan...
      </p>
    </div>
  `;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-opus-4-5",
        max_tokens: 1500,
        messages: [
          {
            role: "user",
            content: `Create a detailed, well-structured study plan for ${hours} hour(s) of studying today.

Return ONLY a JSON object in this exact format, no extra text:
{
  "totalHours": ${hours},
  "sessions": [
    {
      "title": "Session title",
      "duration": "X min",
      "type": "focus | break | review",
      "tasks": ["task 1", "task 2", "task 3"],
      "tip": "A short productivity tip for this session"
    }
  ],
  "dailyGoal": "One motivating sentence summarizing today's goal",
  "productivityScore": 85
}

Rules:
- Include focused work sessions (25–50 min), short breaks (5–10 min), and a review session at the end
- "type" must be exactly one of: focus, break, review
- Make tasks specific and actionable
- productivityScore is a number 0–100 based on the hours given
- Return ONLY the raw JSON, no markdown, no backticks`,
          },
        ],
      }),
    });

    const data = await response.json();
    const raw = data.content[0].text.trim();
    const plan = JSON.parse(raw);
    renderPlan(plan);
  } catch (err) {
    showError("Something went wrong. Please try again.");
    console.error(err);
  }
}

function renderPlan(plan) {
  const output = document.getElementById("output");

  const typeConfig = {
    focus: { icon: "🧠", color: "#7c6af7", bg: "rgba(124,106,247,0.1)", label: "Focus" },
    break: { icon: "☕", color: "#22c55e", bg: "rgba(34,197,94,0.1)", label: "Break" },
    review: { icon: "📋", color: "#f59e0b", bg: "rgba(245,158,11,0.1)", label: "Review" },
  };

  const sessionsHTML = plan.sessions
    .map((s, i) => {
      const cfg = typeConfig[s.type] || typeConfig.focus;
      const tasksHTML = s.tasks
        .map(t => `<li class="task-item"><span class="task-dot"></span>${t}</li>`)
        .join("");

      return `
      <div class="session-card" style="animation-delay: ${i * 0.08}s">
        <div class="session-header">
          <div class="session-left">
            <div class="session-icon" style="background:${cfg.bg}; color:${cfg.color}">
              ${cfg.icon}
            </div>
            <div>
              <p class="session-title">${s.title}</p>
              <div class="session-meta">
                <span class="session-badge" style="background:${cfg.bg}; color:${cfg.color}">
                  ${cfg.label}
                </span>
                <span class="session-duration">⏱ ${s.duration}</span>
              </div>
            </div>
          </div>
          <span class="session-number">${String(i + 1).padStart(2, "0")}</span>
        </div>

        ${
          s.tasks && s.tasks.length
            ? `<ul class="task-list">${tasksHTML}</ul>`
            : ""
        }

        ${
          s.tip
            ? `<div class="session-tip">
                <span class="tip-icon">💡</span>
                <span>${s.tip}</span>
               </div>`
            : ""
        }
      </div>
    `;
    })
    .join("");

  const score = plan.productivityScore || 80;
  const scoreColor =
    score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";

  output.innerHTML = `
    <!-- Summary Bar -->
    <div class="summary-bar plan-card">
      <div class="summary-item">
        <span class="summary-value">${plan.totalHours}h</span>
        <span class="summary-label">Total Time</span>
      </div>
      <div class="summary-divider"></div>
      <div class="summary-item">
        <span class="summary-value">${plan.sessions.length}</span>
        <span class="summary-label">Sessions</span>
      </div>
      <div class="summary-divider"></div>
      <div class="summary-item">
        <span class="summary-value" style="color:${scoreColor}">${score}</span>
        <span class="summary-label">Focus Score</span>
      </div>
      <div class="summary-divider"></div>
      <div class="summary-item">
        <div class="score-bar-wrap">
          <div class="score-bar-fill" style="width:${score}%; background:${scoreColor}"></div>
        </div>
        <span class="summary-label">Efficiency</span>
      </div>
    </div>

    <!-- Daily Goal -->
    <div class="goal-card plan-card">
      <span class="goal-icon">🎯</span>
      <p class="goal-text">${plan.dailyGoal}</p>
    </div>

    <!-- Sessions -->
    <div class="sessions-list">
      ${sessionsHTML}
    </div>

    <!-- Footer CTA -->
    <div class="plan-card" style="text-align:center; padding: 28px;">
      <p style="color:var(--text-secondary); font-size:14px; margin-bottom:14px;">
        Ready to start? Lock in and crush your goals 🚀
      </p>
      <button onclick="generatePlan()" class="generate-btn" style="margin:0 auto;">
        <span class="btn-text">Regenerate Plan</span>
        <span class="btn-arrow">↺</span>
      </button>
    </div>
  `;
}

function showError(msg) {
  document.getElementById("output").innerHTML = `
    <div class="plan-card" style="text-align:center; padding: 40px 32px;">
      <div style="font-size:40px; margin-bottom:16px;">⚠️</div>
      <p style="color:#ef4444; font-size:16px; font-weight:500;">${msg}</p>
    </div>
  `;
}
