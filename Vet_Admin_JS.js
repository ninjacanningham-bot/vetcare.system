// Modal logic
const openModalBtn = document.getElementById('openModal');
const closeModalBtn = document.getElementById('closeModal');
const staffModal = document.getElementById('staffModal');
const staffForm = document.getElementById('staffForm');
const staffCards = document.getElementById('staffCards');
const searchBar = document.getElementById('searchBar');

// Navigation
const navBtns = document.querySelectorAll('.nav-btn');
navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        navBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const sections = document.querySelectorAll('main > section');
        sections.forEach(sec => sec.style.display = 'none');
        if (btn.textContent === 'Add Staff') {
            document.querySelector('.staff-section').style.display = 'block';
        } else if (btn.textContent === 'Excel Log') {
            document.querySelector('.excel-log-section').style.display = 'block';
            loadExcelLog();
            updateLastExtractionInfoDisplay();
        } else if (btn.textContent === 'Log Staff') {
            // Placeholder for Log Staff section
        }
    });
});

// Real-time search functionality
searchBar.addEventListener('input', function() {
    renderStaffCards();
});
const ageInput = document.getElementById('age');
const birthDateInput = document.getElementById('birthDate');

openModalBtn.onclick = () => staffModal.style.display = 'flex';
closeModalBtn.onclick = () => staffModal.style.display = 'none';
window.onclick = (e) => { if (e.target === staffModal) staffModal.style.display = 'none'; };

// Calculate age from birthdate
defaultAge();
birthDateInput.addEventListener('input', function() {
    const birthDate = new Date(this.value);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    ageInput.value = isNaN(age) ? '' : age;
});
function defaultAge() { ageInput.value = ''; }

// Staff data array
let staffList = [];
let selectedStaffIndex = null;
let deleteCountdownTimer = null;

// Load staff from localStorage on page load
function loadStaffFromStorage() {
    const stored = localStorage.getItem('vetStaffList');
    if (stored) {
        staffList = JSON.parse(stored);
        renderStaffCards();
    }
}

// Save staff to localStorage
function saveStaffToStorage() {
    localStorage.setItem('vetStaffList', JSON.stringify(staffList));
}

// Initialize
loadStaffFromStorage();

// Handle form submit
// Defined later to support both new staff creation and edit mode.


function addStaffCard({ fullName, gender, cellNumber, profileImageURL, birthDate, age, address, gmail, password }) {
    staffList.push({ fullName, gender, cellNumber, profileImageURL, birthDate, age, address, gmail, password });
    saveStaffToStorage();
    renderStaffCards();
}


function renderStaffCards() {
    staffCards.innerHTML = '';
    const filter = searchBar.value.toLowerCase();
    const filtered = staffList.filter(staff =>
        staff.fullName.toLowerCase().includes(filter) ||
        staff.cellNumber.includes(filter) ||
        (staff.gender && staff.gender.toLowerCase().includes(filter))
    );
    
    if (filtered.length === 0) {
        staffCards.innerHTML = `
            <div class="empty-state">
                <i class="fa fa-user-md"></i>
                <p>${searchBar.value ? 'No staff found matching your search.' : 'No staff added yet. Click + to add your first staff member.'}</p>
            </div>
        `;
        return;
    }
    
    filtered.forEach((staff, idx) => {
        const actualIndex = staffList.indexOf(staff);
        const card = document.createElement('div');
        card.className = 'staff-card';
        card.onclick = () => openInfoModal(actualIndex);
        const profilePic = document.createElement('div');
        profilePic.className = 'profile-pic';
        if (staff.profileImageURL) {
            const img = document.createElement('img');
            img.src = staff.profileImageURL;
            img.className = 'profile-pic';
            img.alt = 'Profile';
            profilePic.appendChild(img);
        } else {
            profilePic.innerHTML = '<i class="fa fa-user" style="font-size:2.5rem;color:#888;"></i>';
        }
        const info = document.createElement('div');
        info.className = 'staff-info';
        info.innerHTML = `<div>${staff.fullName}</div><div>${staff.cellNumber}</div>`;
        card.appendChild(profilePic);
        card.appendChild(info);
        staffCards.appendChild(card);
    });
}


