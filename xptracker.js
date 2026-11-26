// ---------- 1. Saved data ----------
// The list of transactions. Local Storage keeps it after a refresh.
let transactions = JSON.parse(localStorage.getItem("transactions")) || [];

function save() {
  localStorage.setItem("transactions", JSON.stringify(transactions));
}

// ---------- 2. Find the parts of the page ----------
const expenseForm = document.getElementById("expenseForm");
const incomeForm = document.getElementById("incomeForm");
const filterSelect = document.getElementById("filterCategory");
const transactionList = document.getElementById("transactionList");
const monthlyBody = document.getElementById("monthlyBody");

const incomeCard = document.querySelector(".ieb .income");
const expenseCard = document.querySelector(".ieb .expense");
const balanceCard = document.querySelector(".ieb .balance");

// Formats numbers as Naira, e.g. 580 becomes ₦580.00
const money = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" });

// Adds up the amounts of one type ("income" or "expense")
function addUp(list, type) {
  let sum = 0;
  for (let i = 0; i < list.length; i++) {
    if (list[i].type === type) {
      sum = sum + list[i].amount;
    }
  }
  return sum;
}

// ---------- 3. Add a transaction ----------
// prefix is "exp" or "inc", so "exp" + "Amount" finds the id "expAmount"
function addTransaction(type, prefix) {
  transactions.push({
    id: Date.now(),
    type: type,
    description: document.getElementById(prefix + "Description").value,
    amount: Number(document.getElementById(prefix + "Amount").value),
    date: document.getElementById(prefix + "Date").value,
    category: document.getElementById(prefix + "Category").value
  });

  save();
  document.getElementById(prefix + "Description").value = "";
  document.getElementById(prefix + "Amount").value = "";
  render();
}

expenseForm.addEventListener("submit", function (event) {
  event.preventDefault();               // stops the page from reloading
  addTransaction("expense", "exp");
});

incomeForm.addEventListener("submit", function (event) {
  event.preventDefault();
  addTransaction("income", "inc");
});

// ---------- 4. Delete a transaction ----------
function deleteTransaction(id) {
  transactions = transactions.filter(function (t) {
    return t.id !== id;                 // keep everything except this one
  });
  save();
  render();
}

// ---------- 5. Draw the page ----------
function render() {
  // The three cards
  const income = addUp(transactions, "income");
  const expense = addUp(transactions, "expense");
  incomeCard.textContent = "Income: " + money.format(income);
  expenseCard.textContent = "Expenses: " + money.format(expense);
  balanceCard.textContent = "Balance: " + money.format(income - expense);

  // The filter dropdown: "All categories" plus every category used
  const chosen = filterSelect.value;
  const categories = [...new Set(transactions.map(function (t) { return t.category; }))];
  filterSelect.innerHTML = "";
  filterSelect.append(new Option("All categories", "all"));
  for (let i = 0; i < categories.length; i++) {
    filterSelect.append(new Option(categories[i], categories[i]));
  }
  filterSelect.value = categories.includes(chosen) ? chosen : "all";

  // The list, showing only the chosen category
  transactionList.innerHTML = "";
  for (let i = 0; i < transactions.length; i++) {
    const t = transactions[i];
    if (filterSelect.value !== "all" && t.category !== filterSelect.value) {
      continue;                         // skip transactions that don't match
    }

    const li = document.createElement("li");
    li.className = "item";
    li.innerHTML = "<div><div class='name'></div><div class='meta'></div></div><div class='amt'></div>";
    li.querySelector(".name").textContent = t.description;
    li.querySelector(".meta").textContent = t.category + " · " + t.date;
    li.querySelector(".amt").textContent = money.format(t.amount);
    li.querySelector(".amt").className = t.type === "income" ? "amt pos" : "amt neg";

    const button = document.createElement("button");
    button.className = "del";
    button.textContent = "Delete";
    button.addEventListener("click", function () {
      deleteTransaction(t.id);
    });

    li.append(button);
    transactionList.append(li);
  }

  // The monthly table: one row per month
  monthlyBody.innerHTML = "";
  const months = [...new Set(transactions.map(function (t) { return t.date.slice(0, 7); }))].sort().reverse();
  for (let i = 0; i < months.length; i++) {
    const inMonth = transactions.filter(function (t) {
      return t.date.slice(0, 7) === months[i];
    });
    const label = new Date(months[i] + "-01").toLocaleDateString("en-GB", { month: "long", year: "numeric" });

    const row = document.createElement("tr");
    row.innerHTML = "<td></td><td></td><td></td>";
    row.children[0].textContent = label;
    row.children[1].textContent = money.format(addUp(inMonth, "income"));
    row.children[2].textContent = money.format(addUp(inMonth, "expense"));
    monthlyBody.append(row);
  }
}

// ---------- 6. Start up ----------
filterSelect.addEventListener("change", render);
render();