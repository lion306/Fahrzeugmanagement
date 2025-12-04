// Fahrzeugmanagement App

// ===== SETTINGS MANAGER =====
class SettingsManager {
    constructor() {
        this.categories = ['fremdfirmen', 'aufbereiter', 'hersteller', 'herkunft'];
        this.settings = this.loadSettings();
        this.init();
    }

    // Initialisierung
    init() {
        this.bindElements();
        this.bindEvents();
        this.renderAllLists();
    }

    // DOM-Elemente binden
    bindElements() {
        this.modal = document.getElementById('settings-modal');
        this.settingsBtn = document.getElementById('settings-btn');
        this.closeBtn = document.getElementById('settings-close');
        this.tabBtns = document.querySelectorAll('.tab-btn');
        this.tabPanes = document.querySelectorAll('.tab-pane');
    }

    // Event-Listener binden
    bindEvents() {
        // Modal öffnen/schließen
        this.settingsBtn.addEventListener('click', () => this.openModal());
        this.closeBtn.addEventListener('click', () => this.closeModal());
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.closeModal();
        });

        // Tab-Navigation
        this.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });

        // Enter-Taste für Inputs
        this.categories.forEach(category => {
            const input = document.getElementById(`new-${category.slice(0, -1)}`);
            if (input) {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        this.addItem(category);
                    }
                });
            }
        });

        // Escape-Taste zum Schließen
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('active')) {
                this.closeModal();
            }
        });
    }

    // Einstellungen aus LocalStorage laden
    loadSettings() {
        const data = localStorage.getItem('settings');
        return data ? JSON.parse(data) : {
            fremdfirmen: [],
            aufbereiter: [],
            hersteller: [],
            herkunft: []
        };
    }

    // Einstellungen in LocalStorage speichern
    saveSettings() {
        localStorage.setItem('settings', JSON.stringify(this.settings));
        // Dropdowns aktualisieren
        if (typeof vehicleManager !== 'undefined') {
            vehicleManager.updateDropdowns();
        }
    }

    // Modal öffnen
    openModal() {
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // Modal schließen
    closeModal() {
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Tab wechseln
    switchTab(tabName) {
        // Buttons aktualisieren
        this.tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Panes aktualisieren
        this.tabPanes.forEach(pane => {
            pane.classList.toggle('active', pane.id === `tab-${tabName}`);
        });
    }

    // Neues Element hinzufügen
    addItem(category) {
        const inputId = `new-${category.slice(0, -1)}`;
        const input = document.getElementById(inputId);
        const value = input.value.trim();

        if (!value) {
            this.showToast('Bitte geben Sie einen Namen ein', 'error');
            return;
        }

        // Prüfen ob bereits vorhanden
        if (this.settings[category].includes(value)) {
            this.showToast('Dieser Eintrag existiert bereits', 'error');
            return;
        }

        // Hinzufügen und speichern
        this.settings[category].push(value);
        this.settings[category].sort((a, b) => a.localeCompare(b, 'de'));
        this.saveSettings();
        this.renderList(category);

        // Input leeren
        input.value = '';
        input.focus();

        this.showToast('Eintrag erfolgreich hinzugefügt', 'success');
    }

    // Element löschen
    deleteItem(category, value) {
        if (confirm(`Möchten Sie "${value}" wirklich löschen?`)) {
            this.settings[category] = this.settings[category].filter(item => item !== value);
            this.saveSettings();
            this.renderList(category);
            this.showToast('Eintrag erfolgreich gelöscht', 'success');
        }
    }

    // Liste rendern
    renderList(category) {
        const listElement = document.getElementById(`list-${category}`);
        const items = this.settings[category];

        if (items.length === 0) {
            listElement.innerHTML = '<li class="empty-list-msg">Keine Einträge vorhanden</li>';
            return;
        }

        listElement.innerHTML = items.map(item => `
            <li>
                <span>${this.escapeHtml(item)}</span>
                <button class="btn-delete-item" onclick="settingsManager.deleteItem('${category}', '${this.escapeHtml(item).replace(/'/g, "\\'")}')">
                    Löschen
                </button>
            </li>
        `).join('');
    }

    // Alle Listen rendern
    renderAllLists() {
        this.categories.forEach(category => this.renderList(category));
    }

    // Werte für eine Kategorie abrufen
    getItems(category) {
        return this.settings[category] || [];
    }

    // HTML escapen (Sicherheit)
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Toast-Benachrichtigung anzeigen
    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

// ===== VEHICLE MANAGER =====
class VehicleManager {
    constructor() {
        this.vehicles = this.loadVehicles();
        this.editingId = null;
        this.init();
    }

    // Initialisierung
    init() {
        this.bindElements();
        this.bindEvents();
        this.updateDropdowns();
        this.render();
    }

    // DOM-Elemente binden
    bindElements() {
        this.form = document.getElementById('vehicle-form');
        this.vehicleIdInput = document.getElementById('vehicle-id');
        this.gwNrInput = document.getElementById('gw-nr');
        this.fahrgestellnummerInput = document.getElementById('fahrgestellnummer');
        this.herstellerSelect = document.getElementById('hersteller');
        this.modellInput = document.getElementById('modell');
        this.herkunftSelect = document.getElementById('herkunft');
        this.waNrInput = document.getElementById('wa-nr');
        this.fremdfirmaSelect = document.getElementById('fremdfirma');
        this.aufbereiterSelect = document.getElementById('aufbereiter');
        this.vehicleList = document.getElementById('vehicle-list');
        this.vehicleTable = document.getElementById('vehicle-table');
        this.noVehiclesMsg = document.getElementById('no-vehicles');
        this.vehicleCount = document.getElementById('vehicle-count');
        this.searchInput = document.getElementById('search-input');
        this.formTitle = document.getElementById('form-title');
        this.submitBtn = document.getElementById('submit-btn');
        this.cancelBtn = document.getElementById('cancel-btn');
    }

    // Event-Listener binden
    bindEvents() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.cancelBtn.addEventListener('click', () => this.cancelEdit());
        this.searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
    }

    // Dropdowns aktualisieren
    updateDropdowns() {
        this.populateSelect(this.herstellerSelect, settingsManager.getItems('hersteller'), '-- Bitte wählen --', true);
        this.populateSelect(this.herkunftSelect, settingsManager.getItems('herkunft'), '-- Bitte wählen --', true);
        this.populateSelect(this.fremdfirmaSelect, settingsManager.getItems('fremdfirmen'), '-- Keine --', false);
        this.populateSelect(this.aufbereiterSelect, settingsManager.getItems('aufbereiter'), '-- Keine --', false);
    }

    // Select-Element befüllen
    populateSelect(selectElement, items, defaultText, required) {
        const currentValue = selectElement.value;
        selectElement.innerHTML = `<option value="">${defaultText}</option>`;

        items.forEach(item => {
            const option = document.createElement('option');
            option.value = item;
            option.textContent = item;
            selectElement.appendChild(option);
        });

        // Vorherigen Wert wiederherstellen wenn möglich
        if (currentValue && items.includes(currentValue)) {
            selectElement.value = currentValue;
        }
    }

    // Fahrzeuge aus LocalStorage laden
    loadVehicles() {
        const data = localStorage.getItem('vehicles');
        return data ? JSON.parse(data) : [];
    }

    // Fahrzeuge in LocalStorage speichern
    saveVehicles() {
        localStorage.setItem('vehicles', JSON.stringify(this.vehicles));
    }

    // Eindeutige ID generieren
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Formular absenden
    handleSubmit(e) {
        e.preventDefault();

        const vehicleData = {
            gwNr: this.gwNrInput.value.trim(),
            fahrgestellnummer: this.fahrgestellnummerInput.value.trim(),
            hersteller: this.herstellerSelect.value,
            modell: this.modellInput.value.trim(),
            herkunft: this.herkunftSelect.value,
            waNr: this.waNrInput.value.trim(),
            fremdfirma: this.fremdfirmaSelect.value,
            aufbereiter: this.aufbereiterSelect.value
        };

        if (this.editingId) {
            // Fahrzeug aktualisieren
            this.updateVehicle(this.editingId, vehicleData);
            this.showToast('Fahrzeug erfolgreich aktualisiert', 'success');
        } else {
            // Neues Fahrzeug hinzufügen
            this.addVehicle(vehicleData);
            this.showToast('Fahrzeug erfolgreich angelegt', 'success');
        }

        this.resetForm();
        this.render();
    }

    // Neues Fahrzeug hinzufügen
    addVehicle(data) {
        const vehicle = {
            id: this.generateId(),
            ...data,
            createdAt: new Date().toISOString()
        };
        this.vehicles.push(vehicle);
        this.saveVehicles();
    }

    // Fahrzeug aktualisieren
    updateVehicle(id, data) {
        const index = this.vehicles.findIndex(v => v.id === id);
        if (index !== -1) {
            this.vehicles[index] = {
                ...this.vehicles[index],
                ...data,
                updatedAt: new Date().toISOString()
            };
            this.saveVehicles();
        }
    }

    // Fahrzeug löschen
    deleteVehicle(id) {
        if (confirm('Möchten Sie dieses Fahrzeug wirklich löschen?')) {
            this.vehicles = this.vehicles.filter(v => v.id !== id);
            this.saveVehicles();
            this.render();
            this.showToast('Fahrzeug erfolgreich gelöscht', 'success');
        }
    }

    // Fahrzeug bearbeiten
    editVehicle(id) {
        const vehicle = this.vehicles.find(v => v.id === id);
        if (vehicle) {
            this.editingId = id;
            this.gwNrInput.value = vehicle.gwNr;
            this.fahrgestellnummerInput.value = vehicle.fahrgestellnummer;
            this.herstellerSelect.value = vehicle.hersteller || '';
            this.modellInput.value = vehicle.modell;
            this.herkunftSelect.value = vehicle.herkunft || '';
            this.waNrInput.value = vehicle.waNr;
            this.fremdfirmaSelect.value = vehicle.fremdfirma || '';
            this.aufbereiterSelect.value = vehicle.aufbereiter || '';

            this.formTitle.textContent = 'Fahrzeug bearbeiten';
            this.submitBtn.textContent = 'Änderungen speichern';
            this.cancelBtn.style.display = 'inline-block';

            // Zum Formular scrollen
            this.form.scrollIntoView({ behavior: 'smooth' });
        }
    }

    // Bearbeitung abbrechen
    cancelEdit() {
        this.resetForm();
    }

    // Formular zurücksetzen
    resetForm() {
        this.form.reset();
        this.editingId = null;
        this.formTitle.textContent = 'Neues Fahrzeug anlegen';
        this.submitBtn.textContent = 'Fahrzeug speichern';
        this.cancelBtn.style.display = 'none';
    }

    // Suche
    handleSearch(query) {
        this.render(query.toLowerCase());
    }

    // Fahrzeuge rendern
    render(searchQuery = '') {
        let filteredVehicles = this.vehicles;

        // Filtern nach Suchbegriff
        if (searchQuery) {
            filteredVehicles = this.vehicles.filter(v =>
                (v.gwNr || '').toLowerCase().includes(searchQuery) ||
                (v.fahrgestellnummer || '').toLowerCase().includes(searchQuery) ||
                (v.hersteller || '').toLowerCase().includes(searchQuery) ||
                (v.modell || '').toLowerCase().includes(searchQuery) ||
                (v.herkunft || '').toLowerCase().includes(searchQuery) ||
                (v.waNr || '').toLowerCase().includes(searchQuery) ||
                (v.fremdfirma || '').toLowerCase().includes(searchQuery) ||
                (v.aufbereiter || '').toLowerCase().includes(searchQuery)
            );
        }

        // Anzahl aktualisieren
        this.vehicleCount.textContent = filteredVehicles.length;

        // Tabelle ein-/ausblenden
        if (filteredVehicles.length === 0) {
            this.vehicleTable.style.display = 'none';
            this.noVehiclesMsg.classList.add('visible');
        } else {
            this.vehicleTable.style.display = 'table';
            this.noVehiclesMsg.classList.remove('visible');
        }

        // Tabelleninhalt generieren
        this.vehicleList.innerHTML = filteredVehicles.map(vehicle => `
            <tr>
                <td>${this.escapeHtml(vehicle.gwNr || '')}</td>
                <td>${this.escapeHtml(vehicle.fahrgestellnummer || '')}</td>
                <td>${this.escapeHtml(vehicle.hersteller || '')}</td>
                <td>${this.escapeHtml(vehicle.modell || '')}</td>
                <td>${this.escapeHtml(vehicle.herkunft || '')}</td>
                <td>${this.escapeHtml(vehicle.waNr || '')}</td>
                <td>${this.escapeHtml(vehicle.fremdfirma || '-')}</td>
                <td>${this.escapeHtml(vehicle.aufbereiter || '-')}</td>
                <td class="actions-cell">
                    <button class="btn btn-icon btn-edit" onclick="vehicleManager.editVehicle('${vehicle.id}')" title="Bearbeiten">
                        ✏️
                    </button>
                    <button class="btn btn-icon btn-delete" onclick="vehicleManager.deleteVehicle('${vehicle.id}')" title="Löschen">
                        🗑️
                    </button>
                </td>
            </tr>
        `).join('');
    }

    // HTML escapen (Sicherheit)
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Toast-Benachrichtigung anzeigen
    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

// ===== APP STARTEN =====
// Wichtig: SettingsManager muss zuerst initialisiert werden
const settingsManager = new SettingsManager();
const vehicleManager = new VehicleManager();
