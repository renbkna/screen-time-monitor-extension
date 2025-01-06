// Initialize dashboard
async function initializeDashboard() {
  console.log("Dashboard - Initializing dashboard..."); // Debugging
  // Set active button
  document.getElementById("range-today").classList.add("active-time-range");

  // Add click handlers to range buttons
  const rangeButtons = document.querySelectorAll('[id^="range-"]');
  rangeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      rangeButtons.forEach((btn) => btn.classList.remove("active-time-range"));
      button.classList.add("active-time-range");
      updateData();
    });
  });

  // Initial data load
  await updateData();
}

// Fetch and update data
async function updateData() {
  try {
    const data = await chrome.storage.local.get(["websiteData", "categories"]);
    console.log("Dashboard - Fetched data:", data); // Debugging
    const today = new Date().toISOString().split("T")[0];
    const todayData = data.websiteData?.[today] || {};
    const categories = data.categories || {};

    updateCharts(todayData, categories);
    updateStats(todayData);
    updateDetailedStats(todayData, categories);
  } catch (error) {
    console.error("Dashboard - Error updating data:", error);
  }
}

// Update statistics
function updateStats(data) {
  console.log("Dashboard - Updating stats with data:", data); // Debugging
  // Total time
  const totalTime = Object.values(data).reduce(
    (sum, site) => sum + (site.timeSpent || 0),
    0
  );
  const hours = Math.floor(totalTime / (1000 * 60 * 60));
  const minutes = Math.floor((totalTime % (1000 * 60 * 60)) / (1000 * 60));
  document.getElementById("total-time").textContent = `${hours}h ${minutes}m`;

  // Most visited
  let mostVisited = "-";
  let maxTime = 0;
  Object.entries(data).forEach(([domain, info]) => {
    if (info.timeSpent > maxTime) {
      maxTime = info.timeSpent;
      mostVisited = domain.replace(/^www\./, "");
    }
  });
  document.getElementById("most-visited").textContent = mostVisited;
}

// Colors for charts
const colors = [
  "#4F46E5",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
  "#F97316",
  "#06B6D4",
  "#6366F1",
];

// Update all charts
function updateCharts(data, categories) {
  console.log("Dashboard - Updating charts with data:", data); // Debugging
  updateDailyChart(data);
  updateCategoryChart(data, categories);
}

// Update daily usage chart
function updateDailyChart(data) {
  console.log("Dashboard - Updating daily chart with data:", data); // Debugging
  const ctx = document.getElementById("daily-chart").getContext("2d");

  // Process data
  const chartData = Object.entries(data)
    .map(([domain, info]) => ({
      domain: domain.replace(/^www\./, ""),
      hours: info.timeSpent / (1000 * 60 * 60),
    }))
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 10); // Show top 10 sites

  if (chartData.length === 0) {
    document.getElementById("daily-chart").parentElement.innerHTML =
      '<div class="text-sm text-gray-500 text-center mt-4">No data available</div>';
    return;
  }

  // Create chart
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: chartData.map((item) => item.domain),
      datasets: [
        {
          label: "Hours",
          data: chartData.map((item) => item.hours),
          backgroundColor: colors,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.label || "";
              const value = context.raw || 0;
              return `${label}: ${value.toFixed(1)}h`;
            },
          },
        },
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Hours",
          },
        },
      },
    },
  });
}

// Update category chart
function updateCategoryChart(data, categories) {
  console.log("Dashboard - Updating category chart with data:", data); // Debugging
  const ctx = document.getElementById("category-chart").getContext("2d");

  // Process data
  const categoryData = {};
  Object.entries(data).forEach(([domain, info]) => {
    const category = categories[domain] || "Other";
    categoryData[category] = (categoryData[category] || 0) + info.timeSpent;
  });

  if (Object.keys(categoryData).length === 0) {
    document.getElementById("category-chart").parentElement.innerHTML =
      '<div class="text-sm text-gray-500 text-center mt-4">No data available</div>';
    return;
  }

  // Create chart
  new Chart(ctx, {
    type: "pie",
    data: {
      labels: Object.keys(categoryData),
      datasets: [
        {
          data: Object.values(categoryData).map(
            (time) => time / (1000 * 60 * 60)
          ), // Convert to hours
          backgroundColor: colors,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.label || "";
              const value = context.raw || 0;
              return `${label}: ${value.toFixed(1)}h`;
            },
          },
        },
        legend: {
          position: "bottom",
        },
      },
    },
  });
}

// Update detailed statistics table
function updateDetailedStats(data, categories) {
  console.log("Dashboard - Updating detailed stats with data:", data); // Debugging
  const tbody = document.getElementById("stats-table-body");
  tbody.innerHTML = "";

  // Sort websites by time spent
  const sortedSites = Object.entries(data).sort(
    ([, a], [, b]) => b.timeSpent - a.timeSpent
  );

  sortedSites.forEach(([domain, info]) => {
    const row = document.createElement("tr");
    row.className = "hover:bg-gray-50";

    // Website
    const websiteCell = document.createElement("td");
    websiteCell.className = "px-6 py-4";
    websiteCell.textContent = domain;
    row.appendChild(websiteCell);

    // Time spent
    const timeCell = document.createElement("td");
    timeCell.className = "px-6 py-4";
    const hours = Math.floor(info.timeSpent / (1000 * 60 * 60));
    const minutes = Math.floor(
      (info.timeSpent % (1000 * 60 * 60)) / (1000 * 60)
    );
    timeCell.textContent = `${hours}h ${minutes}m`;
    row.appendChild(timeCell);

    // Category
    const categoryCell = document.createElement("td");
    categoryCell.className = "px-6 py-4";
    categoryCell.textContent = categories[domain] || "Other";
    row.appendChild(categoryCell);

    // Limit status
    const limitCell = document.createElement("td");
    limitCell.className = "px-6 py-4";
    const limitStatus = info.limitExceeded ? "Exceeded" : "Within Limit";
    const statusColor = info.limitExceeded ? "text-red-600" : "text-green-600";
    limitCell.innerHTML = `<span class="${statusColor}">${limitStatus}</span>`;
    row.appendChild(limitCell);

    tbody.appendChild(row);
  });
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", initializeDashboard);
