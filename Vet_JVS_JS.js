let owners = [
{
code:'3RMRL',
name:'Jashtin Hero U. Solon',
dob:'06/06/2004',
phone:'09457094921',
location:'Roxas Ext. Digos City Davao Del Sur',
pets:[
{
id:'pet_oreo',
name:'Oreo',
gender:'Male',
dob:'2026-02-17',
type:'Dog',
typeOther:'',
weight:'1',
height:'3',
color:'White, Brown',
lastStaff:'Dr. Blessedxie Bolamot',
treatments:[]
}
]
}
];

/* GENERATE OWNER CODE */

function generateCode(){
const chars="ABCDEFGHIJKLMNOPQRSTUVWXYZ";
let code="";
let length = Math.floor(Math.random() * 3) + 3; // 3 to 5 letters
for(let i=0;i<length;i++){
code+=chars.charAt(Math.floor(Math.random()*chars.length));
}
document.getElementById("ownerCode").value=code;
}

window.onload=function(){
  loadData();
  generateCode();
  renderOwners();
  setupPetUnitInputs();
  showRegister();
  attachGlobalModalListeners();
  loadStaffForDropdown();
  loadLastExtractionInfo();
};

const LAST_EXTRACTION_KEY = 'vetLastExtractionInfo';

function loadLastExtractionInfo() {
  updateLastExtractionInfoDisplay();
}

function getLastExtractionInfo() {
  try {
    const raw = localStorage.getItem(LAST_EXTRACTION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn('Unable to load last extraction info', e);
    return null;
  }
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

function setupPetUnitInputs(){
  const weightInput = document.getElementById('petWeight');
  const heightInput = document.getElementById('petHeight');

  const normalizeValue = value => {
    let sanitized = value.replace(/[^0-9.'\u2032\u2033]/g, '');
    // Allow a single decimal point
    const parts = sanitized.split('.');
    if(parts.length > 2){
      sanitized = parts.shift() + '.' + parts.join('');
    }
    return sanitized;
  };

  const enforceChars = e => {
    const el = e.target;
    el.value = normalizeValue(el.value);
  };

  if(weightInput){
    weightInput.addEventListener('input', enforceChars);
    weightInput.setAttribute('pattern', "[0-9.'\\u2032\\u2033]*");
  }

  if(heightInput){
    heightInput.addEventListener('input', enforceChars);
    heightInput.setAttribute('pattern', "[0-9.'\\u2032\\u2033]*");
  }
}

const EXCEL_LOG_KEY = 'vetExcelLogEntries';

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
}

function saveExcelLogEntries(entries) {
  excelLogEntries = Array.isArray(entries) ? entries : [];
  writeExcelLogStorage(excelLogEntries);
}

function appendExcelLogEntries(entriesToAppend) {
  if (!Array.isArray(entriesToAppend) || entriesToAppend.length === 0) return;
  const current = readExcelLogStorage();
  const merged = current.concat(entriesToAppend);
  saveExcelLogEntries(merged);
}

function clearExcelLog() {
  saveExcelLogEntries([]);
  renderExcelLog();
}

function saveData(){
  localStorage.setItem('vetOwners', JSON.stringify(owners));
  localStorage.setItem('vetQueueEntries', JSON.stringify(queueEntries));
  localStorage.setItem('vetNextQueueNumber', String(nextQueueNumber));
  writeExcelLogStorage(excelLogEntries);
}

function loadData(){
  try {
    const savedOwners = JSON.parse(localStorage.getItem('vetOwners') || 'null');
    const savedQueue = JSON.parse(localStorage.getItem('vetQueueEntries') || 'null');
    const savedNext = parseInt(localStorage.getItem('vetNextQueueNumber'), 10);
    const savedExcelLog = readExcelLogStorage();

    if(Array.isArray(savedOwners)) owners = savedOwners;
    if(Array.isArray(savedQueue)) queueEntries = savedQueue;
    if(Array.isArray(savedExcelLog)) excelLogEntries = savedExcelLog;

    if(Array.isArray(queueEntries) && queueEntries.length > 0){
      const highestTag = queueEntries
        .map(item => parseInt(item.numberTag, 10))
        .filter(n => !Number.isNaN(n))
        .reduce((max, current) => Math.max(max, current), 0);
      nextQueueNumber = Math.min(999, highestTag + 1);
    } else {
      nextQueueNumber = 1;
    }

    if(!Number.isNaN(savedNext) && savedNext > 0) {
      nextQueueNumber = savedNext;
    }
  } catch(e){
    console.warn('Could not load saved data', e);
    queueEntries = [];
    nextQueueNumber = 1;
  }
}

function attachGlobalModalListeners(){
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', event => {
      if(event.target === modal && !modal.classList.contains('hidden')){
        modal.classList.add('hidden');
      }
    });
  });
}


/* REGISTER OWNER */

let editingOwnerCode=null;
let currentDeleteTarget=null;
let deleteTimer=null;
let deleteCountdown=5;
let pendingOwner=null;

let queueEntries=[]; // { numberTag, ownerCode, ownerName, petId, petName, petType, service, status }
let nextQueueNumber=1;
let currentQueueOwnerCode=null;
let currentQueuePetId=null;
let currentQueueServiceType=null;
let currentQueueIndex = 0;

// Excel Log data
let excelLogEntries = []; // { id, dateLogged, ownerName, cellNumber, birthDate, address, liveStock, sex, zipCode, symptoms, medication }

function registerOwner(){
  const name=document.getElementById("name").value.trim();
  const dob=document.getElementById("dob").value;
  const phone=document.getElementById("phone").value.trim();
  const location=document.getElementById("location").value.trim();
  const code=document.getElementById("ownerCode").value;

  if(!name||!dob||!phone||!location){
    alert("Please fill all fields");
    return;
  }

  pendingOwner = {code,name,dob,phone,location,pets:[]};
  showRegistrationModal();
}


/* CLEAR FORM */

function clearForm(){
  editingOwnerCode = null;
  document.getElementById("name").value="";
  document.getElementById("dob").value="";
  document.getElementById("phone").value="";
  document.getElementById("location").value="";

  generateCode();
}


/* EDIT OWNER */

function editOwner(code){
  const owner = owners.find(o => o.code === code);
  if(!owner) return;

  editingOwnerCode = code;

  document.getElementById("editName").value = owner.name;
  document.getElementById("editDob").value = owner.dob;
  document.getElementById("editPhone").value = owner.phone;
  document.getElementById("editLocation").value = owner.location;

  document.getElementById("editOwnerModal").classList.remove("hidden");
}

function closeEditOwnerModal(){
  document.getElementById("editOwnerModal").classList.add("hidden");
  editingOwnerCode = null;
}

function saveEditOwner(){
  if(!editingOwnerCode) return;
  const owner = owners.find(o => o.code === editingOwnerCode);
  if(!owner) return;

  owner.name = document.getElementById("editName").value.trim();
  owner.dob = document.getElementById("editDob").value;
  owner.phone = document.getElementById("editPhone").value.trim();
  owner.location = document.getElementById("editLocation").value.trim();

  closeEditOwnerModal();
  renderOwners();
  saveData();
}

