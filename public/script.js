// script.js (Complete Redesign with All Tier 1 Features and Audio Permission)

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const alertsList = document.getElementById('alerts-list');
    const totalCasesEl = document.getElementById('total-cases');
    const processingCasesEl = document.getElementById('processing-cases');
    const solvedCasesEl = document.getElementById('solved-cases');
    const filterTabs = document.querySelector('.filter-tabs');
    const mapModal = document.getElementById('map-modal');
    const closeModalBtn = document.querySelector('.close-modal-btn');
    const modalDirectionsBtn = document.getElementById('modal-directions-btn');
    const incidentNotesEl = document.getElementById('incident-notes');
    const saveNotesBtn = document.getElementById('save-notes-btn');
    // NEW: Added elements for audio permission
    const enableAudioBtn = document.getElementById('enable-audio-btn');
    const audioBanner = document.getElementById('audio-permission-banner');

    // --- State Variables ---
    const SERVER_URL = 'http://localhost:3000';
    let allAlerts = [];
    let activeFilter = 'Pending';
    let map; 
    let marker; 

    let previousPendingCount = 0;
    let isFlashing = false;
    const originalTitle = document.title;
    const alertSound = new Audio('alert.mp3');

    // --- Map Initialization ---
    function initializeMap() {
        if (map) return;
        map = L.map('map').setView([20.5937, 78.9629], 5);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        marker = L.marker([0, 0]).addTo(map);
    }

    // --- Data Fetching and Processing ---
    async function fetchData() {
        try {
            const response = await fetch(`${SERVER_URL}/api/alerts`);
            allAlerts = await response.json();
            
            const currentPendingCount = allAlerts.filter(a => a.status === 'Pending').length;
            if (currentPendingCount > previousPendingCount) {
                alertSound.play().catch(e => console.error("Audio play failed:", e));
                startTitleFlashing();
            }
            previousPendingCount = currentPendingCount;

            updateDashboard();
        } catch (error) {
            console.error('Failed to fetch alerts:', error);
            alertsList.innerHTML = '<p>Could not load alerts.</p>';
        }
    }
    
    function startTitleFlashing() {
        if (isFlashing) return;
        isFlashing = true;
        const flashInterval = setInterval(() => {
            document.title = document.title === originalTitle ? `🚨 NEW ALERT! 🚨` : originalTitle;
        }, 1000);

        window.addEventListener('focus', () => {
            clearInterval(flashInterval);
            document.title = originalTitle;
            isFlashing = false;
        }, { once: true });
    }

    // --- Update UI Functions ---
    function updateDashboard() {
        updateStats();
        renderAlerts();
    }

    function updateStats() {
        const processingCount = allAlerts.filter(a => a.status === 'Processing').length;
        const solvedCount = allAlerts.filter(a => a.status === 'Solved').length;
        totalCasesEl.textContent = allAlerts.length;
        processingCasesEl.textContent = processingCount;
        solvedCasesEl.textContent = solvedCount;
    }

    function renderAlerts() {
        alertsList.innerHTML = '';
        const filteredAlerts = allAlerts.filter(alert => alert.status === activeFilter);
        
        if (filteredAlerts.length === 0) {
            alertsList.innerHTML = `<p>No cases found with status: ${activeFilter}.</p>`;
            return;
        }

        filteredAlerts.forEach(alert => {
            const card = createAlertCard(alert);
            alertsList.appendChild(card);
        });
    }

    // --- Alert Card Creation ---
    function createAlertCard(alert) {
        const card = document.createElement('div');
        card.className = 'alert-card';
        card.dataset.alertId = alert._id;
        card.dataset.lat = alert.location.latitude;
        card.dataset.lng = alert.location.longitude;
        card.classList.add(`status-${alert.status.toLowerCase()}`);

        const phoneIcon = `<svg viewBox="0 0 24 24"><path d="M6.62,10.79C8.06,13.62 10.38,15.94 13.21,17.38L15.41,15.18C15.69,14.9 16.08,14.82 16.43,14.93C17.55,15.3 18.75,15.5 20,15.5A1,1 0 0,1 21,16.5V20A1,1 0 0,1 20,21A17,17 0 0,1 3,4A1,1 0 0,1 4,3H7.5A1,1 0 0,1 8.5,4C8.5,5.25 8.7,6.45 9.07,7.57C9.18,7.92 9.1,8.31 8.82,8.59L6.62,10.79Z"></path></svg>`;
        const bloodIcon = `<svg viewBox="0 0 24 24"><path d="M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9A7,7 0 0,0 12,2M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5Z"></path></svg>`;
        const batteryIcon = `<svg viewBox="0 0 24 24"><path d="M16.67,4H15V2H9V4H7.33A1.33,1.33 0 0,0 6,5.33V20.67C6,21.4 6.6,22 7.33,22H16.67A1.33,1.33 0 0,0 18,20.67V5.33C18,4.6 17.4,4 16.67,4Z"></path></svg>`;
        const medicalIcon = `<svg viewBox="0 0 24 24"><path d="M19,3H5C3.89,3 3,3.89 3,5V19C3,20.11 3.89,21 5,21H19C20.11,21 21,20.11 21,19V5C21,3.89 20.11,3 19,3M19,19H5V5H19V19M13,17H11V14H8V12H11V9H13V12H16V14H13V17Z"></path></svg>`;
        const medicalIssueHTML = alert.currentmedicalissue ? `<div class="card-medical-issue">${medicalIcon}<span>${alert.currentmedicalissue}</span></div>` : '';

        card.innerHTML = `
            <div class="card-header">
                <h3>${alert.name}, ${alert.age}</h3>
                <select class="priority-select">
                    <option value="Low" ${alert.priority === 'Low' ? 'selected' : ''}>Low</option>
                    <option value="Medium" ${alert.priority === 'Medium' ? 'selected' : ''}>Medium</option>
                    <option value="High" ${alert.priority === 'High' ? 'selected' : ''}>High</option>
                    <option value="Critical" ${alert.priority === 'Critical' ? 'selected' : ''}>Critical</option>
                </select>
            </div>
            ${medicalIssueHTML}
            <div class="card-details">
                <div class="detail-item">${phoneIcon}<span>${alert.phone}</span></div>
                <div class="detail-item">${batteryIcon}<span>${alert.phoneBattery}%</span></div>
                <div class="detail-item">${bloodIcon}<span>${alert.bloodGroup}</span></div>
            </div>
            <p class="card-message">"${alert.message}"</p>
            <div class="card-actions">
                <select class="status-select">
                    <option value="Pending" ${alert.status === 'Pending' ? 'selected' : ''}>Pending</option>
                    <option value="Processing" ${alert.status === 'Processing' ? 'selected' : ''}>Processing</option>
                    <option value="Solved" ${alert.status === 'Solved' ? 'selected' : ''}>Solved</option>
                </select>
            </div>`;

        const prioritySelect = card.querySelector('.priority-select');
        prioritySelect.classList.add(`priority-${(alert.priority || 'medium').toLowerCase()}`);

        return card;
    }
    
    async function updateStatus(alertId, newStatus) {
        try {
            await fetch(`${SERVER_URL}/api/alert/${alertId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            fetchData();
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    }

    // --- Event Listeners ---

    // NEW LISTENER: For the "Enable Sound Alerts" button
    enableAudioBtn.addEventListener('click', () => {
        // Play and immediately pause the sound. This is enough to get permission.
        alertSound.play().catch(e => {});
        alertSound.pause();
        alertSound.currentTime = 0;

        // Hide the button after it's been clicked
        audioBanner.style.display = 'none';
        
        console.log('Audio alerts enabled.');
    });

    filterTabs.addEventListener('click', (event) => {
        if (event.target.tagName === 'BUTTON') {
            document.querySelector('.tab-btn.active').classList.remove('active');
            event.target.classList.add('active');
            activeFilter = event.target.dataset.status;
            renderAlerts();
        }
    });

    alertsList.addEventListener('click', (event) => {
        const card = event.target.closest('.alert-card');
        if (!card) return;
        
        if (event.target.classList.contains('status-select') || event.target.classList.contains('priority-select')) {
            return;
        }

        const alertId = card.dataset.alertId;
        const selectedAlert = allAlerts.find(a => a._id == alertId);
        if (!selectedAlert) return;

        incidentNotesEl.value = selectedAlert.notes || '';
        saveNotesBtn.dataset.alertId = alertId;

        const lat = parseFloat(card.dataset.lat);
        const lng = parseFloat(card.dataset.lng);
        
        modalDirectionsBtn.href = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        
        mapModal.classList.add('visible');
        initializeMap();
        
        setTimeout(() => {
            map.invalidateSize();
            map.setView([lat, lng], 15);
            marker.setLatLng([lat, lng]);
        }, 10);
    });
    
    alertsList.addEventListener('change', async (event) => {
        const card = event.target.closest('.alert-card');
        if (!card) return;
        const alertId = card.dataset.alertId;
    
        if (event.target.classList.contains('priority-select')) {
            const newPriority = event.target.value;
            try {
                await fetch(`${SERVER_URL}/api/alert/priority/${alertId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ priority: newPriority })
                });
                event.target.className = 'priority-select';
                event.target.classList.add(`priority-${newPriority.toLowerCase()}`);
            } catch (error) {
                console.error('Failed to update priority:', error);
            }
        }
    
        if (event.target.classList.contains('status-select')) {
            const newStatus = event.target.value;
            updateStatus(alertId, newStatus);
        }
    });

    closeModalBtn.addEventListener('click', () => {
        mapModal.classList.remove('visible');
    });

    saveNotesBtn.addEventListener('click', async function() {
        const alertId = this.dataset.alertId;
        const notes = incidentNotesEl.value;
    
        try {
            await fetch(`${SERVER_URL}/api/alert/notes/${alertId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notes: notes })
            });
            const alertToUpdate = allAlerts.find(a => a._id == alertId);
            if (alertToUpdate) alertToUpdate.notes = notes;
            alert('Notes saved!');
        } catch (error) {
            console.error('Failed to save notes:', error);
            alert('Error saving notes.');
        }
    });

    // --- Initial Load ---
    fetchData();
    setInterval(fetchData, 10000);
});