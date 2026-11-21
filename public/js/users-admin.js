
const usersContainer = document.getElementById('users-container');
const usersMessage = document.getElementById('users-message');
const editSection = document.getElementById('edit-user-section');
const editForm = document.getElementById('edit-user-form');

let users = [];

function showMessage(message, isError = false) {
  usersMessage.textContent = message;
  usersMessage.style.color = isError ? 'red' : 'green';
}

async function loadUsers() {
  try {
    const response = await fetch('/api/users');

    if (!response.ok) {
      throw new Error('Unable to retrieve users.');
    }

    users = await response.json();
    displayUsers();
  } catch (error) {
    showMessage(error.message, true);
    usersContainer.textContent = '';
  }
}

function displayUsers() {
  usersContainer.textContent = '';

  if (users.length === 0) {
    usersContainer.textContent = 'No users found.';
    return;
  }

  users.forEach((user) => {
    const userCard = document.createElement('article');

    const name = document.createElement('h2');
    name.textContent = user.displayName;

    const username = document.createElement('p');
    username.textContent = `Username: ${user.username}`;

    const email = document.createElement('p');
    email.textContent = `Email: ${user.email}`;

    const role = document.createElement('p');
    role.textContent = `Role: ${user.role?.name || 'User'}`;

    const editButton = document.createElement('button');
    editButton.textContent = 'Edit';
    editButton.type = 'button';
    editButton.addEventListener('click', () => editUser(user));

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.type = 'button';
    deleteButton.addEventListener('click', () => removeUser(user));

    userCard.append(
      name,
      username,
      email,
      role,
      editButton,
      deleteButton
    );

    usersContainer.appendChild(userCard);
  });
}

// Show the edit form with the selected user's details.
function editUser(user) {
  document.getElementById('edit-user-id').value = user._id;
  document.getElementById('edit-display-name').value = user.displayName;
  document.getElementById('edit-username').value = user.username;
  document.getElementById('edit-email').value = user.email;

  editSection.hidden = false;
  editSection.scrollIntoView({ behavior: 'smooth' });
}

// Save changes through the protected API.
editForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const id = document.getElementById('edit-user-id').value;

  const userData = {
    displayName: document.getElementById('edit-display-name').value,
    username: document.getElementById('edit-username').value,
    email: document.getElementById('edit-email').value
  };

  try {
    const response = await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Unable to update user.');
    }

    showMessage(data.message);
    editSection.hidden = true;
    await loadUsers();
  } catch (error) {
    showMessage(error.message, true);
  }
});

// Cancel editing.
document.getElementById('cancel-edit').addEventListener('click', () => {
  editSection.hidden = true;
});

// Delete a user.
async function removeUser(user) {
  if (!confirm(`Are you sure you want to delete ${user.displayName}?`)) {
    return;
  }

  try {
    const response = await fetch(`/api/users/${user._id}`, {
      method: 'DELETE'
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Unable to delete user.');
    }

    if (data.redirect) {
      window.location.assign(data.redirect);
      return;
    }

    showMessage(data.message);
    await loadUsers();
  } catch (error) {
    showMessage(error.message, true);
  }
}

// Load users when the page opens.
loadUsers();