// Info Modal Logic
const infoModal = document.getElementById('infoModal');
const closeInfoModalBtn = document.getElementById('closeInfoModal');
const infoProfilePic = document.getElementById('infoProfilePic');
const infoDetails = document.getElementById('infoDetails');
const editStaffBtn = document.getElementById('editStaffBtn');
const deleteStaffBtn = document.getElementById('deleteStaffBtn');

function openInfoModal(idx) {
    selectedStaffIndex = idx;
    const staff = staffList[idx];
    infoProfilePic.innerHTML = '';
    if (staff.profileImageURL) {
        const img = document.createElement('img');
        img.src = staff.profileImageURL;
        img.className = 'profile-pic large';
        img.alt = 'Profile';
        infoProfilePic.appendChild(img);
    } else {
        infoProfilePic.textContent = '👤';
    }
    infoDetails.innerHTML = `
        <strong>Name:</strong> ${staff.fullName}<br>
        <strong>Gender:</strong> ${staff.gender || ''}<br>
        <strong>Birth Date:</strong> ${staff.birthDate || ''}<br>
        <strong>Age:</strong> ${staff.age || ''}<br>
        <strong>Address:</strong> ${staff.address || ''}<br>
        <strong>Cell Number:</strong> ${staff.cellNumber}<br>
        <strong>Gmail:</strong> ${staff.gmail || ''}<br>
    `;
    infoModal.style.display = 'flex';
}
closeInfoModalBtn.onclick = () => infoModal.style.display = 'none';
window.addEventListener('click', (e) => {
    if (e.target === infoModal) infoModal.style.display = 'none';
    if (e.target === deleteModal) deleteModal.style.display = 'none';
});

// Edit Staff
editStaffBtn.onclick = () => {
    if (selectedStaffIndex !== null) {
        const staff = staffList[selectedStaffIndex];
        // Populate form with existing data
        document.getElementById('fullName').value = staff.fullName;
        document.getElementById('gender').value = staff.gender || '';
        document.getElementById('birthDate').value = staff.birthDate || '';
        document.getElementById('age').value = staff.age || '';
        document.getElementById('address').value = staff.address || '';
        document.getElementById('cellNumber').value = staff.cellNumber;
        document.getElementById('gmail').value = staff.gmail || '';
        document.getElementById('password').value = staff.password || '';
        // Change form to edit mode
        document.getElementById('formTitle').textContent = 'Edit Staff';
        document.getElementById('formSubmitBtn').textContent = 'Update Staff';
        // Store edit index
        staffForm.dataset.editIndex = selectedStaffIndex;
        // Close info modal and open add modal
        infoModal.style.display = 'none';
        staffModal.style.display = 'flex';
    }
};

// Delete Staff
const deleteModal = document.getElementById('deleteModal');
const closeDeleteModalBtn = document.getElementById('closeDeleteModal');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const deleteCountdown = document.getElementById('deleteCountdown');

deleteStaffBtn.onclick = () => {
    if (selectedStaffIndex !== null) {
        startDeleteCountdown();
        deleteModal.style.display = 'flex';
    }
};

closeDeleteModalBtn.onclick = () => {
    stopDeleteCountdown();
    deleteModal.style.display = 'none';
};
cancelDeleteBtn.onclick = () => {
    stopDeleteCountdown();
    deleteModal.style.display = 'none';
};

