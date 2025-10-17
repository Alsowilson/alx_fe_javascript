// ====== Dynamic Quote Generator with Server Sync (Final Task) ======

// ----- Data -----
let quotes = [
  { text: "The best way to predict the future is to create it.", category: "Inspiration" },
  { text: "Code is like humor. When you have to explain it, it’s bad.", category: "Programming" },
  { text: "In the middle of every difficulty lies opportunity.", category: "Motivation" }
];

// ----- DOM Elements -----
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");
const categoryFilter = document.getElementById("categoryFilter");
const exportBtn = document.getElementById("exportBtn");
const importFile = document.getElementById("importFile");
const syncBtn = document.getElementById("syncBtn");
const notification = document.getElementById("notification");

// ----- Storage -----
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

function loadQuotes() {
  const storedQuotes = localStorage.getItem("quotes");
  if (storedQuotes) quotes = JSON.parse(storedQuotes);
}

function saveLastViewedQuote(quoteObj) {
  sessionStorage.setItem("lastViewedQuote", JSON.stringify(quoteObj));
}

function getLastViewedQuote() {
  const stored = sessionStorage.getItem("lastViewedQuote");
  return stored ? JSON.parse(stored) : null;
}

function saveSelectedCategory(category) {
  localStorage.setItem("selectedCategory", category);
}

function loadSelectedCategory() {
  return localStorage.getItem("selectedCategory") || "all";
}

// ----- Quote Display -----
function showRandomQuote() {
  const filteredCategory = categoryFilter.value;
  let filteredQuotes = quotes;

  if (filteredCategory !== "all") {
    filteredQuotes = quotes.filter(q => q.category.toLowerCase() === filteredCategory.toLowerCase());
  }

  if (filteredQuotes.length === 0) {
    quoteDisplay.innerHTML = `<p>No quotes available for "${filteredCategory}" category.</p>`;
    return;
  }

  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  const randomQuote = filteredQuotes[randomIndex];

  quoteDisplay.innerHTML = `
    <p>"${randomQuote.text}"</p>
    <small>Category: ${randomQuote.category}</small>
  `;

  saveLastViewedQuote(randomQuote);
}

// ----- Add Quote -----
function addQuote() {
  const newQuoteText = document.getElementById("newQuoteText").value.trim();
  const newQuoteCategory = document.getElementById("newQuoteCategory").value.trim();

  if (!newQuoteText || !newQuoteCategory) {
    alert("Please enter both quote and category!");
    return;
  }

  const newQuote = { text: newQuoteText, category: newQuoteCategory };
  quotes.push(newQuote);
  saveQuotes();
  populateCategories();
  alert("Quote added successfully!");
  showRandomQuote();
}

// ----- Create Add Quote Form -----
function createAddQuoteForm() {
  const formContainer = document.createElement("div");
  formContainer.classList.add("add-quote");

  const inputQuote = document.createElement("input");
  inputQuote.type = "text";
  inputQuote.id = "newQuoteText";
  inputQuote.placeholder = "Enter a new quote";

  const inputCategory = document.createElement("input");
  inputCategory.type = "text";
  inputCategory.id = "newQuoteCategory";
  inputCategory.placeholder = "Enter quote category";

  const addBtn = document.createElement("button");
  addBtn.textContent = "Add Quote";
  addBtn.addEventListener("click", addQuote);

  formContainer.appendChild(inputQuote);
  formContainer.appendChild(inputCategory);
  formContainer.appendChild(addBtn);

  document.body.appendChild(formContainer);
}

// ----- Import / Export -----
function exportToJsonFile() {
  const dataStr = JSON.stringify(quotes, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json";
  a.click();
  URL.revokeObjectURL(url);
}

function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function (event) {
    try {
      const importedQuotes = JSON.parse(event.target.result);
      quotes.push(...importedQuotes);
      saveQuotes();
      populateCategories();
      showNotification("Quotes imported successfully!", "success");
    } catch (error) {
      showNotification("Invalid JSON file format!", "error");
    }
  };
  fileReader.readAsText(event.target.files[0]);
}

// ----- Category Filter -----
function populateCategories() {
  const categories = [...new Set(quotes.map(q => q.category))];
  const currentSelected = loadSelectedCategory();

  categoryFilter.innerHTML = `<option value="all">All Categories</option>`;

  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    if (cat === currentSelected) option.selected = true;
    categoryFilter.appendChild(option);
  });
}

function filterQuotes() {
  const selectedCategory = categoryFilter.value;
  saveSelectedCategory(selectedCategory);
  showRandomQuote();
}

// ----- Notifications -----
function showNotification(message, type = "info") {
  notification.textContent = message;
  notification.style.color = type === "error" ? "red" : type === "success" ? "green" : "blue";
  setTimeout(() => (notification.textContent = ""), 5000);
}

// ----- Mock Server Sync -----
// Fetch from mock server (using JSONPlaceholder)
async function fetchQuotesFromServer() {
  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/posts?_limit=5");
    const data = await response.json();
    // Convert fake server data into our format
    return data.map(item => ({
      text: item.title,
      category: "Server"
    }));
  } catch (error) {
    showNotification("Failed to fetch from server!", "error");
    return [];
  }
}

// Post to mock server
async function postQuoteToServer(quote) {
  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(quote)
    });
    return await response.json();
  } catch (error) {
    showNotification("Failed to post to server!", "error");
  }
}

// Sync logic
async function syncQuotes() {
  showNotification("Syncing with server...");

  const serverQuotes = await fetchQuotesFromServer();

  // Conflict resolution: avoid duplicates
  const newQuotes = serverQuotes.filter(
    s => !quotes.some(l => l.text === s.text)
  );

  if (newQuotes.length > 0) {
    quotes.push(...newQuotes);
    saveQuotes();
    populateCategories();
    showNotification(`${newQuotes.length} new quotes added from server!`, "success");
  } else {
    showNotification("No new quotes found.", "info");
  }
}

// Periodic sync (every 30 seconds)
setInterval(syncQuotes, 30000);

// ----- Initialization -----
newQuoteBtn.addEventListener("click", showRandomQuote);
exportBtn.addEventListener("click", exportToJsonFile);
syncBtn.addEventListener("click", syncQuotes);

function init() {
  loadQuotes();
  createAddQuoteForm();
  populateCategories();

  const lastViewed = getLastViewedQuote();
  if (lastViewed) {
    quoteDisplay.innerHTML = `<p>"${lastViewed.text}"</p><small>Category: ${lastViewed.category}</small>`;
  } else {
    showRandomQuote();
  }
}

init();