function avatarHover(el, isHover){
  if(!el) return;
  if(isHover){
    el.dataset.original = el.textContent;
    el.textContent = '+';
    el.style.cursor = 'pointer';
  } else {
    if(el.dataset && el.dataset.original){
      el.textContent = el.dataset.original;
    }
  }
}

function queueOwner(ownerCode){
  const owner = owners.find(o => o.code === ownerCode);
  if(!owner) return;

  if(!owner.pets || owner.pets.length === 0){
    alert('The Owner has no pet');
    return;
  }

  currentQueueOwnerCode = ownerCode;
  currentQueuePetId = owner.pets[0]?.id || null;

  document.getElementById('queueOwnerName').textContent = owner.name;
  document.getElementById('queueOwnerCode').textContent = owner.code;
  document.getElementById('queueNumberTag').textContent = formatQueueNumber(nextQueueNumber);

  const petListEl = document.getElementById('queuePetList');
  petListEl.innerHTML = '';

  owner.pets.forEach(pet => {
    const petBtn = document.createElement('button');
    petBtn.type = 'button';
    petBtn.className = 'queue-pet-btn';
    petBtn.textContent = `${pet.name} (${pet.type})`;

    if (pet.id === currentQueuePetId) {
      petBtn.classList.add('active');
    }

    petBtn.addEventListener('click', () => {
      currentQueuePetId = pet.id;
      document.querySelectorAll('#queuePetList .queue-pet-btn').forEach(btn => btn.classList.remove('active'));
      petBtn.classList.add('active');
    });

    petListEl.appendChild(petBtn);
  });

  // reset service selection when opening queue modal
  currentQueueServiceType = null;
  const serviceSelect = document.getElementById('queueServiceSelect');
  const serviceWrapper = document.getElementById('queueServiceWrapper');
  if (serviceSelect) {
    serviceSelect.value = '';
  }
  if (serviceWrapper) {
    serviceWrapper.style.display = 'none';
  }
  document.getElementById('vaccineBtn').classList.remove('active');
  document.getElementById('checkupBtn').classList.remove('active');

  document.getElementById('queueModal').classList.remove('hidden');
}

function setQueueServiceType(type){
  currentQueueServiceType = type;
  const serviceSelect = document.getElementById('queueServiceSelect');
  const serviceWrapper = document.getElementById('queueServiceWrapper');
  if (!serviceSelect || !serviceWrapper) return;
  serviceWrapper.style.display = 'block';
  serviceSelect.innerHTML = '<option value="">Select service</option>';

  const options = type === 'Vaccine'
    ? ['Antirabies','Immunize','Surgery','Deworming']
    : ['Check-up','Follow-Up','Surgery','Deworming'];

  options.forEach(opt => {
    const optionEl = document.createElement('option');
    optionEl.value = opt;
    optionEl.textContent = opt;
    serviceSelect.appendChild(optionEl);
  });

  document.getElementById('vaccineBtn').classList.toggle('active', type === 'Vaccine');
  document.getElementById('checkupBtn').classList.toggle('active', type === 'Check-up');
}

function closeQueueModal(){
  document.getElementById('queueModal').classList.add('hidden');
  currentQueueOwnerCode = null;
  currentQueuePetId = null;
}

function formatQueueNumber(n){
  if(n > 999) return '999';
  return String(n).padStart(3, '0');
}

function confirmQueue(){
  if(!currentQueueOwnerCode){
    closeQueueModal();
    return;
  }

  if(!currentQueuePetId){
    alert('Please select a pet to queue.');
    return;
  }

  const owner = owners.find(o => o.code === currentQueueOwnerCode);
  if(!owner) return;
  const pet = owner.pets.find(p => p.id === currentQueuePetId);
  if(!pet) return;

  const selectedService = document.getElementById('queueServiceSelect')?.value || '';
  if(!selectedService){
    alert('Please choose a service category and option before adding to queue.');
    return;
  }

  const entry = {
    numberTag: formatQueueNumber(nextQueueNumber),
    ownerCode: owner.code,
    ownerName: owner.name,
    petId: pet.id,
    petName: pet.name,
    petType: pet.type,
    service: selectedService,
    status: 'pending'
  };

  queueEntries.push(entry);
  nextQueueNumber = Math.min(999, nextQueueNumber + 1);

  saveData();
  closeQueueModal();
  renderQueue();
}

