// Travel Itinerary Manager App
class TravelItineraryApp {
    constructor() {
        this.data = {
            locations: [],
            packages: [],
            agency: { name: '', mobile: '' },
            notes: '',
            itineraries: []
        };
        
        this.currentItinerary = {
            customer: '',
            startDate: '',
            days: [],
            packages: [],
            selectedLocations: new Set()
        };
        
        this.editingPackageIndex = -1;
        this.init();
    }

    init() {
        this.loadData();
        this.initializeSampleData();
        this.renderUI();
        this.bindEvents();
    }

    // Data Management
    loadData() {
        try {
            const savedData = localStorage.getItem('travelItineraryData');
            if (savedData) {
                this.data = { ...this.data, ...JSON.parse(savedData) };
            }
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    saveData() {
        try {
            localStorage.setItem('travelItineraryData', JSON.stringify(this.data));
        } catch (error) {
            console.error('Error saving data:', error);
        }
    }

    initializeSampleData() {
        if (this.data.locations.length === 0) {
            this.data.locations = ["Old Goa", "Panjim", "Calangute Beach", "Baga Beach", "Anjuna Beach", "Margao", "Colva Beach", "Dudhsagar Falls", "Spice Plantation", "Dona Paula", "Miramar Beach", "Candolim Beach"];
        }
        
        if (this.data.packages.length === 0) {
            this.data.packages = [
                {
                    id: 'pkg1',
                    name: 'Half Day Package',
                    description: '60 Km, 6 Hr',
                    basePrice: 2500,
                    additionalKmRate: 20,
                    additionalHrRate: 200
                },
                {
                    id: 'pkg2',
                    name: 'Full Day Package',
                    description: '120 Km, 10 Hr',
                    basePrice: 4000,
                    additionalKmRate: 25,
                    additionalHrRate: 250
                },
                {
                    id: 'pkg3',
                    name: 'Multi-Day Package',
                    description: '200 Km, 3 Days',
                    basePrice: 8000,
                    additionalKmRate: 30,
                    additionalHrRate: 300
                }
            ];
        }
        
        if (!this.data.agency.name) {
            this.data.agency = {
                name: 'Goa Travel Services',
                mobile: '+91 8999210640'
            };
        }
        
        if (!this.data.notes) {
            this.data.notes = '• All packages include fuel and driver charges\n• Parking and toll charges extra\n• AC vehicle provided\n• Pick-up and drop-off included\n• Advance booking recommended\n• Cancellation policy: 24 hours notice required';
        }
        
        this.saveData();
    }

    // Event Handlers
    bindEvents() {
        // Setup Modal
        this.bindSetupEvents();
        
        // Main form events
        this.bindMainFormEvents();
        
        // Make sure we add Day 1 by default when date is selected
        const startDateInput = document.getElementById('startDate');
        if (startDateInput) {
            startDateInput.addEventListener('change', () => {
                if (this.currentItinerary.days.length === 0) {
                    this.addDay(); // Automatically add Day 1 when date is selected
                } else {
                    this.updateDayDates();
                }
            });
        }
    }

    bindSetupEvents() {
        const setupBtn = document.getElementById('setupBtn');
        const closeSetupModal = document.getElementById('closeSetupModal');
        
        if (setupBtn) {
            setupBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.openSetupModal();
            });
        }
        
        if (closeSetupModal) {
            closeSetupModal.addEventListener('click', (e) => {
                e.preventDefault();
                this.closeSetupModal();
            });
        }
        
        // Setup Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchTab(e.target.dataset.tab);
            });
        });
        
        // Location management
        const addLocationBtn = document.getElementById('addLocationBtn');
        const locationInput = document.getElementById('locationInput');
        
        if (addLocationBtn) {
            addLocationBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.addLocation();
            });
        }
        
        if (locationInput) {
            locationInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.addLocation();
                }
            });
        }
        
        // Package management
        const addPackageBtn = document.getElementById('addPackageBtn');
        if (addPackageBtn) {
            addPackageBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.addPackage();
            });
        }
        
        // Agency management
        const saveAgencyBtn = document.getElementById('saveAgencyBtn');
        if (saveAgencyBtn) {
            saveAgencyBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.saveAgencyInfo();
            });
        }
        
        // Notes management
        const saveNotesBtn = document.getElementById('saveNotesBtn');
        if (saveNotesBtn) {
            saveNotesBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.saveNotes();
            });
        }
        
        // Modal Close on Background Click
        const setupModal = document.getElementById('setupModal');
        if (setupModal) {
            setupModal.addEventListener('click', (e) => {
                if (e.target.id === 'setupModal') {
                    this.closeSetupModal();
                }
            });
        }
    }

    bindMainFormEvents() {
        const addDayBtn = document.getElementById('addDayBtn');
        const saveItineraryBtn = document.getElementById('saveItineraryBtn');
        
        if (addDayBtn) {
            // Remove any existing listeners
            addDayBtn.replaceWith(addDayBtn.cloneNode(true));
            const newAddDayBtn = document.getElementById('addDayBtn');
            
            newAddDayBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Add Day clicked!');
                this.addDay();
            });
        }
        
        if (saveItineraryBtn) {
            // Remove any existing listeners  
            saveItineraryBtn.replaceWith(saveItineraryBtn.cloneNode(true));
            const newSaveBtn = document.getElementById('saveItineraryBtn');
            
            newSaveBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Save Itinerary clicked!');
                this.saveItinerary();
            });
        }
    }

    // UI Rendering
    renderUI() {
        this.renderAgencyInfo();
        this.renderLocations();
        this.renderPackages();
        this.renderAgencyForm();
        this.renderNotes();
        this.renderPackageSelection();
        this.renderNotesDisplay();
        this.renderSavedItineraries();
        this.renderDays();
    }

    renderAgencyInfo() {
        const agencyName = document.getElementById('agency-name');
        const agencyMobile = document.getElementById('agency-mobile');
        
        if (agencyName) {
            agencyName.textContent = this.data.agency.name || 'Travel Agency';
        }
        
        if (agencyMobile) {
            agencyMobile.textContent = `Mobile: ${this.data.agency.mobile || 'Not Set'}`;
        }
    }

    renderLocations() {
        const container = document.getElementById('locationsList');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.data.locations.forEach((location, index) => {
            const item = document.createElement('div');
            item.className = 'list-item';
            item.innerHTML = `
                <div class="list-item-content">
                    <div class="list-item-title">${location}</div>
                </div>
                <div class="list-item-actions">
                    <button class="btn btn--outline btn--icon edit-location-btn" data-index="${index}">✏️</button>
                    <button class="btn btn--outline btn--icon delete-location-btn" data-index="${index}">🗑️</button>
                </div>
            `;
            container.appendChild(item);
        });
        
        // Bind events for location actions
        container.querySelectorAll('.edit-location-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.getAttribute('data-index'));
                this.editLocation(index);
            });
        });
        
        container.querySelectorAll('.delete-location-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.getAttribute('data-index'));
                this.deleteLocation(index);
            });
        });
    }

    renderPackages() {
        const container = document.getElementById('packagesList');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.data.packages.forEach((pkg, index) => {
            const item = document.createElement('div');
            item.className = 'list-item';
            item.innerHTML = `
                <div class="list-item-content">
                    <div class="list-item-title">${pkg.name}</div>
                    <div class="list-item-details">
                        ${pkg.description} - Base: ₹${pkg.basePrice}<br>
                        Additional: ₹${pkg.additionalKmRate}/Km, ₹${pkg.additionalHrRate}/Hr
                    </div>
                </div>
                <div class="list-item-actions">
                    <button class="btn btn--outline btn--icon edit-package-btn" data-index="${index}">✏️</button>
                    <button class="btn btn--outline btn--icon delete-package-btn" data-index="${index}">🗑️</button>
                </div>
            `;
            container.appendChild(item);
        });
        
        // Bind events for package actions
        container.querySelectorAll('.edit-package-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.getAttribute('data-index'));
                this.editPackage(index);
            });
        });
        
        container.querySelectorAll('.delete-package-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.getAttribute('data-index'));
                this.deletePackage(index);
            });
        });
    }

    renderAgencyForm() {
        const agencyNameInput = document.getElementById('agencyNameInput');
        const agencyMobileInput = document.getElementById('agencyMobileInput');
        
        if (agencyNameInput) {
            agencyNameInput.value = this.data.agency.name;
        }
        
        if (agencyMobileInput) {
            agencyMobileInput.value = this.data.agency.mobile;
        }
    }

    renderNotes() {
        const agencyNotes = document.getElementById('agencyNotes');
        if (agencyNotes) {
            agencyNotes.value = this.data.notes;
        }
    }

    renderPackageSelection() {
        const container = document.getElementById('packagesContainer');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.data.packages.forEach(pkg => {
            const item = document.createElement('div');
            item.className = 'package-item';
            item.innerHTML = `
                <input type="checkbox" class="package-checkbox" value="${pkg.id}" id="pkg-${pkg.id}">
                <div class="package-details">
                    <div class="package-name">${pkg.name}</div>
                    <div class="package-description">${pkg.description}</div>
                    <div class="package-pricing">
                        <div class="price-item">
                            <span class="price-label">Base Price</span>
                            <span class="price-value">₹${pkg.basePrice}</span>
                        </div>
                        <div class="price-item">
                            <span class="price-label">Extra/Km</span>
                            <span class="price-value">₹${pkg.additionalKmRate}</span>
                        </div>
                        <div class="price-item">
                            <span class="price-label">Extra/Hr</span>
                            <span class="price-value">₹${pkg.additionalHrRate}</span>
                        </div>
                    </div>
                </div>
            `;
            container.appendChild(item);
        });
    }

    renderNotesDisplay() {
        const container = document.getElementById('notesDisplay');
        if (!container) return;
        
        if (this.data.notes) {
            container.innerHTML = `
                <h4>Terms & Conditions</h4>
                <div class="notes-content">${this.data.notes}</div>
            `;
            container.style.display = 'block';
        } else {
            container.style.display = 'none';
        }
    }

    renderSavedItineraries() {
        const container = document.getElementById('itinerariesList');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (this.data.itineraries.length === 0) {
            container.innerHTML = '<div class="empty-state">No saved itineraries yet.</div>';
            return;
        }
        
        // Sort by date (newest first)
        const sortedItineraries = [...this.data.itineraries].sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
        );
        
        sortedItineraries.forEach((itinerary) => {
            const originalIndex = this.data.itineraries.findIndex(it => it.id === itinerary.id);
            const item = document.createElement('div');
            item.className = 'itinerary-item';
            
            const dateRange = this.getDateRange(itinerary.startDate, itinerary.days.length);
            const packages = itinerary.packages.map(pkg => pkg.name).join(', ');
            
            // Get all locations from all days
            const allLocations = [];
            itinerary.days.forEach(day => {
                if (day.locations && Array.isArray(day.locations)) {
                    allLocations.push(...day.locations);
                } else if (day.location) {
                    allLocations.push(day.location);
                }
            });
            
            item.innerHTML = `
                <div class="itinerary-header">
                    <div>
                        <div class="itinerary-customer">${itinerary.customer}</div>
                        <div class="itinerary-date">${dateRange}</div>
                    </div>
                </div>
                <div class="itinerary-details">
                    <div class="itinerary-locations">
                        ${allLocations.map(loc => `<span class="location-tag">${loc}</span>`).join('')}
                    </div>
                    <div class="itinerary-packages">Packages: ${packages}</div>
                </div>
                <div class="itinerary-actions">
                    <button class="btn btn--outline btn--sm copy-itinerary-btn" data-index="${originalIndex}">Copy</button>
                    <button class="btn btn--outline btn--sm edit-itinerary-btn" data-index="${originalIndex}">Edit</button>
                    <button class="btn btn--outline btn--sm delete-itinerary-btn" data-index="${originalIndex}">Delete</button>
                    <button class="btn btn--primary btn--sm export-pdf-btn" data-itinerary-id="${itinerary.id}">PDF</button>
                    <button class="btn btn--success btn--sm export-whatsapp-btn" data-itinerary-id="${itinerary.id}">WhatsApp</button>
                </div>
            `;
            container.appendChild(item);
        });
        
        // Bind events for itinerary actions
        this.bindItineraryEvents();
    }

    bindItineraryEvents() {
        const container = document.getElementById('itinerariesList');
        if (!container) return;
        
        container.querySelectorAll('.copy-itinerary-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.getAttribute('data-index'));
                this.copyItinerary(index);
            });
        });
        
        container.querySelectorAll('.edit-itinerary-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.getAttribute('data-index'));
                this.editItinerary(index);
            });
        });
        
        container.querySelectorAll('.delete-itinerary-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.getAttribute('data-index'));
                this.deleteItinerary(index);
            });
        });

        // Bind events for export buttons
        container.querySelectorAll('.export-pdf-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const itineraryId = e.target.getAttribute('data-itinerary-id');
                this.exportToPDF(itineraryId);
            });
        });
        
        container.querySelectorAll('.export-whatsapp-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const itineraryId = e.target.getAttribute('data-itinerary-id');
                this.exportToWhatsApp(itineraryId);
            });
        });
    }

    // Setup Functions
    openSetupModal() {
        const modal = document.getElementById('setupModal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    closeSetupModal() {
        const modal = document.getElementById('setupModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        const activeContent = document.getElementById(`${tabName}-tab`);
        if (activeContent) {
            activeContent.classList.add('active');
        }
    }

    // Location Management
    addLocation() {
        const input = document.getElementById('locationInput');
        if (!input) return;
        
        const location = input.value.trim();
        
        if (!location) {
            this.showMessage('Please enter a location name!', 'error');
            return;
        }
        
        if (this.data.locations.includes(location)) {
            this.showMessage('Location already exists!', 'error');
            return;
        }
        
        this.data.locations.push(location);
        this.saveData();
        this.renderLocations();
        input.value = '';
        this.showMessage('Location added successfully!');
    }

    editLocation(index) {
        const newLocation = prompt('Edit location:', this.data.locations[index]);
        if (newLocation && newLocation.trim() && newLocation !== this.data.locations[index]) {
            this.data.locations[index] = newLocation.trim();
            this.saveData();
            this.renderLocations();
            this.showMessage('Location updated successfully!');
        }
    }

    deleteLocation(index) {
        if (confirm('Are you sure you want to delete this location?')) {
            this.data.locations.splice(index, 1);
            this.saveData();
            this.renderLocations();
            this.showMessage('Location deleted successfully!');
        }
    }

    // Package Management
    addPackage() {
        const name = document.getElementById('packageName')?.value?.trim();
        const description = document.getElementById('packageDesc')?.value?.trim();
        const basePrice = parseInt(document.getElementById('packagePrice')?.value || '0');
        const kmRate = parseInt(document.getElementById('packageKmRate')?.value || '0');
        const hrRate = parseInt(document.getElementById('packageHrRate')?.value || '0');
        
        if (!name || !description || !basePrice || !kmRate || !hrRate) {
            this.showMessage('Please fill all package fields!', 'error');
            return;
        }
        
        const pkg = {
            id: 'pkg' + Date.now(),
            name,
            description,
            basePrice,
            additionalKmRate: kmRate,
            additionalHrRate: hrRate
        };
        
        if (this.editingPackageIndex >= 0) {
            // Update existing package
            this.data.packages[this.editingPackageIndex] = pkg;
            this.editingPackageIndex = -1;
            this.showMessage('Package updated successfully!');
        } else {
            // Add new package
            this.data.packages.push(pkg);
            this.showMessage('Package added successfully!');
        }
        
        this.saveData();
        this.renderPackages();
        this.renderPackageSelection();
        
        // Clear form
        this.clearPackageForm();
    }

    clearPackageForm() {
        const fields = ['packageName', 'packageDesc', 'packagePrice', 'packageKmRate', 'packageHrRate'];
        fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) field.value = '';
        });
    }

    editPackage(index) {
        const pkg = this.data.packages[index];
        document.getElementById('packageName').value = pkg.name;
        document.getElementById('packageDesc').value = pkg.description;
        document.getElementById('packagePrice').value = pkg.basePrice;
        document.getElementById('packageKmRate').value = pkg.additionalKmRate;
        document.getElementById('packageHrRate').value = pkg.additionalHrRate;
        
        this.editingPackageIndex = index;
        this.showMessage('Package loaded for editing. Click Add Package to save changes.');
    }

    deletePackage(index) {
        if (confirm('Are you sure you want to delete this package?')) {
            this.data.packages.splice(index, 1);
            this.saveData();
            this.renderPackages();
            this.renderPackageSelection();
            this.showMessage('Package deleted successfully!');
        }
    }

    // Agency Management
    saveAgencyInfo() {
        const name = document.getElementById('agencyNameInput')?.value?.trim();
        const mobile = document.getElementById('agencyMobileInput')?.value?.trim();
        
        if (!name || !mobile) {
            this.showMessage('Please fill both agency name and mobile!', 'error');
            return;
        }
        
        this.data.agency = { name, mobile };
        this.saveData();
        this.renderAgencyInfo();
        this.showMessage('Agency information saved successfully!');
    }

    // Notes Management
    saveNotes() {
        const notes = document.getElementById('agencyNotes')?.value?.trim() || '';
        this.data.notes = notes;
        this.saveData();
        this.renderNotesDisplay();
        this.showMessage('Notes saved successfully!');
    }

    // Day Management
    addDay() {
        const startDateInput = document.getElementById('startDate');
        const startDate = startDateInput?.value;
        
        if (!startDate) {
            this.showMessage('Please select a start date first!', 'error');
            return;
        }
        
        const dayNumber = this.currentItinerary.days.length + 1;
        const dayDate = new Date(startDate);
        dayDate.setDate(dayDate.getDate() + (dayNumber - 1));
        
        const day = {
            number: dayNumber,
            date: dayDate.toISOString().split('T')[0],
            locations: []
        };
        
        this.currentItinerary.days.push(day);
        console.log('Day added:', day);
        this.renderDays();
        this.showMessage(`Day ${dayNumber} added successfully!`);
    }

    removeDay(index) {
        if (this.currentItinerary.days[index]) {
            const removedDay = this.currentItinerary.days[index];
            
            // Remove all locations from this day from the selected set
            if (removedDay.locations && Array.isArray(removedDay.locations)) {
                removedDay.locations.forEach(location => {
                    this.currentItinerary.selectedLocations.delete(location);
                });
            }
            
            this.currentItinerary.days.splice(index, 1);
            
            // Renumber days
            this.currentItinerary.days.forEach((day, i) => {
                day.number = i + 1;
            });
            
            this.updateDayDates();
            this.renderDays();
            this.showMessage('Day removed successfully!');
        }
    }

    updateDayDates() {
        const startDateInput = document.getElementById('startDate');
        const startDate = startDateInput?.value;
        if (!startDate) return;
        
        this.currentItinerary.days.forEach((day, index) => {
            const dayDate = new Date(startDate);
            dayDate.setDate(dayDate.getDate() + index);
            day.date = dayDate.toISOString().split('T')[0];
        });
        
        this.renderDays();
    }

    renderDays() {
        const container = document.getElementById('daysContainer');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.currentItinerary.days.forEach((day, dayIndex) => {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'day-item';
            
            const formattedDate = new Date(day.date).toLocaleDateString('en-IN', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            
            // Initialize locations array if not exists
            if (!day.locations || !Array.isArray(day.locations)) {
                day.locations = day.location ? [day.location] : [];
                delete day.location;
            }
            
            dayDiv.innerHTML = `
                <div class="day-header">
                    <div>
                        <div class="day-title">Day ${day.number}</div>
                        <div class="day-date">${formattedDate}</div>
                    </div>
                    <button class="remove-day-btn" data-day-index="${dayIndex}">Remove Day</button>
                </div>
                <div class="locations-container" id="locations-${dayIndex}">
                    <!-- Location rows will be added here -->
                </div>
                <button class="add-location-btn" data-day-index="${dayIndex}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                    </svg>
                    Add Location
                </button>
            `;
            
            container.appendChild(dayDiv);
            
            // Render existing locations for this day
            this.renderDayLocations(dayIndex);
        });
        
        // Re-bind events for day actions
        this.bindDayEvents();
    }
    
    bindDayEvents() {
        const container = document.getElementById('daysContainer');
        if (!container) return;
        
        container.querySelectorAll('.remove-day-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.getAttribute('data-day-index'));
                this.removeDay(index);
            });
        });
        
        container.querySelectorAll('.add-location-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const dayIndex = parseInt(e.target.getAttribute('data-day-index'));
                this.addLocationRow(dayIndex);
            });
        });
    }

    renderDayLocations(dayIndex) {
        const day = this.currentItinerary.days[dayIndex];
        const locationsContainer = document.getElementById(`locations-${dayIndex}`);
        if (!locationsContainer || !day) return;
        
        locationsContainer.innerHTML = '';
        
        // Render existing selected locations
        day.locations.forEach((location, locationIndex) => {
            this.createLocationRow(dayIndex, locationIndex, location);
        });
        
        // If no locations, add one empty row
        if (day.locations.length === 0) {
            this.addLocationRow(dayIndex);
        }
    }

    addLocationRow(dayIndex) {
        const day = this.currentItinerary.days[dayIndex];
        if (!day) return;
        
        if (!day.locations) day.locations = [];
        
        const locationIndex = day.locations.length;
        day.locations.push(''); // Add empty location
        
        this.createLocationRow(dayIndex, locationIndex, '');
    }

    createLocationRow(dayIndex, locationIndex, selectedLocation) {
        const locationsContainer = document.getElementById(`locations-${dayIndex}`);
        if (!locationsContainer) return;
        
        const locationRow = document.createElement('div');
        locationRow.className = 'location-row';
        locationRow.id = `location-row-${dayIndex}-${locationIndex}`;
        
        locationRow.innerHTML = `
            <div class="location-input-container">
                <select class="form-control location-select" 
                        data-day-index="${dayIndex}" 
                        data-location-index="${locationIndex}">
                    <option value="">Select location</option>
                    ${this.data.locations.map(loc => 
                        `<option value="${loc}" ${loc === selectedLocation ? 'selected' : ''}>${loc}</option>`
                    ).join('')}
                </select>
            </div>
            ${selectedLocation ? `
                <div class="selected-location">
                    <span class="selected-location-text">${selectedLocation}</span>
                    <button class="remove-location-btn" data-day-index="${dayIndex}" data-location-index="${locationIndex}">×</button>
                </div>
            ` : ''}
        `;
        
        locationsContainer.appendChild(locationRow);
        
        // Bind events for this location row
        this.bindLocationRowEvents(dayIndex, locationIndex);
    }

    bindLocationRowEvents(dayIndex, locationIndex) {
        const select = document.querySelector(`[data-day-index="${dayIndex}"][data-location-index="${locationIndex}"].location-select`);
        const removeBtn = document.querySelector(`[data-day-index="${dayIndex}"][data-location-index="${locationIndex}"].remove-location-btn`);
        
        if (select) {
            select.addEventListener('change', (e) => {
                this.selectLocationFromDropdown(dayIndex, locationIndex, e.target.value);
            });
        }
        
        if (removeBtn) {
            removeBtn.addEventListener('click', (e) => {
                this.removeLocation(dayIndex, locationIndex);
            });
        }
    }

    selectLocationFromDropdown(dayIndex, locationIndex, location) {
        if (location) {
            const day = this.currentItinerary.days[dayIndex];
            if (!day) return;
            
            const oldLocation = day.locations[locationIndex];
            
            // Remove old location from selected set
            if (oldLocation) {
                this.currentItinerary.selectedLocations.delete(oldLocation);
            }
            
            // Add new location
            day.locations[locationIndex] = location;
            this.currentItinerary.selectedLocations.add(location);
            
            // Re-render this location row to show selected state
            this.renderLocationRow(dayIndex, locationIndex);
            
            this.showMessage(`Location selected for Day ${dayIndex + 1}!`);
        }
    }

    removeLocation(dayIndex, locationIndex) {
        const day = this.currentItinerary.days[dayIndex];
        if (!day) return;
        
        const location = day.locations[locationIndex];
        if (location) {
            this.currentItinerary.selectedLocations.delete(location);
        }
        
        day.locations.splice(locationIndex, 1);
        this.renderDayLocations(dayIndex);
        this.showMessage('Location removed successfully!');
    }

    renderLocationRow(dayIndex, locationIndex) {
        const locationRow = document.getElementById(`location-row-${dayIndex}-${locationIndex}`);
        if (!locationRow) return;
        
        const day = this.currentItinerary.days[dayIndex];
        const selectedLocation = day?.locations[locationIndex] || '';
        
        locationRow.innerHTML = `
            <div class="location-input-container">
                <select class="form-control location-select" 
                        data-day-index="${dayIndex}" 
                        data-location-index="${locationIndex}">
                    <option value="">Select location</option>
                    ${this.data.locations.map(loc => 
                        `<option value="${loc}" ${loc === selectedLocation ? 'selected' : ''}>${loc}</option>`
                    ).join('')}
                </select>
            </div>
            ${selectedLocation ? `
                <div class="selected-location">
                    <span class="selected-location-text">${selectedLocation}</span>
                    <button class="remove-location-btn" data-day-index="${dayIndex}" data-location-index="${locationIndex}">×</button>
                </div>
            ` : ''}
        `;
        
        // Re-bind events
        this.bindLocationRowEvents(dayIndex, locationIndex);
    }

    // Itinerary Management
    saveItinerary() {
        console.log('saveItinerary called');
        
        const customer = document.getElementById('customerName')?.value?.trim();
        const startDate = document.getElementById('startDate')?.value;
        
        if (!customer) {
            this.showMessage('Please enter customer name!', 'error');
            return;
        }
        
        if (!startDate) {
            this.showMessage('Please select start date!', 'error');
            return;
        }
        
        if (this.currentItinerary.days.length === 0) {
            this.showMessage('Please add at least one day!', 'error');
            return;
        }
        
        // Check if all days have at least one location
        const incompleteDays = this.currentItinerary.days.filter(day => 
            !day.locations || day.locations.length === 0 || day.locations.every(loc => !loc)
        );
        if (incompleteDays.length > 0) {
            this.showMessage('Please select at least one location for each day!', 'error');
            return;
        }
        
        // Get selected packages
        const selectedPackages = [];
        document.querySelectorAll('.package-checkbox:checked').forEach(checkbox => {
            const pkg = this.data.packages.find(p => p.id === checkbox.value);
            if (pkg) selectedPackages.push(pkg);
        });
        
        const itinerary = {
            id: 'itin' + Date.now(),
            customer,
            startDate,
            days: JSON.parse(JSON.stringify(this.currentItinerary.days)), // Deep copy
            packages: selectedPackages,
            notes: this.data.notes,
            agency: this.data.agency,
            createdAt: new Date().toISOString()
        };
        
        console.log('Saving itinerary:', itinerary);
        
        this.data.itineraries.push(itinerary);
        this.saveData();
        this.renderSavedItineraries();
        this.clearItineraryForm();
        this.showMessage('Itinerary saved successfully!');
    }

    clearItineraryForm() {
        const customerName = document.getElementById('customerName');
        const startDate = document.getElementById('startDate');
        
        if (customerName) customerName.value = '';
        if (startDate) startDate.value = '';
        
        document.querySelectorAll('.package-checkbox').forEach(cb => cb.checked = false);
        this.currentItinerary.days = [];
        this.currentItinerary.selectedLocations.clear();
        this.renderDays();
    }

    copyItinerary(index) {
        const itinerary = this.data.itineraries[index];
        if (!itinerary) return;
        
        const customerName = document.getElementById('customerName');
        const startDate = document.getElementById('startDate');
        
        if (customerName) customerName.value = itinerary.customer + ' (Copy)';
        if (startDate) startDate.value = itinerary.startDate;
        
        // Copy days with locations
        this.currentItinerary.days = JSON.parse(JSON.stringify(itinerary.days));
        this.currentItinerary.selectedLocations.clear();
        
        // Rebuild selected locations set
        this.currentItinerary.days.forEach(day => {
            if (day.locations && Array.isArray(day.locations)) {
                day.locations.forEach(location => {
                    if (location) this.currentItinerary.selectedLocations.add(location);
                });
            }
        });
        
        // Copy packages
        document.querySelectorAll('.package-checkbox').forEach(cb => {
            cb.checked = itinerary.packages.some(pkg => pkg.id === cb.value);
        });
        
        this.renderDays();
        this.showMessage('Itinerary copied successfully!');
    }

    editItinerary(index) {
        this.copyItinerary(index);
        const customerName = document.getElementById('customerName');
        if (customerName) {
            customerName.value = this.data.itineraries[index].customer;
        }
        this.showMessage('Itinerary loaded for editing. Save to create new entry.');
    }

    deleteItinerary(index) {
        if (confirm('Are you sure you want to delete this itinerary?')) {
            this.data.itineraries.splice(index, 1);
            this.saveData();
            this.renderSavedItineraries();
            this.showMessage('Itinerary deleted successfully!');
        }
    }

    // Export Functions
    exportToPDF(itineraryId) {
        try {
            const itinerary = this.data.itineraries.find(it => it.id === itineraryId);
            if (!itinerary) {
                this.showMessage('Itinerary not found', 'error');
                return;
            }

            if (typeof window.jspdf === 'undefined') {
                this.showMessage('PDF export is not available. jsPDF library not loaded.', 'error');
                return;
            }

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Set colors
            const primaryColor = [33, 128, 141]; // Teal
            const secondaryColor = [98, 108, 113]; // Gray
            const textColor = [0, 0, 0]; // Black
            
            // Header
            doc.setFontSize(20);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...primaryColor);
            doc.text(this.data.agency.name, 20, 25);
            
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...secondaryColor);
            doc.text(`Mobile: ${this.data.agency.mobile}`, 20, 35);
            
            // Title
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...textColor);
            doc.text('Travel Itinerary', 20, 55);
            
            // Customer Info
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.text(`Customer: ${itinerary.customer}`, 20, 70);
            
            const dateRange = this.getDateRange(itinerary.startDate, itinerary.days.length);
            doc.text(`Duration: ${dateRange}`, 20, 80);
            
            // Itinerary Table
            let yPos = 95;
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...primaryColor);
            doc.text('Day-wise Itinerary:', 20, yPos);
            
            yPos += 15;
            itinerary.days.forEach((day) => {
                const dayDate = new Date(day.date).toLocaleDateString('en-IN');
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(...textColor);
                doc.text(`Day ${day.number} (${dayDate}):`, 25, yPos);
                yPos += 8;
                
                // List all locations for this day
                if (day.locations && day.locations.length > 0) {
                    day.locations.forEach((location, index) => {
                        if (location) {
                            doc.setFont('helvetica', 'normal');
                            doc.setFontSize(11);
                            doc.text(`• ${location}`, 30, yPos);
                            yPos += 8;
                        }
                    });
                }
                yPos += 5; // Extra space between days
                
                // Check if we need a new page
                if (yPos > 250) {
                    doc.addPage();
                    yPos = 20;
                }
            });
            
            // Packages
            if (itinerary.packages.length > 0) {
                yPos += 10;
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(...primaryColor);
                doc.text('Selected Packages:', 20, yPos);
                
                yPos += 15;
                itinerary.packages.forEach(pkg => {
                    if (yPos > 250) {
                        doc.addPage();
                        yPos = 20;
                    }
                    doc.setFontSize(12);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(...textColor);
                    doc.text(`• ${pkg.name} (${pkg.description}) - ₹${pkg.basePrice}`, 25, yPos);
                    yPos += 8;
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(...secondaryColor);
                    doc.text(`  Additional: ₹${pkg.additionalKmRate}/Km, ₹${pkg.additionalHrRate}/Hr`, 25, yPos);
                    yPos += 12;
                });
            }
            
            // Notes
            if (this.data.notes) {
                // Check if we need a new page
                if (yPos > 220) {
                    doc.addPage();
                    yPos = 20;
                }
                
                yPos += 10;
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(...primaryColor);
                doc.text('Terms & Conditions:', 20, yPos);
                
                yPos += 15;
                const noteLines = this.data.notes.split('\n');
                noteLines.forEach(line => {
                    if (line.trim()) {
                        if (yPos > 270) {
                            doc.addPage();
                            yPos = 20;
                        }
                        doc.setFontSize(10);
                        doc.setFont('helvetica', 'normal');
                        doc.setTextColor(...textColor);
                        doc.text(line, 25, yPos);
                        yPos += 8;
                    }
                });
            }
            
            // Generate proper filename and save
            const fileName = `${itinerary.customer}_Itinerary_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);
            
            this.showMessage('PDF generated successfully!');
        } catch (error) {
            console.error('PDF Export Error:', error);
            this.showMessage('Error generating PDF. Please try again.', 'error');
        }
    }

    exportToWhatsApp(itineraryId) {
        try {
            const itinerary = this.data.itineraries.find(it => it.id === itineraryId);
            if (!itinerary) {
                this.showMessage('Itinerary not found', 'error');
                return;
            }

            // Format message for WhatsApp
            let message = `*${this.data.agency.name}*\n`;
            message += `📞 ${this.data.agency.mobile}\n\n`;
            message += `*🗓️ TRAVEL ITINERARY*\n\n`;
            message += `*Customer:* ${itinerary.customer}\n`;
            
            const dateRange = this.getDateRange(itinerary.startDate, itinerary.days.length);
            message += `*Duration:* ${dateRange}\n\n`;
            
            message += `*📍 Day-wise Plan:*\n`;
            itinerary.days.forEach((day) => {
                const dayDate = new Date(day.date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short'
                });
                message += `*Day ${day.number}* (${dayDate}):\n`;
                
                // List all locations for this day
                if (day.locations && day.locations.length > 0) {
                    day.locations.forEach(location => {
                        if (location) {
                            message += `• ${location}\n`;
                        }
                    });
                }
                message += '\n';
            });
            
            // Packages
            if (itinerary.packages.length > 0) {
                message += `*💰 Selected Packages:*\n`;
                itinerary.packages.forEach(pkg => {
                    message += `• *${pkg.name}* (${pkg.description})\n`;
                    message += `  Base Price: ₹${pkg.basePrice}\n`;
                    message += `  Extra: ₹${pkg.additionalKmRate}/Km, ₹${pkg.additionalHrRate}/Hr\n\n`;
                });
            }
            
            if (this.data.notes) {
                message += `*📋 Terms & Conditions:*\n`;
                const noteLines = this.data.notes.split('\n');
                noteLines.forEach(line => {
                    if (line.trim()) {
                        message += `${line}\n`;
                    }
                });
            }
            
            message += `\n_Thank you for choosing ${this.data.agency.name}!_`;

            // Use mobile app protocol first
            const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
            window.location.href = whatsappUrl;

            // Fallback to web after delay
            setTimeout(() => {
                const webUrl = `https://web.whatsapp.com/send?text=${encodeURIComponent(message)}`;
                window.open(webUrl, '_blank');
            }, 1000);

            this.showMessage('Opening WhatsApp...');
        } catch (error) {
            console.error('WhatsApp Export Error:', error);
            this.showMessage('Error exporting to WhatsApp. Please try again.', 'error');
        }
    }

    // Utility Functions
    getDateRange(startDate, days) {
        const start = new Date(startDate);
        const end = new Date(startDate);
        end.setDate(end.getDate() + days - 1);
        
        const startStr = start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        const endStr = end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        
        return days === 1 ? startStr : `${startStr} to ${endStr}`;
    }

    showMessage(message, type = 'success') {
        const toast = document.getElementById('successToast');
        const messageElement = document.getElementById('toastMessage');
        
        if (toast && messageElement) {
            messageElement.textContent = message;
            toast.classList.remove('hidden', 'error');
            
            if (type === 'error') {
                toast.classList.add('error');
            }
            
            setTimeout(() => {
                toast.classList.add('hidden');
            }, 3000);
        } else {
            // Fallback to alert if toast elements don't exist
            console.log(message);
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new TravelItineraryApp();
});