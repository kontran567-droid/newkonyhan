// script.js
let currentUser = null;
let users = [];
let settings = {
    maintenance: false,
    primaryColor: "#7f4db4ff",
    bgColor: "#f8fafc",
    textColor: "#1f2937",
    appTitle: "ระบบจัดการบริษัท"
};
let globalMessages = [];
let allClockLogs = {}; // key = username

const USERS_KEY = "company_users";
const SETTINGS_KEY = "company_settings";
const MESSAGES_KEY = "company_chat";
const CLOCK_KEY = "company_clock";

// โหลดข้อมูลจาก localStorage
function loadData() {
    const savedUsers = localStorage.getItem(USERS_KEY);
    if (savedUsers) users = JSON.parse(savedUsers);
    else {
        // ข้อมูลเริ่มต้น (บันทึกใน localStorage ทันที)
        users = [
            { id: 1, username: "emp_sales", password: "123", role: "employee", dept: "sales", name: "พนักงานขาย 1", documents: [], requests: [], salary: 25000 },
            { id: 2, username: "emp_hr", password: "123", role: "employee", dept: "hr", name: "พนักงาน HR", documents: [], requests: [], salary: 28000 },
            { id: 3, username: "head_sales", password: "123", role: "head", dept: "sales", name: "หัวหน้าฝ่ายขาย", documents: [], requests: [], salary: 45000 },
            { id: 4, username: "admin", password: "admin123", role: "admin", dept: "", name: "แอดมินระบบ", documents: [], requests: [], salary: 60000 },
            { id: 5, username: "president", password: "boss123", role: "president", dept: "", name: "ประธานบริษัท", documents: [], requests: [], salary: 120000 }
        ];
        saveUsers();
    }

    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    if (savedSettings) settings = JSON.parse(savedSettings);
    else saveSettings();

    const savedMessages = localStorage.getItem(MESSAGES_KEY);
    if (savedMessages) globalMessages = JSON.parse(savedMessages);

    const savedClock = localStorage.getItem(CLOCK_KEY);
    if (savedClock) allClockLogs = JSON.parse(savedClock);
}

// บันทึกข้อมูล
function saveUsers() { localStorage.setItem(USERS_KEY, JSON.stringify(users)); }
function saveSettings() { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }
function saveMessages() { localStorage.setItem(MESSAGES_KEY, JSON.stringify(globalMessages)); }
function saveClock() { localStorage.setItem(CLOCK_KEY, JSON.stringify(allClockLogs)); }

// อัพเดทธีม
function applyTheme() {
    document.documentElement.style.setProperty("--primary-color", settings.primaryColor);
    document.documentElement.style.setProperty("--bg-color", settings.bgColor);
    document.documentElement.style.setProperty("--text-color", settings.textColor);
    document.getElementById("app-title").textContent = settings.appTitle;
    document.getElementById("sidebar-title").textContent = settings.appTitle;
}

// เริ่มต้นระบบ
function init() {
    loadData();
    applyTheme();

    // Tailwind script ทำงานอัตโนมัติ

    // Login form
    document.getElementById("login-form").addEventListener("submit", function(e) {
        e.preventDefault();
        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value;

        const user = users.find(u => u.username === username && u.password === password);
        if (user) {
            currentUser = user;
            checkMaintenanceAndLogin();
        } else {
            alert("ชื่อผู้ใช้หรือรหัสผ่านผิด!");
        }
    });

   
    if (localStorage.getItem("current_username")) {
        const savedUser = users.find(u => u.username === localStorage.getItem("current_username"));
        if (savedUser) {
            currentUser = savedUser;
            checkMaintenanceAndLogin();
        }
    }
}

function checkMaintenanceAndLogin() {
    if (settings.maintenance && currentUser.role !== "admin") {
        document.getElementById("login-page").classList.add("hidden");
        document.getElementById("maintenance-page").classList.remove("hidden");
    } else {
        enterApp();
    }
}

function enterApp() {
    document.getElementById("login-page").classList.add("hidden");
    document.getElementById("app").classList.remove("hidden");
    document.getElementById("current-user").textContent = `${currentUser.name} (${currentUser.role})`;

    // แสดงเมนูตามบทบาท
    document.getElementById("admin-menu").classList.toggle("hidden", currentUser.role !== "admin");
    document.getElementById("president-menu").classList.toggle("hidden", currentUser.role !== "president");

    showSection("home");
}

