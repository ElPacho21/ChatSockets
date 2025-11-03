const socket = io();

const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const showRegister = document.getElementById('show-register');
const showLogin = document.getElementById('show-login');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const loginUsername = document.getElementById('login-username');
const loginPassword = document.getElementById('login-password');
const registerUsername = document.getElementById('register-username');
const registerPassword = document.getElementById('register-password');
const registerFirstName = document.getElementById('register-firstName');
const registerLastName = document.getElementById('register-lastName');

const chatContainer = document.getElementById('chat-container');
const profileUsername = document.getElementById('profile-username');
const profileFirstName = document.getElementById('profile-firstName');
const profileLastName = document.getElementById('profile-lastName');
const myChannelList = document.getElementById('my-channel-list');
const discoverChannelList = document.getElementById('discover-channel-list');
const newChannelBtn = document.getElementById('new-channel-btn');
const discoverUserList = document.getElementById('discover-user-list');
const myUserList = document.getElementById('my-user-list');
const messages = document.getElementById('messages');
const messageInput = document.getElementById('message-input');
const fileInput = document.getElementById('file-input');
const sendBtn = document.getElementById('send-btn');
const uploadBtn = document.getElementById('upload-btn');
const fileNameLabel = document.getElementById('file-name');
const editProfileBtn = document.getElementById('edit-profile-btn');
const profileAvatar = document.getElementById('profile-avatar');
const uploadAvatarBtn = document.getElementById('upload-avatar-btn');
const tabMyBtn = document.getElementById('tab-my');
const tabDiscoverBtn = document.getElementById('tab-discover');
const tabMyContent = document.getElementById('tab-my-content');
const tabDiscoverContent = document.getElementById('tab-discover-content');
const chatTitle = document.getElementById('chat-title');
const chatSubtitle = document.getElementById('chat-subtitle');
const logoutBtn = document.getElementById('logout-btn');

let currentUser = null;
let currentChannel = null;
let privateChatUser = null;
let myChannelIds = new Set();
let myContactIds = new Set();
let lastRenderedDateKey = null;
let floatingDateHeader = null;

// Notification sound
const notificationSound = new Audio('/sounds/notification.mp3');
notificationSound.volume = 0.5;

const isChatPage = !!document.getElementById('chat-container');
const isLoginPage = !!document.getElementById('auth-page');

if (isChatPage) (async function tryRestoreSession(){
    try {
        const res = await fetch('/auth/me');
        if (!res.ok) {
            window.location.href = '/login';
            return;
        }
        const data = await res.json();
        currentUser = data;
        chatContainer.style.display = 'flex';
        profileUsername.textContent = data.username;
        profileFirstName.textContent = data.profile?.firstName || '';
        profileLastName.textContent = data.profile?.lastName || '';
        const avatarUrl = data.profile?.avatar || '/img/default_avatar.svg';
        if (avatarUrl) {
            profileAvatar.src = avatarUrl;
            profileAvatar.style.display = 'block';
        } else {
            profileAvatar.style.display = 'none';
        }
        socket.emit('identify', currentUser);
        await loadInitialData();
    } catch (_) {
        window.location.href = '/login';
    }
})();
if (showRegister && showLogin) {
    showRegister.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    });
    showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        registerForm.style.display = 'none';
        loginForm.style.display = 'block';
    });
}

if (registerBtn) {
    registerBtn.addEventListener('click', async () => {
        try {
            const res = await fetch('/users/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: registerUsername.value,
                    password: registerPassword.value,
                    firstName: registerFirstName.value,
                    lastName: registerLastName.value,
                })
            });
            const data = await res.json();
            if (!res.ok) {
                return Swal.fire('Error', data.error || 'No se pudo registrar', 'error');
            }
            Swal.fire('Registro exitoso', 'Ya puedes iniciar sesión', 'success');
            registerForm.style.display = 'none';
            loginForm.style.display = 'block';
        } catch (e) {
            Swal.fire('Error', 'No se pudo registrar', 'error');
        }
    });
}

if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
        try {
            const res = await fetch('/users/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: loginUsername.value,
                    password: loginPassword.value,
                })
            });
            const data = await res.json();
            if (!res.ok) {
                return Swal.fire('Error', data.error || 'Credenciales inválidas', 'error');
            }
            window.location.href = '/';
        } catch (e) {
            Swal.fire('Error', 'No se pudo iniciar sesión', 'error');
        }
    });
}

async function loadInitialData() {
    await fetchContacts();
    await Promise.all([fetchChannels(), fetchUsers()]);
}

