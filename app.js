// Fahrzeugmanagement App
class VehicleManager {
    constructor() {
        this.vehicles = this.loadVehicles();
        this.fremdfirmen = this.loadFremdfirmen();
        this.aufbereiter = this.loadAufbereiter();
        this.editingId = null;
        this.init();
    }

    // Initialisierung
    init() {
        this.bindElements();
        this.bindEvents();
        this.renderFremdfirmenSelect();
        this.renderAufbereiterSelect();
        this.render();
    }

    // DOM-Elemente binden
    bindElements() {
        // Formular
        this.form = document.getElementById('vehicle-form');
        this.vehicleIdInput = document.getElementById('vehicle-id');
        this.gwNrInput = document.getElementById('gw-nr');
        this.fahrgestellnummerInput = document.getElementById('fahrgestellnummer');
        this.herstellerInput = document.getElementById('hersteller');
        this.modellInput = document.getElementById('modell');
        this.herkunftInput = document.getElementById('herkunft');
        this.waNrInput = document.getElementById('wa-nr');

        // Neue Datumsfelder
        this.einkaufsdatumInput = document.getElementById('einkaufsdatum');
        this.lieferdatumInput = document.getElementById('lieferdatum');
        this.uebergebenWerkstattInput = document.getElementById('uebergeben-werkstatt');
        this.zurueckWerkstattInput = document.getElementById('zurueck-werkstatt');
        this.uebergebenFremdfirmaInput = document.getElementById('uebergeben-fremdfirma');
        this.zurueckFremdfirmaInput = document.getElementById('zurueck-fremdfirma');
        this.uebergebenAufbereitungInput = document.getElementById('uebergeben-aufbereitung');
        this.zurueckAufbereiterInput = document.getElementById('zurueck-aufbereiter');

        // Selects
        this.fremdfirmaSelect = document.getElementById('fremdfirma-select');
        this.aufbereiterSelect = document.getElementById('aufbereiter-select');

        // Liste
        this.vehicleList = document.getElementById('vehicle-list');
        this.vehicleTable = document.getElementById('vehicle-table');
        this.noVehiclesMsg = document.getElementById('no-vehicles');
        this.vehicleCount = document.getElementById('vehicle-count');
        this.searchInput = document.getElementById('search-input');
        this.formTitle = document.getElementById('form-title');
        this.submitBtn = document.getElementById('submit-btn');
        this.cancelBtn = document.getElementById('cancel-btn');

        // Modals
        this.fremdfirmenModal = document.getElementById('fremdfirmen-modal');
        this.aufbereiterModal = document.getElementById('aufbereiter-modal');
        this.detailModal = document.getElementById('detail-modal');
        this.fremdfirmenList = document.getElementById('fremdfirmen-list');
        this.aufbereiterList = document.getElementById('aufbereiter-list');
        this.newFremdfirmaInput = document.getElementById('new-fremdfirma-input');
        this.newAufbereiterInput = document.getElementById('new-aufbereiter-input');
        this.noFremdfirmenMsg = document.getElementById('no-fremdfirmen');
        this.noAufbereiterMsg = document.getElementById('no-aufbereiter');
        this.detailModalTitle = document.getElementById('detail-modal-title');
        this.detailModalBody = document.getElementById('detail-modal-body');
    }