// แสดงหน้าเนื้อหา
function showSection(section) {
    const content = document.getElementById("content");
    content.innerHTML = "";

    if (section === "home") {
        content.innerHTML = `
            <div class="bg-white rounded-3xl shadow p-8">
                <h2 class="text-2xl font-bold mb-6">⏰ เข้างาน / ออกงาน</h2>
                <div class="flex gap-6">
                    <button onclick="clockIn()" class="flex-1 bg-green-600 text-white py-6 rounded-2xl text-xl font-semibold">เข้างาน</button>
                    <button onclick="clockOut()" class="flex-1 bg-red-600 text-white py-6 rounded-2xl text-xl font-semibold">ออกงาน</button>
                </div>
                <div class="mt-8">
                    <h3 class="font-semibold mb-3">บันทึกการเข้างาน</h3>
                    <div id="clock-list" class="space-y-2 max-h-96 overflow-y-auto"></div>
                </div>
            </div>
        `;
        renderClockLogs();
    }
    else if (section === "chat") {
        content.innerHTML = `
            <div class="bg-white rounded-3xl shadow p-8 h-[calc(100vh-120px)] flex flex-col">
                <h2 class="text-2xl font-bold mb-4">💬 แชทกลุ่มบริษัท</h2>
                <div id="chat-messages" class="flex-1 overflow-y-auto border rounded-2xl p-4 mb-4 space-y-3"></div>
                <div class="flex gap-3">
                    <input id="chat-input" type="text" class="flex-1 px-5 py-4 border rounded-2xl" placeholder="พิมพ์ข้อความ...">
                    <button onclick="sendChat()" class="bg-[var(--primary-color)] text-white px-8 rounded-2xl">ส่ง</button>
                </div>
            </div>
        `;
        renderChat();
    }
    else if (section === "documents") {
        content.innerHTML = `
            <div class="bg-white rounded-3xl shadow p-8">
                <div class="flex justify-between mb-6">
                    <h2 class="text-2xl font-bold">📄 ส่งเอกสาร</h2>
                    <button onclick="uploadDocument()" class="bg-[var(--primary-color)] text-white px-6 py-3 rounded-xl">+ ส่งเอกสารใหม่</button>
                </div>
                <ul id="doc-list" class="space-y-3"></ul>
            </div>
        `;
        renderDocuments();
    }
    else if (section === "money") {
        content.innerHTML = `
            <div class="bg-white rounded-3xl shadow p-8">
                <h2 class="text-2xl font-bold mb-6">💰 ขอเบิกเงิน</h2>
                <div class="grid grid-cols-2 gap-6">
                    <div>
                        <label class="block mb-2">จำนวนเงิน</label>
                        <input id="money-amount" type="number" class="w-full px-5 py-4 border rounded-2xl" placeholder="3000">
                    </div>
                    <div>
                        <label class="block mb-2">เหตุผล</label>
                        <input id="money-reason" type="text" class="w-full px-5 py-4 border rounded-2xl" placeholder="ค่าอาหาร">
                    </div>
                </div>
                <button onclick="requestMoney()" class="mt-6 w-full bg-[var(--primary-color)] text-white py-5 rounded-2xl text-lg">ส่งคำขอเบิกเงิน</button>
                <div class="mt-10">
                    <h3 class="font-semibold mb-3">คำขอของฉัน</h3>
                    <div id="request-list" class="space-y-3"></div>
                </div>
            </div>
        `;
        renderRequests();
    }
    else if (section === "usermanagement" && currentUser.role === "admin") {
        let html = `<div class="bg-white rounded-3xl shadow p-8"><h2 class="text-2xl font-bold mb-6">👥 จัดการผู้ใช้</h2>`;
        html += `<button onclick="addUser()" class="mb-6 bg-green-600 text-white px-6 py-3 rounded-xl">+ เพิ่มผู้ใช้ใหม่</button>`;
        html += `<div class="overflow-x-auto"><table class="w-full"><thead><tr class="bg-gray-100"><th class="p-4 text-left">ชื่อ</th><th>บทบาท</th><th>แผนก</th><th>รหัสผ่าน</th><th>จัดการ</th></tr></thead><tbody>`;
        
        users.forEach(u => {
            html += `<tr class="border-t"><td class="p-4">${u.name}</td><td>${u.role}</td><td>${u.dept || "-"}</td><td>***</td>`;
            html += `<td class="flex gap-2"><button onclick="changePassword(${u.id})" class="text-blue-600">เปลี่ยนรหัส</button>`;
            if (u.id !== currentUser.id) html += `<button onclick="deleteUser(${u.id})" class="text-red-600">ลบ</button>`;
            html += `</td></tr>`;
        });
        html += `</tbody></table></div></div>`;
        content.innerHTML = html;
    }
    else if (section === "salary" && currentUser.role === "president") {
        let html = `<div class="bg-white rounded-3xl shadow p-8"><h2 class="text-2xl font-bold mb-6">💵 กระจายเงินเดือน</h2><div class="space-y-6">`;
        users.filter(u => u.role !== "president").forEach(u => {
            html += `
                <div class="flex items-center justify-between bg-gray-50 p-5 rounded-2xl">
                    <div>
                        <div class="font-medium">${u.name}</div>
                        <div class="text-sm text-gray-500">${u.role} ${u.dept ? `(${u.dept})` : ""}</div>
                    </div>
                    <div class="flex items-center gap-3">
                        <input type="number" value="${u.salary}" id="salary-${u.id}" class="w-32 px-4 py-2 border rounded-xl">
                        <button onclick="updateSalary(${u.id})" class="bg-[var(--primary-color)] text-white px-6 py-2 rounded-xl">อัพเดท</button>
                    </div>
                </div>`;
        });
        html += `<button onclick="distributeSalary()" class="mt-8 w-full bg-green-600 text-white py-6 rounded-2xl text-xl font-bold">🚀 กระจายเงินเดือนทั้งหมด</button></div></div>`;
        content.innerHTML = html;
    }
}

