   // Configuration - adapt endpoints as needed
        const API_BASE = 'http://localhost:8080/api/todos';
        const API_USER = 'http://localhost:8080/api/user';

        let todos = [];
        let currentFilter = 'all'; // all | active | completed
        let currentSort = 'createdDesc';
        let deletingId = null;

        // Greeting
        function updateGreeting() {
            const now = new Date();
            const h = now.getHours();
            let greet = 'Hello';
            if (h < 12) greet = 'Good morning';
            else if (h < 18) greet = 'Good afternoon';
            else greet = 'Good evening';
            document.getElementById('greeting').textContent = greet + ',';
        }

        // Fetch username (optional)
        async function fetchUsername() {
            try {
                const res = await apiRequestUser(`/me`, 'GET');
                document.getElementById('username').textContent =  res.username || 'User';
            } catch (error){
                console.error('Failed to fetch user info:', error);
                document.getElementById('username').textContent = 'User';
                
            }
        }

        // Fetch todos from backend
     async function loadTodos() {
  try {
    const res = await apiRequest("/get-all");
    console.log("Response from backend:", res);

    // ✅ Extract todos from response
    if (res && Array.isArray(res.todos)) {
      todos = res.todos;
    } else {
      todos = [];
    }

    renderTodos();
  } catch (err) {
    console.error("Error loading todos:", err);
    showAlert("Failed to load todos. Please try again later.", "danger");
  }
}


        function renderTodos() {
            const container = document.getElementById('todosList');
            container.innerHTML = '';
            let list = [...todos];

            // Filter
            if (currentFilter === 'active') list = list.filter(t => !t.completed);
            if (currentFilter === 'completed') list = list.filter(t => t.completed);

            // Sort
            list.sort((a, b) => {
                if (currentSort === 'createdDesc') return new Date(b.createdAt) - new Date(a.createdAt);
                if (currentSort === 'createdAsc') return new Date(a.createdAt) - new Date(b.createdAt);
                if (currentSort === 'dueAsc') {
                    const da = a.dueDate ? new Date(a.dueDate) : new Date(8640000000000000);
                    const db = b.dueDate ? new Date(b.dueDate) : new Date(8640000000000000);
                    return da - db;
                }
                if (currentSort === 'priorityDesc') {
                    const rank = p => ({HIGH:3,MEDIUM:2,LOW:1}[p] || 2);
                    return rank(b.priority) - rank(a.priority);
                }
                return 0;
            });

            document.getElementById('todo-count').textContent = `${list.length} tasks`;

            for (const t of list) {
                const col = document.createElement('div');
                col.className = 'col-12 col-md-6 col-lg-4';

                const card = document.createElement('div');
                card.className = 'card todo-card shadow-sm ' + (t.completed ? 'completed' : '');
                card.dataset.id = t.id;

                const cardBody = document.createElement('div');
                cardBody.className = 'card-body';

                // Header row
                const titleRow = document.createElement('div');
                titleRow.className = 'd-flex justify-content-between align-items-start';

                const titleLeft = document.createElement('div');
                const title = document.createElement('h5');
                title.className = 'card-title mb-1';
                title.innerHTML = `${escapeHtml(t.title || '(No title)')}`;
                const meta = document.createElement('small');
                meta.className = 'text-muted d-block';
                const created = new Date(t.createdAt).toLocaleString();
                meta.textContent = `Created: ${created}`;
                titleLeft.appendChild(title);
                titleLeft.appendChild(meta);

                const actions = document.createElement('div');
                actions.className = 'btn-group btn-group-sm';

                // Completed toggle
                const btnToggle = document.createElement('button');
                btnToggle.className = 'btn btn-outline-success';
                btnToggle.title = t.completed ? 'Mark as not done' : 'Mark as done';
                btnToggle.innerHTML = `<i class="fa-solid ${t.completed ? 'fa-rotate-left' : 'fa-check'}"></i>`;
                btnToggle.onclick = () => toggleCompleted(t.id, !t.completed);
                actions.appendChild(btnToggle);

                // Edit
                const btnEdit = document.createElement('button');
                btnEdit.className = 'btn btn-outline-primary';
                btnEdit.title = 'Edit';
                btnEdit.innerHTML = '<i class="fa-solid fa-pen"></i>';
                btnEdit.onclick = () => openEditModal(t.id);
                actions.appendChild(btnEdit);

                // Delete
                const btnDelete = document.createElement('button');
                btnDelete.className = 'btn btn-outline-danger';
                btnDelete.title = 'Delete';
                btnDelete.innerHTML = '<i class="fa-solid fa-trash"></i>';
                btnDelete.onclick = () => openDeleteModal(t.id);
                actions.appendChild(btnDelete);

                titleRow.appendChild(titleLeft);
                titleRow.appendChild(actions);

                // Body details
                const desc = document.createElement('p');
                desc.className = 'card-text mt-2';
                desc.textContent = t.description || '';

                const infoRow = document.createElement('div');
                infoRow.className = 'd-flex justify-content-between align-items-center mt-3';

                const leftInfo = document.createElement('div');

                const prioritySpan = document.createElement('span');
                const pri = (t.priority || 'MEDIUM').toUpperCase();
                prioritySpan.className = 'me-2 ' + (pri === 'HIGH' ? 'priority-high' : pri === 'LOW' ? 'priority-low' : 'priority-medium');
                prioritySpan.innerHTML = `<i class="fa-solid fa-flag me-1"></i>${pri}`;

                const catSpan = document.createElement('span');
                catSpan.className = 'text-muted';
                catSpan.innerHTML = `<i class="fa-solid fa-tag me-1"></i>${escapeHtml(t.category || '-')}`;

                leftInfo.appendChild(prioritySpan);
                leftInfo.appendChild(catSpan);

                const rightInfo = document.createElement('div');
                if (t.dueDate) {
                    const due = new Date(t.dueDate);
                    const dueStr = due.toLocaleDateString();
                    const diffDays = Math.ceil((new Date(due.toDateString()) - new Date().setHours(0,0,0,0)) / (1000*60*60*24));
                    const dueSpan = document.createElement('small');
                    dueSpan.className = 'text-muted d-block';
                    if (diffDays <= 1 && diffDays >= 0) dueSpan.className = 'due-soon';
                    dueSpan.innerHTML = `<i class="fa-solid fa-calendar-days me-1"></i>Due: ${dueStr}`;
                    rightInfo.appendChild(dueSpan);
                }

                infoRow.appendChild(leftInfo);
                infoRow.appendChild(rightInfo);

                cardBody.appendChild(titleRow);
                if (desc.textContent) cardBody.appendChild(desc);
                cardBody.appendChild(infoRow);

                card.appendChild(cardBody);
                col.appendChild(card);
                container.appendChild(col);
            }
        }

        // Helpers
        function escapeHtml(s) {
            if (!s) return '';
            return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
        }

        // Open Add/Edit
        const todoModalEl = document.getElementById('todoModal');
        const todoModal = new bootstrap.Modal(todoModalEl);
        function openAddModal() {
            document.getElementById('modalTitle').textContent = 'Add Todo';
            document.getElementById('todoForm').reset();
            document.getElementById('todoId').value = '';
        }
        function openEditModal(id) {
            const t = todos.find(x => x.id === id);
            if (!t) return;
            document.getElementById('modalTitle').textContent = 'Edit Todo';
            document.getElementById('todoId').value = t.id;
            document.getElementById('title').value = t.title || '';
            document.getElementById('description').value = t.description || '';
            document.getElementById('priority').value = (t.priority || 'MEDIUM');
            document.getElementById('dueDate').value = t.dueDate ? new Date(t.dueDate).toISOString().slice(0,10) : '';
            document.getElementById('category').value = t.category || '';
            todoModal.show();
        }

        // Modal submit -> save
        document.getElementById('todoForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('todoId').value;
            const payload = {
                title: document.getElementById('title').value.trim(),
                description: document.getElementById('description').value.trim(),
                priority: document.getElementById('priority').value,
                dueDate: document.getElementById('dueDate').value || null,
                category: document.getElementById('category').value.trim() || null
            };
            try {
                if (id) {
                    // update
                    const res = await apiRequest(`/${id}`, 'PUT', payload);
                    alert(res.message);
                } else {
                    // create
                    const res = await apiRequest(`/save`, 'POST', payload);
                    alert(res.message);
                }
                todoModal.hide();
                await loadTodos();
            } catch (err) {
                console.error(err);
                alert('Save failed. Check console for details.');
            }
        });

        // Delete flow
        const confirmDeleteModal = new bootstrap.Modal(document.getElementById('confirmDeleteModal'));
        function openDeleteModal(id) {
            deletingId = id;
            confirmDeleteModal.show();
        }
        document.getElementById('confirmDelete').addEventListener('click', async () => {
            if (!deletingId) { console.log(`delete id ${deletingId}` ); return;} 
            try {
                console.log(`delete id ${deletingId}` );
                const res = await apiRequest(`/${deletingId}`, 'DELETE');
                
                confirmDeleteModal.hide();
                deletingId = null;
                await loadTodos();
            } catch (err) {
                console.error(err);
                alert('Delete failed.');
            }
        });

        // Toggle completed
        async function toggleCompleted(id, completed) {
            try {
                const res = await apiRequest(`/partial-update/${id}`, 'PATCH', { completed }); 
                await loadTodos();
            } catch (err) {
                console.error(err);
                alert('Toggle failed.');
            }
        }

        // Filters & sort event handlers
        document.getElementById('filterAll').addEventListener('click', () => { setFilter('all'); });
        document.getElementById('filterActive').addEventListener('click', () => { setFilter('active'); });
        document.getElementById('filterCompleted').addEventListener('click', () => { setFilter('completed'); });
        function setFilter(f) {
            currentFilter = f;
            document.getElementById('filterAll').classList.toggle('active', f==='all');
            document.getElementById('filterActive').classList.toggle('active', f==='active');
            document.getElementById('filterCompleted').classList.toggle('active', f==='completed');
            renderTodos();
        }
        document.getElementById('sortSelect').addEventListener('change', (e) => {
            currentSort = e.target.value;
            renderTodos();
        });

        // Bind add button
        document.getElementById('btnAdd').addEventListener('click', () => {
            openAddModal();
        });

        // Init
        window.onload = () => { 
        printUserName();
        updateGreeting();
        fetchUsername();
        loadTodos();
        };

        // Optional: poll for updates every 30s
        setInterval(loadTodos, 30000);