function startDeleteCountdown() {
    let seconds = 5;
    confirmDeleteBtn.disabled = true;
    confirmDeleteBtn.style.opacity = '0.6';
    confirmDeleteBtn.style.cursor = 'not-allowed';
    deleteCountdown.textContent = seconds;
    
    // Visual countdown effect
    confirmDeleteBtn.innerHTML = `Yes (<span id="deleteCountdown" style="font-weight:bold;color:#fff;">${seconds}</span>)`;
    const countdownSpan = confirmDeleteBtn.querySelector('#deleteCountdown');
    
    deleteCountdownTimer = setInterval(() => {
        seconds--;
        if (countdownSpan) countdownSpan.textContent = seconds;
        
        if (seconds <= 0) {
            clearInterval(deleteCountdownTimer);
            confirmDeleteBtn.disabled = false;
            confirmDeleteBtn.style.opacity = '1';
            confirmDeleteBtn.style.cursor = 'pointer';
            confirmDeleteBtn.innerHTML = 'Yes';
        }
    }, 1000);
}
function stopDeleteCountdown() {
    clearInterval(deleteCountdownTimer);
    confirmDeleteBtn.disabled = true;
    confirmDeleteBtn.style.opacity = '0.6';
    confirmDeleteBtn.style.cursor = 'not-allowed';
    confirmDeleteBtn.innerHTML = 'Yes (<span id="deleteCountdown">5</span>)';
}

confirmDeleteBtn.onclick = () => {
    if (selectedStaffIndex !== null && !confirmDeleteBtn.disabled) {
        staffList.splice(selectedStaffIndex, 1);
        saveStaffToStorage();
        renderStaffCards();
        infoModal.style.display = 'none';
        deleteModal.style.display = 'none';
        stopDeleteCountdown();
    }
};

// Excel Log
const EXCEL_LOG_KEY = 'vetExcelLogEntries';
let excelLogEntries = [];

function readExcelLogStorage() {
    try {
        const stored = localStorage.getItem(EXCEL_LOG_KEY);
        const parsed = stored ? JSON.parse(stored) : null;
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        console.warn('Failed to read Excel log from storage', e);
        return [];
    }
}

function writeExcelLogStorage(entries) {
    localStorage.setItem(EXCEL_LOG_KEY, JSON.stringify(entries));
}

function refreshExcelLogFromStorage() {
    excelLogEntries = readExcelLogStorage();
    renderExcelLog();
}

function clearExcelLog() {
    excelLogEntries = [];
    writeExcelLogStorage(excelLogEntries);
    renderExcelLog();
}

function loadExcelLog() {
    refreshExcelLogFromStorage();
}

function getLastExtractionInfo() {
    try {
        const raw = localStorage.getItem('vetLastExtractionInfo');
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        console.warn('Failed to read last extraction info', e);
        return null;
    }
}

function setLastExtractionInfo(timestamp) {
    const info = { message: 'Last Extraction', timestamp };
    localStorage.setItem('vetLastExtractionInfo', JSON.stringify(info));
    updateLastExtractionInfoDisplay();
}

function updateLastExtractionInfoDisplay() {
    const info = getLastExtractionInfo();
    const el = document.getElementById('lastExtractionInfo');
    if (!el) return;
    if (info && info.timestamp) {
        el.textContent = `${info.message} - ${info.timestamp}`;
        el.style.display = 'block';
    } else {
        el.style.display = 'none';
    }
}