// เข้างาน
function clockIn() {
    if (!allClockLogs[currentUser.username]) allClockLogs[currentUser.username] = [];
    const now = new Date().toLocaleString("th-TH");
    allClockLogs[currentUser.username].push({ type: "เข้า", time: now });
    saveClock();
    alert("เข้างานเรียบร้อย " + now);
    renderClockLogs();
}

// ออกงาน
function clockOut() {
    if (!allClockLogs[currentUser.username]) allClockLogs[currentUser.username] = [];
    const now = new Date().toLocaleString("th-TH");
    allClockLogs[currentUser.username].push({ type: "ออก", time: now });
    saveClock();
    alert("ออกงานเรียบร้อย " + now);
    renderClockLogs();
}

function renderClockLogs() {
    const list = document.getElementById("clock-list");
    if (!list) return;
    let html = "";
    const logs = allClockLogs[currentUser.username] || [];
    logs.forEach(log => {
        html += `<div class="bg-gray-50 p-4 rounded-2xl flex justify-between"><span>${log.type}</span><span class="text-gray-500">${log.time}</span></div>`;
    });
    list.innerHTML = html || "<p class='text-gray-400'>ยังไม่มีบันทึก</p>";
}

// แชท
function sendChat() {
    const input = document.getElementById("chat-input");
    if (!input.value.trim()) return;
    globalMessages.push({
        user: currentUser.name,
        text: input.value,
        time: new Date().toLocaleTimeString("th-TH", {hour:"2-digit", minute:"2-digit"})
    });
    saveMessages();
    input.value = "";
    renderChat();
}

function renderChat() {
    const box = document.getElementById("chat-messages");
    if (!box) return;
    let html = "";
    globalMessages.forEach(m => {
        html += `<div class="flex ${m.user === currentUser.name ? "justify-end" : ""}">
            <div class="${m.user === currentUser.name ? "bg-[var(--primary-color)] text-white" : "bg-gray-100"} px-5 py-3 rounded-3xl max-w-xs">
                <div class="text-xs opacity-70">${m.user}</div>
                <div>${m.text}</div>
                <div class="text-xs opacity-70 text-right">${m.time}</div>
            </div>
        </div>`;
    });
    box.innerHTML = html;
    box.scrollTop = box.scrollHeight;
}

// เอกสาร
function uploadDocument() {
    const name = prompt("ชื่อเอกสาร (เช่น ใบเบิกเงินเดือน.pdf):");
    if (!name) return;
    const user = users.find(u => u.id === currentUser.id);
    user.documents.push({ name: name, date: new Date().toLocaleDateString("th-TH") });
    saveUsers();
    renderDocuments();
}

function renderDocuments() {
    const list = document.getElementById("doc-list");
    if (!list) return;
    const user = users.find(u => u.id === currentUser.id);
    let html = "";
    user.documents.forEach((doc, i) => {
        html += `<li class="flex justify-between bg-gray-50 p-4 rounded-2xl"><span>📄 ${doc.name}</span><span class="text-sm text-gray-500">${doc.date}</span></li>`;
    });
    list.innerHTML = html || "<p class='text-gray-400'>ยังไม่มีเอกสาร</p>";
}

// ขอเบิกเงิน
function requestMoney() {
    const amount = document.getElementById("money-amount").value;
    const reason = document.getElementById("money-reason").value;
    if (!amount || !reason) return alert("กรอกข้อมูลให้ครบ");
    const user = users.find(u => u.id === currentUser.id);
    user.requests.push({ amount: amount, reason: reason, date: new Date().toLocaleDateString("th-TH"), status: "รอพิจารณา" });
    saveUsers();
    renderRequests();
    alert("ส่งคำขอเบิกเงินแล้ว!");
}

