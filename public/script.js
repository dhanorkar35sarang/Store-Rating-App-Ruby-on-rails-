// Handle Login Form Submission  
document.getElementById("loginForm")?.addEventListener("submit", function(e) {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  
  fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      alert('Login successful');
      if (data.role === 'admin') {
        window.location.href = 'admin_dashboard.html';
      } else if (data.role === 'store_owner') {
        window.location.href = 'store_owner_dashboard.html';
      } else {
        window.location.href = 'user_dashboard.html';
      }
    } else {
      alert('Login failed');
    }
  });
});

// Handle Signup Form Submission
document.getElementById("signupForm")?.addEventListener("submit", function(e) {
  e.preventDefault();
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const address = document.getElementById("address").value;
  const password = document.getElementById("password").value;

  fetch('/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, address, password })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      alert('Signup successful');
      window.location.href = 'index.html';
    } else {
      alert('Signup failed');
    }
  });
});

// Fetch and display admin dashboard stats
function loadAdminDashboard() {
  fetch('/admin/summary')
    .then(response => response.json())
    .then(data => {
      document.getElementById('totalUsers').innerText = data.totalUsers;
      document.getElementById('totalStores').innerText = data.totalStores;
      document.getElementById('totalRatings').innerText = data.totalRatings;
    });

  loadUsers();
  loadStores();
}

// Add new user functionality
document.getElementById('addUserForm')?.addEventListener('submit', function(e) {
  e.preventDefault();
  const name = document.getElementById('newUserName').value;
  const email = document.getElementById('newUserEmail').value;
  const address = document.getElementById('newUserAddress').value;
  const password = document.getElementById('newUserPassword').value;
  const role = document.getElementById('newUserRole').value;

  fetch('/admin/add_user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, address, password, role })
  }).then(response => response.json())
    .then(data => {
      if (data.success) {
        alert('User added successfully');
        loadUsers(); // Refresh the users list
      } else {
        alert('Failed to add user');
      }
    });
});

// Fetch and display users in the table
function loadUsers() {
  fetch('/admin/users')
    .then(response => response.json())
    .then(data => {
      const usersList = document.getElementById('usersList');
      usersList.innerHTML = '';
      data.forEach(user => {
        usersList.innerHTML += `<tr>
          <td>${user.name}</td>
          <td>${user.email}</td>
          <td>${user.role}</td>
        </tr>`;
      });
    });
}

// Fetch and display stores in the table
function loadStores() {
  fetch('/admin/stores')
    .then(response => response.json())
    .then(data => {
      const storesList = document.getElementById('storesList');
      storesList.innerHTML = '';
      data.forEach(store => {
        storesList.innerHTML += `<tr>
          <td>${store.name}</td>
          <td>${store.address}</td>
          <td>${store.average_rating}</td>
        </tr>`;
      });
    });
}

// Sorting logic for users and stores
function sortUsers(sortBy) {
  fetch(`/admin/users?sort=${sortBy}`)
    .then(response => response.json())
    .then(data => {
      const usersList = document.getElementById('usersList');
      usersList.innerHTML = '';
      data.forEach(user => {
        usersList.innerHTML += `<tr>
          <td>${user.name}</td>
          <td>${user.email}</td>
          <td>${user.role}</td>
        </tr>`;
      });
    });
}

function sortStores(sortBy) {
  fetch(`/admin/stores?sort=${sortBy}`)
    .then(response => response.json())
    .then(data => {
      const storesList = document.getElementById('storesList');
      storesList.innerHTML = '';
      data.forEach(store => {
        storesList.innerHTML += `<tr>
          <td>${store.name}</td>
          <td>${store.address}</td>
          <td>${store.average_rating}</td>
        </tr>`;
      });
    });
}

// Initialize dashboard on page load
window.onload = function() {
  loadAdminDashboard();
  loadUsers();
  loadStores();
};

function switchRole() {
  const selectedRole = document.getElementById('roleSwitcher').value;
  const userId = sessionStorage.getItem('userId'); // Assuming you have the user's ID stored

  fetch('/switch_role', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, role: selectedRole })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      alert('Role switched to ' + selectedRole);
      if (selectedRole === 'admin') {
        window.location.href = 'admin_dashboard.html';
      } else if (selectedRole === 'store_owner') {
        window.location.href = 'store_owner_dashboard.html';
      } else {
        window.location.href = 'user_dashboard.html';
      }
    } else {
      alert('Error switching role: ' + data.message);
    }
  });
}

// Load Store Owner Dashboard
function loadStoreOwnerDashboard() {
  fetch('/store_owner/ratings')
    .then(response => response.json())
    .then(data => {
      document.getElementById('averageRating').innerText = data.averageRating || 'No ratings yet';

      const ratingsList = document.getElementById('ratingsList');
      ratingsList.innerHTML = '';
      data.ratings.forEach(rating => {
        ratingsList.innerHTML += `<tr>
          <td>${rating.userName}</td>
          <td>${rating.rating}</td>
        </tr>`;
      });
    });
}

// Handle Add Store Form Submission
document.getElementById("addStoreForm")?.addEventListener("submit", function(e) {
  e.preventDefault();
  
  const name = document.getElementById("storeName").value;
  const address = document.getElementById("storeAddress").value;
  const rating = document.getElementById("storeRating").value;

  fetch('/add_store', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, address, rating })
  })
  .then(response => response.json())
  .then(data => {
    const responseMessage = document.getElementById('responseMessage');
    if (data.success) {
      responseMessage.innerText = "Store added successfully!";
      responseMessage.style.color = "green";
    } else {
      responseMessage.innerText = "Error adding store: " + data.message;
      responseMessage.style.color = "red";
    }
  });
});

// Handle Rating Submission Form
document.getElementById("ratingForm")?.addEventListener("submit", function(e) {
  e.preventDefault();
  
  const storeId = document.getElementById("storeId").value;
  const rating = document.getElementById("rating").value;
  const userId = sessionStorage.getItem('userId'); // Assuming user ID is in session storage
  
  fetch('/submit_rating', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, storeId, rating })
  })
  .then(response => response.json())
  .then(data => {
    const ratingMessage = document.getElementById('ratingMessage');
    if (data.success) {
      ratingMessage.innerText = "Rating submitted successfully!";
      ratingMessage.style.color = "green";
      loadAdminDashboard(); // Refresh dashboard after submitting rating
    } else {
      ratingMessage.innerText = "Error submitting rating: " + data.message;
      ratingMessage.style.color = "red";
    }
  });
});
///////////////////////////////////////////
// Handle Forgot Password link click
document.getElementById("forgotPasswordLink")?.addEventListener("click", function() {
  document.getElementById("resetPasswordModal").style.display = "block";
});

// Handle close modal
document.getElementById("closeModal")?.addEventListener("click", function() {
  document.getElementById("resetPasswordModal").style.display = "none";
});

// Handle Reset Password
document.getElementById("resetPasswordButton")?.addEventListener("click", function() {
  const email = document.getElementById("resetEmail").value;
  
  fetch('/reset_password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      alert('Reset link sent to your email.');
      document.getElementById("resetPasswordModal").style.display = "none";
    } else {
      alert('Error: ' + data.message);
    }
  });
});