async function apiRequest(endpoint, method = "GET", body = null) {
    return await handleRequest(API_BASE, endpoint, method, body);
}
async function apiRequestUser(endpoint, method = "GET", body = null) {
    return await handleRequest(API_USER, endpoint, method, body);
}

//handles requests with token refresh logic
async function handleRequest(BASE_URL, endpoint, method, body) {
    let token = localStorage.getItem("accessToken");

    const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };

    const options = { method, headers };

    if (body) options.body = JSON.stringify(body);

    let response = await fetch(`${BASE_URL}${endpoint}`, options);

    // Token expired (backend may return 401 or 403)
    if (response.status === 401 || response.status === 403) {
        const refreshed = await refreshAccessToken();

        if (refreshed) {
            // retry request
            token = localStorage.getItem("accessToken");
            options.headers.Authorization = `Bearer ${token}`;
            response = await fetch(`${BASE_URL}${endpoint}`, options);
        } else {
            alert("Session expired. Please login again.");
            window.location.href = "login.html";
            return;
        }
    }
     // 🎯 DELETE returns 204 No Content
    if (response.status === 204) return { status: "ok" };

    return response.json();
}

// this function attempts to refresh the access token using the refresh token
async function refreshAccessToken() {
    try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) return false;

        const res = await fetch(`${API_USER}/auth/refresh-token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken })
        });

        if (!res.ok) return false;

        const data = await res.json();

        if (!data.accessToken || !data.refreshToken) return false;

        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);

        return true;

    } catch (err) {
        console.error("Refresh token failed", err);
        return false;
    }
}





//user name printing
function printUserName() {
    const isFirstLogin = !localStorage.getItem('hasLoggedInBefore');
    document.getElementById('username').textContent =
        isFirstLogin ? 'Welcome,' : 'Welcome back,';

    localStorage.setItem('hasLoggedInBefore', 'true');
}