function renderRequests() {
    const list = document.getElementById("request-list");
    if (!list) return;
    const user = users.find(u => u.id === currentUser.id);
    let html = "";
    user.requests.forEach(req => {
        html += `<div class="bg-gray-50 p-5 rounded-2xl flex justify-between items-center"><div><div class="font-medium">฿${req.amount}</div><div class="text-sm">${req.reason}</div></div><div class="text-right"><div class="text-xs text-gray-500">${req.date}</div><div class="text-blue-600">${req.status}</div></div></div>`;
    });
    list.innerHTML = html || "<p class='text-gray-400'>ยังไม่มีคำขอ</p>";
}

// แอดมิน - เพิ่มผู้ใช้
function addUser() {
    const username = prompt("ชื่อผู้ใช้ใหม่:");
    const name = prompt("ชื่อ-นามสกุล:");
    const role = prompt("บทบาท (employee/head/admin/president):");
    const dept = prompt("แผนก (sales/hr/it หรือเว้นว่าง):");
    <h1>รหัสเริ่มต้นคือ 123 หากเพิ่่มเเล้ว กรุณาเปลี่ยนรหัสผ่าน </h1>
    if (!username || !name || !role) return;
    const newUser = {
        id: Date.now(),
        username: username,
        password: "123",
        role: role,
        dept: dept || "",
        name: name,
        documents: [],
        requests: [],
        salary: 25000
    };
    users.push(newUser);
    saveUsers();
    showSection("usermanagement");
}

// ลบผู้ใช้
function deleteUser(id) {
    if (!confirm("ยืนยันลบผู้ใช้นี้?")) return;
    users = users.filter(u => u.id !== id);
    saveUsers();
    showSection("usermanagement");
}

// เปลี่ยนรหัสผ่าน
function changePassword(id) {
    const newPass = prompt("รหัสผ่านใหม่:");
    if (!newPass) return;
    const user = users.find(u => u.id === id);
    if (user) {
        user.password = newPass;
        saveUsers();
        alert("เปลี่ยนรหัสผ่านแล้ว");
    }
}

// เปิด/ปิด โหมดปรับปรุง (ต้องใส่รหัสแอดมิน)
function toggleMaintenance() {
    const pass = prompt("ใส่รหัสผ่านแอดมินเพื่อยืนยัน:");
    if (pass !== "admin123") return alert("รหัสผ่านผิด!");
    
    settings.maintenance = !settings.maintenance;
    saveSettings();
    alert(settings.maintenance ? "เปิดโหมดปรับปรุงแล้ว ✅" : "ปิดโหมดปรับปรุงแล้ว ✅");
}

// เปิดแผงแก้ไข (Maintenance Editor)
function openEditorPanel() {
    const pass = prompt("ใส่รหัสผ่านแอดมินเพื่อเข้าแก้ไข:");
    if (pass !== "admin123") return alert("รหัสผ่านผิด!");

    document.getElementById("editor-panel").classList.remove("hidden");
    // ตั้งค่าเริ่มต้น
    document.getElementById("color-primary").value = settings.primaryColor;
    document.getElementById("color-bg").value = settings.bgColor;
    document.getElementById("color-text").value = settings.textColor;
    document.getElementById("edit-title").value = settings.appTitle;
}

function closeEditorPanel() {
    document.getElementById("editor-panel").classList.add("hidden");
}

function saveEditorChanges() {
    settings.primaryColor = document.getElementById("color-primary").value;
    settings.bgColor = document.getElementById("color-bg").value;
    settings.textColor = document.getElementById("color-text").value;
    settings.appTitle = document.getElementById("edit-title").value;

    saveSettings();
    applyTheme();
    closeEditorPanel();
    alert("บันทึกการเปลี่ยนสีและคำเรียบร้อย! ระบบอัพเดทแล้ว");
}

// อัพเดทเงินเดือน
function updateSalary(id) {
    const input = document.getElementById(`salary-${id}`);
    const user = users.find(u => u.id === id);
    if (user && input) {
        user.salary = parseInt(input.value);
        saveUsers();
        alert("อัพเดทเงินเดือนแล้ว");
    }
}

function distributeSalary() {
    if (!confirm("ยืนยันกระจายเงินเดือนให้ทุกคน?")) return;
    alert("✅ กระจายเงินเดือนเรียบร้อยแล้ว! (ข้อมูลถูกบันทึกในระบบ)");
}

// ออกจากระบบ
function logout() {
    localStorage.removeItem("current_username");
    currentUser = null;
    document.getElementById("app").classList.add("hidden");
    document.getElementById("login-page").classList.remove("hidden");
}

// เริ่มต้น
init();