function renderExcelLog() {
    const tbody = document.getElementById('excelLogTableBody');
    tbody.innerHTML = '';
    const searchTerm = document.getElementById('excelSearchInput').value.toLowerCase();
    const filterType = document.getElementById('excelFilterSelect').value;
    
    let filteredEntries = excelLogEntries.filter(entry => {
        // Search filter
        const matchesSearch = searchTerm === '' || 
            entry.ownerName.toLowerCase().includes(searchTerm) ||
            entry.cellNumber.includes(searchTerm) ||
            entry.dateLogged.includes(searchTerm) ||
            entry.address.toLowerCase().includes(searchTerm);
        
        if (!matchesSearch) return false;
        
        // Type filter
        if (filterType === 'owner') {
            return entry.ownerName.toLowerCase().includes(searchTerm);
        } else if (filterType === 'cell') {
            return entry.cellNumber.includes(searchTerm);
        } else if (filterType === 'date') {
            return entry.dateLogged.includes(searchTerm);
        }
        
        return true;
    });
    
    filteredEntries.forEach((entry, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${entry.dateLogged}</td>
            <td>${entry.ownerName}</td>
            <td>${entry.cellNumber}</td>
            <td>${entry.birthDate}</td>
            <td>${entry.address}</td>
            <td>${entry.ownerCode || entry.zipCode || ''}</td>
            <td>${entry.petName || ''}</td>
            <td>${entry.liveStock}</td>
            <td>${entry.sex}</td>
            <td>${entry.saveDate || ''}</td>
            <td>${entry.symptoms}</td>
            <td>${entry.medication}</td>
        `;
        tbody.appendChild(row);
    });
    
    if (filteredEntries.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="13" style="text-align: center; color: #999; padding: 20px;">No records found</td>';
        tbody.appendChild(row);
    }
}

document.getElementById('deleteAllBtn').addEventListener('click', () => {
    if (confirm('Are you sure you want to delete all Excel Log entries?')) {
        const deleteBtn = document.getElementById('deleteAllBtn');
        const exportBtn = document.getElementById('exportBtn');
        deleteBtn.disabled = true;
        exportBtn.disabled = true;
        
        try {
            // Atomic delete: clear the shared storage key
            localStorage.removeItem(EXCEL_LOG_KEY);
            excelLogEntries = [];
            renderExcelLog();
            alert('All Excel Log entries have been permanently deleted.');
        } finally {
            deleteBtn.disabled = false;
            exportBtn.disabled = false;
        }
    }
});

document.getElementById('exportBtn').addEventListener('click', () => {
    exportToExcel();
});

document.getElementById('excelSearchInput').addEventListener('input', () => {
    renderExcelLog();
});

document.getElementById('excelFilterSelect').addEventListener('change', () => {
    renderExcelLog();
});

window.addEventListener('storage', (event) => {
    if (event.key === EXCEL_LOG_KEY) {
        excelLogEntries = event.newValue ? JSON.parse(event.newValue) : [];
        renderExcelLog();
    }
    if (event.key === 'vetLastExtractionInfo') {
        updateLastExtractionInfoDisplay();
    }
});

// CSV Preview Modal
const csvPreviewModal = document.getElementById('csvPreviewModal');
const closeCsvPreviewModalBtn = document.getElementById('closeCsvPreviewModal');
const confirmCsvExportBtn = document.getElementById('confirmCsvExportBtn');
const cancelCsvExportBtn = document.getElementById('cancelCsvExportBtn');
const csvPreviewContent = document.getElementById('csvPreviewContent');

closeCsvPreviewModalBtn.onclick = () => csvPreviewModal.style.display = 'none';
cancelCsvExportBtn.onclick = () => csvPreviewModal.style.display = 'none';
window.addEventListener('click', (e) => {
    if (e.target === csvPreviewModal) csvPreviewModal.style.display = 'none';
});

let currentCsvData = '';

confirmCsvExportBtn.onclick = () => {
    if (currentCsvData) {
        const blob = new Blob([currentCsvData], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'pet_notes_export.csv';
        a.click();
        window.URL.revokeObjectURL(url);
        csvPreviewModal.style.display = 'none';
    }
};

// Function to read owners from localStorage
function readOwnersFromStorage() {
    try {
        const stored = localStorage.getItem('vetOwners');
        const parsed = stored ? JSON.parse(stored) : null;
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        console.warn('Failed to read owners from storage', e);
        return [];
    }
}

// Function to generate CSV from owners data
function generateCsvFromOwners() {
    const owners = readOwnersFromStorage();
    const rows = [];
    let maxNotes = 0;

    // Collect all pet data and find max notes
    owners.forEach(owner => {
        if (!Array.isArray(owner.pets)) return;
        owner.pets.forEach(pet => {
            if (!Array.isArray(pet.notes)) pet.notes = [];
            // Sort notes by createdAt timestamp
            pet.notes.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
            maxNotes = Math.max(maxNotes, pet.notes.length);
            rows.push({
                ownerName: owner.name,
                petName: pet.name,
                notes: pet.notes
            });
        });
    });

    // Generate headers
    const headers = ['Owner Name', 'Pet Name'];
    for (let i = 1; i <= maxNotes; i++) {
        headers.push(`Note ${i}`);
    }

    // Generate CSV content
    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
        const csvRow = [
            `"${row.ownerName}"`,
            `"${row.petName}"`
        ];
        for (let i = 0; i < maxNotes; i++) {
            const note = row.notes[i];
            if (note) {
                // Flatten note content: symptoms + medicines
                const symptoms = Array.isArray(note.symptoms) ? note.symptoms.join('; ') : '';
                const medicines = [];
                if (note.medicines) {
                    ['Antibiotics', 'Vitamins', 'Others'].forEach(cat => {
                        if (Array.isArray(note.medicines[cat])) {
                            medicines.push(...note.medicines[cat]);
                        }
                    });
                }
                const medicineStr = medicines.join('; ');
                const noteContent = `${symptoms}${symptoms && medicineStr ? ' | ' : ''}${medicineStr}`;
                csvRow.push(`"${noteContent.replace(/"/g, '""')}"`);
            } else {
                csvRow.push('""');
            }
        }
        csv += csvRow.join(',') + '\n';
    });

    return csv;
}

