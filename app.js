// Fahrzeugmanagement App
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
        this.render();
    }

    // DOM-Elemente binden
    bindElements() {
        this.form = document.getElementById('vehicle-form');
        this.vehicleIdInput = document.getElementById('vehicle-id');
        this.gwNrInput = document.getElementById('gw-nr');
        this.fahrgestellnummerInput = document.getElementById('fahrgestellnummer');
        this.herstellerInput = document.getElementById('hersteller');
        this.modellInput = document.getElementById('modell');
        this.herkunftInput = document.getElementById('herkunft');
        this.waNrInput = document.getElementById('wa-nr');
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
            hersteller: this.herstellerInput.value.trim(),
            modell: this.modellInput.value.trim(),
            herkunft: this.herkunftInput.value.trim(),
            waNr: this.waNrInput.value.trim()
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
            this.herstellerInput.value = vehicle.hersteller;
            this.modellInput.value = vehicle.modell;
            this.herkunftInput.value = vehicle.herkunft;
            this.waNrInput.value = vehicle.waNr;

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
        this.vehicleList.innerHTML = filteredVehicles.map(vehicle => `
            <tr>
                <td>${this.escapeHtml(vehicle.gwNr)}</td>
                <td>${this.escapeHtml(vehicle.fahrgestellnummer)}</td>
                <td>${this.escapeHtml(vehicle.hersteller)}</td>
                <td>${this.escapeHtml(vehicle.modell)}</td>
                <td>${this.escapeHtml(vehicle.herkunft)}</td>
                <td>${this.escapeHtml(vehicle.waNr)}</td>
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

// App starten
const vehicleManager = new VehicleManager();
