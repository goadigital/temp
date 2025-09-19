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
        // used to restore/scroll to the day that was modified to avoid jumping
        this._scrollToDayAfterRender = null;
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

        this.data.packages.forEach((pkg, index) => {
            const wrap = document.createElement('div');
            wrap.className = 'package-item';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'package-checkbox';
            checkbox.id = `pkg-${index}`;
            checkbox.setAttribute('data-index', String(index));
            // store package name in value for fallback
            checkbox.value = pkg.name || '';

            const label = document.createElement('label');
            label.htmlFor = `pkg-${index}`;
            label.textContent = `${pkg.name} ${pkg.description ? '- ' + pkg.description : ''}`;

            wrap.appendChild(checkbox);
            wrap.appendChild(label);
            container.appendChild(wrap);
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
        // read inputs (fall back to empty if elements not present)
        const nameEl = document.getElementById('packageName');
        const descEl = document.getElementById('packageDesc');
        const distEl = document.getElementById('packageDistance');
        const durEl = document.getElementById('packageDuration');
        const priceEl = document.getElementById('packagePrice');
        // support multiple possible input IDs (robust fallback)
        const kmRateEl = document.getElementById('packageKmRate') || document.getElementById('packageKmRateInput') || document.getElementById('packageKmRateField');
        const hourRateEl = document.getElementById('packageHrRate') || document.getElementById('packageHourRate') || document.getElementById('packageHourRateInput');

        const distance = distEl && distEl.value ? String(distEl.value).trim() : '';
        const duration = durEl && durEl.value ? String(durEl.value).trim() : '';

        // auto-generate name if not provided
        let name = nameEl && nameEl.value ? String(nameEl.value).trim() : '';
        if (!name) {
            const parts = ['Package'];
            if (duration) parts.push(`${duration} Hours`);
            if (distance) parts.push(`${distance} Km`);
            name = parts.join(' - ');
        }

        const pkg = {
            name,
            description: descEl ? descEl.value : '',
            distance: distance,
            duration: duration,
            basePrice: priceEl ? Number(priceEl.value) || 0 : 0,
            // save using the same property names used elsewhere in the app
            additionalKmRate: kmRateEl ? Number(kmRateEl.value) || 0 : 0,
            additionalHrRate: hourRateEl ? Number(hourRateEl.value) || 0 : 0,
            // keep legacy keys too (optional)
            kmRate: kmRateEl ? Number(kmRateEl.value) || 0 : 0,
            hourRate: hourRateEl ? Number(hourRateEl.value) || 0 : 0,
        };

        // push into data store
        this.data.packages.push(pkg);
        this.saveData();
        this.renderPackages();
        // clear inputs (keep generated name cleared too)
        if (descEl) descEl.value = '';
        if (distEl) distEl.value = '';
        if (durEl) durEl.value = '';
        if (priceEl) priceEl.value = '';
        // clear all supported rate fields
        ['packageKmRate','packageKmRateInput','packageHrRate','packageHourRate','packageHourRateInput'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        if (nameEl) nameEl.value = '';
        this.showMessage('Package added', 'success');
    }

    clearPackageForm() {
        // clear both common ID variants to be robust
        const fields = ['packageName', 'packageDesc', 'packagePrice', 'packageKmRate', 'packageKmRateInput', 'packageHrRate', 'packageHourRate'];
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
        // populate any present rate inputs (support multiple IDs)
        const kmFields = ['packageKmRate','packageKmRateInput'];
        const hrFields = ['packageHrRate','packageHourRate'];
        kmFields.forEach(id => { const el = document.getElementById(id); if (el) el.value = pkg.additionalKmRate ?? pkg.kmRate ?? ''; });
        hrFields.forEach(id => { const el = document.getElementById(id); if (el) el.value = pkg.additionalHrRate ?? pkg.hourRate ?? ''; });
        
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
        // Add a new day object with empty locations array
        const newDay = {
            locations: []
        };
        this.currentItinerary.days.push(newDay);
        this.updateDayDates();
        this.renderDays();
        this.moveAddDayBtnToEnd();
    }

    removeDay(index) {
        // remove locations from selectedLocations set when deleting day
        const day = this.currentItinerary.days[index];
        if (day && day.locations.length) {
            day.locations.forEach(loc => this.currentItinerary.selectedLocations.delete(loc));
        }
        this.currentItinerary.days.splice(index, 1);
        this.updateDayDates();
        this.renderDays();
    }

    updateDayDates() {
        const startInput = document.getElementById('startDate');
        const start = startInput && startInput.value ? new Date(startInput.value) : new Date();
        this.currentItinerary.startDate = start.toISOString().split('T')[0];
    }

    renderDays() {
        const container = document.getElementById('daysContainer');
        if (!container) return;
        // preserve scroll to avoid abrupt jump
        const prevScrollTop = container.scrollTop;
        const prevScrollLeft = container.scrollLeft;

        // keep reference to add-day container (so we can move it to the end)
        const addDayContainer = container.querySelector('.add-day-container');

        // clear all day items (but not the add-day container)
        container.querySelectorAll('.day-item').forEach(el => el.remove());

        // render each day
        this.currentItinerary.days.forEach((day, idx) => {
            const dayIndex = idx;
            const dayDiv = document.createElement('div');
            dayDiv.className = 'day-item';
            // give each day wrapper a stable id so we can scroll to it after re-render
            dayDiv.id = `day-${dayIndex}`;
            
            // compute date
            const startDateStr = this.currentItinerary.startDate || document.getElementById('startDate').value || new Date().toISOString().split('T')[0];
            const date = new Date(startDateStr);
            date.setDate(date.getDate() + dayIndex);
            const dateStr = date.toISOString().split('T')[0];

            dayDiv.innerHTML = `
                <div class="day-header">
                    <div class="day-title">Day ${dayIndex + 1}</div>
                    <div class="day-date">${dateStr}</div>
                    <button class="btn remove-day-btn" data-day-index="${dayIndex}">Remove Day</button>
                </div>
                <div class="day-locations" id="dayLocations-${dayIndex}"></div>
            `;
            // insert before add-day container (so add day stays at end)
            if (addDayContainer) container.insertBefore(dayDiv, addDayContainer);
            else container.appendChild(dayDiv);

            // Render existing location rows and the persistent dropdown
            this.renderDayLocations(dayIndex);
        });

        // re-bind day events
        this.bindDayEvents();
        // ensure add-day button at end
        this.moveAddDayBtnToEnd();

        // After re-rendering, either scroll to the specific day that was modified
        // or restore previous scroll position so the UI doesn't jump to Day 1.
        setTimeout(() => {
            if (Number.isInteger(this._scrollToDayAfterRender)) {
                const target = document.getElementById(`day-${this._scrollToDayAfterRender}`);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } else {
                    // fallback: restore previous scroll
                    container.scrollTop = prevScrollTop;
                    container.scrollLeft = prevScrollLeft;
                }
                this._scrollToDayAfterRender = null;
            } else {
                container.scrollTop = prevScrollTop;
                container.scrollLeft = prevScrollLeft;
            }
        }, 20);
    }

    bindDayEvents() {
        // remove day buttons
        document.querySelectorAll('.remove-day-btn').forEach(btn => {
            btn.onclick = (e) => {
                const idx = parseInt(e.currentTarget.dataset.dayIndex, 10);
                this.removeDay(idx);
            };
        });

        // remove-location buttons are bound inside renderDayLocations
    }

    renderDayLocations(dayIndex) {
        const container = document.getElementById(`dayLocations-${dayIndex}`);
        if (!container) return;
        container.innerHTML = '';

        const day = this.currentItinerary.days[dayIndex] || { locations: [] };

        // render each selected location for the day (one-line entries)
        day.locations.forEach((locName, locIdx) => {
            const row = document.createElement('div');
            row.className = 'location-row';
            row.innerHTML = `
                <span class="selected-location-text">${locName}</span>
                <button class="btn remove-location-btn" data-day-index="${dayIndex}" data-loc-name="${locName}">Remove</button>
            `;
            container.appendChild(row);
        });

        // Build persistent dropdown for adding next location
        const allLocations = this.data.locations || [];
        const available = allLocations.filter(l => !this.currentItinerary.selectedLocations.has(l));

        // If there are available locations, show a select immediately
        if (available.length > 0) {
            const selWrap = document.createElement('div');
            selWrap.className = 'location-select-wrap';

            const select = document.createElement('select');
            select.className = 'location-select';
            const placeholderOpt = document.createElement('option');
            placeholderOpt.value = '';
            placeholderOpt.textContent = 'Select location';
            select.appendChild(placeholderOpt);

            available.forEach(loc => {
                const opt = document.createElement('option');
                opt.value = loc;
                opt.textContent = loc;
                select.appendChild(opt);
            });

            selWrap.appendChild(select);
            container.appendChild(selWrap);

            // onchange: add selected location immediately and re-render (this creates a fresh dropdown line)
            select.onchange = (e) => {
                const chosen = e.target.value;
                if (!chosen) return;
                this.selectLocationFromDropdown(dayIndex, chosen);
            };
        } else {
            // optionally show info when no more locations available
            const info = document.createElement('div');
            info.className = 'no-more-locations';
            info.textContent = 'No more locations available';
            container.appendChild(info);
        }

        // bind remove location buttons
        container.querySelectorAll('.remove-location-btn').forEach(btn => {
            btn.onclick = (e) => {
                const dayIdx = parseInt(e.currentTarget.dataset.dayIndex, 10);
                const locName = e.currentTarget.dataset.locName;
                this.removeLocation(dayIdx, locName);
            };
        });
    }

    addLocationRow(dayIndex) {
        // create a small select dropdown populated with available locations (not already selected)
        const locations = this.data.locations || [];
        const available = locations.filter(l => !this.currentItinerary.selectedLocations.has(l));

        // if none available, show message
        if (available.length === 0) {
            this.showMessage('No more locations available to add', 'info');
            return;
        }

        // create dropdown element (modal-like inline)
        const container = document.getElementById(`dayLocations-${dayIndex}`);
        const selWrap = document.createElement('div');
        selWrap.className = 'location-select-wrap';

        const select = document.createElement('select');
        select.className = 'location-select';
        const placeholderOpt = document.createElement('option');
        placeholderOpt.value = '';
        placeholderOpt.textContent = 'Select location';
        select.appendChild(placeholderOpt);

        available.forEach(loc => {
            const opt = document.createElement('option');
            opt.value = loc;
            opt.textContent = loc;
            select.appendChild(opt);
        });

        const addBtn = document.createElement('button');
        addBtn.className = 'btn btn--primary add-location-btn';
        addBtn.textContent = 'Add';

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn btn--outline';
        cancelBtn.textContent = 'Cancel';

        selWrap.appendChild(select);
        selWrap.appendChild(addBtn);
        selWrap.appendChild(cancelBtn);
        container.appendChild(selWrap);

        // handlers
        addBtn.onclick = () => {
            const chosen = select.value;
            if (!chosen) {
                this.showMessage('Please select a location', 'error');
                return;
            }
            this.selectLocationFromDropdown(dayIndex, chosen);
        };
        cancelBtn.onclick = () => selWrap.remove();
    }

    selectLocationFromDropdown(dayIndex, location) {
        // add to day and global selected set
        const day = this.currentItinerary.days[dayIndex];
        if (!day) return;
        if (!day.locations.includes(location)) {
            day.locations.push(location);
            this.currentItinerary.selectedLocations.add(location);
        }
        // remember which day we updated so renderDays can keep the view there
        this._scrollToDayAfterRender = dayIndex;
        // re-render days to reflect the new row (renderDays will handle scrolling)
        this.renderDays();
    }

    removeLocation(dayIndex, location) {
        const day = this.currentItinerary.days[dayIndex];
        if (!day) return;
        const idx = day.locations.indexOf(location);
        if (idx > -1) {
            day.locations.splice(idx, 1);
            // remove from global selected set so it becomes available elsewhere
            this.currentItinerary.selectedLocations.delete(location);
        }
        this.renderDays();
    }

    // Helper to ensure Add Day button stays at end
    moveAddDayBtnToEnd() {
        const daysContainer = document.getElementById('daysContainer');
        if (!daysContainer) return;
        const addDayContainer = daysContainer.querySelector('.add-day-container');
        if (addDayContainer) daysContainer.appendChild(addDayContainer);
    }

    // Itinerary Management
    saveItinerary() {
        try {
            const customer = document.getElementById('customerName')?.value?.trim() || 'Unnamed';
            const startDateInput = document.getElementById('startDate');
            const startDate = startDateInput && startDateInput.value ? startDateInput.value : this.currentItinerary.startDate || new Date().toISOString().split('T')[0];

            // collect selected packages by reading checkboxes' data-index
            const selectedPackages = [];
            document.querySelectorAll('.package-checkbox').forEach(cb => {
                if (cb.checked) {
                    const idx = cb.getAttribute('data-index');
                    if (idx !== null) {
                        const p = this.data.packages[Number(idx)];
                        if (p) selectedPackages.push(Object.assign({}, p));
                    } else {
                        // fallback: match by name
                        const name = cb.value;
                        const p = this.data.packages.find(pp => pp.name === name);
                        if (p) selectedPackages.push(Object.assign({}, p));
                    }
                }
            });

            // Deep copy days to avoid mutation later
            const daysCopy = JSON.parse(JSON.stringify(this.currentItinerary.days || []));

            const itinerary = {
                id: Date.now().toString(),
                customer,
                startDate,
                days: daysCopy,
                packages: selectedPackages,
                notes: this.data.notes || '',
                agency: Object.assign({}, this.data.agency || {}),
                createdAt: new Date().toISOString()
            };

            this.data.itineraries = this.data.itineraries || [];
            this.data.itineraries.push(itinerary);
            this.saveData();
            this.renderSavedItineraries();
            this.showMessage('Itinerary saved successfully!');
            this.clearItineraryForm();
        } catch (error) {
            console.error(error);
            this.showMessage('Failed to save itinerary', 'error');
        }
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
        
        if (customerName) customerName.value = itinerary.customer || '';
        if (startDate) {
            startDate.value = itinerary.startDate || '';
            const disp = document.getElementById('startDateDisplay');
            if (disp) disp.textContent = this.formatDateDisplay(itinerary.startDate);
        }
        
        // Copy days with locations
        this.currentItinerary.days = JSON.parse(JSON.stringify(itinerary.days));
        this.currentItinerary.selectedLocations.clear();
        
        // Rebuild selected locations set
        this.currentItinerary.days.forEach(day => {
            (day.locations || []).forEach(loc => this.currentItinerary.selectedLocations.add(loc));
        });
        
        // Copy packages
        document.querySelectorAll('.package-checkbox').forEach(cb => {
            cb.checked = (itinerary.packages || []).some(p => p.id === cb.value || p.name === cb.value);
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

    // Utility Functions
    // return formatted date like "19 Sep 2025" for a single date string "YYYY-MM-DD"
    formatDateDisplay(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d)) return dateStr;
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    

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
    
    // export itinerary as formatted PDF using jsPDF (improved visual layout / background)
    exportToPDF(itineraryId) {
        try {
            const itinerary = this.data.itineraries.find(it => it.id === itineraryId);
            if (!itinerary) { this.showMessage('Itinerary not found', 'error'); return; }

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ unit: 'pt', format: 'a4' });
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 48;
            let y = 32;

            // Full page subtle background (very light)
            doc.setFillColor(250, 251, 253);
            doc.rect(0, 0, pageWidth, pageHeight, 'F');

            // Header band (branding) — left soft color block across top, agency on right
            const headerHeight = 64;
            doc.setFillColor(16, 88, 151); // deep blue branding color
            doc.rect(0, 0, pageWidth, headerHeight, 'F');

            // Agency name & mobile — top-right in white
            const agencyName = itinerary.agency?.name || this.data.agency?.name || 'Agency Name';
            const agencyMobile = itinerary.agency?.mobile || this.data.agency?.mobile || 'Mobile';
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.setTextColor(255, 255, 255);
            const agencyHeader = `${agencyName}\n${agencyMobile}`;
            // draw multi-line right aligned inside header area with small right margin
            doc.text(agencyHeader, pageWidth - margin, 16, { align: 'right', baseline: 'top' });

            // Thin divider under header
            doc.setDrawColor(220, 225, 230);
            doc.setLineWidth(0.6);
            doc.line(margin, headerHeight + 8, pageWidth - margin, headerHeight + 8);

            // Title centered: Itinerary (placed below header)
            y = headerHeight + 28;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(22);
            doc.setTextColor(34, 34, 34);
            doc.text('Itinerary', pageWidth / 2, y, { align: 'center' });

            // Date range and customer below title
            y += 28;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(11);
            doc.setTextColor(80, 80, 80);
            const dateRange = this.getDateRange(itinerary.startDate, itinerary.days?.length || 0);
            doc.text(`Dates: ${dateRange}`, margin, y);
            y += 18;
            doc.text(`Customer: ${itinerary.customer || ''}`, margin, y);

            // extra space after Customer
            y += 34;

            // Day-wise details: each location line-by-line
            doc.setFontSize(12);
            doc.setTextColor(34,34,34);
            (itinerary.days || []).forEach((day, idx) => {
                if (y > pageHeight - 120) { doc.addPage(); y = margin; }
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(12);
                doc.text(`Day ${idx + 1}:`, margin, y);
                y += 16;
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(11);
                const locations = day.locations || [];
                if (locations.length === 0) {
                    doc.setTextColor(120,120,120);
                    doc.text('- No locations added', margin + 18, y);
                    y += 14;
                } else {
                    locations.forEach(loc => {
                        if (y > pageHeight - 120) { doc.addPage(); y = margin; }
                        doc.setTextColor(60,60,60);
                        const wrapped = doc.splitTextToSize(`- ${loc}`, pageWidth - margin * 2 - 20);
                        doc.text(wrapped, margin + 18, y);
                        y += wrapped.length * 14;
                    });
                }
                // space after each day
                y += 12;
            });

            // extra space after last day/locations
            y += 18;

            // Selected packages with additional details
            if (itinerary.packages && itinerary.packages.length) {
                if (y > pageHeight - 140) { doc.addPage(); y = margin; }
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(13);
                doc.setTextColor(34,34,34);
                doc.text('Selected Packages:', margin, y);
                y += 18;
                doc.setFont('helvetica', 'normal');
                itinerary.packages.forEach(pkg => {
                    if (y > pageHeight - 140) { doc.addPage(); y = margin; }
                    const pkgLine = `${pkg.name || ''}${pkg.description ? ' - ' + pkg.description : ''}`;
                    const wrappedPkg = doc.splitTextToSize(`• ${pkgLine}`, pageWidth - margin * 2 - 20);
                    doc.setFontSize(11);
                    doc.setTextColor(60,60,60);
                    doc.text(wrappedPkg, margin + 18, y);
                    y += wrappedPkg.length * 14;

                    // Additional numeric/details line (if present) — "Base Price" and Rs. prefix
                    const detailsParts = [];
                    if (pkg.basePrice !== undefined) detailsParts.push(`Base Price: Rs. ${pkg.basePrice}`);
                    if (pkg.additionalKmRate !== undefined) detailsParts.push(`+Rs. ${pkg.additionalKmRate}/Km`);
                    if (pkg.additionalHrRate !== undefined) detailsParts.push(`+Rs. ${pkg.additionalHrRate}/Hr`);
                    if (detailsParts.length) {
                        if (y > pageHeight - 120) { doc.addPage(); y = margin; }
                        doc.setFontSize(10);
                        doc.setTextColor(110,110,110);
                        const details = detailsParts.join('  •  ');
                        const wrappedDetails = doc.splitTextToSize(details, pageWidth - margin * 2 - 40);
                        doc.text(wrappedDetails, margin + 28, y);
                        y += wrappedDetails.length * 12 + 10;
                    } else {
                        y += 6;
                    }
                });
            }

            // Terms & Conditions from Agency Notes
            const terms = this.data.notes || '';
            if (terms) {
                if (y > pageHeight - 160) { doc.addPage(); y = margin; }
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(12);
                doc.setTextColor(34,34,34);
                doc.text('Terms & Conditions:', margin, y);
                y += 16;
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(10);
                doc.setTextColor(100,100,100);
                const wrappedTerms = doc.splitTextToSize(terms, pageWidth - margin * 2);
                doc.text(wrappedTerms, margin, y);
            }

            // Footer small branding line
            const footerY = pageHeight - 28;
            doc.setFontSize(9);
            doc.setTextColor(120,120,120);
            doc.text(`Generated by ${this.data.agency?.name || 'Agency'}`, margin, footerY);

            const filename = `${(itinerary.customer || 'itinerary').replace(/\s+/g, '_')}_${itinerary.id || Date.now()}.pdf`;
            doc.save(filename);
            this.showMessage('PDF exported');
        } catch (err) {
            console.error(err);
            this.showMessage('Failed to export PDF', 'error');
        }
    }

    // open WhatsApp share with formatted dates and itinerary summary
    exportToWhatsApp(itineraryId) {
        try {
            const itinerary = this.data.itineraries.find(it => it.id === itineraryId);
            if (!itinerary) { this.showMessage('Itinerary not found', 'error'); return; }

            const agencyName = itinerary.agency?.name || this.data.agency?.name || 'Agency Name';
            const agencyMobile = itinerary.agency?.mobile || this.data.agency?.mobile || 'Mobile';

            const dateRange = this.getDateRange(itinerary.startDate, itinerary.days?.length || 0);

            // Build message following requested sequence and spacing. Use * for headings.
            let msg = '';
            // Heading: Agency name and mobile (then two blank lines)
            msg += `${agencyName} • ${agencyMobile}\n\n\n`;

            // Itinerary heading (then one blank line)
            msg += `*Itinerary*\n\n`;

            // Dates (then one blank line)
            msg += `*Dates:* ${dateRange}\n\n`;

            // Day-wise details: each location line-by-line. After all days keep two blank lines
            itinerary.days.forEach((day, idx) => {
                msg += `*Day ${idx + 1}:*\n`;
                const locs = (day.locations || []);
                if (locs.length === 0) {
                    msg += `- No locations added\n`;
                } else {
                    locs.forEach(loc => {
                        msg += `- ${loc}\n`;
                    });
                }
                msg += `\n`; // small gap between days
            });
            msg += `\n\n`;

            // Selected packages with additional details, then two blank lines
            if (itinerary.packages && itinerary.packages.length) {
                msg += `*Selected Packages:*\n`;
                itinerary.packages.forEach(p => {
                    msg += `*${p.name || ''}*${p.description ? ' - ' + p.description : ''}\n`;
                    const parts = [];
                    if (p.basePrice !== undefined) parts.push(`Base Price: Rs. ${p.basePrice}`);
                    if (p.additionalKmRate !== undefined) parts.push(`+Rs. ${p.additionalKmRate}/Km`);
                    if (p.additionalHrRate !== undefined) parts.push(`+Rs. ${p.additionalHrRate}/Hr`);
                    if (parts.length) msg += `${parts.join('  •  ')}\n`;
                    msg += `\n`;
                });
                msg += `\n`;
            } else {
                msg += `*Selected Packages:*\n- None\n\n\n`;
            }

            // Terms & Conditions from agency notes
            const terms = itinerary.notes || this.data.notes || '';
            if (terms) {
                msg += `*Terms & Conditions:*\n${terms}\n`;
            }

            const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
            window.open(url, '_blank');
        } catch (error) {
            console.error(error);
            this.showMessage('Failed to prepare WhatsApp message', 'error');
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.app = new TravelItineraryApp();

    // Set start date to today by default and update friendly display
    const startDateInput = document.getElementById('startDate');
    if (startDateInput) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const iso = `${yyyy}-${mm}-${dd}`;
        if (!startDateInput.value) startDateInput.value = iso;
        const disp = document.getElementById('startDateDisplay');
        if (disp) disp.textContent = window.app.formatDateDisplay(startDateInput.value);

        // update display when user changes the date
        startDateInput.addEventListener('change', (e) => {
            const v = e.target.value;
            if (disp) disp.textContent = window.app.formatDateDisplay(v);
            // ensure itinerary startDate is kept in sync
            window.app.currentItinerary.startDate = v || window.app.currentItinerary.startDate;
        });
    }

    // Automatically add Day 1 when the page loads (if no days yet)
    if (!window.app.currentItinerary.days.length) {
        window.app.addDay();
    }

    // Move Add Day button to end and wire its click
    window.app.moveAddDayBtnToEnd();

    const pkgNameInput = document.getElementById('packageName');
    const pkgDistInput = document.getElementById('packageDistance');
    const pkgDurInput = document.getElementById('packageDuration');
    const addPkgBtn = document.getElementById('addPackageBtn');

    function updatePackageName() {
        const d = pkgDistInput?.value ? pkgDistInput.value : '';
        const h = pkgDurInput?.value ? pkgDurInput.value : '';
        if (pkgNameInput) pkgNameInput.value = d || h ? `${d} Km / ${h} Hr` : '';
    }

    if (pkgDistInput) pkgDistInput.addEventListener('input', updatePackageName);
    if (pkgDurInput) pkgDurInput.addEventListener('input', updatePackageName);

    // ensure addPackage is called (existing binding may exist) — attach if not present
    if (addPkgBtn) {
        addPkgBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.app.addPackage();
        });
    }
});