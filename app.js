/* =========================================================
   Student Companion — Firebase Auth + Firestore + App Logic
========================================================= */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Default Seed Data (merged with live Cloud Firestore records)
const defaultRequests = [
  {
    id: "SC-001",
    date: "Today",
    submittedDate: "24 September 2026",
    title: "Classroom fan repair",
    category: "Facilities",
    location: "Block B — Room 204",
    status: "Pending",
    description: "The classroom fan is not working. Please arrange an inspection and repair."
  },
  {
    id: "SC-002",
    date: "Yesterday",
    submittedDate: "23 September 2026",
    title: "Library lighting issue",
    category: "Facilities",
    location: "Central Library — Floor 2",
    status: "In Progress",
    description: "The overhead lights near the study area are flickering and several are not working."
  },
  {
    id: "SC-003",
    date: "12 September",
    submittedDate: "12 September 2026",
    title: "Damaged study desk",
    category: "Facilities",
    location: "Student Center",
    status: "Resolved",
    description: "The study desk has an unstable leg and needs to be repaired."
  }
];

const defaultLostFound = [
  {
    id: "LF-01",
    name: "Black Wallet",
    type: "Lost",
    category: "Personal",
    location: "Main Library",
    dateText: "Reported today",
    description: "Black leather wallet with student ID inside. If you found this item, contact campus support."
  },
  {
    id: "LF-02",
    name: "Student ID Card",
    type: "Found",
    category: "Personal",
    location: "Student Center",
    dateText: "Reported yesterday",
    description: "A student ID card was found near the Student Center. Contact campus support to verify ownership."
  },
  {
    id: "LF-03",
    name: "Wireless Earbuds",
    type: "Lost",
    category: "Electronics",
    location: "Computer Lab",
    dateText: "Reported 2 days ago",
    description: "Wireless earbuds were reported missing in the Computer Lab. Contact campus support with any information."
  }
];

const campusEvents = [
  {
    id: "EVT-01",
    day: "25",
    month: "OCT",
    fullDate: "25 October 2026",
    title: "Student Tech Seminar",
    category: "Seminar",
    tagLine: "Seminar · Student Development",
    time: "10:00 AM–12:00 PM",
    location: "Main Auditorium",
    about: "Join students and guest speakers for a practical technology seminar covering current digital skills and career opportunities."
  },
  {
    id: "EVT-02",
    day: "25",
    month: "OCT",
    fullDate: "25 October 2026",
    title: "Web Development Seminar",
    category: "Workshop",
    tagLine: "Seminar · Student Development",
    time: "2:00 PM–4:00 PM",
    location: "Computer Lab",
    about: "Build practical web development skills in a student-focused seminar at the Computer Lab."
  },
  {
    id: "EVT-03",
    day: "28",
    month: "OCT",
    fullDate: "28 October 2026",
    title: "Interfaculty Sports Day",
    category: "Sports",
    tagLine: "Sports · Student Development",
    time: "9:00 AM",
    location: "University Sports Ground",
    about: "Join students from across the university for a day of interfaculty sports and friendly competition."
  }
];

const defaultNotifications = [
  {
    id: "NOTIF-1",
    title: "Issue status updated",
    body: "Your classroom maintenance request is now in progress.",
    time: "10:30 AM",
    unread: true,
    targetScreen: "screen-requests"
  },
  {
    id: "NOTIF-2",
    title: "Upcoming campus event",
    body: "Student Tech Seminar is scheduled for 25 October 2026.",
    time: "11:00 AM",
    unread: true,
    targetScreen: "screen-events"
  },
  {
    id: "NOTIF-3",
    title: "Lost & Found update",
    body: "A new item has been posted in Lost & Found.",
    time: "Yesterday",
    unread: false,
    targetScreen: "screen-lost-found"
  },
  {
    id: "NOTIF-4",
    title: "Booking request received",
    body: "Your facility booking request has been received.",
    time: "20 October 2026",
    unread: false,
    targetScreen: "screen-services"
  }
];

let requestsList = [...defaultRequests];
let lfList = [...defaultLostFound];
let notificationsList = [...defaultNotifications];

