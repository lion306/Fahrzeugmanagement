// Fahrzeugmanagement App

// ===== SETTINGS MANAGER =====
class SettingsManager {
    constructor() {
        this.categories = ['fremdfirmen', 'aufbereiter', 'hersteller', 'herkunft'];
        // Mapping von Plural zu Singular für Input-IDs
        this.singularMap = {
            'fremdfirmen': 'fremdfirma',
            'aufbereiter': 'aufbereiter',
            'hersteller': 'hersteller',
            'herkunft': 'herkunft'
        };
        this.settings = this.loadSettings();
        this.eskalation = this.loadEskalation();
        this.init();
    }

    // Initialisierung
    init() {
        this.bindElements();
        this.bindEvents();
        this.renderAllLists();
        this.loadEskalationForm();
    }

    // DOM-Elemente binden
    bindElements() {
        this.modal = document.getElementById('settings-modal');
        this.settingsBtn = document.getElementById('settings-btn');
        this.closeBtn = document.getElementById('settings-close');
        this.tabBtns = document.querySelectorAll('.tab-btn');
        this.tabPanes = document.querySelectorAll('.tab-pane');
        this.eskalationForm = document.getElementById('eskalation-form');
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
            const input = document.getElementById(`new-${this.singularMap[category]}`);
            if (input) {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        this.addItem(category);
                    }
                });
            }
        });

        // Eskalation-Formular
        this.eskalationForm.addEventListener('submit', (e) => this.handleEskalationSubmit(e));

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

    // Eskalationsstufen aus LocalStorage laden
    loadEskalation() {
        const data = localStorage.getItem('eskalation');
        return data ? JSON.parse(data) : {
            lieferung: 14,
            werkstatt: 5,
            fremdfirma: 7,
            aufbereitung: 3
        };
    }

    // Eskalationsstufen in LocalStorage speichern
    saveEskalation() {
        localStorage.setItem('eskalation', JSON.stringify(this.eskalation));
        // Dashboard aktualisieren
        if (typeof dashboardManager !== 'undefined') {
            dashboardManager.render();
        }
    }

    // Eskalation-Formular laden
    loadEskalationForm() {
        document.getElementById('esk-lieferung').value = this.eskalation.lieferung;
        document.getElementById('esk-werkstatt').value = this.eskalation.werkstatt;
        document.getElementById('esk-fremdfirma').value = this.eskalation.fremdfirma;
        document.getElementById('esk-aufbereitung').value = this.eskalation.aufbereitung;
    }

    // Eskalation-Formular absenden
    handleEskalationSubmit(e) {
        e.preventDefault();
        this.eskalation = {
            lieferung: parseInt(document.getElementById('esk-lieferung').value) || 14,
            werkstatt: parseInt(document.getElementById('esk-werkstatt').value) || 5,
            fremdfirma: parseInt(document.getElementById('esk-fremdfirma').value) || 7,
            aufbereitung: parseInt(document.getElementById('esk-aufbereitung').value) || 3
        };
        this.saveEskalation();
        this.showToast('Eskalationsstufen erfolgreich gespeichert', 'success');
    }

    // Eskalationswerte abrufen
    getEskalation() {
        return this.eskalation;
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
        const inputId = `new-${this.singularMap[category]}`;
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

// ===== DASHBOARD MANAGER =====
class DashboardManager {
    constructor() {
        this.dashboardGrid = document.getElementById('dashboard-grid');
        this.noEscalations = document.getElementById('no-escalations');
    }

    // Tage seit einem Datum berechnen
    daysSince(dateString) {
        if (!dateString) return null;
        const date = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);
        const diffTime = today - date;
        return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }

    // Überfällige Fahrzeuge berechnen
    getOverdueVehicles() {
        const eskalation = settingsManager.getEskalation();
        const vehicles = vehicleManager.vehicles;

        const overdue = {
            lieferung: [],
            werkstatt: [],
            fremdfirma: [],
            aufbereitung: []
        };

        vehicles.forEach(vehicle => {
            // Lieferung überfällig: Einkaufsdatum gesetzt, aber noch nicht geliefert
            if (vehicle.einkaufsdatum && !vehicle.lieferdatum) {
                const days = this.daysSince(vehicle.einkaufsdatum);
                if (days >= eskalation.lieferung) {
                    overdue.lieferung.push({ ...vehicle, daysOverdue: days });
                }
            }

            // Werkstatt überfällig: Übergeben aber noch nicht zurück
            if (vehicle.werkstattUebergabe && !vehicle.werkstattZurueck) {
                const days = this.daysSince(vehicle.werkstattUebergabe);
                if (days >= eskalation.werkstatt) {
                    overdue.werkstatt.push({ ...vehicle, daysOverdue: days });
                }
            }

            // Fremdfirma überfällig
            if (vehicle.fremdfirmaUebergabe && !vehicle.fremdfirmaZurueck) {
                const days = this.daysSince(vehicle.fremdfirmaUebergabe);
                if (days >= eskalation.fremdfirma) {
                    overdue.fremdfirma.push({ ...vehicle, daysOverdue: days });
                }
            }

            // Aufbereitung überfällig
            if (vehicle.aufbereitungUebergabe && !vehicle.aufbereitungZurueck) {
                const days = this.daysSince(vehicle.aufbereitungUebergabe);
                if (days >= eskalation.aufbereitung) {
                    overdue.aufbereitung.push({ ...vehicle, daysOverdue: days });
                }
            }
        });

        // Nach Tagen sortieren (höchste zuerst)
        Object.keys(overdue).forEach(key => {
            overdue[key].sort((a, b) => b.daysOverdue - a.daysOverdue);
        });

        return overdue;
    }

    // Dashboard rendern
    render() {
        const overdue = this.getOverdueVehicles();
        const eskalation = settingsManager.getEskalation();

        const categories = [
            { key: 'lieferung', title: 'Lieferung überfällig', threshold: eskalation.lieferung },
            { key: 'werkstatt', title: 'Werkstatt überfällig', threshold: eskalation.werkstatt },
            { key: 'fremdfirma', title: 'Fremdfirma überfällig', threshold: eskalation.fremdfirma },
            { key: 'aufbereitung', title: 'Aufbereitung überfällig', threshold: eskalation.aufbereitung }
        ];

        // Prüfen ob es überfällige Fahrzeuge gibt
        const totalOverdue = Object.values(overdue).reduce((sum, arr) => sum + arr.length, 0);

        if (totalOverdue === 0) {
            this.dashboardGrid.innerHTML = '';
            this.dashboardGrid.style.display = 'none';
            this.noEscalations.classList.add('visible');
            return;
        }

        this.dashboardGrid.style.display = 'grid';
        this.noEscalations.classList.remove('visible');

        // Nur Kategorien mit überfälligen Fahrzeugen anzeigen
        const cardsHtml = categories
            .filter(cat => overdue[cat.key].length > 0)
            .map(cat => this.renderCard(cat.key, cat.title, overdue[cat.key], cat.threshold))
            .join('');

        this.dashboardGrid.innerHTML = cardsHtml;
    }

    // Einzelne Karte rendern
    renderCard(key, title, vehicles, threshold) {
        const vehiclesList = vehicles.map(v => `
            <li onclick="vehicleManager.openVehicleDetails('${v.id}')">
                <div class="dashboard-vehicle-info">
                    <span class="gw-nr">${this.escapeHtml(v.gwNr || '-')}</span>
                    <span class="vehicle-name">${this.escapeHtml(v.hersteller || '')} ${this.escapeHtml(v.modell || '')}</span>
                </div>
                <span class="dashboard-days-overdue">${v.daysOverdue} Tage</span>
            </li>
        `).join('');

        return `
            <div class="dashboard-card card-${key}">
                <div class="dashboard-card-header">
                    <h3>${title}</h3>
                    <span class="dashboard-card-count">${vehicles.length}</span>
                </div>
                <ul class="dashboard-card-list">
                    ${vehiclesList}
                </ul>
            </div>
        `;
    }

    // HTML escapen
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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
        // Hauptformular
        this.form = document.getElementById('vehicle-form');
        this.vehicleIdInput = document.getElementById('vehicle-id');
        this.gwNrInput = document.getElementById('gw-nr');
        this.fahrgestellnummerInput = document.getElementById('fahrgestellnummer');
        this.herstellerSelect = document.getElementById('hersteller');
        this.modellInput = document.getElementById('modell');
        this.herkunftSelect = document.getElementById('herkunft');
        this.waNrInput = document.getElementById('wa-nr');
        this.einkaufsdatumInput = document.getElementById('einkaufsdatum');
        this.vehicleList = document.getElementById('vehicle-list');
        this.vehicleTable = document.getElementById('vehicle-table');
        this.noVehiclesMsg = document.getElementById('no-vehicles');
        this.vehicleCount = document.getElementById('vehicle-count');
        this.searchInput = document.getElementById('search-input');
        this.formTitle = document.getElementById('form-title');
        this.submitBtn = document.getElementById('submit-btn');
        this.cancelBtn = document.getElementById('cancel-btn');

        // Detail-Modal
        this.detailModal = document.getElementById('vehicle-detail-modal');
        this.detailCloseBtn = document.getElementById('detail-close');
        this.detailCancelBtn = document.getElementById('detail-cancel');
        this.trackingForm = document.getElementById('tracking-form');
        this.detailVehicleId = document.getElementById('detail-vehicle-id');

        // Detail-Info Anzeige
        this.detailGwNr = document.getElementById('detail-gw-nr');
        this.detailHersteller = document.getElementById('detail-hersteller');
        this.detailModell = document.getElementById('detail-modell');
        this.detailFahrgestellnummer = document.getElementById('detail-fahrgestellnummer');

        // Tracking-Felder
        this.detailEinkaufsdatum = document.getElementById('detail-einkaufsdatum');
        this.detailLieferdatum = document.getElementById('detail-lieferdatum');
        this.detailWerkstattUebergabe = document.getElementById('detail-werkstatt-uebergabe');
        this.detailWerkstattZurueck = document.getElementById('detail-werkstatt-zurueck');
        this.detailFremdfirma = document.getElementById('detail-fremdfirma');
        this.detailFremdfirmaUebergabe = document.getElementById('detail-fremdfirma-uebergabe');
        this.detailFremdfirmaZurueck = document.getElementById('detail-fremdfirma-zurueck');
        this.detailAufbereiter = document.getElementById('detail-aufbereiter');
        this.detailAufbereitungUebergabe = document.getElementById('detail-aufbereitung-uebergabe');
        this.detailAufbereitungZurueck = document.getElementById('detail-aufbereitung-zurueck');
    }

    // Event-Listener binden
    bindEvents() {
        // Hauptformular
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.cancelBtn.addEventListener('click', () => this.cancelEdit());
        this.searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));

        // Detail-Modal
        this.detailCloseBtn.addEventListener('click', () => this.closeDetailModal());
        this.detailCancelBtn.addEventListener('click', () => this.closeDetailModal());
        this.detailModal.addEventListener('click', (e) => {
            if (e.target === this.detailModal) this.closeDetailModal();
        });
        this.trackingForm.addEventListener('submit', (e) => this.handleTrackingSubmit(e));

        // Escape-Taste zum Schließen
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.detailModal.classList.contains('active')) {
                this.closeDetailModal();
            }
        });
    }

    // Dropdowns aktualisieren
    updateDropdowns() {
        // Hauptformular
        this.populateSelect(this.herstellerSelect, settingsManager.getItems('hersteller'), '-- Bitte wählen --');
        this.populateSelect(this.herkunftSelect, settingsManager.getItems('herkunft'), '-- Bitte wählen --');

        // Detail-Modal
        this.populateSelect(this.detailFremdfirma, settingsManager.getItems('fremdfirmen'), '-- Keine --');
        this.populateSelect(this.detailAufbereiter, settingsManager.getItems('aufbereiter'), '-- Keine --');
    }

    // Select-Element befüllen
    populateSelect(selectElement, items, defaultText) {
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

    // Datum formatieren für Anzeige
    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('de-DE');
    }

    // Status berechnen
    getStatus(vehicle) {
        // Prüfen ob alle Phasen abgeschlossen
        const werkstattFertig = vehicle.werkstattZurueck;
        const fremdfirmaFertig = !vehicle.fremdfirmaUebergabe || vehicle.fremdfirmaZurueck;
        const aufbereitungFertig = !vehicle.aufbereitungUebergabe || vehicle.aufbereitungZurueck;

        if (vehicle.aufbereitungUebergabe && !vehicle.aufbereitungZurueck) {
            return { text: 'Aufbereitung', class: 'status-aufbereitung' };
        }
        if (vehicle.fremdfirmaUebergabe && !vehicle.fremdfirmaZurueck) {
            return { text: 'Fremdfirma', class: 'status-fremdfirma' };
        }
        if (vehicle.werkstattUebergabe && !vehicle.werkstattZurueck) {
            return { text: 'Werkstatt', class: 'status-werkstatt' };
        }
        if (werkstattFertig && fremdfirmaFertig && aufbereitungFertig && vehicle.lieferdatum) {
            return { text: 'Fertig', class: 'status-fertig' };
        }
        return { text: 'Neu', class: 'status-neu' };
    }

    // Formular absenden (Hauptformular)
    handleSubmit(e) {
        e.preventDefault();

        const vehicleData = {
            gwNr: this.gwNrInput.value.trim(),
            fahrgestellnummer: this.fahrgestellnummerInput.value.trim(),
            hersteller: this.herstellerSelect.value,
            modell: this.modellInput.value.trim(),
            herkunft: this.herkunftSelect.value,
            waNr: this.waNrInput.value.trim(),
            einkaufsdatum: this.einkaufsdatumInput.value
        };

        if (this.editingId) {
            // Fahrzeug aktualisieren (nur Basisdaten)
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

    // Tracking-Formular absenden
    handleTrackingSubmit(e) {
        e.preventDefault();

        const vehicleId = this.detailVehicleId.value;
        const trackingData = {
            einkaufsdatum: this.detailEinkaufsdatum.value,
            lieferdatum: this.detailLieferdatum.value,
            werkstattUebergabe: this.detailWerkstattUebergabe.value,
            werkstattZurueck: this.detailWerkstattZurueck.value,
            fremdfirma: this.detailFremdfirma.value,
            fremdfirmaUebergabe: this.detailFremdfirmaUebergabe.value,
            fremdfirmaZurueck: this.detailFremdfirmaZurueck.value,
            aufbereiter: this.detailAufbereiter.value,
            aufbereitungUebergabe: this.detailAufbereitungUebergabe.value,
            aufbereitungZurueck: this.detailAufbereitungZurueck.value
        };

        this.updateVehicle(vehicleId, trackingData);
        this.showToast('Tracking-Daten erfolgreich gespeichert', 'success');
        this.closeDetailModal();
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

    // Fahrzeug bearbeiten (Hauptformular)
    editVehicle(id) {
        const vehicle = this.vehicles.find(v => v.id === id);
        if (vehicle) {
            this.editingId = id;
            this.gwNrInput.value = vehicle.gwNr || '';
            this.fahrgestellnummerInput.value = vehicle.fahrgestellnummer || '';
            this.herstellerSelect.value = vehicle.hersteller || '';
            this.modellInput.value = vehicle.modell || '';
            this.herkunftSelect.value = vehicle.herkunft || '';
            this.waNrInput.value = vehicle.waNr || '';
            this.einkaufsdatumInput.value = vehicle.einkaufsdatum || '';

            this.formTitle.textContent = 'Fahrzeug bearbeiten';
            this.submitBtn.textContent = 'Änderungen speichern';
            this.cancelBtn.style.display = 'inline-block';

            // Zum Formular scrollen
            this.form.scrollIntoView({ behavior: 'smooth' });
        }
    }

    // Fahrzeug-Details öffnen (Tracking Modal)
    openVehicleDetails(id) {
        const vehicle = this.vehicles.find(v => v.id === id);
        if (!vehicle) return;

        // Dropdowns aktualisieren
        this.updateDropdowns();

        // Info-Header befüllen
        this.detailGwNr.textContent = vehicle.gwNr || '-';
        this.detailHersteller.textContent = vehicle.hersteller || '-';
        this.detailModell.textContent = vehicle.modell || '-';
        this.detailFahrgestellnummer.textContent = vehicle.fahrgestellnummer || '-';

        // Hidden ID
        this.detailVehicleId.value = vehicle.id;

        // Tracking-Felder befüllen
        this.detailEinkaufsdatum.value = vehicle.einkaufsdatum || '';
        this.detailLieferdatum.value = vehicle.lieferdatum || '';
        this.detailWerkstattUebergabe.value = vehicle.werkstattUebergabe || '';
        this.detailWerkstattZurueck.value = vehicle.werkstattZurueck || '';
        this.detailFremdfirma.value = vehicle.fremdfirma || '';
        this.detailFremdfirmaUebergabe.value = vehicle.fremdfirmaUebergabe || '';
        this.detailFremdfirmaZurueck.value = vehicle.fremdfirmaZurueck || '';
        this.detailAufbereiter.value = vehicle.aufbereiter || '';
        this.detailAufbereitungUebergabe.value = vehicle.aufbereitungUebergabe || '';
        this.detailAufbereitungZurueck.value = vehicle.aufbereitungZurueck || '';

        // Modal öffnen
        this.detailModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // Detail-Modal schließen
    closeDetailModal() {
        this.detailModal.classList.remove('active');
        document.body.style.overflow = '';
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
        this.vehicleList.innerHTML = filteredVehicles.map(vehicle => {
            const status = this.getStatus(vehicle);
            return `
                <tr>
                    <td>${this.escapeHtml(vehicle.gwNr || '')}</td>
                    <td>${this.escapeHtml(vehicle.fahrgestellnummer || '')}</td>
                    <td>${this.escapeHtml(vehicle.hersteller || '')}</td>
                    <td>${this.escapeHtml(vehicle.modell || '')}</td>
                    <td>${this.escapeHtml(vehicle.herkunft || '')}</td>
                    <td>${this.escapeHtml(vehicle.waNr || '')}</td>
                    <td>${this.formatDate(vehicle.einkaufsdatum)}</td>
                    <td><span class="status-badge ${status.class}">${status.text}</span></td>
                    <td class="actions-cell">
                        <button type="button" class="btn btn-icon btn-detail" onclick="vehicleManager.openVehicleDetails('${vehicle.id}')" title="Details & Tracking">
                            📋
                        </button>
                        <button type="button" class="btn btn-icon btn-edit" onclick="vehicleManager.editVehicle('${vehicle.id}')" title="Bearbeiten">
                            ✏️
                        </button>
                        <button type="button" class="btn btn-icon btn-delete" onclick="vehicleManager.deleteVehicle('${vehicle.id}')" title="Löschen">
                            🗑️
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        // Dashboard aktualisieren
        if (typeof dashboardManager !== 'undefined') {
            dashboardManager.render();
        }
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
// Wichtig: Reihenfolge beachten
const settingsManager = new SettingsManager();
const vehicleManager = new VehicleManager();
const dashboardManager = new DashboardManager();

// Initial Dashboard rendern
dashboardManager.render();