    // Event-Listener binden
    bindEvents() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.cancelBtn.addEventListener('click', () => this.cancelEdit());
        this.searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));

        // Modal-Schliessen bei Klick ausserhalb
        window.addEventListener('click', (e) => {
            if (e.target === this.fremdfirmenModal) this.closeFremdfirmenModal();
            if (e.target === this.aufbereiterModal) this.closeAufbereiterModal();
            if (e.target === this.detailModal) this.closeDetailModal();
        });

        // Enter-Taste in Modal-Inputs
        this.newFremdfirmaInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.addFremdfirma();
            }
        });
        this.newAufbereiterInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.addAufbereiter();
            }
        });
    }

    // ===== LocalStorage Operationen =====

    loadVehicles() {
        const data = localStorage.getItem('vehicles');
        return data ? JSON.parse(data) : [];
    }

    saveVehicles() {
        localStorage.setItem('vehicles', JSON.stringify(this.vehicles));
    }

    loadFremdfirmen() {
        const data = localStorage.getItem('fremdfirmen');
        return data ? JSON.parse(data) : [];
    }

    saveFremdfirmen() {
        localStorage.setItem('fremdfirmen', JSON.stringify(this.fremdfirmen));
    }

    loadAufbereiter() {
        const data = localStorage.getItem('aufbereiter');
        return data ? JSON.parse(data) : [];
    }

    saveAufbereiter() {
        localStorage.setItem('aufbereiter', JSON.stringify(this.aufbereiter));
    }

    // Eindeutige ID generieren
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // ===== Fremdfirmen-Verwaltung =====

    openFremdfirmenModal() {
        this.fremdfirmenModal.classList.add('visible');
        this.renderFremdfirmenList();
        this.newFremdfirmaInput.focus();
    }

    closeFremdfirmenModal() {
        this.fremdfirmenModal.classList.remove('visible');
        this.newFremdfirmaInput.value = '';
    }

    addFremdfirma() {
        const name = this.newFremdfirmaInput.value.trim();
        if (!name) {
            this.showToast('Bitte einen Namen eingeben', 'error');
            return;
        }

        // Pruefen ob bereits vorhanden
        if (this.fremdfirmen.some(f => f.name.toLowerCase() === name.toLowerCase())) {
            this.showToast('Diese Fremdfirma existiert bereits', 'error');
            return;
        }

        this.fremdfirmen.push({
            id: this.generateId(),
            name: name
        });
        this.saveFremdfirmen();
        this.renderFremdfirmenList();
        this.renderFremdfirmenSelect();
        this.newFremdfirmaInput.value = '';
        this.showToast('Fremdfirma hinzugefuegt', 'success');
    }

    deleteFremdfirma(id) {
        if (confirm('Moechten Sie diese Fremdfirma wirklich loeschen?')) {
            this.fremdfirmen = this.fremdfirmen.filter(f => f.id !== id);
            this.saveFremdfirmen();
            this.renderFremdfirmenList();
            this.renderFremdfirmenSelect();
            this.showToast('Fremdfirma geloescht', 'success');
        }
    }

    renderFremdfirmenList() {
        if (this.fremdfirmen.length === 0) {
            this.fremdfirmenList.innerHTML = '';
            this.noFremdfirmenMsg.style.display = 'block';
        } else {
            this.noFremdfirmenMsg.style.display = 'none';
            this.fremdfirmenList.innerHTML = this.fremdfirmen.map(firma => `
                <li class="management-item">
                    <span>${this.escapeHtml(firma.name)}</span>
                    <button class="btn btn-icon btn-delete btn-small" onclick="vehicleManager.deleteFremdfirma('${firma.id}')" title="Loeschen">
                        &times;
                    </button>
                </li>
            `).join('');
        }
    }

    renderFremdfirmenSelect() {
        const currentValue = this.fremdfirmaSelect.value;
        this.fremdfirmaSelect.innerHTML = '<option value="">-- Keine Auswahl --</option>' +
            this.fremdfirmen.map(firma =>
                `<option value="${firma.id}">${this.escapeHtml(firma.name)}</option>`
            ).join('');
        this.fremdfirmaSelect.value = currentValue;
    }

    // ===== Aufbereiter-Verwaltung =====

    openAufbereiterModal() {
        this.aufbereiterModal.classList.add('visible');
        this.renderAufbereiterList();
        this.newAufbereiterInput.focus();
    }

    closeAufbereiterModal() {
        this.aufbereiterModal.classList.remove('visible');
        this.newAufbereiterInput.value = '';
    }

    addAufbereiter() {
        const name = this.newAufbereiterInput.value.trim();
        if (!name) {
            this.showToast('Bitte einen Namen eingeben', 'error');
            return;
        }

        // Pruefen ob bereits vorhanden
        if (this.aufbereiter.some(a => a.name.toLowerCase() === name.toLowerCase())) {
            this.showToast('Dieser Aufbereiter existiert bereits', 'error');
            return;
        }

        this.aufbereiter.push({
            id: this.generateId(),
            name: name
        });
        this.saveAufbereiter();
        this.renderAufbereiterList();
        this.renderAufbereiterSelect();
        this.newAufbereiterInput.value = '';
        this.showToast('Aufbereiter hinzugefuegt', 'success');
    }

    deleteAufbereiter(id) {
        if (confirm('Moechten Sie diesen Aufbereiter wirklich loeschen?')) {
            this.aufbereiter = this.aufbereiter.filter(a => a.id !== id);
            this.saveAufbereiter();
            this.renderAufbereiterList();
            this.renderAufbereiterSelect();
            this.showToast('Aufbereiter geloescht', 'success');
        }
    }

    renderAufbereiterList() {
        if (this.aufbereiter.length === 0) {
            this.aufbereiterList.innerHTML = '';
            this.noAufbereiterMsg.style.display = 'block';
        } else {
            this.noAufbereiterMsg.style.display = 'none';
            this.aufbereiterList.innerHTML = this.aufbereiter.map(aufb => `
                <li class="management-item">
                    <span>${this.escapeHtml(aufb.name)}</span>
                    <button class="btn btn-icon btn-delete btn-small" onclick="vehicleManager.deleteAufbereiter('${aufb.id}')" title="Loeschen">
                        &times;
                    </button>
                </li>
            `).join('');
        }
    }

    renderAufbereiterSelect() {
        const currentValue = this.aufbereiterSelect.value;
        this.aufbereiterSelect.innerHTML = '<option value="">-- Keine Auswahl --</option>' +
            this.aufbereiter.map(aufb =>
                `<option value="${aufb.id}">${this.escapeHtml(aufb.name)}</option>`
            ).join('');
        this.aufbereiterSelect.value = currentValue;
    }

    // ===== Fahrzeug-Operationen =====

    handleSubmit(e) {
        e.preventDefault();

        const vehicleData = {
            gwNr: this.gwNrInput.value.trim(),
            fahrgestellnummer: this.fahrgestellnummerInput.value.trim(),
            hersteller: this.herstellerInput.value.trim(),
            modell: this.modellInput.value.trim(),
            herkunft: this.herkunftInput.value.trim(),
            waNr: this.waNrInput.value.trim(),
            // Neue Felder
            einkaufsdatum: this.einkaufsdatumInput.value || null,
            lieferdatum: this.lieferdatumInput.value || null,
            uebergebenWerkstatt: this.uebergebenWerkstattInput.value || null,
            zurueckWerkstatt: this.zurueckWerkstattInput.value || null,
            fremdfirmaId: this.fremdfirmaSelect.value || null,
            uebergebenFremdfirma: this.uebergebenFremdfirmaInput.value || null,
            zurueckFremdfirma: this.zurueckFremdfirmaInput.value || null,
            aufbereiterId: this.aufbereiterSelect.value || null,
            uebergebenAufbereitung: this.uebergebenAufbereitungInput.value || null,
            zurueckAufbereiter: this.zurueckAufbereiterInput.value || null
        };

        if (this.editingId) {
            this.updateVehicle(this.editingId, vehicleData);
            this.showToast('Fahrzeug erfolgreich aktualisiert', 'success');
        } else {
            this.addVehicle(vehicleData);
            this.showToast('Fahrzeug erfolgreich angelegt', 'success');
        }

        this.resetForm();
        this.render();
    }

    addVehicle(data) {
        const vehicle = {
            id: this.generateId(),
            ...data,
            createdAt: new Date().toISOString()
        };
        this.vehicles.push(vehicle);
        this.saveVehicles();
    }

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

    deleteVehicle(id) {
        if (confirm('Moechten Sie dieses Fahrzeug wirklich loeschen?')) {
            this.vehicles = this.vehicles.filter(v => v.id !== id);
            this.saveVehicles();
            this.render();
            this.showToast('Fahrzeug erfolgreich geloescht', 'success');
        }
    }

    editVehicle(id) {
        const vehicle = this.vehicles.find(v => v.id === id);
        if (vehicle) {
            this.editingId = id;

            // Basisfelder
            this.gwNrInput.value = vehicle.gwNr;
            this.fahrgestellnummerInput.value = vehicle.fahrgestellnummer;
            this.herstellerInput.value = vehicle.hersteller;
            this.modellInput.value = vehicle.modell;
            this.herkunftInput.value = vehicle.herkunft;
            this.waNrInput.value = vehicle.waNr;

            // Neue Felder
            this.einkaufsdatumInput.value = vehicle.einkaufsdatum || '';
            this.lieferdatumInput.value = vehicle.lieferdatum || '';
            this.uebergebenWerkstattInput.value = vehicle.uebergebenWerkstatt || '';
            this.zurueckWerkstattInput.value = vehicle.zurueckWerkstatt || '';
            this.fremdfirmaSelect.value = vehicle.fremdfirmaId || '';
            this.uebergebenFremdfirmaInput.value = vehicle.uebergebenFremdfirma || '';
            this.zurueckFremdfirmaInput.value = vehicle.zurueckFremdfirma || '';
            this.aufbereiterSelect.value = vehicle.aufbereiterId || '';
            this.uebergebenAufbereitungInput.value = vehicle.uebergebenAufbereitung || '';
            this.zurueckAufbereiterInput.value = vehicle.zurueckAufbereiter || '';

            this.formTitle.textContent = 'Fahrzeug bearbeiten';
            this.submitBtn.textContent = 'Aenderungen speichern';
            this.cancelBtn.style.display = 'inline-block';

            this.form.scrollIntoView({ behavior: 'smooth' });
        }
    }

    cancelEdit() {
        this.resetForm();
    }

    resetForm() {
        this.form.reset();
        this.editingId = null;
        this.formTitle.textContent = 'Neues Fahrzeug anlegen';
        this.submitBtn.textContent = 'Fahrzeug speichern';
        this.cancelBtn.style.display = 'none';
    }

    // ===== Detail-Modal =====

    showDetails(id) {
        const vehicle = this.vehicles.find(v => v.id === id);
        if (!vehicle) return;

        const fremdfirma = this.fremdfirmen.find(f => f.id === vehicle.fremdfirmaId);
        const aufbereiter = this.aufbereiter.find(a => a.id === vehicle.aufbereiterId);

        this.detailModalTitle.textContent = `${vehicle.hersteller} ${vehicle.modell} (${vehicle.gwNr})`;

        this.detailModalBody.innerHTML = `
            <div class="detail-grid">
                <div class="detail-section">
                    <h4>Fahrzeugdaten</h4>
                    <div class="detail-row">
                        <span class="detail-label">GW-Nr.:</span>
                        <span class="detail-value">${this.escapeHtml(vehicle.gwNr)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Fahrgestellnummer:</span>
                        <span class="detail-value">${this.escapeHtml(vehicle.fahrgestellnummer)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Hersteller:</span>
                        <span class="detail-value">${this.escapeHtml(vehicle.hersteller)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Modell:</span>
                        <span class="detail-value">${this.escapeHtml(vehicle.modell)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Herkunft:</span>
                        <span class="detail-value">${this.escapeHtml(vehicle.herkunft)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">WA-Nr.:</span>
                        <span class="detail-value">${this.escapeHtml(vehicle.waNr)}</span>
                    </div>
                </div>

                <div class="detail-section">
                    <h4>Einkauf & Lieferung</h4>
                    <div class="detail-row">
                        <span class="detail-label">Einkaufsdatum:</span>
                        <span class="detail-value">${this.formatDate(vehicle.einkaufsdatum)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Lieferdatum:</span>
                        <span class="detail-value">${this.formatDate(vehicle.lieferdatum)}</span>
                    </div>
                </div>

                <div class="detail-section">
                    <h4>Werkstatt</h4>
                    <div class="detail-row ${this.getStatusClass(vehicle.uebergebenWerkstatt, vehicle.zurueckWerkstatt)}">
                        <span class="detail-label">Uebergeben:</span>
                        <span class="detail-value">${this.formatDate(vehicle.uebergebenWerkstatt)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Zurueck:</span>
                        <span class="detail-value">${this.formatDate(vehicle.zurueckWerkstatt)}</span>
                    </div>
                </div>

                <div class="detail-section">
                    <h4>Fremdfirma</h4>
                    <div class="detail-row">
                        <span class="detail-label">Firma:</span>
                        <span class="detail-value">${fremdfirma ? this.escapeHtml(fremdfirma.name) : '-'}</span>
                    </div>
                    <div class="detail-row ${this.getStatusClass(vehicle.uebergebenFremdfirma, vehicle.zurueckFremdfirma)}">
                        <span class="detail-label">Uebergeben:</span>
                        <span class="detail-value">${this.formatDate(vehicle.uebergebenFremdfirma)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Zurueck:</span>
                        <span class="detail-value">${this.formatDate(vehicle.zurueckFremdfirma)}</span>
                    </div>
                </div>

                <div class="detail-section">
                    <h4>Aufbereitung</h4>
                    <div class="detail-row">
                        <span class="detail-label">Aufbereiter:</span>
                        <span class="detail-value">${aufbereiter ? this.escapeHtml(aufbereiter.name) : '-'}</span>
                    </div>
                    <div class="detail-row ${this.getStatusClass(vehicle.uebergebenAufbereitung, vehicle.zurueckAufbereiter)}">
                        <span class="detail-label">Uebergeben:</span>
                        <span class="detail-value">${this.formatDate(vehicle.uebergebenAufbereitung)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Zurueck:</span>
                        <span class="detail-value">${this.formatDate(vehicle.zurueckAufbereiter)}</span>
                    </div>
                </div>
            </div>
        `;

        this.detailModal.classList.add('visible');
    }

    closeDetailModal() {
        this.detailModal.classList.remove('visible');
    }

    // ===== Hilfsfunktionen =====

    formatDate(dateStr) {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    getStatusClass(uebergeben, zurueck) {
        if (uebergeben && !zurueck) return 'status-active';
        return '';
    }

    getVehicleStatus(vehicle) {
        // Status-Prioritaet: Werkstatt > Fremdfirma > Aufbereitung
        if (vehicle.uebergebenWerkstatt && !vehicle.zurueckWerkstatt) {
            return { text: 'In Werkstatt', class: 'status-badge status-werkstatt' };
        }
        if (vehicle.uebergebenFremdfirma && !vehicle.zurueckFremdfirma) {
            const firma = this.fremdfirmen.find(f => f.id === vehicle.fremdfirmaId);
            return {
                text: firma ? `Bei ${firma.name}` : 'Bei Fremdfirma',
                class: 'status-badge status-fremdfirma'
            };
        }
        if (vehicle.uebergebenAufbereitung && !vehicle.zurueckAufbereiter) {
            const aufb = this.aufbereiter.find(a => a.id === vehicle.aufbereiterId);
            return {
                text: aufb ? `Bei ${aufb.name}` : 'In Aufbereitung',
                class: 'status-badge status-aufbereitung'
            };
        }
        if (vehicle.lieferdatum) {
            return { text: 'Geliefert', class: 'status-badge status-geliefert' };
        }
        if (vehicle.einkaufsdatum) {
            return { text: 'Eingekauft', class: 'status-badge status-eingekauft' };
        }
        return { text: 'Neu', class: 'status-badge status-neu' };
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
                v.gwNr.toLowerCase().includes(searchQuery) ||
                v.fahrgestellnummer.toLowerCase().includes(searchQuery) ||
                v.hersteller.toLowerCase().includes(searchQuery) ||
                v.modell.toLowerCase().includes(searchQuery) ||
                v.herkunft.toLowerCase().includes(searchQuery) ||
                v.waNr.toLowerCase().includes(searchQuery)
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
            const status = this.getVehicleStatus(vehicle);
            return `
            <tr>
                <td>${this.escapeHtml(vehicle.gwNr)}</td>
                <td>${this.escapeHtml(vehicle.fahrgestellnummer)}</td>
                <td>${this.escapeHtml(vehicle.hersteller)}</td>
                <td>${this.escapeHtml(vehicle.modell)}</td>
                <td>${this.escapeHtml(vehicle.herkunft)}</td>
                <td>${this.escapeHtml(vehicle.waNr)}</td>
                <td><span class="${status.class}">${status.text}</span></td>
                <td class="actions-cell">
                    <button class="btn btn-icon btn-info" onclick="vehicleManager.showDetails('${vehicle.id}')" title="Details">
                        i
                    </button>
                    <button class="btn btn-icon btn-edit" onclick="vehicleManager.editVehicle('${vehicle.id}')" title="Bearbeiten">
                        E
                    </button>
                    <button class="btn btn-icon btn-delete" onclick="vehicleManager.deleteVehicle('${vehicle.id}')" title="Loeschen">
                        X
                    </button>
                </td>
            </tr>
        `}).join('');
    }

    // HTML escapen (Sicherheit)
    escapeHtml(text) {
        if (!text) return '';
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

// App starten
const vehicleManager = new VehicleManager();