let currentScreen = "screen-onboarding";
let previousScreen = "screen-home";
let activeRequestFilter = "All";
let activeLfFilter = "All";
let activeEventFilter = "All";
let lfPostType = "Lost";
let selectedRating = 4;

// Load Live Data from Cloud Firestore
async function loadFirestoreData() {
  try {
    const reqQuery = query(collection(db, "service_requests"), orderBy("createdAt", "desc"));
    const reqSnap = await getDocs(reqQuery);
    const cloudRequests = [];
    reqSnap.forEach(doc => cloudRequests.push(doc.data()));
    requestsList = [...cloudRequests, ...defaultRequests];

    const lfQuery = query(collection(db, "lost_found_items"), orderBy("createdAt", "desc"));
    const lfSnap = await getDocs(lfQuery);
    const cloudLf = [];
    lfSnap.forEach(doc => cloudLf.push(doc.data()));
    lfList = [...cloudLf, ...defaultLostFound];

    renderHomeActiveRequest();
    renderRequests();
    renderLostFound();
  } catch (err) {
    console.log("Firestore read ready:", err.message);
  }
}

// Navigation Controller
function goToScreen(screenId) {
  if (currentScreen !== screenId) {
    previousScreen = currentScreen;
  }

  document.querySelectorAll(".screen").forEach(sec => sec.classList.remove("active"));
  const target = document.getElementById(screenId);
  if (target) {
    target.classList.add("active");
    currentScreen = screenId;
  }

  const bottomNav = document.getElementById("bottomNav");
  if (target && target.classList.contains("has-nav")) {
    bottomNav.classList.remove("hidden");
  } else {
    bottomNav.classList.add("hidden");
  }

  document.querySelectorAll(".nav-tab").forEach(tab => {
    tab.classList.remove("active");
    if (tab.dataset.target === screenId) {
      tab.classList.add("active");
    }
  });

  if (screenId === "screen-home") renderHomeActiveRequest();
  if (screenId === "screen-requests") renderRequests();
  if (screenId === "screen-lost-found") renderLostFound();
  if (screenId === "screen-events") renderEvents();
  if (screenId === "screen-notifications") renderNotifications();
}

function goBack() {
  goToScreen(previousScreen || "screen-home");
}

// Onboarding Steps (00A, 00B, 00C)
function setOnboardingStep(stepIndex) {
  const textGroup = document.getElementById("onboardingTextGroup");
  const actionsGroup = document.getElementById("onboardingActions");

  document.querySelectorAll(".onboarding-dots .dot").forEach((dot, idx) => {
    dot.classList.toggle("active", idx === stepIndex);
  });

  if (stepIndex === 0) {
    textGroup.classList.add("hidden");
    actionsGroup.classList.add("hidden");
  } else if (stepIndex === 1) {
    textGroup.classList.remove("hidden");
    actionsGroup.classList.add("hidden");
  } else {
    textGroup.classList.remove("hidden");
    actionsGroup.classList.remove("hidden");
  }
}

// Firebase Authentication Login
function togglePasswordVisibility() {
  const passInput = document.getElementById("loginPassword");
  const toggleBtn = document.getElementById("togglePassBtn");
  if (passInput.type === "password") {
    passInput.type = "text";
    toggleBtn.textContent = "Hide";
  } else {
    passInput.type = "password";
    toggleBtn.textContent = "Show";
  }
}

async function handleLogin(event) {
  event.preventDefault();
  const emailInput = document.getElementById("loginEmail");
  const passInput = document.getElementById("loginPassword");
  const emailErr = document.getElementById("loginEmailError");
  const passErr = document.getElementById("loginPassError");
  const signInBtn = document.getElementById("signInBtn");

  emailErr.textContent = "";
  passErr.textContent = "";
  emailInput.classList.remove("input-error");
  passInput.classList.remove("input-error");

  const email = emailInput.value.trim();
  const password = passInput.value.trim();

  if (!email || !email.includes("@")) {
    emailErr.textContent = "Please enter a valid campus email address.";
    emailInput.classList.add("input-error");
    return;
  }

  if (password.length < 6) {
    passErr.textContent = "Password must be at least 6 characters.";
    passInput.classList.add("input-error");
    return;
  }

  signInBtn.textContent = "Signing in...";
  signInBtn.disabled = true;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    await loadFirestoreData();
    goToScreen("screen-home");
  } catch (error) {
    passErr.textContent = "Invalid campus credentials. Check Firebase Auth user.";
    passInput.classList.add("input-error");
  } finally {
    signInBtn.textContent = "Sign In";
    signInBtn.disabled = false;
  }
}