async function fetchChannels() {
    try {
        const res = await fetch('/channels');
        const data = await res.json();
        
        myChannelIds = new Set((currentUser.channels || []).map(c => c._id || c));
        myChannelList.innerHTML = '';
        discoverChannelList.innerHTML = '';
        data.forEach(ch => {
            if (myChannelIds.has(String(ch._id))) {
                addChannelListItem(myChannelList, ch, true);
            } else {
                addChannelListItem(discoverChannelList, ch, false);
            }
        });
    } catch (e) { /* ignore */ }
}

async function fetchUsers() {
    try {
        const res = await fetch('/users');
        const data = await res.json();
        discoverUserList.innerHTML = '';
        data.forEach(user => {
            if (user._id !== currentUser?._id && !myContactIds.has(String(user._id))) {
                const li = document.createElement('li');
                li.textContent = user.username;
                li.dataset.userId = user._id;
                li.addEventListener('click', () => openPrivateChat(user, li));
                discoverUserList.appendChild(li);
            }
        });
    } catch (e) { /* ignore */ }
}

socket.on('userList', (users) => {
    
});

socket.on('channelCreated', (channel) => {
    
    if (String(channel.owner) === String(currentUser._id)) {
        (async () => { await joinChannelMembership(channel._id); await fetchChannels(); })();
    } else {
        addChannelListItem(discoverChannelList, channel, false);
    }
});

async function fetchContacts() {
    try {
        const res = await fetch(`/messages/contacts?me=${currentUser._id}`);
        const data = await res.json();
        myUserList.innerHTML = '';
        myContactIds = new Set(data.map(u => String(u._id)));
        data.forEach(user => {
            const li = document.createElement('li');
            li.textContent = user.username;
            li.dataset.userId = user._id;
            li.addEventListener('click', () => openPrivateChat(user, li));
            myUserList.appendChild(li);
        });
    } catch (e) { /* ignore */ }
}

function openPrivateChat(user, li) {
    currentChannel = null;
    privateChatUser = user._id;
    resetMessagesView();
    loadPrivateHistory(privateChatUser);
    document.querySelectorAll('#my-channel-list li, #discover-channel-list li, #my-user-list li, #discover-user-list li').forEach(item => item.classList.remove('active'));
    li.classList.add('active');
    messageInput.value = '';
    fileInput.value = '';
    updateChatHeader({ type: 'user', name: user.username });
}
function addChannelListItem(listEl, channel, isMine) {
    const li = document.createElement('li');
    li.textContent = channel.name;
    li.dataset.channelId = channel._id;
    if (isMine) {
        li.addEventListener('click', () => openChannel(channel, li));
    } else {
        li.addEventListener('click', async () => {
            await joinChannelMembership(channel._id);
            await fetchChannels();
        });
    }
    listEl.appendChild(li);
}

