// --- GLOBAL VARIABLES FOR RESET TIMER ---
let resetTimer = null; // Used for WIPE ALL DATA
let countdownInterval = null; // Used for WIPE ALL DATA countdown

let contactDeleteTimer = null; // 🟢 NEW: Used for Delete Contact 🟢
let contactDeleteInterval = null; // 🟢 NEW: Used for Delete Contact countdown 🟢

const RESET_DURATION = 3000; // 3 seconds hold time


// --- CORE DATA FUNCTIONS (No major logic changes, only definitions) ---

function processNumbers(numberString) {
    if (!numberString) return [];
    return numberString.split('\n').map(n => n.trim()).filter(n => n.length > 0);
}

function loadContacts(filterGroup = 'ALL') {
    const contactsList = document.getElementById('contacts-list');
    contactsList.innerHTML = '';
    
    let contacts;
    try {
        contacts = JSON.parse(localStorage.getItem('cyberContacts')) || [];
    } catch (e) {
        console.error("Local storage error, resetting contacts.", e);
        localStorage.removeItem('cyberContacts');
        contacts = [];
    }
    
    let filteredContacts = contacts;
    if (filterGroup === 'NONE') {
        filteredContacts = contacts.filter(contact => !contact.group || contact.group === 'NONE');
    } else if (filterGroup !== 'ALL') {
        filteredContacts = contacts.filter(contact => contact.group === filterGroup);
    }
    
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    
    if (searchTerm) {
        filteredContacts = filteredContacts.filter(contact => {
            const allNumbers = (contact.numbers || []).join(' ');
            const searchableText = `${contact.name} ${contact.details} ${allNumbers} ${contact.group || ''}`.toLowerCase();
            return searchableText.includes(searchTerm);
        });
    }

    if (filteredContacts.length === 0 && contacts.length > 0) {
        contactsList.innerHTML = `
            <div class="contact-card no-contacts" style="justify-content: center; text-align: center; opacity: 0.6; cursor: default;">
                <p>--- NO CONTACTS FOUND ---<br>Adjust filter or clear search box.</p>
            </div>
        `;
        return;
    } else if (contacts.length === 0) {
        contactsList.innerHTML = `
            <div class="contact-card no-contacts" style="justify-content: center; text-align: center; opacity: 0.6; cursor: default;">
                <p>--- NO CONTACTS FOUND ---<br>Click 'NEW DATA ENTRY' to begin logging.</p>
            </div>
        `;
        return;
    }

    filteredContacts.forEach((contact, index) => {
        const originalIndex = contacts.indexOf(contact); 

        const contactCard = document.createElement('div');
        contactCard.classList.add('contact-card');
        contactCard.setAttribute('onclick', `openViewModal(${originalIndex})`); 

        const primaryNumber = (contact.numbers && contact.numbers.length > 0) 
            ? contact.numbers[0] 
            : '--- NO NUMBER ---';
        
        contactCard.innerHTML = `
            <div class="contact-card-content">
                <span class="contact-name">${contact.name}</span>
                <span class="contact-number-label">PRY ID:</span>
                <span class="contact-number">${primaryNumber}</span>
            </div>
            <button class="group-button" onclick="event.stopPropagation(); openGroupAssignmentModal(${originalIndex})">G</button>
        `;
        contactsList.appendChild(contactCard);
    });

    populateGroupSelect();
}


function saveContact() {
    const name = document.getElementById('add-name').value.trim();
    const numberString = document.getElementById('add-numbers').value;
    const details = document.getElementById('add-details').value.trim();

    const numbers = processNumbers(numberString);

    if (!name || numbers.length === 0) {
        alert("ERROR: Name and at least ONE number must be filled for data integrity.");
        return;
    }

    const newContact = { name, numbers, details, group: 'NONE' }; 

    const contacts = JSON.parse(localStorage.getItem('cyberContacts')) || [];
    contacts.push(newContact);
    localStorage.setItem('cyberContacts', JSON.stringify(contacts));

    document.getElementById('add-modal').style.display = 'none';
    loadContacts(); 
    alert(`SUCCESS: Contact "${name}" saved.`);
}