function renderQueue(){
  const list = document.getElementById('queueList');
  list.innerHTML = '';
  document.getElementById('queueCount').textContent = queueEntries.length;

  // Update indicator number
  if (queueEntries.length > 0) {
    document.getElementById('currentQueueIndicator').textContent = queueEntries[currentQueueIndex]?.numberTag || '000';
  } else {
    document.getElementById('currentQueueIndicator').textContent = '000';
  }

  queueEntries.forEach((entry, idx) => {
    const row = document.createElement('div');
    row.style.display = 'grid';
    row.style.gridTemplateColumns = '70px 1fr 110px 130px';
    row.style.alignItems = 'center';
    row.style.gap = '12px';
    row.style.padding = '12px';
    row.style.border = '1px solid rgba(0,0,0,0.12)';
    row.style.borderRadius = '14px';
    row.style.background = idx === currentQueueIndex ? 'rgba(34,136,122,0.18)' : (entry.status === 'complete' ? 'rgba(255,255,0,0.2)' : entry.status === 'abandon' ? 'rgba(255,100,100,0.15)' : 'rgba(255,255,255,0.85)');
    row.style.boxShadow = idx === currentQueueIndex ? '0 0 16px #22a58f33' : '';
    row.style.transition = 'background 0.2s, box-shadow 0.2s';

    const tag = document.createElement('div');
    tag.style.fontWeight = '700';
    tag.textContent = entry.numberTag;

    const details = document.createElement('div');
    details.innerHTML = `<div style="font-weight:700;">${entry.ownerName}</div><div style="font-size:13px; color:#555;">${entry.petName} (${entry.petType}) • ${entry.ownerCode}</div><div style="font-size:12px; color:#000000; margin-top:3px;">Service: ${entry.service || 'None'}</div>`;

    const status = document.createElement('div');
    status.style.display = 'flex';
    status.style.gap = '8px';

    const completeBtn = document.createElement('button');
    completeBtn.textContent = 'Complete';
    completeBtn.style.padding = '6px 10px';
    completeBtn.style.border = 'none';
    completeBtn.style.borderRadius = '10px';
    completeBtn.style.cursor = 'pointer';
    completeBtn.style.background = entry.status === 'complete' ? '#f1c40f' : '#d1e7d6';
    completeBtn.addEventListener('click', (e) => {
      entry.status = 'complete';
      renderQueue();
      saveData();
      e.stopPropagation();
    });

    const abandonBtn = document.createElement('button');
    abandonBtn.textContent = 'Abandon';
    abandonBtn.style.padding = '6px 10px';
    abandonBtn.style.border = 'none';
    abandonBtn.style.borderRadius = '10px';
    abandonBtn.style.cursor = 'pointer';
    abandonBtn.style.background = entry.status === 'abandon' ? '#e74c3c' : '#f6d6d6';
    abandonBtn.addEventListener('click', (e) => {
      entry.status = 'abandon';
      renderQueue();
      saveData();
      e.stopPropagation();
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Remove';
    deleteBtn.style.padding = '6px 10px';
    deleteBtn.style.border = 'none';
    deleteBtn.style.borderRadius = '10px';
    deleteBtn.style.cursor = 'pointer';
    deleteBtn.style.background = '#f0a8a8';
    deleteBtn.addEventListener('click', (e) => {
      queueEntries = queueEntries.filter((_, i) => i !== idx);
      currentQueueIndex = Math.min(currentQueueIndex, queueEntries.length - 1);
      renderQueue();
      saveData();
      e.stopPropagation();
    });

    status.appendChild(completeBtn);
    status.appendChild(abandonBtn);
    status.appendChild(deleteBtn);

    row.appendChild(tag);
    row.appendChild(details);
    row.appendChild(status);

    // Click row to set as active and show pet info
    row.addEventListener('click', () => {
      currentQueueIndex = idx;
      renderQueue();
      // Show pet info modal
      const owner = owners.find(o => o.code === entry.ownerCode);
      if (!owner) return;
      const pet = owner.pets.find(p => p.id === entry.petId);
      if (!pet) return;
      showPetDetails(owner.code, pet.id);
    });

    list.appendChild(row);
  });
}

function previousQueue() {
  if (queueEntries.length === 0) return;
  currentQueueIndex = Math.max(0, currentQueueIndex - 1);
  renderQueue();
}

function nextQueue() {
  if (queueEntries.length === 0) return;
  currentQueueIndex = Math.min(queueEntries.length - 1, currentQueueIndex + 1);
  renderQueue();
}

function clearQueue(){
  if(queueEntries.length === 0){
    alert('Queue is already empty.');
    return;
  }
  if (!confirm('Clear all queue entries?')) return;
  queueEntries = [];
  nextQueueNumber = 1;
  currentQueueIndex = 0;
  renderQueue();
  saveData();
}



/* DISPLAY OWNERS */

function renderOwners(){

const container=document.getElementById("ownerList");
container.innerHTML="";

owners.forEach(owner=>{

let petsHTML="";

owner.pets.forEach(p=>{
petsHTML+=`<div class="petTag" onclick="showPetDetails('${owner.code}','${p.id}')">${p.name}</div>`;
});

container.innerHTML+=`

<div class="ownerCard">

<div class="actions">
<i class="fa fa-pen" onclick="editOwner('${owner.code}')"></i>
<i class="fa fa-trash" onclick="promptDeleteOwner('${owner.code}')"></i>
</div>

<div class="ownerTop">

<div class="avatar" title="Add to queue" onclick="queueOwner('${owner.code}')" onmouseenter="avatarHover(this,true)" onmouseleave="avatarHover(this,false)">${owner.name.charAt(0)}</div>

<div class="ownerInfo">
<h2>${owner.name}</h2>
<div class="ownerCode">${owner.pets.length} pets &nbsp;&nbsp; ${owner.code}</div>
</div>

</div>

<div class="infoRow">
<div><i class="fa fa-phone"></i> ${owner.phone}</div>
<div><i class="fa fa-calendar"></i> ${(() => {const p = owner.dob.split(owner.dob.includes('/') ? '/' : '-'); return p.length === 3 ? `${p[0]}/${p[1]}/${p[2].slice(-2)}` : owner.dob;})()}</div>
</div>

<div class="infoRow">
<div><i class="fa fa-location-dot"></i> ${owner.location}</div>
</div>

<div class="pets">

<b>Pets:</b>

${petsHTML}

<div class="addPet" onclick="addPet('${owner.code}')">+</div>

</div>

</div>

`;

});

}

/* PET MODAL */

let currentPetOwnerCode=null;
let currentPetId=null;
let currentPetView=null;
let currentPetNoteDraft = {
  editingIndex: null,
  symptoms: [],
  medicines: {
    Antibiotics: [],
    Vitamins: [],
    Others: []
  }
};

function addPet(code){
openPetFormModal(code);
}

function openPetFormModal(ownerCode,petId=null){

closePetDetails();


const owner=owners.find(o=>o.code===ownerCode);
const pet=petId?owner.pets.find(p=>p.id===petId):null;

currentPetOwnerCode=ownerCode;
currentPetId=petId;

document.getElementById("petFormTitle").textContent=pet?"Edit Pet":"Register Pet";

document.getElementById("petName").value=pet?pet.name:"";
document.getElementById("petGender").value=pet?pet.gender:"Male";
document.getElementById("petDob").value=pet?pet.dob:"";
document.getElementById("petType").value=pet?((pet.type==="Dog"||pet.type==="Cat")?pet.type:"Others"):"Dog";
document.getElementById("petWeight").value=pet?pet.weight:"";
document.getElementById("petHeight").value=pet?pet.height:"";
document.getElementById("petColor").value=pet?pet.color:"";

// Show/hide and set value for petTypeOther
if(pet && pet.type!=="Dog" && pet.type!=="Cat"){
  document.getElementById('petTypeOtherRow').style.display = 'block';
  document.getElementById('petTypeOther').value = pet.type;
}else{
  document.getElementById('petTypeOtherRow').style.display = 'none';
  document.getElementById('petTypeOther').value = '';
}

document.getElementById("petFormContainer").classList.remove("hidden");

}

/* SAVE PET */

function savePet(){

const owner=owners.find(o=>o.code===currentPetOwnerCode);


let petType = document.getElementById("petType").value;
let petTypeOther = document.getElementById("petTypeOther").value.trim();
if(petType === "Others" && petTypeOther) {
  petType = petTypeOther;
}

const petNameValue = document.getElementById("petName").value.trim();
const petDobValue = document.getElementById("petDob").value;
const petWeightValue = document.getElementById("petWeight").value.trim();
const petHeightValue = document.getElementById("petHeight").value.trim();
const petColorValue = document.getElementById("petColor").value.trim();

if (!petNameValue || !petDobValue || !petWeightValue || !petHeightValue || !petColorValue) {
  alert('Please fill all pet fields before saving.');
  return;
}

const petData={
  id:currentPetId||"pet_"+Date.now(),
  name:petNameValue,
  gender:document.getElementById("petGender").value,
  dob:petDobValue,
  type:petType,
  weight:petWeightValue,
  height:petHeightValue,
  color:petColorValue,
  treatments:[]
};

if(currentPetId){

const index=owner.pets.findIndex(p=>p.id===currentPetId);
owner.pets[index]={...owner.pets[index],...petData};

}else{

owner.pets.push(petData);

}

closePetFormModal();
renderOwners();
saveData();

}

/* CLOSE PET FORM */

function closePetFormModal(){

document.getElementById("petFormContainer").classList.add("hidden");

currentPetOwnerCode=null;
currentPetId=null;

}

/* SHOW PET DETAILS */

function showPetDetails(ownerCode,petId){

  const owner=owners.find(o=>o.code===ownerCode);
  if(!owner) return;
  const pet=owner.pets.find(p=>p.id===petId);
  if(!pet) return;

  currentPetView={ownerCode,petId};

  // Initialize draft for new note; existing notes are stored in pet.notes.
  currentPetNoteDraft = {
    editingIndex: null,
    symptoms: [],
    medicines: { Antibiotics: [], Vitamins: [], Others: [] }
  };

  if(!pet.notes){
    pet.notes = [];
  }

  document.getElementById("petDetailsName").textContent=pet.name;

  let treatmentRows="";

  if(!pet.treatments || pet.treatments.length===0){
    treatmentRows=`<tr><td colspan="4" style="text-align:center;">No treatment records yet</td></tr>`;
  } else {
    pet.treatments.forEach(t=>{
      treatmentRows+=`
<tr>
<td>${t.date}</td>
<td>${t.vaccineType}</td>
<td>${t.nextDate||'N/A'}</td>
<td>${t.doctor||'N/A'}</td>
</tr>
`;
    });
  }


  // Show the correct type (custom if not Dog/Cat)
  let displayType = (pet.type === "Dog" || pet.type === "Cat") ? pet.type : pet.type;

  const modalContent = document.getElementById('petDetailsModal').querySelector('.modal-content');
  modalContent.innerHTML = `

<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
  <h3 id="petDetailsName">${pet.name}</h3>
  <div>
    <i class="fa fa-print" style="cursor:pointer; margin-right:12px;" onclick="printPet('${ownerCode}', '${petId}')"></i>
    <i class="fa fa-pen" style="cursor:pointer; margin-right:12px;" onclick="openPetFormModal('${ownerCode}', '${petId}')"></i>
    <i class="fa fa-trash" style="cursor:pointer;" onclick="promptDeletePet('${ownerCode}', '${petId}')"></i>
  </div>
</div>

<div id="petDetailsInfo">
<div class="pet-details-layout">

<div class="pet-info-box">
<div class="pet-row"><span>Owner</span><span>${owner.name}</span></div>
<div class="pet-row"><span>Gender</span><span>${pet.gender}</span></div>
<div class="pet-row"><span>Date of Birth</span><span>${pet.dob}</span></div>
<div class="pet-row"><span>Type</span><span>${displayType}</span></div>
<div class="pet-row"><span>Weight</span><span>${pet.weight} kg</span></div>
<div class="pet-row"><span>Height</span><span>${pet.height} cm</span></div>
<div class="pet-row"><span>Body color</span><span>${pet.color}</span></div>
</div>

<div class="pet-treatment-box">
<h4>Treatment records</h4>
<div class="treatment-table-wrap">
<table class="treatment-table">
<thead><tr><th>DATE</th><th>TREATMENT</th><th>NEXT TREATMENT</th><th>DOCTOR</th></tr></thead>
<tbody>${treatmentRows}</tbody>
</table>
</div>
<div class="add-treatment-grid">
<input id="treatmentDate" type="date">
<input id="treatmentType" type="text" placeholder="Treatment type" list="treatmentTypeOptions">
<datalist id="treatmentTypeOptions">
  <option value="Antirabies"></option>
  <option value="Immunize"></option>
  <option value="Sergery"></option>
  <option value="Deworming"></option>
  <option value="Check-up"></option>
  <option value="Follow-Up"></option>
  <option value="Surgery"></option>
</datalist>
<input id="treatmentNextDate" type="date">
<div class="field" style="grid-column: 1 / -1;">
        <label for="petLastStaff">Doctor In Charge</label>
        <select id="petLastStaff">
          <option value="">Select doctor</option>
        </select>
      </div>
<button class="register" onclick="saveTreatment()">Add Treatment</button>
</div>
</div>

</div>
</div>

<div class="pet-note-box">
  <div style="display:flex; justify-content:space-between; align-items:center;">
    <h4>Pet Notes</h4>
    <button class="code-btn" style="padding:8px 12px; font-size:0.9rem;" onclick="startNewPetNote()">Add Note</button>
  </div>

  <div id="addNotePanel" style="display:none; margin-top:12px; background:#eefbfd; border:1px solid #a6dee8; border-radius:10px; padding:12px;">
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
      <div>
        <label for="noteSymptomsInput" style="font-weight:700; display:block; margin-bottom:6px;">Symptoms</label>
        <div style="display:flex; gap:8px; margin-bottom:6px; align-items:center;">
          <input id="noteSymptomsInput" type="text" placeholder="Type a sentence and click Next" style="flex:1; padding:8px; border-radius:8px; border:1px solid #b8d8df;" />
          <button class="register" style="padding:8px 12px; font-size:0.85rem;" onclick="addSymptomSentence()">Next</button>
        </div>
        <div id="symptomsPreview" style="margin-top:10px; background:#fff; border:1px solid #ccebec; border-radius:8px; min-height:80px; padding:8px; overflow:auto;">No symptoms yet.</div>
      </div>

      <div>
        <label style="font-weight:700; display:block; margin-bottom:6px;">Medicine</label>
        <div style="display:flex; gap:8px; margin-bottom:8px; flex-wrap:wrap;">
          <button class="service-btn" onclick="toggleMedicineDropdown('Antibiotics', event)">Antibiotics</button>
          <button class="service-btn" onclick="toggleMedicineDropdown('Vitamins', event)">Vitamins</button>
          <button class="service-btn" onclick="toggleMedicineDropdown('Others', event)">Others</button>
        </div>

        <div id="medicineDropdowns" style="display:grid; gap:8px;">
          <div id="AntibioticsDropdown" style="display:none;"><select id="antibioticSelect" onchange="selectMedicine('Antibiotics', this)"><option value="">Select Antibiotic</option><option>Enrofloxacin</option><option>Lincomycin+Speetinomycin+Bromhexine</option><option>Marbofloxacin</option><option>CCD</option><option>Penicillin</option><option>Oxytetraoycline</option></select></div>
          <div id="VitaminsDropdown" style="display:none;"><select id="vitaminsSelect" onchange="selectMedicine('Vitamins', this)"><option value="">Select Vitamin</option><option>ATP+Butophosphan</option><option>Iron</option><option>B Complex</option><option>Vit ADE</option></select></div>
          <div id="OthersDropdown" style="display:none;">
            <select id="othersSelect" onchange="selectMedicine('Others', this)"><option value="">Select Other</option><option>Ivermeetin</option><option>Ecolmin</option><option>Dexamenthasoue</option><option>Oxytocin</option><option>Co-pyrine</option></select>
            <div style="margin-top:6px; display:flex; gap:6px; align-items:center;">
              <input id="othersCustomInput" type="text" placeholder="Other med" style="flex:1; padding:6px; border-radius:6px; border:1px solid #b8d8df;" />
              <button class="register" style="padding:5px 8px; font-size:0.8rem;" onclick="addOtherMedicine()">Add</button>
            </div>
          </div>
        </div>

        <div style="margin-top:10px;">
          <div style="font-weight:700; margin-bottom:4px;">Selected Medications</div>
          <div id="selectedMedicines" style="min-height:180px; max-height:120px; overflow-y:auto; background:#fff; border:1px solid #ccebec; border-radius:8px; padding:8px;"></div>
        </div>
      </div>
    </div>

    <div style="margin-top:12px; display:flex; justify-content:flex-end; gap:8px;">
      <button class="cancel" onclick="closeAddNotePanel()">Cancel</button>
      <button class="register" onclick="savePetNote()">Save Note</button>
    </div>
  </div>

  <div id="savedNoteDisplay" style="margin-top:12px; background:#fdfdfd; border:1px solid #e2edf0; border-radius:10px; padding:10px;"></div>

</div>

<div class="modal-actions" style="margin-top:20px; justify-content:flex-end;">
  <button class="cancel" onclick="closePetDetails()">Close</button>
</div>

`;

  renderSavedNoteDisplay(pet);

  document.getElementById('petDetailsModal').classList.remove('hidden');
  
  // Load staff names for the dropdown after modal is shown
  loadStaffForDropdown();
}

function savePetNote(){
  if(!currentPetView) return;
  const owner = owners.find(o=>o.code===currentPetView.ownerCode);
  if(!owner) return;
  const pet = owner.pets.find(p=>p.id===currentPetView.petId);
  if(!pet) return;

  if(!pet.notes) pet.notes=[];

  const symptoms = currentPetNoteDraft.symptoms.filter(Boolean);
  if(symptoms.length===0 && currentPetNoteDraft.medicines.Antibiotics.length===0 && currentPetNoteDraft.medicines.Vitamins.length===0 && currentPetNoteDraft.medicines.Others.length===0){
    alert('Please add symptoms or medicine before saving.');
    return;
  }

  const noteData = {
    symptoms: symptoms.slice(),
    medicines: {
      Antibiotics: currentPetNoteDraft.medicines.Antibiotics.slice(),
      Vitamins: currentPetNoteDraft.medicines.Vitamins.slice(),
      Others: currentPetNoteDraft.medicines.Others.slice()
    }
  };

  if (currentPetNoteDraft.editingIndex !== null && pet.notes[currentPetNoteDraft.editingIndex]) {
    const existingNote = pet.notes[currentPetNoteDraft.editingIndex];
    existingNote.symptoms = noteData.symptoms;
    existingNote.medicines = noteData.medicines;
    existingNote.updatedAt = new Date().toISOString();
  } else {
    const newNote = {
      id: Date.now(),
      symptoms: noteData.symptoms,
      medicines: noteData.medicines,
      createdAt: new Date().toISOString()
    };
    pet.notes.push(newNote);
  }

  currentPetNoteDraft.editingIndex = null;
  saveData();
  renderSavedNoteDisplay(pet);
  closeAddNotePanel();
  alert('Pet note saved.');
}

function startNewPetNote(){
  currentPetNoteDraft = {
    editingIndex: null,
    symptoms: [],
    medicines: { Antibiotics: [], Vitamins: [], Others: [] }
  };

  const noteInput = document.getElementById('noteSymptomsInput');
  if(noteInput){
    noteInput.value = '';
  }

  updateSymptomsPreview();
  renderSelectedMedicines();
  openAddNotePanel();
}

function openAddNotePanel(){
  const panel = document.getElementById('addNotePanel');
  if(!panel) return;
  panel.style.display = 'block';
  const noteInput = document.getElementById('noteSymptomsInput');
  if(noteInput){
    noteInput.value = '';
    noteInput.focus();
  }
  updateSymptomsPreview();
  renderSelectedMedicines();
}

function addSymptomSentence(){
  const symptomsInput = document.getElementById('noteSymptomsInput');
  if(!symptomsInput) return;
  const sentence = symptomsInput.value.trim();
  if(!sentence){
    alert('Please type a symptom sentence before clicking Next.');
    return;
  }
  currentPetNoteDraft.symptoms.push(sentence);
  symptomsInput.value = '';
  updateSymptomsPreview();
}

function addOtherMedicine(){
  const input = document.getElementById('othersCustomInput');
  if(!input) return;
  const value = input.value.trim();
  if(!value){
    alert('Please enter other medicine name.');
    return;
  }
  if(!currentPetNoteDraft.medicines.Others.includes(value)){
    currentPetNoteDraft.medicines.Others.push(value);
  }
  input.value = '';
  renderSelectedMedicines();
}

function closeAddNotePanel(){
  const panel = document.getElementById('addNotePanel');
  if(!panel) return;
  panel.style.display = 'none';
  ['AntibioticsDropdown','VitaminsDropdown','OthersDropdown'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.style.display = 'none';
  });
}

function updateSymptomsPreview(){
  const preview = document.getElementById('symptomsPreview');
  if(!preview) return;

  const items = currentPetNoteDraft.symptoms || [];

  if(items.length===0){
    preview.innerHTML = '<small style="color:#4f6d77;">No symptoms yet.</small>';
    return;
  }

  preview.innerHTML = '<ul style="padding-left:18px; margin:0;">' + items.map((i, idx) => `<li data-index="${idx}" style="cursor:pointer;">${i}</li>`).join('') + '</ul>';

  // Add event listeners for hover and click
  const lis = preview.querySelectorAll('li');
  lis.forEach(li => {
    li.addEventListener('mouseenter', () => li.style.color = 'blue');
    li.addEventListener('mouseleave', () => li.style.color = '');
    li.addEventListener('click', () => {
      if (confirm('Are you sure you want to delete it?')) {
        const idx = parseInt(li.dataset.index);
        currentPetNoteDraft.symptoms.splice(idx, 1);
        updateSymptomsPreview();
      }
    });
  });
}

function toggleMedicineDropdown(category, event){
  event.preventDefault();
  ['AntibioticsDropdown','VitaminsDropdown','OthersDropdown'].forEach(id => {
    const el=document.getElementById(id);
    if(!el) return;
    el.style.display = (id === `${category}Dropdown` && el.style.display !== 'block') ? 'block' : 'none';
  });
}

function selectMedicine(category, select){
  const value = (select.value || '').trim();
  if(!value) return;
  const group = currentPetNoteDraft.medicines[category] || [];
  if(!group.includes(value)) {
    group.push(value);
  }
  currentPetNoteDraft.medicines[category] = group;

  Array.from(select.options).forEach(opt => {
    if(opt.value === value) opt.disabled = true;
  });
  select.value = '';
  renderSelectedMedicines();
}

function renderSelectedMedicines(){
  const container = document.getElementById('selectedMedicines');
  if(!container) return;
  const meds = currentPetNoteDraft.medicines;
  let html = '';
  for(const cat of ['Antibiotics','Vitamins','Others']){
    if(meds[cat] && meds[cat].length>0){
      html += `<strong>${cat}:</strong><ul style="padding-left:18px; margin:4px 0;">`;
      meds[cat].forEach((med, idx) => {
        html += `<li data-category="${cat}" data-index="${idx}" style="cursor:pointer;">${med}</li>`;
      });
      html += '</ul>';
    }
  }
  container.innerHTML = html || '<small style="color:#4f6d77;">No medications selected.</small>';

  // Add event listeners for hover and click
  const lis = container.querySelectorAll('li');
  lis.forEach(li => {
    li.addEventListener('mouseenter', () => li.style.color = 'blue');
    li.addEventListener('mouseleave', () => li.style.color = '');
    li.addEventListener('click', () => {
      if (confirm('Are you sure you want to delete it?')) {
        const cat = li.dataset.category;
        const idx = parseInt(li.dataset.index);
        currentPetNoteDraft.medicines[cat].splice(idx, 1);
        renderSelectedMedicines();
      }
    });
  });

  const selects = [
    {id: 'antibioticSelect', category: 'Antibiotics'},
    {id: 'vitaminsSelect', category: 'Vitamins'},
    {id: 'othersSelect', category: 'Others'}
  ];
  selects.forEach(s => {
    const selectEl = document.getElementById(s.id);
    if(!selectEl) return;
    Array.from(selectEl.options).forEach(opt => {
      if(!opt.value) return;
      opt.disabled = currentPetNoteDraft.medicines[s.category].includes(opt.value);
    });
  });
}


function renderSavedNoteDisplay(pet){
  const container = document.getElementById('savedNoteDisplay');
  if(!container) return;

  if(!pet.notes || pet.notes.length===0){
    container.innerHTML = '<em>No saved notes yet.</em>';
    return;
  }

  let html = '<h4 style="margin:0 0 10px; font-size:1rem;">Saved Notes</h4>';
  pet.notes.forEach((note, index) => {
    const medLines = [];
    for (const cat of ['Antibiotics', 'Vitamins', 'Others']) {
      if (note.medicines[cat] && note.medicines[cat].length) {
        medLines.push(`<div><strong>${cat}:</strong> ${note.medicines[cat].join('<b>,</b> ')}</div>`);
      }
    }
    html += `<div style="border:1px solid #ccebec; border-radius:10px; margin-bottom:10px; padding:10px; position:relative; background:#f8fcfd;">
      <div style="position:absolute; top:10px; right:10px; cursor:pointer; color:#17686f;">
        <i class="fa fa-pen" onclick="editSavedNote(${index})" style="margin-right:8px;"></i>
        <i class="fa fa-trash" onclick="deleteSavedNote(${index})"></i>
      </div>
      <div style="font-size:0.85rem; color:#3a5f6a; margin-bottom:8px;">Saved: ${new Date(note.createdAt).toLocaleString()}</div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <div>
          <div><strong>Symptoms:</strong></div>
          <ul style="padding-left:18px; margin:6px 0; max-height:100px; overflow-y:auto;">${(note.symptoms || []).map(s => `<li>${s}</li>`).join('')}</ul>
        </div>
        <div>
          <div><strong>Medicines:</strong></div>
          ${medLines.length ? medLines.join('') : '<div>No medicines selected.</div>'}
        </div>
      </div>
    </div>`;
  });

  container.innerHTML = html;
}

function editSavedNote(index){
  if(!currentPetView) return;
  const owner = owners.find(o=>o.code===currentPetView.ownerCode);
  if(!owner) return;
  const pet = owner.pets.find(p=>p.id===currentPetView.petId);
  if(!pet || !pet.notes || !pet.notes[index]) return;

  const note = pet.notes[index];
  currentPetNoteDraft = {
    editingIndex: index,
    symptoms: note.symptoms ? note.symptoms.slice() : [],
    medicines: {
      Antibiotics: note.medicines?.Antibiotics ? note.medicines.Antibiotics.slice() : [],
      Vitamins: note.medicines?.Vitamins ? note.medicines.Vitamins.slice() : [],
      Others: note.medicines?.Others ? note.medicines.Others.slice() : []
    }
  };

  const noteInput = document.getElementById('noteSymptomsInput');
  if(noteInput) noteInput.value = '';
  updateSymptomsPreview();
  renderSelectedMedicines();
  openAddNotePanel();
}

function deleteSavedNote(index){
  if(!currentPetView) return;
  const owner = owners.find(o=>o.code===currentPetView.ownerCode);
  if(!owner) return;
  const pet = owner.pets.find(p=>p.id===currentPetView.petId);
  if(!pet || !pet.notes || !pet.notes[index]) return;

  if(confirm('Are you sure you want to delete this note?')){
    pet.notes.splice(index, 1);
    renderSavedNoteDisplay(pet);
    saveData();
  }
}

function saveTreatment(){
  if(!currentPetView) return;
  const owner = owners.find(o => o.code === currentPetView.ownerCode);
  if(!owner) return;
  const pet = owner.pets.find(p => p.id === currentPetView.petId);
  if(!pet) return;

  const date = document.getElementById('treatmentDate').value;
  const vaccineType = document.getElementById('treatmentType').value.trim();
  const nextDate = document.getElementById('treatmentNextDate').value;
  const doctor = document.getElementById('petLastStaff').value;

  if(!date || !vaccineType || !doctor){
    alert('Please enter treatment date, type, and doctor.');
    return;
  }

  pet.treatments = pet.treatments || [];
  pet.treatments.push({
    date,
    vaccineType,
    nextDate: nextDate || 'N/A',
    doctor
  });

  document.getElementById('treatmentDate').value = '';
  document.getElementById('treatmentType').value = '';
  document.getElementById('treatmentNextDate').value = '';

  showPetDetails(currentPetView.ownerCode, currentPetView.petId);
  alert('Treatment has been added.');
}

function closePetDetails(){
  console.log('closePetDetails called');
  const modal = document.getElementById('petDetailsModal');
  if(modal){
    modal.classList.add('hidden');
  }
  currentPetView = null;
}

function promptDeleteOwner(ownerCode){
  closePetDetails();
  currentDeleteTarget = { type: 'owner', ownerCode };
  deleteCountdown = 5;
  const confirmBtn = document.getElementById('confirmDeleteBtn');
  confirmBtn.disabled = true;
  confirmBtn.textContent = `Delete (${deleteCountdown}s)`;
  document.getElementById('modalText').textContent = 'Are you sure you want to delete this owner?';
  document.getElementById('confirmationModal').classList.remove('hidden');
  if(deleteTimer) clearInterval(deleteTimer);
  deleteTimer = setInterval(() => {
    deleteCountdown -= 1;
    if(deleteCountdown > 0){
      confirmBtn.textContent = `Delete (${deleteCountdown}s)`;
    } else {
      clearInterval(deleteTimer);
      deleteTimer = null;
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Delete';
    }
  }, 1000);
}

function promptDeletePet(ownerCode, petId){
  closePetDetails();
  currentDeleteTarget = { type: 'pet', ownerCode, petId };
  deleteCountdown = 5;
  const confirmBtn = document.getElementById('confirmDeleteBtn');
  confirmBtn.disabled = true;
  confirmBtn.textContent = `Delete (${deleteCountdown}s)`;
  document.getElementById('modalText').textContent = 'Are you sure you want to delete this pet?';
  document.getElementById('confirmationModal').classList.remove('hidden');
  if(deleteTimer) clearInterval(deleteTimer);
  deleteTimer = setInterval(() => {
    deleteCountdown -= 1;
    if(deleteCountdown > 0){
      confirmBtn.textContent = `Delete (${deleteCountdown}s)`;
    } else {
      clearInterval(deleteTimer);
      deleteTimer = null;
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Delete';
    }
  }, 1000);
}

function cancelDelete(){
  if(deleteTimer) { clearInterval(deleteTimer); deleteTimer = null; }
  currentDeleteTarget = null;
  document.getElementById('confirmationModal').classList.add('hidden');
}

function deleteOwnerConfirmed(){
  if(!currentDeleteTarget) return;

  if(currentDeleteTarget.type==='owner'){
    owners = owners.filter(o=>o.code!==currentDeleteTarget.ownerCode);
  } else if(currentDeleteTarget.type==='pet'){
    const owner = owners.find(o=>o.code===currentDeleteTarget.ownerCode);
    if(owner){
      owner.pets = owner.pets.filter(p=>p.id!==currentDeleteTarget.petId);
    }
  }

  currentDeleteTarget = null;
  if(deleteTimer){ clearInterval(deleteTimer); deleteTimer=null; }
  document.getElementById('confirmationModal').classList.add('hidden');
  renderOwners();
  saveData();
}

function setActiveMenu(menuId){
  document.querySelectorAll('.sidebar .menu').forEach(btn=>btn.classList.remove('active'));
  const activeBtn = document.getElementById(menuId);
  if(activeBtn) activeBtn.classList.add('active');
}

function showDashboard(){
  document.getElementById('registerPage').style.display='none';
  document.getElementById('dashboardPage').style.display='block';
  document.getElementById('queuePage').style.display='none';
  document.getElementById('excelLogPage').style.display='none';
  setActiveMenu('dashboardMenu');
}

function showRegister(){
  document.getElementById('registerPage').style.display='block';
  document.getElementById('dashboardPage').style.display='none';
  document.getElementById('queuePage').style.display='none';
  document.getElementById('excelLogPage').style.display='none';
  setActiveMenu('registerMenu');
}

function showQueue(){
  document.getElementById('registerPage').style.display='none';
  document.getElementById('dashboardPage').style.display='none';
  document.getElementById('queuePage').style.display='block';
  document.getElementById('excelLogPage').style.display='none';
  setActiveMenu('queueMenu');
  renderQueue();
}

function showExcelLog(){
  document.getElementById('registerPage').style.display='none';
  document.getElementById('dashboardPage').style.display='none';
  document.getElementById('queuePage').style.display='none';
  document.getElementById('excelLogPage').style.display='block';
  setActiveMenu('excelLogMenu');
  renderExcelLog();
}

function searchOwner(){
  const input=document.getElementById('searchInput').value.toLowerCase();
  const container=document.getElementById('ownerList');
  container.innerHTML='';

  owners.filter(o =>
    o.name.toLowerCase().includes(input) ||
    o.code.toLowerCase().includes(input)
  ).forEach(owner => {
    let petsHTML='';
    owner.pets.forEach(p => {
      petsHTML += `<div class="petTag" onclick="showPetDetails('${owner.code}','${p.id}')">${p.name}</div>`;
    });

    container.innerHTML += `
<div class="ownerCard">
<div class="actions">
<i class="fa fa-pen" onclick="editOwner('${owner.code}')"></i>
<i class="fa fa-trash" onclick="promptDeleteOwner('${owner.code}')"></i>
</div>
<div class="ownerTop">
<div class="avatar" title="Add to queue" onclick="queueOwner('${owner.code}')" onmouseenter="avatarHover(this,true)" onmouseleave="avatarHover(this,false)">${owner.name.charAt(0)}</div>
<div class="ownerInfo">
<h2>${owner.name}</h2>
<div class="ownerCode">${owner.pets.length} pets &nbsp;&nbsp; ${owner.code}</div>
</div>
</div>
<div class="infoRow"><div><i class="fa fa-phone"></i> ${owner.phone}</div><div><i class="fa fa-calendar"></i> ${owner.dob}</div></div>
<div class="infoRow"><div><i class="fa fa-location-dot"></i> ${owner.location}</div></div>
<div class="pets"><b>Pets:</b>${petsHTML}<div class="addPet" onclick="addPet('${owner.code}')">+</div></div>
</div>
`;
  });
}

function showRegistrationModal(){
  if(!pendingOwner) return;
  document.getElementById('regName').textContent = pendingOwner.name;
  document.getElementById('regPhone').textContent = pendingOwner.phone;
  document.getElementById('regDob').textContent = pendingOwner.dob;
  document.getElementById('regLocation').textContent = pendingOwner.location;
  document.getElementById('regCode').textContent = pendingOwner.code;
  document.getElementById('registrationModal').classList.remove('hidden');
}

function cancelRegistration(){
  pendingOwner = null;
  document.getElementById('registrationModal').classList.add('hidden');
  clearForm();
  generateCode();
}

function confirmRegistration(){
  if(!pendingOwner) return;
  owners.push(pendingOwner);
  pendingOwner = null;
  document.getElementById('registrationModal').classList.add('hidden');
  clearForm();
  renderOwners();
  saveData();
  showDashboard();
}

function printRegistration(){
  window.print();
}

// EXCEL LOG ENTRY BUILDER
// Returns an array of entries - one row per saved note (not concatenated)
// Each note becomes a separate row with its own Save Date, Symptoms, and Medication
// Notes are sorted chronologically (oldest to newest)
function buildExcelEntry(owner, pet){
  const allNotes = Array.isArray(pet.notes) ? pet.notes : [];
  
  // If no notes, create one entry with empty note fields
  if (allNotes.length === 0) {
    return [{
      id: 'log_' + owner.code + '_' + pet.id + '_' + Date.now(),
      dateLogged: new Date().toISOString().split('T')[0],
      ownerName: owner.name,
      cellNumber: owner.phone,
      birthDate: owner.dob,
      address: owner.location,
      ownerCode: owner.code,
      petName: pet.name,
      liveStock: pet.type,
      sex: pet.gender,
      zipCode: owner.code,
      saveDate: '',
      symptoms: '',
      medication: ''
    }];
  }
  
  // Sort notes by createdAt ascending (oldest to newest)
  const sortedNotes = allNotes.slice().sort((a, b) => {
    const dateA = new Date(a.createdAt || 0);
    const dateB = new Date(b.createdAt || 0);
    return dateA - dateB;
  });
  
  // Create one entry per note
  return sortedNotes.map((note, idx) => {
    const medications = [
      ...(note.medicines?.Antibiotics || []),
      ...(note.medicines?.Vitamins || []),
      ...(note.medicines?.Others || [])
    ].filter(Boolean).join('; ');
    
    return {
      id: 'log_' + owner.code + '_' + pet.id + '_' + idx + '_' + (note.createdAt || Date.now()),
      dateLogged: new Date().toISOString().split('T')[0],
      ownerName: owner.name,
      cellNumber: owner.phone,
      birthDate: owner.dob,
      address: owner.location,
      ownerCode: owner.code,
      petName: pet.name,
      liveStock: pet.type,
      sex: pet.gender,
      zipCode: owner.code,
      saveDate: note.createdAt ? note.createdAt.split('T')[0] : '',
      symptoms: Array.isArray(note.symptoms) ? note.symptoms.filter(Boolean).join('; ') : '',
      medication: medications
    };
  });
}

function printPet(ownerCode, petId){
  const owner = owners.find(o => o.code === ownerCode);
  if(!owner) return;
  
  const pet = owner.pets.find(p => p.id === petId);
  if(!pet) return;
  
  // buildExcelEntry now returns an array of entries (one per note)
  const newEntries = buildExcelEntry(owner, pet);
  appendExcelLogEntries(newEntries);
  renderExcelLog();
  
  alert('Pet information has been added to Excel Log!');
}

function extractAllData(){
  const newEntries = [];
  owners.forEach(owner => {
    if(!Array.isArray(owner.pets)) return;
    owner.pets.forEach(pet => {
      // buildExcelEntry now returns an array of entries (one per note)
      const entries = buildExcelEntry(owner, pet);
      newEntries.push(...entries);
    });
  });
  appendExcelLogEntries(newEntries);
  renderExcelLog();
  alert('All pet data has been extracted to Excel Log.');
}

function renderExcelLog(){
  const tbody = document.getElementById('excelLogBody');
  if(!tbody) return;
  
  tbody.innerHTML = '';
  
  // Get filter values
  const searchTerm = (document.getElementById('excelLogSearch')?.value || '').toLowerCase();
  const filterType = document.getElementById('excelLogFilter')?.value || 'all';
  
  // Filter entries
  let filteredEntries = excelLogEntries.filter(entry => {
    // Search filter - searches in owner name, pet name, address
    const matchesSearch = !searchTerm || 
      entry.ownerName.toLowerCase().includes(searchTerm) ||
      (entry.petName && entry.petName.toLowerCase().includes(searchTerm)) ||
      entry.address.toLowerCase().includes(searchTerm);
    
    // Type filter
    const matchesFilter = filterType === 'all' || entry.liveStock === filterType;
    
    return matchesSearch && matchesFilter;
  });
  
  if(filteredEntries.length === 0){
    tbody.innerHTML = '<tr><td colspan="14" style="padding:40px; text-align:center; color:#5f7f8b;">No records yet. Click the print icon on a pet to add entries.</td></tr>';
    return;
  }
  
  filteredEntries.forEach((entry, index) => {
    const row = document.createElement('tr');
    row.style.background = index % 2 === 0 ? '#ffffff' : '#f8fcfc';
    row.style.borderBottom = '1px solid #e6eff1';
    
    row.innerHTML = `
      <td style="padding:12px 10px; text-align:center; font-size:13px; font-weight:700;">${index + 1}</td>
      <td style="padding:12px 10px; text-align:center; font-size:13px;">${entry.dateLogged}</td>
      <td style="padding:12px 10px; text-align:center; font-size:13px;">${entry.ownerName}</td>
      <td style="padding:12px 10px; text-align:center; font-size:13px;">${entry.cellNumber}</td>
      <td style="padding:12px 10px; text-align:center; font-size:13px;">${entry.birthDate}</td>
      <td style="padding:12px 10px; text-align:center; font-size:13px;">${entry.address}</td>
      <td style="padding:12px 10px; text-align:center; font-size:13px;">${entry.ownerCode || entry.zipCode || ''}</td>
      <td style="padding:12px 10px; text-align:center; font-size:13px; font-weight:600; color:#1f7d82;">${entry.petName || '-'}</td>
      <td style="padding:12px 10px; text-align:center; font-size:13px;">${entry.liveStock}</td>
      <td style="padding:12px 10px; text-align:center; font-size:13px;">${entry.sex}</td>
      <td style="padding:12px 10px; text-align:center; font-size:13px;">${entry.saveDate || entry.dateLogged}</td>
      <td style="padding:12px 10px; text-align:center; font-size:13px;">
        <input type="text" value="${entry.symptoms}" 
          onchange="updateExcelLogField('${entry.id}', 'symptoms', this.value)"
          style="width:100%; padding:6px 8px; border:1px solid #d5e8ec; border-radius:6px; text-align:center;">
      </td>
      <td style="padding:12px 10px; text-align:center; font-size:13px;">
        <input type="text" value="${entry.medication}" 
          onchange="updateExcelLogField('${entry.id}', 'medication', this.value)"
          style="width:100%; padding:6px 8px; border:1px solid #d5e8ec; border-radius:6px; text-align:center;">
      </td>
      <td style="padding:12px 10px; text-align:center;">
        <i class="fa fa-pen" style="cursor:pointer; margin-right:8px; color:#1f7d82;" onclick="editExcelLogEntry('${entry.id}')" title="Edit"></i>
        <i class="fa fa-trash" style="cursor:pointer; color:#e74c3c;" onclick="deleteExcelLogEntry('${entry.id}')" title="Delete"></i>
      </td>
    `;
    
    tbody.appendChild(row);
  });
}

// Search function for Excel Log
function searchExcelLog(){
  renderExcelLog();
}

// Filter function for Excel Log
function filterExcelLog(){
  renderExcelLog();
}

window.addEventListener('storage', (event) => {
  if (event.key === EXCEL_LOG_KEY) {
    excelLogEntries = event.newValue ? JSON.parse(event.newValue) : [];
    renderExcelLog();
  }
  if (event.key === LAST_EXTRACTION_KEY) {
    updateLastExtractionInfoDisplay();
  }
});

function updateExcelLogField(entryId, field, value){
  refreshExcelLogFromStorage();
  const entry = excelLogEntries.find(e => e.id === entryId);
  if(!entry) return;
  entry[field] = value;
  saveExcelLogEntries(excelLogEntries);
}

function editExcelLogEntry(entryId){
  refreshExcelLogFromStorage();
  const entryIndex = excelLogEntries.findIndex(e => e.id === entryId);
  if(entryIndex === -1) return;
  const entry = excelLogEntries[entryIndex];
  
  const newOwnerName = prompt('Edit Owner Name:', entry.ownerName);
  if(newOwnerName === null) return;
  
  const newCellNumber = prompt('Edit Cell Number:', entry.cellNumber);
  if(newCellNumber === null) return;
  
  const newBirthDate = prompt('Edit Birth Date:', entry.birthDate);
  if(newBirthDate === null) return;
  
  const newAddress = prompt('Edit Address:', entry.address);
  if(newAddress === null) return;
  
  const newPetName = prompt('Edit Pet Name:', entry.petName || '');
  if(newPetName === null) return;
  
  const newLiveStock = prompt('Edit Pets / LiveStock:', entry.liveStock);
  if(newLiveStock === null) return;
  
  const newSex = prompt('Edit Sex:', entry.sex);
  if(newSex === null) return;
  
  const newZipCode = prompt('Edit Zip Code:', entry.zipCode);
  if(newZipCode === null) return;
  
  excelLogEntries[entryIndex] = {
    ...entry,
    ownerName: newOwnerName,
    cellNumber: newCellNumber,
    birthDate: newBirthDate,
    address: newAddress,
    petName: newPetName,
    liveStock: newLiveStock,
    sex: newSex,
    zipCode: newZipCode
  };
  
  saveExcelLogEntries(excelLogEntries);
  renderExcelLog();
  alert('Entry updated successfully!');
}

function deleteExcelLogEntry(entryId){
  if(!confirm('Are you sure you want to delete this entry?')) return;
  
  refreshExcelLogFromStorage();
  excelLogEntries = excelLogEntries.filter(e => e.id !== entryId);
  saveExcelLogEntries(excelLogEntries);
  renderExcelLog();
  alert('Entry deleted successfully!');
}

// Load staff names for the petLastStaff dropdown
function loadStaffForDropdown() {
  const staffSelect = document.getElementById('petLastStaff');
  if (!staffSelect) return;
  
  // Clear existing options except the first one
  staffSelect.innerHTML = '<option value="">Select doctor</option>';
  
  // Load staff from localStorage
  const stored = localStorage.getItem('vetStaffList');
  if (stored) {
    const staffList = JSON.parse(stored);
    staffList.forEach(staff => {
      if (staff.fullName) {
        const option = document.createElement('option');
        option.value = 'Dr. ' + staff.fullName;
        option.textContent = 'Dr. ' + staff.fullName;
        staffSelect.appendChild(option);
      }
    });
  }
}