// ATOMIC EXPORT FUNCTION
// Performs an atomic read from the shared storage key
// Each note is a separate row; symptoms/medications are not concatenated
// Export preview is shown before download to confirm the data
function exportToExcel() {
    // Disable export button to prevent race conditions
    document.getElementById('exportBtn').disabled = true;
    
    try {
        // Read latest entries from storage (atomic read)
        const latestEntries = readExcelLogStorage();
        
        if (latestEntries.length === 0) {
            alert('No data to export.');
            document.getElementById('exportBtn').disabled = false;
            return;
        }
        
        let csv = 'Number,Date Logged,Owner Name,Cell Number,Birth Date,Address,Owner Code,Pet Name,Pets / LiveStock,Sex,Save Date,Symptoms,Medication\n';
        latestEntries.forEach((entry, index) => {
            // Escape quotes in strings
            const escapeQuote = (str) => (str || '').replace(/"/g, '""');
            csv += `"${index + 1}","${escapeQuote(entry.dateLogged)}","${escapeQuote(entry.ownerName)}","${escapeQuote(entry.cellNumber)}","${escapeQuote(entry.birthDate)}","${escapeQuote(entry.address)}","${escapeQuote(entry.ownerCode || entry.zipCode || '')}","${escapeQuote(entry.petName || '')}","${escapeQuote(entry.liveStock)}","${escapeQuote(entry.sex)}","${escapeQuote(entry.saveDate || '')}","${escapeQuote(entry.symptoms)}","${escapeQuote(entry.medication)}"\n`;
        });
        
        // Show preview
        const previewLines = csv.split('\n').slice(0, 10).join('\n');
        csvPreviewContent.textContent = previewLines + (csv.split('\n').length > 10 ? '\n...' : '');
        currentCsvData = csv;
        csvPreviewModal.style.display = 'flex';
        setLastExtractionInfo(new Date().toLocaleString());
    } finally {
        document.getElementById('exportBtn').disabled = false;
    }
}

// Validation function for staff form
function validateStaffForm() {
    // Clear all previous error messages
    document.querySelectorAll('.error-msg').forEach(el => el.classList.remove('show'));
    document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
    
    let isValid = true;
    const fullName = document.getElementById('fullName').value.trim();
    const gender = document.getElementById('gender').value;
    const birthDate = document.getElementById('birthDate').value;
    const age = document.getElementById('age').value;
    const address = document.getElementById('address').value.trim();
    const cellNumber = document.getElementById('cellNumber').value.trim();
    const gmail = document.getElementById('gmail').value.trim();
    const password = document.getElementById('password').value;
    
    // Full Name validation
    if (!fullName || fullName.length < 3) {
        showError('fullName', 'Full name must be at least 3 characters');
        isValid = false;
    }
    
    // Gender validation
    if (!gender) {
        showError('gender', 'Please select a gender');
        isValid = false;
    }
    
    // Birth Date validation
    if (!birthDate) {
        showError('birthDate', 'Birth date is required');
        isValid = false;
    } else {
        const birthDateObj = new Date(birthDate);
        const today = new Date();
        if (birthDateObj > today) {
            showError('birthDate', 'Birth date cannot be in the future');
            isValid = false;
        }
    }
    
    // Address validation
    if (!address || address.length < 5) {
        showError('address', 'Address must be at least 5 characters');
        isValid = false;
    }
    
    // Cell Number validation
    if (!cellNumber || cellNumber.length < 10) {
        showError('cellNumber', 'Cell number must be at least 10 digits');
        isValid = false;
    }
    
    // Gmail validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!gmail || !emailRegex.test(gmail)) {
        showError('gmail', 'Please enter a valid email address');
        isValid = false;
    }
    
    // Password validation
    if (!password || password.length < 6) {
        showError('password', 'Password must be at least 6 characters');
        isValid = false;
    }
    
    return isValid;
}