function editContact() {
    const index = document.getElementById('contact-index').value;
    const name = document.getElementById('add-name').value.trim();
    const numberString = document.getElementById('add-numbers').value;
    const details = document.getElementById('add-details').value.trim();

    const numbers = processNumbers(numberString);

    if (!name || numbers.length === 0) {
        alert("ERROR: Name and at least ONE number must be filled for data integrity.");
        return;
    }

    const contacts = JSON.parse(localStorage.getItem('cyberContacts')) || [];
    
    if (contacts[index]) {
        const existingGroup = contacts[index].group || 'NONE';
        contacts[index] = { name, numbers, details, group: existingGroup }; 
        localStorage.setItem('cyberContacts', JSON.stringify(contacts));
        
        document.getElementById('add-modal').style.display = 'none';
        loadContacts();
        alert(`SUCCESS: Contact "${name}" updated.`);
    } else {
        alert("ERROR: Contact not found for update.");
    }
}

function assignGroup(index, groupName) {
    const contacts = JSON.parse(localStorage.getItem('cyberContacts')) || [];
    const contact = contacts[index];

    if (contact) {
        contact.group = groupName;
        localStorage.setItem('cyberContacts', JSON.stringify(contacts));
        
        document.getElementById('group-modal').style.display = 'none';
        loadContacts(document.getElementById('group-filter-select').value);
        alert(`Contact ${contact.name} assigned to group: ${groupName || 'NONE'}`);
    }
}

// 🟢 MODIFIED: The function now takes the index from the hidden input field
function deleteContact() {
    // Get the index from the hidden field set by openViewModal
    const index = document.getElementById('delete-contact-index').value;
    
    // Safety check: if no index is set, abort
    if (index === "" || index === null) {
        console.error("Error: Attempted to delete contact without a valid index.");
        return;
    }

    const contacts = JSON.parse(localStorage.getItem('cyberContacts'));
    const contactName = contacts[index] ? contacts[index].name : 'Unknown Contact';

    // No need for a separate confirmation prompt, as the hold action confirms the intent.
    
    // Perform the deletion
    contacts.splice(index, 1);
    localStorage.setItem('cyberContacts', JSON.stringify(contacts));
    
    document.getElementById('view-modal').style.display = 'none'; 
    loadContacts(); 
    alert(`Contact "${contactName}" ERASED.`);
}