async function joinChannelMembership(channelId) {
    await fetch(`/channels/join/${channelId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser._id })
    }).then(res => res.json()).then(user => { currentUser = user; });
}

function openChannel(channel, li) {
    currentChannel = channel._id;
    privateChatUser = null;
    resetMessagesView();
    loadChannelHistory(currentChannel);
    socket.emit('joinChannel', currentChannel);
    document.querySelectorAll('#my-channel-list li, #discover-channel-list li, #my-user-list li, #discover-user-list li').forEach(item => item.classList.remove('active'));
    li.classList.add('active');
    messageInput.value = '';
    fileInput.value = '';
    updateChatHeader({ type: 'channel', name: channel.name, description: channel.description || '' });
}

if (newChannelBtn) {
    newChannelBtn.addEventListener('click', async () => {
        const { value: formValues } = await Swal.fire({
            title: 'Nuevo canal',
            html:
                '<input id="swal-input1" class="swal2-input" placeholder="Nombre">' +
                '<input id="swal-input2" class="swal2-input" placeholder="Descripción">',
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Crear',
            preConfirm: () => {
                const name = document.getElementById('swal-input1').value.trim();
                const description = document.getElementById('swal-input2').value.trim();
                if (!name) {
                    Swal.showValidationMessage('El nombre es obligatorio');
                    return false;
                }
                return { name, description };
            }
        });
        if (formValues) {
            socket.emit('createChannel', { ...formValues, owner: currentUser._id });
        }
    });
}

if (sendBtn) {
    sendBtn.addEventListener('click', () => {
        const content = messageInput.value.trim();
        const file = fileInput.files[0];

        if (file) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('senderId', currentUser._id);
            if (content) formData.append('content', content);
            if (currentChannel) formData.append('channel', currentChannel);
            if (privateChatUser) formData.append('receiver', privateChatUser);

            fetch('/messages/upload', { method: 'POST', body: formData })
                .then(res => res.json())
                .then(() => { fileInput.value = ''; if (fileNameLabel) { fileNameLabel.style.display = 'none'; fileNameLabel.textContent = ''; } })
                .catch(err => console.error(err));
            messageInput.value = '';
        } else if (content) {
            const messageData = { sender: currentUser._id, content };
            if (currentChannel) messageData.channel = currentChannel;
            if (privateChatUser) messageData.receiver = privateChatUser;
            socket.emit('message', messageData);
            messageInput.value = '';
        }
    });
}

messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendBtn.click();
    }
});

if (uploadBtn) {
    uploadBtn.addEventListener('click', () => fileInput.click());
}

if (fileInput) {
    fileInput.addEventListener('change', () => {
        const f = fileInput.files[0];
        if (f && fileNameLabel) {
            fileNameLabel.textContent = f.name;
            fileNameLabel.style.display = 'inline-block';
        } else if (fileNameLabel) {
            fileNameLabel.textContent = '';
            fileNameLabel.style.display = 'none';
        }
    });
}

// Edit profile button navigates to profile view with userId
if (editProfileBtn) {
    editProfileBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (!currentUser?._id) return;
        window.location.href = `/profile?userId=${currentUser._id}`;
    });
}

function idStr(v){ return String(v?._id || v || ''); }
function isPrivateMessage(msg){ return !!msg.receiver && !msg.channel; }
function isForCurrentContext(msg){
    if (currentChannel) return idStr(msg.channel) === idStr(currentChannel);
    if (privateChatUser) {
        const s = idStr(msg.sender);
        const r = idStr(msg.receiver);
        return (s === idStr(privateChatUser) && r === idStr(currentUser._id)) ||
               (s === idStr(currentUser._id) && r === idStr(privateChatUser));
    }
    return false;
}

// Date helpers and sticky dividers
function toLocalDate(d){
    const date = new Date(d);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
function getDateKey(d){
    const dt = toLocalDate(d);
    const y = dt.getFullYear();
    const m = String(dt.getMonth()+1).padStart(2,'0');
    const day = String(dt.getDate()).padStart(2,'0');
    return `${y}-${m}-${day}`;
}
function formatDayLabel(d){
    const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    const today = toLocalDate(new Date());
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate()-1);
    const dt = toLocalDate(d);
    if (dt.getTime() === today.getTime()) return 'Hoy';
    if (dt.getTime() === yesterday.getTime()) return 'Ayer';
    return `${dt.getDate()} de ${months[dt.getMonth()]} de ${dt.getFullYear()}`;
}
function insertDateDividerIfNeeded(date){
    const key = getDateKey(date);
    if (key === lastRenderedDateKey) return;
    lastRenderedDateKey = key;
    const div = document.createElement('div');
    div.className = 'date-divider';
    const span = document.createElement('span');
    const label = formatDayLabel(date);
    span.textContent = label;
    div.dataset.dateKey = key;
    div.dataset.dateLabel = label;
    div.appendChild(span);
    messages.appendChild(div);
}
function resetMessagesView(){
    messages.innerHTML = '';
    lastRenderedDateKey = null;
    ensureFloatingDateHeader();
    updateFloatingDateHeader();
}

// Floating date header (single sticky header that updates on scroll)
function ensureFloatingDateHeader(){
    if (!messages) return;
    if (floatingDateHeader && floatingDateHeader.isConnected) return;
    floatingDateHeader = document.createElement('div');
    floatingDateHeader.className = 'date-floating';
    const span = document.createElement('span');
    floatingDateHeader.appendChild(span);
    messages.prepend(floatingDateHeader);
}
function updateFloatingDateHeader(){
    if (!messages) return;
    ensureFloatingDateHeader();
    const dividers = messages.querySelectorAll('.date-divider');
    const span = floatingDateHeader.querySelector('span');
    if (!dividers.length) {
        floatingDateHeader.style.display = 'none';
        return;
    }
    const containerTop = messages.getBoundingClientRect().top;
    let current = dividers[0];
    dividers.forEach(d => {
        const rect = d.getBoundingClientRect();
        if (rect.top <= containerTop + 8) {
            current = d;
        }
    });
    const label = current?.dataset?.dateLabel || current?.textContent?.trim();
    if (label) {
        span.textContent = label;
        floatingDateHeader.style.display = '';
    } else {
        floatingDateHeader.style.display = 'none';
    }

    // Hide the static divider when it would visually overlap with the floating header
    // First, clear previous state
    dividers.forEach(d => d.classList.remove('hidden-under-floating'));
    if (current) {
        const currRect = current.getBoundingClientRect();
        const floatRect = floatingDateHeader.getBoundingClientRect();
        // If the current divider is under the floating header area, hide it
        if (currRect.top <= (containerTop + floatRect.height + 4)) {
            current.classList.add('hidden-under-floating');
        }
    }
}

// Render messages from socket (only for current context)
socket.on('messageLogs', async (msgs) => {
    let needsContactsRefresh = false;
    msgs.forEach(msg => {
        // If it's a private message involving me, mark to refresh contacts
        if (isPrivateMessage(msg)) {
            const involvesMe = idStr(msg.sender) === idStr(currentUser?._id) || idStr(msg.receiver) === idStr(currentUser?._id);
            if (involvesMe) needsContactsRefresh = true;
        }
        // Only render if message belongs to the active context
        if (isForCurrentContext(msg)) {
            renderMessage(msg);
            if (currentUser && idStr(msg.sender) !== idStr(currentUser._id)) {
                notificationSound.play().catch(() => {});
            }
        }
    });
    if (needsContactsRefresh) {
        try { await fetchContacts(); await fetchUsers(); } catch(_){}
    }
    messages.scrollTop = messages.scrollHeight;
    updateFloatingDateHeader();
});

async function loadChannelHistory(channelId) {
    try {
        const res = await fetch(`/messages/channel/${channelId}`);
        const data = await res.json();
        renderHistory(data);
    } catch (e) { /* ignore */ }
}

async function loadPrivateHistory(userId) {
    try {
        const params = new URLSearchParams({ me: currentUser._id, user: userId });
        const res = await fetch(`/messages/private?${params.toString()}`);
        const data = await res.json();
        renderHistory(data);
    } catch (e) { /* ignore */ }
}

function renderHistory(list) {
    resetMessagesView();
    // Ensure chronological order ascending by timestamp
    list
        .slice()
        .sort((a,b) => new Date(a.timestamp||0) - new Date(b.timestamp||0))
        .forEach(msg => renderMessage(msg));
    messages.scrollTop = messages.scrollHeight;
    updateFloatingDateHeader();
}

function renderMessage(msg) {
    const time = msg.timestamp ? new Date(msg.timestamp) : new Date();
    // Insert a sticky date divider when day changes
    insertDateDividerIfNeeded(time);
    const el = document.createElement('div');
    const isMe = String(msg.sender?._id || msg.sender) === String(currentUser._id);
    el.className = `message ${isMe ? 'me' : 'other'}`;
    const hh = String(time.getHours()).padStart(2, '0');
    const mm = String(time.getMinutes()).padStart(2, '0');
    let inner = `<div class="bubble">`;
    inner += `<div><strong>${msg.sender?.username || 'Usuario'}:</strong> ${msg.content || ''}</div>`;
    if (msg.file && msg.file.filename) {
        inner += `<div><a href="/uploads/${msg.file.filename}" target="_blank">${msg.file.filename}</a></div>`;
    }
    inner += `<span class="timestamp">${hh}:${mm}</span>`;
    inner += `</div>`;
    el.innerHTML = inner;
    messages.appendChild(el);
    updateFloatingDateHeader();
}

function updateChatHeader(ctx) {
    if (ctx.type === 'channel') {
        chatTitle.textContent = `# ${ctx.name}`;
        chatSubtitle.textContent = ctx.description || '';
    } else if (ctx.type === 'user') {
        chatTitle.textContent = `@ ${ctx.name}`;
        chatSubtitle.textContent = '';
    } else {
        chatTitle.textContent = '';
        chatSubtitle.textContent = '';
    }
}

// Tabs logic
if (tabMyBtn && tabDiscoverBtn) {
    tabMyBtn.addEventListener('click', () => {
        tabMyBtn.classList.add('active');
        tabDiscoverBtn.classList.remove('active');
        tabMyContent.style.display = '';
        tabDiscoverContent.style.display = 'none';
    });
    tabDiscoverBtn.addEventListener('click', () => {
        tabDiscoverBtn.classList.add('active');
        tabMyBtn.classList.remove('active');
        tabDiscoverContent.style.display = '';
        tabMyContent.style.display = 'none';
    });
}

// Logout
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        try {
            await fetch('/auth/logout', { method: 'POST' });
        } catch (_) {}
        window.location.href = '/login';
    });
}

// Update floating date on scroll
if (messages) {
    messages.addEventListener('scroll', () => {
        updateFloatingDateHeader();
    });
}