// Function to show error message
function showError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorEl = document.getElementById(fieldId + 'Err');
    
    if (field && errorEl) {
        field.classList.add('input-error');
        errorEl.textContent = message;
        errorEl.classList.add('show');
    }
}

// Update addStaffCard to store all info
staffForm.onsubmit = function(e) {
    e.preventDefault();
    
    // Validate form first
    if (!validateStaffForm()) {
        return;
    }
    
    const fullName = document.getElementById('fullName').value.trim();
    const birthDate = document.getElementById('birthDate').value;
    const age = document.getElementById('age').value;
    const address = document.getElementById('address').value.trim();
    const cellNumber = document.getElementById('cellNumber').value.trim();
    const gmail = document.getElementById('gmail').value.trim();
    const password = document.getElementById('password').value;
    const profileImageInput = document.getElementById('profileImage');
    let profileImageURL = '';
    
    const handleImage = (imgData) => {
        const editIndex = staffForm.dataset.editIndex;
        const gender = document.getElementById('gender').value;
        let finalImageURL = imgData;

        if (editIndex !== undefined) {
            if (!imgData && staffList[editIndex] && staffList[editIndex].profileImageURL) {
                finalImageURL = staffList[editIndex].profileImageURL;
            }
            staffList[editIndex] = { fullName, gender, cellNumber, profileImageURL: finalImageURL, birthDate, age, address, gmail, password };
            saveStaffToStorage();
            renderStaffCards();
            delete staffForm.dataset.editIndex;
            document.getElementById('formTitle').textContent = 'Register New Staff';
            document.getElementById('formSubmitBtn').textContent = 'Add Staff';
        } else {
            addStaffCard({ fullName, gender, cellNumber, profileImageURL: finalImageURL, birthDate, age, address, gmail, password });
        }
        staffModal.style.display = 'none';
        staffForm.reset();
        defaultAge();
        // Clear any error messages
        document.querySelectorAll('.error-msg').forEach(el => el.classList.remove('show'));
        document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
    };
    
    if (profileImageInput.files && profileImageInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            handleImage(e.target.result);
        };
        reader.onerror = function() {
            alert('Error reading the selected image file. Please try a different image.');
            handleImage('');
        };
        reader.readAsDataURL(profileImageInput.files[0]);
    } else {
        handleImage('');
    }
};

// Cancel button
document.getElementById('cancelBtn').addEventListener('click', function() {
    staffModal.style.display = 'none';
    staffForm.reset();
    defaultAge();
    // Clear any error messages
    document.querySelectorAll('.error-msg').forEach(el => el.classList.remove('show'));
    document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
    // Clear edit mode
    delete staffForm.dataset.editIndex;
    document.getElementById('formTitle').textContent = 'Register New Staff';
    document.getElementById('formSubmitBtn').textContent = 'Add Staff';
});