function exportContacts() {
    const contacts = JSON.parse(localStorage.getItem('cyberContacts')) || [];
    if (contacts.length === 0) {
        alert("Database is empty. Nothing to export.");
        return;
    }
    
    const jsonString = JSON.stringify(contacts, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cyber_contacts_backup.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert(`SUCCESS: ${contacts.length} contacts exported to cyber_contacts_backup.json`);
}

function resetAllData() {
    localStorage.removeItem('cyberContacts');
    
    // Stop shake and reset button immediately
    document.getElementById('app-container').classList.remove('shake-active');
    document.getElementById('reset-button').classList.remove('active');
    document.getElementById('reset-button').textContent = "WIPE ALL DATA";

    loadContacts(); 
    alert("DATABASE WIPE SUCCESSFUL. All contacts have been erased.");
}

// ------------------------------------------------------------------
// WIPE ALL DATA LOGIC
// ------------------------------------------------------------------

function startEraseCountdown() {
    const resetButton = document.getElementById('reset-button');
    const appContainer = document.getElementById('app-container');

    if (resetTimer) return;
    
    resetButton.classList.add('active');
    appContainer.classList.add('shake-active');

    let count = RESET_DURATION / 1000;
    
    resetButton.textContent = `ERASING IN... ${count}s`;
    
    countdownInterval = setInterval(() => {
        count -= 1;
        if (count > 0) {
            resetButton.textContent = `ERASING IN... ${count}s`;
        }
    }, 1000);


    resetTimer = setTimeout(() => {
        clearInterval(countdownInterval);
        countdownInterval = null;
        resetTimer = null;
        
        resetAllData();
    }, RESET_DURATION);
}

function cancelEraseCountdown() {
    const resetButton = document.getElementById('reset-button');
    const appContainer = document.getElementById('app-container');

    if (resetTimer) {
        clearTimeout(resetTimer);
        resetTimer = null;
        
        clearInterval(countdownInterval);
        countdownInterval = null;

        resetButton.classList.remove('active');
        appContainer.classList.remove('shake-active');
        resetButton.textContent = "WIPE ALL DATA";
    }
}

// ------------------------------------------------------------------
// 🟢 NEW: DELETE CONTACT LOGIC 🟢
// ------------------------------------------------------------------

function startContactDeleteCountdown() {
    const deleteButton = document.getElementById('detail-delete-button');
    const viewModalContent = document.getElementById('view-modal-content');

    if (contactDeleteTimer) return;
    
    deleteButton.classList.add('active');
    viewModalContent.classList.add('shake-delete');

    let count = RESET_DURATION / 1000;
    
    deleteButton.textContent = `ERASING IN... ${count}s`;
    
    contactDeleteInterval = setInterval(() => {
        count -= 1;
        if (count > 0) {
            deleteButton.textContent = `ERASING IN... ${count}s`;
        }
    }, 1000);


    contactDeleteTimer = setTimeout(() => {
        clearInterval(contactDeleteInterval);
        contactDeleteInterval = null;
        contactDeleteTimer = null;
        
        // Execute the deletion
        deleteContact();
    }, RESET_DURATION);
}

function cancelContactDeleteCountdown() {
    const deleteButton = document.getElementById('detail-delete-button');
    const viewModalContent = document.getElementById('view-modal-content');


    if (contactDeleteTimer) {
        clearTimeout(contactDeleteTimer);
        contactDeleteTimer = null;
        
        clearInterval(contactDeleteInterval);
        contactDeleteInterval = null;

        deleteButton.classList.remove('active');
        viewModalContent.classList.remove('shake-delete');
        deleteButton.textContent = "[ PERMANENTLY ERASE DATA ]";
    }
}

// ------------------------------------------------------------------
// UI / MODAL FUNCTIONS
// ------------------------------------------------------------------

function openAddModal() {
    document.getElementById('modal-title').textContent = '> INPUT NEW CONTACT DATA';
    document.getElementById('save-edit-button').textContent = '[ SAVE & COMMIT DATA ]';
    document.getElementById('save-edit-button').onclick = saveContact;
    document.getElementById('contact-index').value = ''; 
    
    document.getElementById('add-name').value = '';
    document.getElementById('add-numbers').value = ''; 
    document.getElementById('add-details').value = '';
    
    document.getElementById('add-modal').style.display = 'flex';
}

// 🟢 MODIFIED: Store the index in a hidden field 🟢
function openViewModal(index) {
    const contacts = JSON.parse(localStorage.getItem('cyberContacts')) || [];
    const contact = contacts[index];

    if (!contact) return;

    // Store the index for the hold-to-delete function to access
    document.getElementById('delete-contact-index').value = index; 

    document.getElementById('detail-name').textContent = contact.name || '--- UNKNOWN ---';
    document.getElementById('detail-details').textContent = contact.details || '--- NO NOTES ON FILE ---';
    document.getElementById('detail-group').textContent = contact.group || '--- NONE ---';
    
    const numbersBox = document.getElementById('detail-numbers-box');
    numbersBox.innerHTML = `<span class="detail-label">ID NUMBERS:</span>`;

    if (contact.numbers && contact.numbers.length > 0) {
        contact.numbers.forEach(num => {
            const numSpan = document.createElement('span');
            numSpan.classList.add('detail-number-item');
            numSpan.textContent = num;
            numbersBox.appendChild(numSpan);
        });
    } else {
        numbersBox.innerHTML += '<span class="detail-number-item">--- NO NUMBER(S) ON FILE ---</span>';
    }
    
    // Set up the EDIT button with the correct index
    const editButton = document.getElementById('detail-edit-button');
    editButton.setAttribute('onclick', `openEditModal(${index})`);

    // Reset delete button state every time the modal is opened
    const deleteButton = document.getElementById('detail-delete-button');
    deleteButton.textContent = "[ PERMANENTLY ERASE DATA ]";
    deleteButton.classList.remove('active');
    document.getElementById('view-modal-content').classList.remove('shake-delete');


    document.getElementById('view-modal').style.display = 'flex';
}

function openEditModal(index) {
    const contacts = JSON.parse(localStorage.getItem('cyberContacts')) || [];
    const contact = contacts[index];
    
    if (!contact) return;
    
    document.getElementById('view-modal').style.display = 'none';
    
    document.getElementById('modal-title').textContent = '> EDIT CONTACT DATA FILE';
    document.getElementById('save-edit-button').textContent = '[ UPDATE & COMMIT ]';
    document.getElementById('save-edit-button').onclick = editContact;

    document.getElementById('contact-index').value = index;

    document.getElementById('add-name').value = contact.name;
    document.getElementById('add-numbers').value = (contact.numbers || []).join('\n'); 
    document.getElementById('add-details').value = contact.details;
    
    document.getElementById('add-modal').style.display = 'flex';
}

function openGroupAssignmentModal(index) {
    const contacts = JSON.parse(localStorage.getItem('cyberContacts')) || [];
    const contact = contacts[index];
    
    if (!contact) return;

    const groupName = prompt(`Assign a group name for ${contact.name}: \n(e.g., Family, Friends, Work, or type NONE to clear)\n\nCurrent Group: ${contact.group || 'NONE'}`);

    if (groupName !== null) {
        const cleanGroupName = groupName.trim().toUpperCase() || 'NONE'; 
        assignGroup(index, cleanGroupName);
    }
}

function populateGroupSelect() {
    const contacts = JSON.parse(localStorage.getItem('cyberContacts')) || [];
    const select = document.getElementById('group-filter-select');
    
    const groups = new Set(contacts.map(c => c.group).filter(g => g && g !== 'NONE'));
    const sortedGroups = Array.from(groups).sort();

    const currentFilter = select.value;

    select.innerHTML = `
        <option value="ALL">-- VIEW ALL GROUPS --</option>
        <option value="NONE">-- NO GROUP ASSIGNED --</option>
    `;
    
    sortedGroups.forEach(group => {
        const option = document.createElement('option');
        option.value = group;
        option.textContent = group;
        select.appendChild(option);
    });

    select.value = currentFilter;
}

function filterContactsByGroup(groupName) {
    loadContacts(groupName);
}

function closeModal(event, modalId) {
    if (event.target.id === modalId) {
        document.getElementById(modalId).style.display = 'none';
    }
}

function searchContacts() {
    const currentFilter = document.getElementById('group-filter-select').value;
    loadContacts(currentFilter);
}


function handleCSVUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (typeof Papa === 'undefined') {
        alert("ERROR: PapaParse library failed to load. Please check your internet connection and reload the page.");
        return;
    }

    Papa.parse(file, {
        header: true, 
        skipEmptyLines: true,
        complete: function(results) {
            const importedContacts = [];
            const existingContacts = JSON.parse(localStorage.getItem('cyberContacts')) || [];
            let importCount = 0;

            results.data.forEach(row => {
                const contactName = row['Name'] || row['First Name'] || 'Unknown Contact';
                const contactDetails = row['Notes'] || '';

                const contactNumbers = [];
                if (row['Phone 1 - Value']) contactNumbers.push(row['Phone 1 - Value'].trim());
                if (row['Phone 2 - Value']) contactNumbers.push(row['Phone 2 - Value'].trim());
                if (row['Mobile Phone']) contactNumbers.push(row['Mobile Phone'].trim());
                
                const primaryNumberFallback = row['Phone 1 - Type'];
                if (primaryNumberFallback && !contactNumbers.includes(primaryNumberFallback)) {
                     contactNumbers.push(primaryNumberFallback.trim());
                }

                const uniqueNumbers = [...new Set(contactNumbers.filter(n => n.length > 0))]; 

                if (contactName && uniqueNumbers.length > 0) {
                    importedContacts.push({
                        name: contactName.trim(),
                        numbers: uniqueNumbers, 
                        details: contactDetails.trim(),
                        group: 'IMPORTED' 
                    });
                    importCount++;
                }
            });

            if (importedContacts.length > 0) {
                const updatedContacts = existingContacts.concat(importedContacts);
                localStorage.setItem('cyberContacts', JSON.stringify(updatedContacts));
                loadContacts(); 
                alert(`[SUCCESS] ${importCount} contacts successfully imported from CSV. Assigned to 'IMPORTED' group.`);
            } else {
                alert("[WARNING] No valid contacts with names and numbers found in the CSV file.");
            }
        },
        error: function(error) {
            alert("[ERROR] Failed to parse CSV file: " + error.message);
        }
    });

    event.target.value = ''; 
}

// Load contacts and groups when the page first loads
window.onload = function() {
    loadContacts(); 
    populateGroupSelect();
};