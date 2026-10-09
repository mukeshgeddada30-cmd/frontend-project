const STORAGE_KEY = "taskflow_tasks_v1";
const THEME_KEY = "taskflow_theme_v1";

const $ = (id) => document.getElementById(id);
const dialog = $("taskDialog");
let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") || [
  { id: crypto.randomUUID(), title: "Finish portfolio website", description: "Polish the projects section and deploy it.", category: "Work", priority: "high", due: "2026-10-05", completed: false, created: Date.now() - 5000 },
  { id: crypto.randomUUID(), title: "Study JavaScript arrays", description: "Review map, filter, reduce and practice examples.", category: "Study", priority: "medium", due: "2026-10-06", completed: false, created: Date.now() - 4000 },
  { id: crypto.randomUUID(), title: "Morning workout", description: "30 minutes of cardio and stretching.", category: "Health", priority: "low", due: "2026-10-03", completed: true, created: Date.now() - 3000 }
];

let activeFilter = "all";
let editingId = null;

function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); }
function esc(str) { return String(str).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[c])); }

function render() {
  const query = $("searchInput").value.trim().toLowerCase();
  const sort = $("sortSelect").value;
  let visible = tasks.filter(t => {
    const filterMatch = activeFilter === "all" || (activeFilter === "active" && !t.completed) || (activeFilter === "completed" && t.completed);
    const searchMatch = !query || `${t.title} ${t.description} ${t.category}`.toLowerCase().includes(query);
    return filterMatch && searchMatch;
  });

  visible.sort((a,b) => {
    if (sort === "oldest") return a.created - b.created;
    if (sort === "priority") return ({high:0, medium:1, low:2}[a.priority] - {high:0, medium:1, low:2}[b.priority]);
    if (sort === "alphabetical") return a.title.localeCompare(b.title);
    return b.created - a.created;
  });

  $("taskList").innerHTML = visible.map(taskHTML).join("");
  $("emptyState").classList.toggle("hidden", visible.length !== 0);

  const total = tasks.length, completed = tasks.filter(t => t.completed).length, active = total - completed;
  $("totalCount").textContent = total;
  $("activeCount").textContent = active;
  $("completedCount").textContent = completed;
  $("completionRate").textContent = total ? `${Math.round(completed / total * 100)}%` : "0%";
  $("navAll").textContent = total; $("navActive").textContent = active; $("navCompleted").textContent = completed;
  $("miniProgress").style.width = `${total ? completed / total * 100 : 0}%`;

  const titles = { all: ["All Tasks", "Everything you need to get done."], active: ["Active Tasks", "Keep moving — these still need your attention."], completed: ["Completed Tasks", "A record of everything you've finished."] };
  $("listTitle").textContent = titles[activeFilter][0];
  $("taskSubtitle").textContent = titles[activeFilter][1];
  document.querySelectorAll(".nav-item").forEach(btn => btn.classList.toggle("active", btn.dataset.filter === activeFilter));
}

function taskHTML(t) {
  const due = t.due ? new Date(t.due + "T00:00:00").toLocaleDateString(undefined, {month:"short", day:"numeric"}) : "";
  return `<article class="task ${t.completed ? "done" : ""}">
    <button class="check" aria-label="Toggle ${esc(t.title)}" onclick="toggleTask('${t.id}')"></button>
    <div class="task-content">
      <h3 class="task-title">${esc(t.title)}</h3>
      ${t.description ? `<p class="task-desc">${esc(t.description)}</p>` : ""}
      <div class="meta"><span class="badge">${esc(t.category)}</span><span class="badge priority-${t.priority}">${t.priority[0].toUpperCase()+t.priority.slice(1)} priority</span>${due ? `<span class="due">Due ${due}</span>` : ""}</div>
    </div>
    <div class="task-actions">
      <button class="icon-btn" onclick="editTask('${t.id}')" aria-label="Edit">✎</button>
      <button class="icon-btn" onclick="deleteTask('${t.id}')" aria-label="Delete">⌫</button>
    </div>
  </article>`;
}

function openCreate() {
  editingId = null; $("modalTitle").textContent = "Create a task"; $("taskForm").reset(); dialog.showModal(); $("titleInput").focus();
}
function editTask(id) {
  const t = tasks.find(x => x.id === id); if (!t) return;
  editingId = id; $("modalTitle").textContent = "Edit task";
  $("titleInput").value = t.title; $("descriptionInput").value = t.description || ""; $("categoryInput").value = t.category; $("priorityInput").value = t.priority; $("dateInput").value = t.due || "";
  dialog.showModal(); $("titleInput").focus();
}
function toggleTask(id) { const t = tasks.find(x => x.id === id); if (t) t.completed = !t.completed; save(); render(); }
function deleteTask(id) { if (confirm("Delete this task?")) { tasks = tasks.filter(t => t.id !== id); save(); render(); } }

$("taskForm").addEventListener("submit", e => {
  e.preventDefault();
  const data = { title: $("titleInput").value.trim(), description: $("descriptionInput").value.trim(), category: $("categoryInput").value, priority: $("priorityInput").value, due: $("dateInput").value };
  if (!data.title) return;
  if (editingId) Object.assign(tasks.find(t => t.id === editingId), data);
  else tasks.unshift({ ...data, id: crypto.randomUUID(), completed: false, created: Date.now() });
  save(); render(); dialog.close();
});
$("addBtn").onclick = openCreate; $("closeBtn").onclick = () => dialog.close(); $("cancelBtn").onclick = () => dialog.close();
$("searchInput").addEventListener("input", render); $("sortSelect").addEventListener("change", render);
document.querySelectorAll(".nav-item").forEach(btn => btn.addEventListener("click", () => { activeFilter = btn.dataset.filter; render(); }));

$("themeBtn").onclick = () => {
  document.body.classList.toggle("dark");
  localStorage.setItem(THEME_KEY, document.body.classList.contains("dark") ? "dark" : "light");
  $("themeBtn").textContent = document.body.classList.contains("dark") ? "☀" : "☾";
};
if (localStorage.getItem(THEME_KEY) === "dark") { document.body.classList.add("dark"); $("themeBtn").textContent = "☀"; }

const hour = new Date().getHours();
$("greeting").textContent = hour < 12 ? "GOOD MORNING" : hour < 18 ? "GOOD AFTERNOON" : "GOOD EVENING";
save(); render();