// Home Active Request
function renderHomeActiveRequest() {
  const container = document.getElementById("homeActiveRequestCard");
  const activeReq = requestsList.find(r => r.status === "In Progress") || requestsList[0];

  if (!activeReq) {
    container.innerHTML = `<p class="muted-sm">No active requests right now.</p>`;
    return;
  }

  container.innerHTML = `
    <p class="card-top-meta">${activeReq.id} · Active request</p>
    <h4>${activeReq.title}</h4>
    <p class="muted-sm">${activeReq.location}</p>
    <div class="card-footer-row">
      <span class="status-pill ${getStatusClass(activeReq.status)}">&#9679; ${activeReq.status}</span>
      <button type="button" class="link-btn-sm" onclick="openIssueDetails('${activeReq.id}')">View Details</button>
    </div>
  `;
}

// Photo Overlay & Report Issue -> Saves to Firestore
function openPhotoOverlay() {
  showModal(`
    <h3>Add a Photo</h3>
    <p>PNG or JPG, up to 10 MB. Try attaching the sample photo in this prototype.</p>
    <div class="modal-btn-stack">
      <button type="button" class="btn btn-primary" onclick="attachSamplePhoto(true)">Use sample photo</button>
      <button type="button" class="btn btn-secondary" onclick="attachSamplePhoto(false)">Remove Photo</button>
      <button type="button" class="link-btn" onclick="closeModal()">Cancel</button>
    </div>
  `);
}

function attachSamplePhoto(attach) {
  const box = document.getElementById("photoUploadBox");
  const title = document.getElementById("photoUploadTitle");
  const sub = document.getElementById("photoUploadSub");

  if (attach) {
    box.classList.add("attached");
    title.textContent = "Sample_Campus_Photo.jpg Attached";
    sub.textContent = "Tap to replace or remove photo";
  } else {
    box.classList.remove("attached");
    title.textContent = "Add a Photo";
    sub.textContent = "PNG or JPG, up to 10 MB";
  }
  closeModal();
}

