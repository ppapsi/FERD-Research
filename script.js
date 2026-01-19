const API = "http://localhost:5000";

// ===========================
// LOGIN FUNCTION
// ===========================
const loginForm = document.getElementById("loginForm");
const loginMsg = document.createElement("p");
loginMsg.style.color = "red";
if (loginForm) loginForm.appendChild(loginMsg);

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      const res = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) return (loginMsg.innerText = data.message);

      localStorage.setItem("token", data.token);
      localStorage.setItem("preferredName", data.preferredName);
      window.location = "dashboard.html";
    } catch (err) {
      console.error(err);
      loginMsg.innerText = "Login failed. Try again.";
    }
  });
}

// ===========================
// SIGNUP FUNCTION
// ===========================
const signupForm = document.getElementById("signupForm");
const signupMsg = document.createElement("p");
signupMsg.style.color = "red";
if (signupForm) signupForm.appendChild(signupMsg);

if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const preferredName = document.getElementById("preferredName").value;
    const email = document.getElementById("emailSignUp").value;
    const password = document.getElementById("passwordSignUp").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (password.length < 8) {
      signupMsg.innerText = "Password must be at least 8 characters long.";
      return;
    }

    if (password !== confirmPassword) {
      signupMsg.innerText = "Passwords do not match.";
      return;
    }

    try {
      const res = await fetch(`${API}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, preferredName }),
      });

      const data = await res.json();
      if (!res.ok) return (signupMsg.innerText = data.message);

      localStorage.setItem("token", data.token);
      localStorage.setItem("preferredName", data.preferredName);

      signupForm.reset();
      document.getElementById("signupModal").style.display = "none";

      window.location = "dashboard.html";
    } catch (err) {
      console.error(err);
      signupMsg.innerText = "Sign up failed. Try again.";
    }
  });
}

// ===========================
// SIGNUP MODAL OPEN/CLOSE
// ===========================
const signupBtn = document.getElementById("signupBtn");
const signupModal = document.getElementById("signupModal");
const signupCloseBtn = document.querySelector("#signupModal .close") || document.getElementById("closeModal");

// Open signup modal
if (signupBtn) {
  signupBtn.addEventListener("click", () => {
    signupModal.style.display = "flex";
  });
}

// Close signup modal
if (signupCloseBtn) {
  signupCloseBtn.addEventListener("click", () => {
    signupModal.style.display = "none";
  });
}

// Close modal if clicked outside content
window.addEventListener("click", (e) => {
  if (e.target === signupModal) {
    signupModal.style.display = "none";
  }
});



// -------------------- DASHBOARD AUTH --------------------
if (window.location.pathname.includes("dashboard.html")) {
  if (!localStorage.getItem("token")) {
    window.location = "index.html";
  } else {
    document.getElementById("userName").innerText = localStorage.getItem("preferredName") || "User";
  }

  const userId = localStorage.getItem("user_id");
  const modal = document.getElementById("modal");
  const modalTitle = document.getElementById("modalTitle");
  const modalBody = document.getElementById("modalBody");
  const closeModalBtn = document.getElementById("closeModal");

  // Close modal
  closeModalBtn.addEventListener("click", () => modal.style.display = "none");
  window.addEventListener("click", (e) => { if(e.target === modal) modal.style.display = "none"; });

  let orders = [];

  async function fetchOrders() {
    try {
      const res = await fetch(`${API}/orders/${userId}`);
      orders = await res.json();
    } catch(err) { console.error(err); }
  }

  // -------------------- CARD MODAL LOGIC --------------------
  const cards = {
    projectsCard: "Your Projects",
    notificationsCard: "Notifications",
    analyticsCard: "Analytics & Progress",
    placeOrderCard: "Place New Order"
  };

  Object.keys(cards).forEach(cardId => {
    const card = document.getElementById(cardId);
    if(card) {
      card.addEventListener("click", async () => {
        modalTitle.innerText = cards[cardId];
        modalBody.innerHTML = "";
        modal.style.display = "block";

        await fetchOrders(); // Refresh orders

        if(cardId === "projectsCard") {
          modalBody.innerHTML = `<p>View, manage, and track all ongoing research work, dissertations, and assignments.</p>`;
          if(orders.length > 0){
            const ul = document.createElement("ul");
            orders.forEach(o => {
              const li = document.createElement("li");
              li.textContent = `${o.type} - ${o.title} (${o.status})`;
              ul.appendChild(li);
            });
            modalBody.appendChild(ul);
          }
        }

        if(cardId === "notificationsCard") {
          modalBody.innerHTML = `<p>Stay updated with important messages, deadlines, and service-related announcements.</p>`;
          if(orders.length > 0){
            const ul = document.createElement("ul");
            orders.slice(0,5).forEach(o => {
              const li = document.createElement("li");
              li.textContent = `Order #${o.order_id} is ${o.status}`;
              ul.appendChild(li);
            });
            modalBody.appendChild(ul);
          }
        }

        if(cardId === "analyticsCard") {
          modalBody.innerHTML = `<p>Monitor completed tasks, revisions, and overall progress of your submitted work.</p>`;
          if(orders.length > 0){
            const table = document.createElement("table");
            table.innerHTML = `
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Service</th>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Download</th>
                </tr>
              </thead>
              <tbody>
                ${orders.map(o => `
                  <tr>
                    <td>${o.order_id}</td>
                    <td>${o.type}</td>
                    <td>${o.title}</td>
                    <td class="status-${o.status.replace(" ", "\\ ")}">${o.status}</td>
                    <td>${o.status === "Completed" ? `<a href="${API}/orders/download/${o.order_id}" target="_blank">Download</a>` : "-"}</td>
                  </tr>
                `).join("")}
              </tbody>
            `;
            modalBody.appendChild(table);
          }
        }

        if(cardId === "placeOrderCard") {
          const form = document.createElement("form");
          form.innerHTML = `
            <label>Service Type</label>
            <select id="modalOrderType" required>
              <option value="">Select a service</option>
              <option value="Thesis">Thesis / Dissertation</option>
              <option value="Essay">Research Paper / Essay</option>
              <option value="Project">Project Work</option>
              <option value="Other">Other</option>
            </select>
            <label>Title / Topic</label>
            <input type="text" id="modalOrderTitle" required>
            <label>Description</label>
            <textarea id="modalOrderDescription" rows="5" required></textarea>
            <button type="submit">Submit Order</button>
          `;
          modalBody.appendChild(form);

          form.addEventListener("submit", async e => {
            e.preventDefault();
            const type = document.getElementById("modalOrderType").value;
            const title = document.getElementById("modalOrderTitle").value;
            const description = document.getElementById("modalOrderDescription").value;

            try {
              const res = await fetch(`${API}/orders`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: userId, type, title, description })
              });
              const data = await res.json();
              if(res.ok) {
                alert("Order submitted successfully!");
                fetchOrders();
                modal.style.display = "none";
              } else {
                alert(data.error || "Failed to place order");
              }
            } catch(err) {
              console.error(err);
              alert("Error placing order");
            }
          });
        }
      });
    }
  });
}

// ===========================
// DASHBOARD MENU TOGGLE
// ===========================
const menuToggle = document.getElementById("menuToggle");
const servicesMenu = document.getElementById("servicesMenu");

if (menuToggle && servicesMenu) {
  menuToggle.addEventListener("click", () => {
    servicesMenu.style.display =
      servicesMenu.style.display === "block" ? "none" : "block";
  });

  document.addEventListener("click", (e) => {
    if (!menuToggle.contains(e.target) && !servicesMenu.contains(e.target)) {
      servicesMenu.style.display = "none";
    }
  });
}

// ===========================
// COMPLAINTS
// ===========================
const complaintBtn = document.getElementById("makeComplaint");
if (complaintBtn) {
  complaintBtn.addEventListener("click", () => {
    modalTitle.innerText = "Make a Complaint";
    modalBody.innerHTML = `
      <form id="complaintForm">
        <label for="complaintText">Your Complaint:</label>
        <textarea id="complaintText" rows="5"></textarea>
        <button type="submit">Submit</button>
      </form>
    `;
    modal.style.display = "block";
  });
}

// ===========================
// LOGOUT BUTTON
// ===========================
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.clear();
    window.location = "index.html";
  });
}
