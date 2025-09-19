// app.js - Itinerary Builder
// Requires: jsPDF (loaded in index.html)

(() => {
  const qs = s => document.querySelector(s);
  const qsa = s => Array.from(document.querySelectorAll(s));

  class ItineraryApp {
    constructor() {
      this.storageKey = 'itinerary_app_v1';
      this.data = {
        agency: { name: '', mobile: '' },
        locations: [],   // available locations
        packages: [],    // package objects
        itineraries: []  // saved itineraries
      };

      // transient editing state
      this.currentItinerary = {
        id: null,
        customer: 'Customer',
        startDate: null,
        days: [], // { number, date (yyyy-mm-dd), locations: [str] }
        packages: []
      };
      this.currentItinerary.selectedLocations = new Set(); // prevent duplicates
      this.editingPackageIndex = -1;

      this.init();
    }

    // ---------- Initialization ----------
    init() {
      this.loadData();
      this.renderUI();

      // Auto-set start date to today and ensure at least Day 1
      try {
        const startInput = qs('#startDate');
        if (startInput) {
          const today = new Date();
          const yyyy = today.getFullYear();
          const mm = String(today.getMonth() + 1).padStart(2, '0');
          const dd = String(today.getDate()).padStart(2, '0');
          startInput.value = `${yyyy}-${mm}-${dd}`;
          this.currentItinerary.startDate = startInput.value;
          if (this.currentItinerary.days.length === 0) {
            this.addDay();
          } else {
            this.updateDayDates();
          }
        }
      } catch (e) {
        console.warn('Auto start date failed', e);
      }

      this.bindEvents();
      this.renderSavedItineraries();
    }

    loadData() {
      try {
        const raw = localStorage.getItem(this.storageKey);
        if (raw) {
          const obj = JSON.parse(raw);
          this.data = Object.assign(this.data, obj);
        }
      } catch (e) {
        console.warn('Failed to load data', e);
      }
    }

    saveData() {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
      this.renderLocations();
      this.renderPackagesList();
      this.renderSavedItineraries();
    }

    showMessage(msg, type = 'info') {
      console.log(`${type.toUpperCase()}: ${msg}`);
      // Simple transient UI feedback: small alert in console for now
      // You can wire a nicer toast if needed
    }

    // ---------- UI rendering ----------
    renderUI() {
      qs('#agencyName').value = this.data.agency.name || '';
      qs('#agencyMobile').value = this.data.agency.mobile || '';
      this.renderLocations();
      this.renderPackagesList();
      this.renderDays();
    }

    renderLocations() {
      const out = qs('#locationsList');
      out.innerHTML = '';
      this.data.locations.forEach(loc => {
        const div = document.createElement('div');
        div.className = 'list-item';
        div.innerText = loc;
        out.appendChild(div);
      });
    }

    renderPackagesList() {
      const out = qs('#packagesList');
      out.innerHTML = '';
      this.data.packages.forEach((p, idx) => {
        const el = document.createElement('div');
        el.className = 'list-item';
        el.innerHTML = `<strong>${p.name}</strong><div class="muted">Rs ${p.basePrice} | ${p.hours || '-'} Hrs | ${p.kms || '-'} Kms</div>
          <div class="row-actions">
            <button data-i="${idx}" class="btn btn--tiny edit-pkg">Edit</button>
            <button data-i="${idx}" class="btn btn--tiny del-pkg">Delete</button>
          </div>`;
        out.appendChild(el);
      });

      qsa('.edit-pkg').forEach(b => b.addEventListener('click', e => {
        const idx = parseInt(e.target.getAttribute('data-i'));
        this.editPackage(idx);
      }));
      qsa('.del-pkg').forEach(b => b.addEventListener('click', e => {
        const idx = parseInt(e.target.getAttribute('data-i'));
        if (confirm('Delete package?')) {
          this.data.packages.splice(idx, 1);
          this.saveData();
        }
      }));
    }

    renderDays() {
      const container = qs('#daysContainer');
      container.innerHTML = '';

      this.currentItinerary.days.forEach((day, dayIndex) => {
        const dayBox = document.createElement('div');
        dayBox.className = 'day-item';
        dayBox.id = `day-${dayIndex}`;

        const displayDate = new Date(day.date);
        const dateLabel = displayDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

        dayBox.innerHTML = `
          <div class="day-header">
            <div><strong>Day ${day.number}</strong> — <span class="muted">${dateLabel}</span></div>
            <div class="day-actions">
              <button class="btn btn--tiny add-location-btn" data-day="${dayIndex}">+ Location</button>
              <button class="btn btn--tiny remove-day-btn" data-day="${dayIndex}">Remove Day</button>
            </div>
          </div>
          <div id="locations-${dayIndex}" class="locations-list"></div>
        `;
        container.appendChild(dayBox);

        // ensure at least one empty location row
        if (!day.locations || day.locations.length === 0) day.locations = [''];
        // render each location row
        day.locations.forEach((loc, i) => this.createLocationRow(dayIndex, i, loc));
      });

      // Bind day-level buttons
      qsa('.add-location-btn').forEach(b => b.addEventListener('click', e => {
        const d = parseInt(e.target.getAttribute('data-day'));
        this.addLocationRow(d);
      }));
      qsa('.remove-day-btn').forEach(b => b.addEventListener('click', e => {
        const d = parseInt(e.target.getAttribute('data-day'));
        if (confirm('Remove this day?')) this.removeDay(d);
      }));
    }

    // ---------- Day & Location management ----------
    addDay() {
      const startDateInput = qs('#startDate');
      const startDate = startDateInput?.value;
      if (!startDate) {
        this.showMessage('Please set start date first', 'error');
        return;
      }
      const dayNumber = this.currentItinerary.days.length + 1;
      const dayDate = new Date(startDate);
      dayDate.setDate(dayDate.getDate() + (dayNumber - 1));
      this.currentItinerary.days.push({
        number: dayNumber,
        date: dayDate.toISOString().split('T')[0],
        locations: ['']
      });
      // scroll into view after render
      this.renderDays();
      setTimeout(() => {
        const el = qs(`#daysContainer .day-item:last-child`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 60);
    }

    removeDay(dayIndex) {
      const removed = this.currentItinerary.days.splice(dayIndex, 1)[0];
      // remove used locations from selected set
      if (removed && removed.locations) {
        removed.locations.forEach(l => {
          if (l) this.currentItinerary.selectedLocations.delete(l);
        });
      }
      // renumber remaining days and update dates
      this.updateDayDates();
      this.renderDays();
    }

    updateDayDates() {
      const startDateInput = qs('#startDate');
      const startDate = startDateInput?.value;
      if (!startDate) return;
      this.currentItinerary.startDate = startDate;
      this.currentItinerary.days.forEach((day, idx) => {
        const dayDate = new Date(startDate);
        dayDate.setDate(dayDate.getDate() + idx);
        day.number = idx + 1;
        day.date = dayDate.toISOString().split('T')[0];
      });
      this.renderDays();
    }

    createLocationRow(dayIndex, locationIndex, selectedLocation) {
      const locationsContainer = qs(`#locations-${dayIndex}`);
      if (!locationsContainer) return;

      const row = document.createElement('div');
      row.className = 'location-row';
      row.id = `location-row-${dayIndex}-${locationIndex}`;

      // Build available options excluding already selected locations except current selection
      const chosen = selectedLocation || '';
      const used = Array.from(this.currentItinerary.selectedLocations);
      const available = this.data.locations
        .filter(loc => (loc === chosen) || !used.includes(loc));

      const optionsHtml = available.map(loc => `<option value="${loc}">${loc}</option>`).join('');

      row.innerHTML = `
        <div class="loc-left">
          <input list="dlist-${dayIndex}-${locationIndex}" class="location-input" data-day="${dayIndex}" data-index="${locationIndex}" placeholder="Search or type location" value="${selectedLocation ? selectedLocation : ''}" />
          <datalist id="dlist-${dayIndex}-${locationIndex}">${optionsHtml}</datalist>
          <select class="location-select" data-day="${dayIndex}" data-index="${locationIndex}">
            <option value="">Select location</option>
            ${optionsHtml}
          </select>
        </div>
        <div class="loc-right">
          ${selectedLocation ? `<div class="selected-text">${selectedLocation}</div>` : `<div class="selected-text muted">not selected</div>`}
          <div class="row-actions">
            <button class="btn btn--tiny remove-loc" data-day="${dayIndex}" data-index="${locationIndex}">Remove</button>
          </div>
        </div>
      `;
      locationsContainer.appendChild(row);

      // Ensure day.locations array length
      const day = this.currentItinerary.days[dayIndex];
      if (!day.locations) day.locations = [];
      day.locations[locationIndex] = selectedLocation || '';

      this.bindLocationRowEvents(dayIndex, locationIndex);
    }

    addLocationRow(dayIndex) {
      const day = this.currentItinerary.days[dayIndex];
      if (!day) return;
      day.locations.push('');
      this.renderDays();
      // scroll to bottom of that day
      setTimeout(() => {
        const el = qs(`#day-${dayIndex} .locations-list .location-row:last-child`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 60);
    }

    bindLocationRowEvents(dayIndex, locationIndex) {
      const input = qs(`input.location-input[data-day="${dayIndex}"][data-index="${locationIndex}"]`);
      const select = qs(`select.location-select[data-day="${dayIndex}"][data-index="${locationIndex}"]`);
      const removeBtn = qs(`button.remove-loc[data-day="${dayIndex}"][data-index="${locationIndex}"]`);

      if (select) {
        select.addEventListener('change', e => {
          this.selectLocation(dayIndex, locationIndex, e.target.value);
          setTimeout(() => {
            const day = this.currentItinerary.days[dayIndex];
            if (day && day.locations && day.locations.length - 1 === locationIndex) this.addLocationRow(dayIndex);
          }, 40);
        });
      }

      if (input) {
        input.addEventListener('change', e => {
          const val = e.target.value.trim();
          if (val) {
            this.selectLocation(dayIndex, locationIndex, val);
            setTimeout(() => {
              const day = this.currentItinerary.days[dayIndex];
              if (day && day.locations && day.locations.length - 1 === locationIndex) this.addLocationRow(dayIndex);
            }, 40);
          }
        });
        input.addEventListener('keypress', e => {
          if (e.key === 'Enter') {
            e.preventDefault();
            const val = input.value.trim();
            if (val) {
              this.selectLocation(dayIndex, locationIndex, val);
              setTimeout(() => {
                const day = this.currentItinerary.days[dayIndex];
                if (day && day.locations && day.locations.length - 1 === locationIndex) this.addLocationRow(dayIndex);
              }, 40);
            }
          }
        });
      }

      if (removeBtn) {
        removeBtn.addEventListener('click', () => {
          this.removeLocation(dayIndex, locationIndex);
        });
      }
    }

    selectLocation(dayIndex, locationIndex, location) {
      if (!location) return;
      const day = this.currentItinerary.days[dayIndex];
      if (!day) return;
      const old = day.locations[locationIndex];

      // Block duplicates across itinerary (if already selected elsewhere and not reselecting same)
      if (this.currentItinerary.selectedLocations.has(location) && old !== location) {
        this.showMessage('This location is already used in the itinerary. Choose another.', 'error');
        this.renderDays();
        return;
      }

      // Add location to master list if user typed a new location (optionally)
      if (!this.data.locations.includes(location)) {
        this.data.locations.push(location);
        this.saveData();
      }

      // Remove old selection
      if (old) this.currentItinerary.selectedLocations.delete(old);

      // Assign and mark selected
      day.locations[locationIndex] = location;
      this.currentItinerary.selectedLocations.add(location);

      // Re-render days (so datalists and selects update to exclude selected items)
      this.renderDays();
      this.showMessage(`Selected "${location}" for Day ${day.number}`);
    }

    removeLocation(dayIndex, locationIndex) {
      const day = this.currentItinerary.days[dayIndex];
      if (!day) return;
      const removed = day.locations.splice(locationIndex, 1)[0];
      if (removed) this.currentItinerary.selectedLocations.delete(removed);
      if (day.locations.length === 0) day.locations.push('');
      this.renderDays();
    }

    // ---------- Setup actions ----------
    addLocationBulk() {
      const raw = qs('#locationInput').value.trim();
      if (!raw) {
        this.showMessage('Enter location(s) to add', 'error');
        return;
      }
      const parts = raw.split(',').map(s => s.trim()).filter(Boolean);
      let added = 0;
      parts.forEach(p => {
        if (!this.data.locations.includes(p)) {
          this.data.locations.push(p);
          added++;
        }
      });
      qs('#locationInput').value = '';
      if (added > 0) {
        this.saveData();
        this.showMessage(`Added ${added} location(s)`);
      } else {
        this.showMessage('No new locations to add (duplicates skipped).', 'info');
      }
    }

    addPackageFromForm() {
      const hours = parseInt(qs('#packageHours').value || '0', 10) || 0;
      const kms = parseInt(qs('#packageKms').value || '0', 10) || 0;
      let name = qs('#packageName').value.trim();
      const desc = qs('#packageDesc').value.trim();
      const base = parseInt(qs('#packagePrice').value || '0', 10) || 0;
      const kmRate = parseInt(qs('#packageKmRate').value || '0', 10) || 0;
      const hrRate = parseInt(qs('#packageHrRate').value || '0', 10) || 0;

      if ((!name) && hours && kms) name = `${hours} Hours Package - ${kms} Kms`;

      if (!name || !desc || !base || !kmRate || !hrRate) {
        this.showMessage('Please fill all package fields', 'error');
        return;
      }

      const pkg = { id: 'pkg' + Date.now(), name, description: desc, basePrice: base, additionalKmRate: kmRate, additionalHrRate: hrRate, hours, kms };

      if (this.editingPackageIndex >= 0) {
        this.data.packages[this.editingPackageIndex] = pkg;
        this.editingPackageIndex = -1;
      } else {
        this.data.packages.push(pkg);
      }

      this.saveData();
      qs('#packageName').value = '';
      qs('#packageDesc').value = '';
      qs('#packageHours').value = '';
      qs('#packageKms').value = '';
      qs('#packagePrice').value = '';
      qs('#packageKmRate').value = '';
      qs('#packageHrRate').value = '';
      this.renderPackagesList();
    }

    editPackage(idx) {
      const p = this.data.packages[idx];
      if (!p) return;
      this.editingPackageIndex = idx;
      qs('#packageName').value = p.name;
      qs('#packageDesc').value = p.description;
      qs('#packageHours').value = p.hours || '';
      qs('#packageKms').value = p.kms || '';
      qs('#packagePrice').value = p.basePrice || '';
      qs('#packageKmRate').value = p.additionalKmRate || '';
      qs('#packageHrRate').value = p.additionalHrRate || '';
    }

    // ---------- Save itinerary ----------
    saveItinerary() {
      // Clean days: remove empty trailing location rows
      this.currentItinerary.days.forEach(day => {
        day.locations = (day.locations || []).filter(l => l && l.trim());
      });

      // build packages selection (for demo, we keep none assigned unless user chooses — extend as needed)
      // create id and save
      if (!this.currentItinerary.id) {
        this.currentItinerary.id = 'it' + Date.now();
      }
      // clone data for safe storage
      const copy = JSON.parse(JSON.stringify(this.currentItinerary));
      // remove selectedLocations set
      delete copy.selectedLocations;
      this.data.itineraries.push(copy);

      // Save agency details
      this.data.agency.name = qs('#agencyName').value.trim();
      this.data.agency.mobile = qs('#agencyMobile').value.trim();

      this.saveData();
      this.showMessage('Itinerary saved');
      // reset current itinerary to a fresh one
      this.currentItinerary = { id: null, customer: 'Customer', startDate: qs('#startDate').value, days: [], packages: [] };
      this.currentItinerary.selectedLocations = new Set();
      this.addDay();
    }

    renderSavedItineraries() {
      const container = qs('#savedList');
      container.innerHTML = '';
      if (!this.data.itineraries.length) {
        container.innerHTML = '<div class="muted">No saved itineraries</div>';
        return;
      }
      this.data.itineraries.forEach((it, idx) => {
        const el = document.createElement('div');
        el.className = 'saved-item';
        const start = new Date(it.startDate).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
        el.innerHTML = `<strong>${it.customer}</strong> <div class="muted">Starts ${start} • ${it.days.length} day(s)</div>
          <div class="row-actions">
            <button class="btn btn--tiny export-pdf" data-i="${idx}">Export PDF</button>
            <button class="btn btn--tiny export-wa" data-i="${idx}">Export WhatsApp</button>
            <button class="btn btn--tiny del-it" data-i="${idx}">Delete</button>
          </div>`;
        container.appendChild(el);
      });

      qsa('.export-pdf').forEach(b => b.addEventListener('click', e => {
        const i = parseInt(e.target.getAttribute('data-i'));
        this.exportToPDF(i);
      }));
      qsa('.export-wa').forEach(b => b.addEventListener('click', e => {
        const i = parseInt(e.target.getAttribute('data-i'));
        this.exportWhatsApp(i);
      }));
      qsa('.del-it').forEach(b => b.addEventListener('click', e => {
        const i = parseInt(e.target.getAttribute('data-i'));
        if (confirm('Delete itinerary?')) {
          this.data.itineraries.splice(i, 1);
          this.saveData();
        }
      }));
    }

    // ---------- Exports ----------
    exportWhatsApp(index) {
      const it = this.data.itineraries[index];
      if (!it) return;
      // build a short text summary
      let msg = `${this.data.agency.name || ''}\nItinerary: ${it.customer}\nStart: ${new Date(it.startDate).toLocaleDateString('en-GB')}\n`;
      it.days.forEach(d => {
        msg += `\nDay ${d.number} (${new Date(d.date).toLocaleDateString('en-GB', {day:'2-digit',month:'short'})}):\n`;
        (d.locations || []).forEach(l => { msg += `- ${l}\n`; });
      });
      // create whatsapp link (note: mobile numbers and actual sending handled by user)
      const waUrl = `https://wa.me/?text=${encodeURIComponent(msg)}`;
      window.open(waUrl, '_blank');
    }

    exportToPDF(index) {
      const it = this.data.itineraries[index];
      if (!it) return;

      if (typeof window.jspdf === 'undefined') {
        alert('PDF library not loaded');
        return;
      }
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageW = doc.internal.pageSize.getWidth();
      const margin = 16;
      let y = 18;

      // Header right: agency name + mobile (bold)
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      const agencyText = `${this.data.agency.name || ''}${this.data.agency.mobile ? ' | ' + this.data.agency.mobile : ''}`;
      const headerW = doc.getTextWidth(agencyText);
      doc.text(agencyText, pageW - margin - headerW, 12);

      // Title
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(`${it.customer} - Itinerary`, margin, y);
      y += 7;

      // Date range
      const start = new Date(it.startDate);
      const end = new Date(start);
      end.setDate(end.getDate() + it.days.length - 1);
      const df = (d) => d.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text(`Duration: ${df(start)} - ${df(end)}`, margin, y);
      y += 8;

      // Day-wise
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('Day-wise Itinerary:', margin, y);
      y += 7;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');

      it.days.forEach((d, di) => {
        if (y > 270) { doc.addPage(); y = 20; }
        const dayDate = df(new Date(d.date));
        doc.setFont('helvetica', 'bold');
        doc.text(`Day ${d.number} (${dayDate}):`, margin + 4, y);
        y += 6;
        doc.setFont('helvetica', 'normal');
        if (d.locations && d.locations.length) {
          d.locations.forEach(loc => {
            if (!loc) return;
            if (y > 270) { doc.addPage(); y = 20; }
            doc.text(`• ${loc}`, margin + 10, y);
            y += 6;
          });
        } else {
          doc.text('No locations selected.', margin + 10, y);
          y += 6;
        }
        y += 4;
      });

      // Selected Packages (if stored with itinerary; here we show global selected packages demo)
      if (it.packages && it.packages.length) {
        if (y > 260) { doc.addPage(); y = 20; }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text('Selected Packages:', margin, y);
        y += 7;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        it.packages.forEach(p => {
          doc.text(`${p.name}`, margin + 6, y); y += 6;
          doc.text(`Base Price: Rs ${p.basePrice}`, margin + 8, y); y += 6;
          doc.text(`Additional rate: Rs ${p.additionalKmRate}/Km, Rs ${p.additionalHrRate}/Hr`, margin + 8, y); y += 8;
        });
      }

      // Footer page numbers
      const total = doc.getNumberOfPages();
      for (let i = 1; i <= total; i++) {
        doc.setPage(i);
        const footer = `${i} of ${total}`;
        const fw = doc.getTextWidth(footer);
        doc.setFontSize(10);
        doc.text(footer, (pageW - fw) / 2, doc.internal.pageSize.getHeight() - 10);
      }

      const filename = `${it.customer.replace(/\s+/g,'_')}_itinerary.pdf`;
      doc.save(filename);
    }

    // ---------- Bind all UI events ----------
    bindEvents() {
      qs('#addDayBtn').addEventListener('click', () => this.addDay());
      qs('#startDate').addEventListener('change', () => this.updateDayDates());
      qs('#addLocationBtn').addEventListener('click', () => this.addLocationBulk());
      qs('#addPackageBtn').addEventListener('click', () => this.addPackageFromForm());
      qs('#clearPackageBtn').addEventListener('click', () => {
        ['#packageName','#packageDesc','#packageHours','#packageKms','#packagePrice','#packageKmRate','#packageHrRate'].forEach(sel => { if(qs(sel)) qs(sel).value=''; });
        this.editingPackageIndex = -1;
      });
      qs('#saveItineraryBtn').addEventListener('click', () => this.saveItinerary());

      // Agency save on blur
      qs('#agencyName').addEventListener('blur', () => { this.data.agency.name = qs('#agencyName').value; this.saveData(); });
      qs('#agencyMobile').addEventListener('blur', () => { this.data.agency.mobile = qs('#agencyMobile').value; this.saveData(); });

      // Live render updates for packages list when data changes
      // (already covered by saveData calls)
    }
  }

  // Start app
  window.app = new ItineraryApp();
})();