async function handleReportSubmit(event) {
  event.preventDefault();
  const titleInput = document.getElementById("issueTitle");
  const locInput = document.getElementById("issueLocation");
  const descInput = document.getElementById("issueDescription");
  const catInput = document.getElementById("issueCategory");
  const summaryBox = document.getElementById("reportErrorSummary");

  let valid = true;
  summaryBox.classList.add("hidden");

  if (!titleInput.value.trim()) {
    document.getElementById("issueTitleError").textContent = "Please enter an issue title.";
    titleInput.classList.add("input-error");
    valid = false;
  } else {
    document.getElementById("issueTitleError").textContent = "";
    titleInput.classList.remove("input-error");
  }

  if (!locInput.value.trim()) {
    document.getElementById("issueLocationError").textContent = "Please enter the campus location.";
    locInput.classList.add("input-error");
    valid = false;
  } else {
    document.getElementById("issueLocationError").textContent = "";
    locInput.classList.remove("input-error");
  }

  if (!descInput.value.trim()) {
    document.getElementById("issueDescError").textContent = "Please describe the issue.";
    descInput.classList.add("input-error");
    valid = false;
  } else {
    document.getElementById("issueDescError").textContent = "";
    descInput.classList.remove("input-error");
  }

  if (!valid) {
    summaryBox.classList.remove("hidden");
    return;
  }

  const newId = "SC-00" + (requestsList.length + 1);
  const newTicket = {
    id: newId,
    date: "Just now",
    submittedDate: "24 September 2026",
    title: titleInput.value.trim(),
    category: catInput.value,
    location: locInput.value.trim(),
    status: "Pending",
    description: descInput.value.trim()
  };

  requestsList.unshift(newTicket);

  try {
    await addDoc(collection(db, "service_requests"), {
      ...newTicket,
      userEmail: auth.currentUser ? auth.currentUser.email : "student@campus.edu",
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.error("Firestore save error:", err);
  }

  showModal(`
    <div class="modal-icon-circle">&#10003;</div>
    <h3>Report Submitted</h3>
    <p>Your report (${newId}) has been saved to Cloud Firestore. You can follow its progress in My Requests.</p>
    <button type="button" class="btn btn-primary" onclick="closeModal(); goToScreen('screen-requests');">Continue</button>
  `);
}

// Request Tracking & Details
function setRequestFilter(status, chipEl) {
  activeRequestFilter = status;
  document.querySelectorAll("#requestFilterChips .chip").forEach(c => c.classList.remove("active"));
  chipEl.classList.add("active");
  renderRequests();
}

function getStatusClass(status) {
  if (status === "Pending") return "status-pending";
  if (status === "In Progress") return "status-progress";
  return "status-resolved";
}

function renderRequests() {
  const container = document.getElementById("requestsListContainer");
  const queryText = document.getElementById("requestSearchInput").value.toLowerCase().trim();
  const subtitle = document.getElementById("requestCountSubtitle");

  const filtered = requestsList.filter(req => {
    const matchesStatus = activeRequestFilter === "All" || req.status === activeRequestFilter;
    const matchesQuery = req.id.toLowerCase().includes(queryText) || req.title.toLowerCase().includes(queryText);
    return matchesStatus && matchesQuery;
  });

  subtitle.textContent = `${filtered.length} service request${filtered.length === 1 ? "" : "s"}`;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="card" style="text-align:center; padding:28px 16px;">
        <h4>No requests found</h4>
        <p class="muted-sm">Try clearing your search or selecting All.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(req => `
    <div class="card">
      <p class="card-top-meta">${req.id} · ${req.date}</p>
      <h4>${req.title}</h4>
      <p class="muted-sm">${req.location}</p>
      <div class="card-footer-row">
        <span class="status-pill ${getStatusClass(req.status)}">&#9679; ${req.status}</span>
        <button type="button" class="link-btn-sm" onclick="openIssueDetails('${req.id}')">View Details</button>
      </div>
    </div>
  `).join("");
}

function openIssueDetails(requestId) {
  const req = requestsList.find(r => r.id === requestId);
  if (!req) return;

  document.getElementById("detailRequestIdSub").textContent = `Request ${req.id}`;
  const container = document.getElementById("issueDetailsContainer");

  let statusExplanation = "Your request has been received and is waiting to be assigned.";
  let completedCount = 1;

  if (req.status === "In Progress") {
    statusExplanation = "The facilities team is currently working on this issue.";
    completedCount = 3;
  } else if (req.status === "Resolved") {
    statusExplanation = "This issue has been resolved successfully.";
    completedCount = 4;
  }

  const steps = [
    { name: "Submitted", sub: completedCount >= 1 ? "Completed" : "Waiting" },
    { name: "Assigned", sub: completedCount >= 2 ? "Completed" : "Waiting" },
    { name: "In Progress", sub: req.status === "In Progress" ? "Current" : (completedCount > 3 ? "Completed" : "Not started") },
    { name: "Resolved", sub: completedCount === 4 ? "Completed" : "Not completed" }
  ];

  container.innerHTML = `
    <div class="card">
      <span class="eyebrow-blue">${req.id}</span>
      <h4>${req.title}</h4>
      <p class="muted-sm">${req.location}</p>
      <p class="muted-sm" style="margin:4px 0 10px;">Submitted ${req.submittedDate}</p>
      <span class="status-pill ${getStatusClass(req.status)}">&#9679; ${req.status}</span>
    </div>

    <div class="info-banner-blue">
      <strong>Current status · ${req.status}</strong>
      <p>${statusExplanation}</p>
    </div>

    <h3 class="section-heading">Description</h3>
    <p class="muted-sm" style="margin-bottom:14px;">${req.description}</p>

    <h3 class="section-heading">Request timeline</h3>
    <div class="timeline-list">
      ${steps.map((st, idx) => `
        <div class="timeline-step">
          <span class="step-circle ${idx < completedCount ? "done" : ""}">${idx < completedCount ? "&#10003;" : idx + 1}</span>
          <div>
            <strong style="font-size:13px; display:block;">${st.name}</strong>
            <span class="muted-sm">${st.sub}</span>
          </div>
        </div>
      `).join("")}
    </div>
  `;

  goToScreen("screen-issue-details");
}

// Lost & Found -> Saves to Firestore
function setLfFilter(filter, chipEl) {
  activeLfFilter = filter;
  document.querySelectorAll("#lfFilterChips .chip").forEach(c => c.classList.remove("active"));
  chipEl.classList.add("active");
  renderLostFound();
}

function renderLostFound() {
  const container = document.getElementById("lfListContainer");
  const queryText = document.getElementById("lfSearchInput").value.toLowerCase().trim();

  const filtered = lfList.filter(item => {
    const matchesFilter =
      activeLfFilter === "All" ||
      item.type === activeLfFilter ||
      item.category === activeLfFilter;
    const matchesQuery =
      item.name.toLowerCase().includes(queryText) ||
      item.location.toLowerCase().includes(queryText);
    return matchesFilter && matchesQuery;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="card" style="text-align:center; padding:24px;">
        <h4>No items found</h4>
        <p class="muted-sm">No matching lost or found items.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(item => `
    <div class="service-row-card" onclick="openLfItemModal('${item.id}')">
      <span class="service-icon-box">${item.category === "Electronics" ? "&#127911;" : "&#128188;"}</span>
      <div class="card-flex-body">
        <h4>${item.name}</h4>
        <p class="muted-sm">${item.location}</p>
        <span class="blue-text-sm">${item.type} · ${item.dateText}</span>
      </div>
    </div>
  `).join("");
}

function openLfItemModal(itemId) {
  const item = lfList.find(i => i.id === itemId);
  if (!item) return;

  showModal(`
    <div class="modal-icon-circle">i</div>
    <h3>${item.name}</h3>
    <p>${item.type} · ${item.location}\n${item.dateText}\n\n${item.description}</p>
    <div class="modal-btn-stack">
      <button type="button" class="btn btn-primary" onclick="closeModal(); goToScreen('screen-help');">Contact Support</button>
      <button type="button" class="link-btn" onclick="closeModal()">Close</button>
    </div>
  `);
}

function setLfPostType(type) {
  lfPostType = type;
  document.getElementById("typeLostBtn").classList.toggle("active", type === "Lost");
  document.getElementById("typeFoundBtn").classList.toggle("active", type === "Found");
}

async function handleCreateLfPost(event) {
  event.preventDefault();
  const nameInput = document.getElementById("lfItemName");
  const locInput = document.getElementById("lfLocation");
  const descInput = document.getElementById("lfDescription");
  const catInput = document.getElementById("lfCategory");
  const dateInput = document.getElementById("lfDate");

  if (!nameInput.value.trim() || !locInput.value.trim() || !descInput.value.trim()) {
    document.getElementById("lfNameError").textContent = !nameInput.value.trim() ? "Item name is required." : "";
    document.getElementById("lfLocationError").textContent = !locInput.value.trim() ? "Location is required." : "";
    document.getElementById("lfDescError").textContent = !descInput.value.trim() ? "Description is required." : "";
    return;
  }

  const newPost = {
    id: "LF-" + (lfList.length + 1),
    name: nameInput.value.trim(),
    type: lfPostType,
    category: catInput.value,
    location: locInput.value.trim(),
    dateText: dateInput.value,
    description: descInput.value.trim()
  };

  lfList.unshift(newPost);

  try {
    await addDoc(collection(db, "lost_found_items"), {
      ...newPost,
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.error("Firestore Lost & Found error:", err);
  }

  showModal(`
    <div class="modal-icon-circle">&#10003;</div>
    <h3>Post published</h3>
    <p>Your Lost &amp; Found post has been saved to Cloud Firestore and is now visible to other students.</p>
    <button type="button" class="btn btn-primary" onclick="closeModal(); goToScreen('screen-lost-found');">Continue</button>
  `);
}

// Campus Services, Events, Notifications, Feedback, Help & Modals
function filterServicesList() {
  const queryText = document.getElementById("serviceSearchInput").value.toLowerCase().trim();
  document.querySelectorAll("#servicesDirectoryList .service-row-card").forEach(card => {
    const text = card.innerText.toLowerCase();
    card.style.display = text.includes(queryText) ? "flex" : "none";
  });
}

function setEventFilter(cat, chipEl) {
  activeEventFilter = cat;
  document.querySelectorAll("#eventCategoryChips .chip").forEach(c => c.classList.remove("active"));
  chipEl.classList.add("active");
  renderEvents();
}

function renderEvents() {
  const container = document.getElementById("eventsListContainer");
  const queryText = document.getElementById("eventSearchInput").value.toLowerCase().trim();

  const filtered = campusEvents.filter(ev => {
    const matchesCat = activeEventFilter === "All" || ev.category === activeEventFilter;
    const matchesQuery = ev.title.toLowerCase().includes(queryText) || ev.location.toLowerCase().includes(queryText);
    return matchesCat && matchesQuery;
  });

  container.innerHTML = filtered.map(ev => `
    <div class="event-mini-card" onclick="openEventDetails('${ev.id}')">
      <div class="date-pill-sm">
        <strong>${ev.day}</strong>
        <span>${ev.month}</span>
      </div>
      <div class="card-flex-body">
        <h4>${ev.title}</h4>
        <p class="muted-sm">${ev.fullDate} · ${ev.time.split("–")[0]}</p>
      </div>
      <span class="chevron">&#8250;</span>
    </div>
  `).join("");
}

function openEventDetails(eventId) {
  const ev = campusEvents.find(e => e.id === eventId);
  if (!ev) return;

  document.getElementById("eventDetailsContainer").innerHTML = `
    <div class="event-hero-box">
      <div class="date-pill-sm">
        <strong>${ev.day}</strong>
        <span>${ev.month}</span>
      </div>
      <span class="blue-text-sm">${ev.fullDate}</span>
      <h2 style="font-size:20px; margin:4px 0;">${ev.title}</h2>
      <p class="muted-sm">${ev.tagLine}</p>
    </div>

    <h3 class="section-heading">Event Information</h3>
    <div class="card"><p class="muted-sm">Date</p><strong>${ev.fullDate}</strong></div>
    <div class="card"><p class="muted-sm">Time</p><strong>${ev.time}</strong></div>
    <div class="card"><p class="muted-sm">Location</p><strong>${ev.location}</strong></div>

    <h3 class="section-heading">About this event</h3>
    <p class="muted-sm">${ev.about}</p>
  `;

  goToScreen("screen-event-details");
}

function renderNotifications() {
  const container = document.getElementById("notificationsListContainer");
  const unreadCount = notificationsList.filter(n => n.unread).length;
  const dot = document.getElementById("homeNotifDot");
  if (dot) dot.style.display = unreadCount > 0 ? "block" : "none";

  container.innerHTML = notificationsList.map(n => `
    <div class="notif-card ${n.unread ? "unread" : ""}" onclick="readNotification('${n.id}')">
      <h4 style="font-size:14px;">${n.unread ? "&#9679; " : ""}${n.title}</h4>
      <p class="muted-sm" style="margin:4px 0;">${n.body}</p>
      <span style="font-size:11px; color:#6B7280;">${n.time}</span>
    </div>
  `).join("");
}

function readNotification(id) {
  const item = notificationsList.find(n => n.id === id);
  if (item) {
    item.unread = false;
    goToScreen(item.targetScreen);
  }
}

function markAllNotificationsRead() {
  notificationsList.forEach(n => (n.unread = false));
  renderNotifications();
}

function setRating(val) {
  selectedRating = val;
  document.querySelectorAll("#ratingScale .rate-btn").forEach((btn, idx) => {
    btn.classList.toggle("active", idx + 1 === val);
  });
}

async function handleFeedbackSubmit(event) {
  event.preventDefault();
  const comments = document.getElementById("fbComments");
  const err = document.getElementById("fbCommentsError");

  if (!comments.value.trim()) {
    err.textContent = "Please enter your comments before submitting.";
    comments.classList.add("input-error");
    return;
  }
  err.textContent = "";
  comments.classList.remove("input-error");

  try {
    await addDoc(collection(db, "feedback_entries"), {
      service: document.getElementById("fbService").value,
      rating: selectedRating,
      category: document.getElementById("fbCategory").value,
      comments: comments.value.trim(),
      suggestions: document.getElementById("fbSuggestions").value.trim(),
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.error("Firestore feedback error:", err);
  }

  showModal(`
    <div class="modal-icon-circle">&#10003;</div>
    <h3>Thank you</h3>
    <p>Thank you. Your feedback (${selectedRating}/5) has been recorded in Cloud Firestore.</p>
    <button type="button" class="btn btn-primary" onclick="closeModal(); goToScreen('screen-profile');">Done</button>
  `);
}

function toggleFaq(cardEl) {
  cardEl.classList.toggle("open");
}

async function handleSupportSubmit(event) {
  event.preventDefault();
  const name = document.getElementById("supName");
  const email = document.getElementById("supEmail");
  const cat = document.getElementById("supCategory");
  const q = document.getElementById("supQuestion");

  document.getElementById("supNameError").textContent = !name.value.trim() ? "Please enter your name." : "";
  document.getElementById("supEmailError").textContent = !email.value.includes("@") ? "Please enter a valid email." : "";
  document.getElementById("supCategoryError").textContent = !cat.value ? "Please choose a category." : "";
  document.getElementById("supQuestionError").textContent = !q.value.trim() ? "Please enter your question." : "";

  if (!name.value.trim() || !email.value.includes("@") || !cat.value || !q.value.trim()) {
    return;
  }

  try {
    await addDoc(collection(db, "support_tickets"), {
      name: name.value.trim(),
      email: email.value.trim(),
      category: cat.value,
      question: q.value.trim(),
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.error("Firestore support error:", err);
  }

  q.value = "";
  showModal(`
    <div class="modal-icon-circle">&#10003;</div>
    <h3>Support request submitted</h3>
    <p>Support request submitted. We received your question and will respond by email.</p>
    <button type="button" class="btn btn-primary" onclick="closeModal()">Done</button>
  `);
}

function showModal(innerHtml) {
  document.getElementById("modalCard").innerHTML = innerHtml;
  document.getElementById("modalBackdrop").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("modalBackdrop").classList.add("hidden");
}

function openInfoModal(title, message) {
  showModal(`
    <div class="modal-icon-circle">i</div>
    <h3>${title}</h3>
    <p>${message}</p>
    <div class="modal-btn-stack">
      <button type="button" class="btn btn-primary" onclick="closeModal()">Done</button>
      <button type="button" class="link-btn" onclick="closeModal(); goToScreen('screen-help');">Contact Support</button>
    </div>
  `);
}

function openLogoutModal() {
  showModal(`
    <div class="modal-icon-circle">i</div>
    <h3>Log out?</h3>
    <p>You can sign in again anytime to access campus services.</p>
    <div class="modal-btn-stack">
      <button type="button" class="btn btn-primary" onclick="confirmFirebaseLogout()">Log Out</button>
      <button type="button" class="link-btn" onclick="closeModal()">Cancel</button>
    </div>
  `);
}

async function confirmFirebaseLogout() {
  try {
    await signOut(auth);
  } catch (e) {}
  closeModal();
  goToScreen("screen-login");
}

function toggleOfflineMode() {
  document.getElementById("offlineBanner").classList.toggle("hidden");
}

// Expose functions globally for HTML onclick handlers
Object.assign(window, {
  goToScreen,
  goBack,
  setOnboardingStep,
  togglePasswordVisibility,
  handleLogin,
  openPhotoOverlay,
  attachSamplePhoto,
  handleReportSubmit,
  setRequestFilter,
  renderRequests,
  openIssueDetails,
  setLfFilter,
  renderLostFound,
  openLfItemModal,
  setLfPostType,
  handleCreateLfPost,
  filterServicesList,
  setEventFilter,
  renderEvents,
  openEventDetails,
  renderNotifications,
  readNotification,
  markAllNotificationsRead,
  setRating,
  handleFeedbackSubmit,
  toggleFaq,
  handleSupportSubmit,
  closeModal,
  openInfoModal,
  openLogoutModal,
  confirmFirebaseLogout,
  toggleOfflineMode
});

// Initialize views
renderHomeActiveRequest();
renderRequests();
renderLostFound();
renderEvents();
renderNotifications();