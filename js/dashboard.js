   // Configuration - adapt endpoints as needed
        const API_BASE = 'http://localhost:8080/api/todos';
        const API_USER = 'http://localhost:8080/api/user';

        let todos = [];
        let currentFilter = 'all'; // all | active | completed
        let currentSort = 'createdDesc';
        let deletingId = null;
        let themeRecognition = null;
        let isThemeListening = false;
        let shouldKeepThemeListening = true;
        let isReminderAnnouncementSpeaking = false;

        function applyTheme(theme) {
            clearCustomThemeStyles();
            document.body.classList.remove('theme-dark', 'theme-custom');

            if (theme === 'dark') {
                document.body.classList.add('theme-dark');
                localStorage.setItem('dashboardTheme', theme);
                showVoiceFeedback('Dark theme applied');
                return;
            }

            if (theme === 'light') {
                localStorage.setItem('dashboardTheme', theme);
                showVoiceFeedback('Light theme applied');
                return;
            }

            applyCustomColorTheme(theme);
        }

        function applyCustomColorTheme(color) {
            const readableTheme = getReadableThemeColors(color);

            document.body.classList.add('theme-custom');
            document.body.style.setProperty('--theme-bg', readableTheme.background);
            document.body.style.setProperty('--theme-surface', readableTheme.surface);
            document.body.style.setProperty('--theme-input', readableTheme.input);
            document.body.style.setProperty('--theme-border', readableTheme.border);
            document.body.style.setProperty('--theme-text', readableTheme.text);
            document.body.style.setProperty('--theme-muted', readableTheme.muted);

            localStorage.setItem('dashboardTheme', color);
            showVoiceFeedback(`${capitalize(color)} theme applied`);
        }

        function handleVoiceCommand(command) {
            const spokenText = command.toLowerCase();

            if (handleThemeCommand(spokenText)) return;
            if (handleScrollCommand(spokenText)) return;
            if (handleCloseTaskModalCommand(spokenText)) return;
            if (handleAddTaskCommand(spokenText)) return;
            if (handleReminderCommand(spokenText)) return;
            if (handleFilterCommand(spokenText)) return;
            if (handleSortCommand(spokenText)) return;
        }

        function handleThemeCommand(spokenText) {
            const spokenColor = extractCssColorFromSpeech(spokenText);
            if (spokenColor) {
                applyTheme(spokenColor);
                return true;
            }

            if (spokenText.includes('dark')) {
                applyTheme('dark');
                return true;
            }

            if (spokenText.includes('light')) {
                applyTheme('light');
                return true;
            }

            return false;
        }

        function handleFilterCommand(spokenText) {
            const words = getSpeechKeywords(spokenText);

            if (hasAnyKeyword(words, ['today', 'aaj'])) {
                setFilter('today');
                showVoiceFeedback("Showing today's tasks");
                return true;
            }

            if (hasAnyKeyword(words, ['overdue', 'late', 'missed', 'expired'])) {
                setFilter('overdue');
                showVoiceFeedback('Showing overdue tasks');
                return true;
            }

            if (hasAnyKeyword(words, ['upcoming', 'future', 'next', 'coming'])) {
                setFilter('upcoming');
                showVoiceFeedback('Showing upcoming tasks');
                return true;
            }

            if (hasAnyKeyword(words, ['completed', 'complete', 'done', 'finished'])) {
                setFilter('completed');
                showVoiceFeedback('Showing completed tasks');
                return true;
            }

            if (hasAnyKeyword(words, ['active', 'pending', 'incomplete', 'remaining', 'open'])) {
                setFilter('active');
                showVoiceFeedback('Showing active tasks');
                return true;
            }

            if (hasAnyKeyword(words, ['all', 'everything', 'sab'])) {
                setFilter('all');
                showVoiceFeedback('Showing all tasks');
                return true;
            }

            return false;
        }

        function handleSortCommand(spokenText) {
            const words = getSpeechKeywords(spokenText);

            if (hasAnyKeyword(words, ['newest', 'new', 'latest', 'recent', 'fresh'])) {
                setSort('createdDesc', 'Sorted by newest');
                return true;
            }

            if (hasAnyKeyword(words, ['oldest', 'old', 'earliest', 'previous', 'purana'])) {
                setSort('createdAsc', 'Sorted by oldest');
                return true;
            }

            if (hasAnyKeyword(words, ['due', 'soon', 'deadline', 'date'])) {
                setSort('dueAsc', 'Sorted by due date');
                return true;
            }

            if (hasAnyKeyword(words, ['priority', 'important', 'urgent', 'high'])) {
                setSort('priorityDesc', 'Sorted by priority');
                return true;
            }

            return false;
        }

        function handleScrollCommand(spokenText) {
            const scrollIntent = getScrollIntent(spokenText);

            if (scrollIntent === 'bottom') {
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                return true;
            }

            if (scrollIntent === 'top') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return true;
            }

            if (scrollIntent === 'down') {
                window.scrollBy({ top: window.innerHeight * 0.75, behavior: 'smooth' });
                return true;
            }

            if (scrollIntent === 'up') {
                window.scrollBy({ top: -window.innerHeight * 0.75, behavior: 'smooth' });
                return true;
            }

            return false;
        }

        function getScrollIntent(spokenText) {
            const words = getSpeechKeywords(spokenText);
            const normalizedWords = words.map(normalizeSpeechKeyword);

            if (hasAnyKeyword(normalizedWords, ['bottom'])) return 'bottom';
            if (hasAnyKeyword(normalizedWords, ['top'])) return 'top';
            if (hasAnyKeyword(normalizedWords, ['down', 'neeche'])) return 'down';
            if (hasAnyKeyword(normalizedWords, ['up', 'upar'])) return 'up';

            return null;
        }

        function handleAddTaskCommand(spokenText) {
            const words = getSpeechKeywords(spokenText);
            const hasCreateIntent = hasAnyKeyword(words, ['create', 'add', 'open', 'make', 'bana', 'banaye', 'banate', 'karte']);
            const hasTaskContext = hasAnyKeyword(words, ['task', 'todo', 'work', 'modal']);
            const hasCreatorContext = words.includes('creator') || (words.includes('create') && words.includes('modal'));

            if (hasCreateIntent && (hasTaskContext || hasCreatorContext || (words.includes('create') && words.length <= 3))) {
                openAddModal();
                todoModal.show();
                showVoiceFeedback('New task opened');
                return true;
            }

            return false;
        }

        function handleCloseTaskModalCommand(spokenText) {
            const words = getSpeechKeywords(spokenText);
            const hasCloseIntent = hasAnyKeyword(words, ['close', 'cancel', 'exit', 'stop', 'band', 'bandh', 'nahi']);
            const hasTaskModalContext = hasAnyKeyword(words, ['modal', 'task', 'creator']) || words.length <= 3;

            if (hasCloseIntent && hasTaskModalContext && isTodoModalOpen()) {
                todoModal.hide();
                showVoiceFeedback('Task creator closed');
                return true;
            }

            return false;
        }

        function handleReminderCommand(spokenText) {
            const words = getSpeechKeywords(spokenText);
            if (isReminderVoiceRequest(words)) {
                announceDueDateReminders();
                return true;
            }

            return false;
        }

        function isReminderVoiceRequest(words) {
            const normalizedWords = words.map(normalizeReminderKeyword);
            const reminderWords = ['reminder', 'reminders', 'remind'];
            const taskWords = ['task', 'tasks', 'work', 'todo', 'todos'];
            const todayWords = ['today', 'todays'];
            const askWords = ['announce', 'read', 'speak', 'tell', 'show', 'dikha', 'bata', 'what', 'list'];

            const hasReminderWord = hasAnyKeyword(normalizedWords, reminderWords);
            const hasTaskWord = hasAnyKeyword(normalizedWords, taskWords);
            const hasTodayWord = hasAnyKeyword(normalizedWords, todayWords);
            const hasAskWord = hasAnyKeyword(normalizedWords, askWords);
            const hasMyWord = normalizedWords.includes('my');

            if (hasReminderWord) return true;
            if (normalizedWords.includes('remind') && normalizedWords.includes('me')) return true;
            if (hasTodayWord && hasTaskWord) return true;
            if (hasMyWord && hasTaskWord && hasTodayWord) return true;
            if (hasAskWord && hasTaskWord && hasTodayWord) return true;

            return false;
        }

        function normalizeReminderKeyword(word) {
            const reminderKeywordMap = {
                remainder: 'reminder',
                remainders: 'reminders',
                remender: 'reminder',
                remenders: 'reminders',
                remindar: 'reminder',
                remindars: 'reminders',
                riminder: 'reminder',
                riminders: 'reminders',
                rimandar: 'reminder',
                rimandars: 'reminders',
                dikhao: 'dikha',
                dekha: 'dikha',
                batao: 'bata',
                batana: 'bata',
                btaa: 'bata',
                bta: 'bata',
                bataa: 'bata',
                bataao: 'bata',
                kaam: 'work',
                kam: 'work'
            };

            return reminderKeywordMap[word] || word;
        }

        function setSort(sortValue, message) {
            currentSort = sortValue;
            document.getElementById('sortSelect').value = sortValue;
            renderTodos();
            showVoiceFeedback(message);
        }

        function getSpeechKeywords(spokenText) {
            return spokenText
                .toLowerCase()
                .replace(/[^a-z0-9\s]/g, ' ')
                .split(/\s+/)
                .filter(Boolean);
        }

        function normalizeSpeechKeyword(word) {
            const keywordMap = {
                below: 'down',
                downward: 'down',
                downstairs: 'down',
                bottom: 'bottom',
                end: 'bottom',
                neeche: 'neeche',
                niche: 'neeche',
                nicha: 'neeche',
                neechay: 'neeche',
                down: 'down',
                above: 'up',
                upward: 'up',
                upstairs: 'up',
                upar: 'upar',
                upper: 'upar',
                oopar: 'upar',
                up: 'up',
                top: 'top',
                start: 'top'
            };

            return keywordMap[word] || word;
        }

        function hasAnyKeyword(words, keywords) {
            return keywords.some(keyword => words.includes(keyword));
        }

        function showVoiceFeedback(message) {
            if (!message) return;
            console.log(`Voice command: ${message}`);
        }

        function announceDueDateReminders() {
            const reminders = getDueDateReminderMessages();

            if (reminders.length === 0) {
                speakMessage('You have no tasks due today or tomorrow.');
                return;
            }

            speakReminderMessages(reminders);
        }

        function speakMessage(message) {
            if (!('speechSynthesis' in window)) {
                console.log(message);
                return;
            }

            window.speechSynthesis.cancel();
            speakReminderQueue([message]);
        }

        function speakReminderMessages(messages) {
            if (!('speechSynthesis' in window)) {
                console.log(messages.join(' '));
                return;
            }

            speakReminderQueue(messages);
        }

        function speakReminderQueue(messages) {
            window.speechSynthesis.cancel();
            pauseRecognitionForReminderSpeech();

            const cleanMessages = messages.filter(Boolean);
            if (cleanMessages.length === 0) {
                resumeRecognitionAfterReminderSpeech();
                return;
            }

            cleanMessages.forEach((message, index) => {
                const utterance = createReminderUtterance(message);

                if (index === cleanMessages.length - 1) {
                    utterance.onend = resumeRecognitionAfterReminderSpeech;
                    utterance.onerror = resumeRecognitionAfterReminderSpeech;
                }

                window.speechSynthesis.speak(utterance);
            });
        }

        function pauseRecognitionForReminderSpeech() {
            isReminderAnnouncementSpeaking = true;

            if (themeRecognition && isThemeListening) {
                try {
                    themeRecognition.stop();
                } catch (error) {
                    console.warn('Voice recognition could not pause for reminder speech:', error);
                }
            }
        }

        function resumeRecognitionAfterReminderSpeech() {
            isReminderAnnouncementSpeaking = false;

            if (shouldKeepThemeListening) {
                setTimeout(startThemeRecognition, 400);
            }
        }

        function capitalize(value) {
            return value.charAt(0).toUpperCase() + value.slice(1);
        }

        function extractCssColorFromSpeech(spokenText) {
            const cleanedText = spokenText
                .replace(/\b(change|switch|set|make|apply|use|theme|background|color|colour|to|please)\b/g, ' ')
                .replace(/[^a-z0-9\s#(),.%]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();

            if (!cleanedText) return null;

            const words = cleanedText.split(' ');
            for (let length = words.length; length >= 1; length--) {
                for (let start = 0; start <= words.length - length; start++) {
                    const phrase = words.slice(start, start + length).join(' ');
                    const compactPhrase = phrase.replace(/\s+/g, '');

                    if (isValidCssColor(phrase)) return phrase;
                    if (compactPhrase !== phrase && isValidCssColor(compactPhrase)) return compactPhrase;
                }
            }

            return null;
        }

        function isValidCssColor(value) {
            if (!value || value === 'dark' || value === 'light') return false;
            return CSS.supports('color', value);
        }

        function getReadableThemeColors(color) {
            const rgb = getRgbFromCssColor(color);
            if (!rgb) {
                return {
                    background: color,
                    surface: color,
                    input: color,
                    border: color,
                    text: '#212529',
                    muted: '#6c757d'
                };
            }

            const isDarkColor = getRelativeLuminance(rgb) < 0.45;
            const text = isDarkColor ? '#f8f9fa' : '#212529';

            return {
                background: color,
                surface: mixColor(rgb, isDarkColor ? [255, 255, 255] : [0, 0, 0], isDarkColor ? 0.12 : 0.08),
                input: mixColor(rgb, isDarkColor ? [255, 255, 255] : [255, 255, 255], isDarkColor ? 0.18 : 0.72),
                border: mixColor(rgb, isDarkColor ? [255, 255, 255] : [0, 0, 0], isDarkColor ? 0.28 : 0.18),
                text,
                muted: isDarkColor ? '#ced4da' : '#495057'
            };
        }

        function getRgbFromCssColor(color) {
            const colorProbe = document.createElement('span');
            colorProbe.style.color = color;
            document.body.appendChild(colorProbe);

            const computedColor = getComputedStyle(colorProbe).color;
            colorProbe.remove();

            const match = computedColor.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
            if (!match) return null;

            return [Number(match[1]), Number(match[2]), Number(match[3])];
        }

        function getRelativeLuminance(rgb) {
            const [red, green, blue] = rgb.map(value => {
                const channel = value / 255;
                return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
            });

            return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
        }

        function mixColor(rgb, targetRgb, amount) {
            const mixed = rgb.map((channel, index) => Math.round(channel + (targetRgb[index] - channel) * amount));
            return `rgb(${mixed[0]}, ${mixed[1]}, ${mixed[2]})`;
        }

        function clearCustomThemeStyles() {
            ['--theme-bg', '--theme-surface', '--theme-input', '--theme-border', '--theme-text', '--theme-muted']
                .forEach(property => document.body.style.removeProperty(property));
        }

        function initVoiceThemeSwitcher() {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

            const savedTheme = localStorage.getItem('dashboardTheme') || 'light';
            applyTheme(savedTheme);

            if (!SpeechRecognition) {
                console.warn('Voice theme switching is not supported in this browser.');
                return;
            }

            themeRecognition = new SpeechRecognition();
            themeRecognition.lang = 'en-US';
            themeRecognition.continuous = true;
            themeRecognition.interimResults = false;
            themeRecognition.maxAlternatives = 5;

            themeRecognition.onstart = () => {
                isThemeListening = true;
            };

            themeRecognition.onresult = (event) => {
                const result = event.results[event.results.length - 1];
                const transcripts = Array.from(result).map(alternative => alternative.transcript);
                const reminderTranscript = transcripts.find(transcript => handleReminderCommand(transcript.toLowerCase()));

                if (reminderTranscript) return;

                handleVoiceCommand(transcripts[0]);
            };

            themeRecognition.onerror = (event) => {
                if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                    shouldKeepThemeListening = false;
                    console.warn('Voice theme switching needs microphone permission.');
                }
            };

            themeRecognition.onend = () => {
                isThemeListening = false;
                if (shouldKeepThemeListening && !isReminderAnnouncementSpeaking) {
                    setTimeout(startThemeRecognition, 500);
                }
            };

            startThemeRecognition();
        }

        function startThemeRecognition() {
            if (!themeRecognition || isThemeListening) return;

            try {
                themeRecognition.start();
            } catch (error) {
                console.warn('Voice recognition could not start:', error);
            }
        }

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
                updateWelcomeCard(res.username || 'User');
            } catch (error){
                console.error('Failed to fetch user info:', error);
                updateWelcomeCard('User');
                
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
    showDueDateReminders();
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
            if (currentFilter === 'today') list = list.filter(t => !t.completed && isTaskDueToday(t));
            if (currentFilter === 'overdue') list = list.filter(t => !t.completed && isTaskOverdue(t));
            if (currentFilter === 'upcoming') list = list.filter(t => !t.completed && isTaskUpcoming(t));

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

        function showDueDateReminders() {
            getDueDateReminderItems().forEach(reminder => {
                showReminderToast(reminder.todo, reminder.type, reminder.title);
            });
        }

        function getDueDateReminderItems() {
            const today = startOfDay(new Date());
            const reminders = [];

            todos.forEach(todo => {
                if (!todo.dueDate || todo.completed) return;

                const dueDate = parseLocalDate(todo.dueDate);
                if (!dueDate) return;

                const daysUntilDue = Math.round((dueDate - today) / (1000 * 60 * 60 * 24));

                if (daysUntilDue === 0) {
                    reminders.push({ todo, type: 'due-today', title: 'Due today' });
                }

                if (daysUntilDue === 1) {
                    reminders.push({ todo, type: 'due-tomorrow', title: 'Due tomorrow' });
                }
            });

            return reminders;
        }

        function getDueDateReminderMessages() {
            const userName = getDashboardUserName();
            const reminders = getDueDateReminderItems();
            const todayCount = reminders.filter(reminder => reminder.type === 'due-today').length;

            return reminders.map((reminder, index) => {
                const taskTitle = reminder.todo.title || 'Untitled task';
                const dueText = getReadableDueDate(reminder.todo.dueDate, reminder.type);

                if (reminder.type === 'due-today') {
                    if (index === 0 && todayCount > 1) {
                        return `${userName}, you have ${todayCount} tasks for today. First, ${taskTitle} should be finished ${dueText}.`;
                    }

                    return `Your task ${taskTitle} should be finished ${dueText}.`;
                }

                return `A quick reminder, ${taskTitle} is due ${dueText}.`;
            });
        }

        function showReminderToast(todo, reminderType, reminderTitle) {
            const container = document.getElementById('reminderToastContainer');
            if (!container) return;

            const reminderKey = `taskmind-reminder-${reminderType}-${todo.id || todo.title}`;
            if (sessionStorage.getItem(reminderKey)) return;
            sessionStorage.setItem(reminderKey, 'shown');

            const toastEl = document.createElement('div');
            toastEl.className = `toast reminder-toast ${reminderType}`;
            toastEl.setAttribute('role', 'alert');
            toastEl.setAttribute('aria-live', 'assertive');
            toastEl.setAttribute('aria-atomic', 'true');

            const header = document.createElement('div');
            header.className = 'toast-header';

            const icon = document.createElement('i');
            icon.className = 'fa-solid fa-bell text-primary me-2';

            const title = document.createElement('strong');
            title.className = 'me-auto';
            title.textContent = reminderTitle;

            const closeButton = document.createElement('button');
            closeButton.type = 'button';
            closeButton.className = 'btn-close';
            closeButton.setAttribute('data-bs-dismiss', 'toast');
            closeButton.setAttribute('aria-label', 'Close');

            const body = document.createElement('div');
            body.className = 'toast-body';
            body.textContent = `${todo.title || 'Untitled task'} needs your attention.`;

            header.appendChild(icon);
            header.appendChild(title);
            header.appendChild(closeButton);
            toastEl.appendChild(header);
            toastEl.appendChild(body);
            container.appendChild(toastEl);

            const toast = new bootstrap.Toast(toastEl, { delay: 5000 });
            toast.show();
            speakReminderAnnouncement(getReminderSpeechMessage(todo, reminderType));
            toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
        }

        function getReminderSpeechMessage(todo, reminderType) {
            const taskTitle = todo.title || 'Untitled task';
            const dueText = getReadableDueDate(todo.dueDate, reminderType);

            if (reminderType === 'due-today') {
                return `Reminder, ${taskTitle} should be finished ${dueText}.`;
            }

            if (reminderType === 'due-tomorrow') {
                return `A quick reminder, ${taskTitle} is due ${dueText}.`;
            }

            return `Reminder: ${taskTitle} needs your attention.`;
        }

        function speakReminderAnnouncement(message) {
            if (!message || !('speechSynthesis' in window)) return;

            speakReminderQueue([message]);
        }

        function createReminderUtterance(message) {
            const utterance = new SpeechSynthesisUtterance(message);
            const voice = getBestReminderVoice();

            if (voice) {
                utterance.voice = voice;
                utterance.lang = voice.lang;
            } else {
                utterance.lang = 'en-IN';
            }

            utterance.rate = 0.92;
            utterance.pitch = 1;
            utterance.volume = 1;

            return utterance;
        }

        function getBestReminderVoice() {
            const voices = window.speechSynthesis.getVoices();
            if (!voices.length) return null;

            const preferredVoiceNames = ['natural', 'online', 'neural', 'google', 'microsoft', 'zira', 'aria', 'ravi', 'heera'];
            const preferredLanguages = ['en-IN', 'en-GB', 'en-US'];

            return voices
                .filter(voice => voice.lang && voice.lang.toLowerCase().startsWith('en'))
                .sort((a, b) => scoreReminderVoice(b, preferredVoiceNames, preferredLanguages) - scoreReminderVoice(a, preferredVoiceNames, preferredLanguages))[0] || null;
        }

        function scoreReminderVoice(voice, preferredVoiceNames, preferredLanguages) {
            const name = voice.name.toLowerCase();
            let score = 0;

            const languageIndex = preferredLanguages.indexOf(voice.lang);
            if (languageIndex !== -1) score += 30 - languageIndex * 5;
            if (voice.localService === false) score += 8;
            if (preferredVoiceNames.some(preferredName => name.includes(preferredName))) score += 12;

            return score;
        }

        function getDashboardUserName() {
            const usernameEl = document.getElementById('username');
            const username = usernameEl ? usernameEl.textContent.trim() : '';

            return username && username !== 'User' ? username : 'You';
        }

        function getReadableDueDate(dueDate, reminderType) {
            if (reminderType === 'due-today') return 'today';
            if (reminderType === 'due-tomorrow') return 'tomorrow';

            const parsedDate = parseLocalDate(dueDate);
            if (!parsedDate) return 'soon';

            return parsedDate.toLocaleDateString('en-IN', {
                weekday: 'long',
                month: 'short',
                day: 'numeric'
            });
        }

        function parseLocalDate(value) {
            if (!value) return null;

            const dateText = String(value).slice(0, 10);
            const parts = dateText.split('-').map(Number);
            if (parts.length !== 3 || parts.some(Number.isNaN)) return null;

            return startOfDay(new Date(parts[0], parts[1] - 1, parts[2]));
        }

        function startOfDay(date) {
            return new Date(date.getFullYear(), date.getMonth(), date.getDate());
        }

        function isTaskDueToday(todo) {
            if (!todo.dueDate) return false;

            const today = startOfDay(new Date());
            const dueDate = parseLocalDate(todo.dueDate);

            return dueDate && dueDate.getTime() === today.getTime();
        }

        function isTaskOverdue(todo) {
            if (!todo.dueDate) return false;

            const today = startOfDay(new Date());
            const dueDate = parseLocalDate(todo.dueDate);

            return dueDate && dueDate < today;
        }

        function isTaskUpcoming(todo) {
            if (!todo.dueDate) return false;

            const today = startOfDay(new Date());
            const dueDate = parseLocalDate(todo.dueDate);

            return dueDate && dueDate > today;
        }

        function isTodoModalOpen() {
            return todoModalEl.classList.contains('show');
        }

        // Open Add/Edit
        const todoModalEl = document.getElementById('todoModal');
        const todoModal = new bootstrap.Modal(todoModalEl);
        function openAddModal() {
            document.getElementById('modalTitle').textContent = 'Create Task';
            document.getElementById('todoSubmitBtn').innerHTML = '<i class="fa-solid fa-save me-1"></i> Create Task';
            document.getElementById('todoForm').reset();
            document.getElementById('todoId').value = '';
        }
        function openEditModal(id) {
            const t = todos.find(x => x.id === id);
            if (!t) return;
            document.getElementById('modalTitle').textContent = 'Edit Todo';
            document.getElementById('todoSubmitBtn').innerHTML = '<i class="fa-solid fa-save me-1"></i> Save';
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
        initVoiceThemeSwitcher();
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





// user name printing
function updateWelcomeCard(username) {
    const safeUsername = username || 'User';
    const welcomeKey = `hasVisitedDashboard:${safeUsername}`;
    const hasVisitedBefore = localStorage.getItem(welcomeKey);

    document.getElementById('welcomeMessage').textContent =
        hasVisitedBefore ? 'Welcome back,' : 'Welcome,';
    document.getElementById('username').textContent = safeUsername;

    localStorage.setItem(welcomeKey, 'true');
}
