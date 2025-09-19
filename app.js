// app.js - Minimal changes only, per your request.
// Behavior implemented:
// - Auto Day1 on load and startDate = today
// - Add Day button appends a day and scrolls to it
// - Location input supports datalist (search) + dropdown.
// - After selecting a location, a new empty row is added automatically.
// - Prevent duplicate selection across itinerary.
// - Setup locations accept comma-separated bulk upload.
// - Packages: Hours & Kms fields; name auto-generated when left blank.
// - Export PDF & Export WhatsApp are only under Saved Itineraries.
// No layout changes; setup kept where it was.

(() => {
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  class App {
    constructor() {
      this.storageKey = 'itinerary_v2';
      this.data = {
        agency: { name: '', mobile: '' },
        locations: [],
        packages: [],
        itineraries: []
      };

      // current (working) itinerary
      this.it = {
        id: null,
        customer: 'Customer',
        startDate: null,
        days: [], // { number, date (yyyy-mm-dd), locations: [] }
        packages: []
      };
      this.it.selectedLocations = new Set(); // used to prevent duplicates in current itinerary

      this.editingPackageIndex = -1;

      this.init();
    }

    init() {
      this.load();
      this.renderUI();

      // auto set startDate to today and ensure Day1 exists
      try {
        const start = $('#startDate');
        if (start) {
          const d = new Date();
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          start.value = `${yyyy}-${mm}-${dd}`;
          this.it.startDate = start.value;
          if (!this.it.days.length) this.addDay();
          else this.updateDayDates();
        }
      } catch (e) { console.warn(e); }

      this.bindEvents();
      this.renderSaved();
    }

    // storage
    load() {
      try {
        const raw = localStorage.getItem(this.storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          this.data = Object.assign(this.data, parsed);
        }
      } catch (e) { console.warn('load failed', e); }
    }
    save() {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
      this.renderLocations();
      this.renderPackages();
      this.renderSaved();
    }

    show(msg) { console.log(msg); } // simple feedback; no UI toast to avoid extra markup

    // UI initial render
    renderUI() {
      $('#agencyName').value = this.data.agency.name || '';
      $('#agencyMobile').value = this.data.agency.mobile || '';
      this.renderLocations();
      this.renderPackages();
      this.renderDays();
    }

    // Locations list in setup
    renderLocations() {
      const out = $('#locationsList');
      out.innerHTML = '';
      this.data.locations.forEach(loc => {
        const el = document.createElement('div');
        el.className = 'list-item';
        el.textContent = loc;
        out.appendChild(el);
      });
    }

    // Packages list in setup
    renderPackages() {
      const out = $('#packagesList');
      out.innerHTML = '';
      this.data.packages.forEach((p, idx) => {
        const el = document.createElement('div');
        el.className = 'list-item';
        el.innerHTML = `<div><strong>${p.name}</strong><div class="muted">Rs ${p.basePrice} • ${p.hours || '-'} H • ${p.kms || '-'} K</div></div>
          <div class="row-actions">
            <button data-i="${idx}" class="btn btn--tiny edit-pkg">Edit</button>
            <button data-i="${idx}" class="btn btn--tiny del-pkg">Delete</button>
          </div>`;
        out.appendChild(el);
      });
      // bind package edits/deletes
      $$('.edit-pkg').forEach(b => b.addEventListener('click', e => this.editPackage(parseInt(e.target.dataset.i))));
      $$('.del-pkg').forEach(b => b.addEventListener('click', e => {
        const i = parseInt(e.target.dataset.i);
        if (confirm('Delete package?')) { this.data.packages.splice(i, 1); this.save(); }
      }));
    }

    // Days & location rendering
    renderDays() {
      const container = $('#daysContainer');
      container.innerHTML = '';
      this.it.days.forEach((day, di) => {
        const card = document.createElement('div');
        card.className = 'day-item';
        const dt = new Date(day.date);
        const dateLabel = dt.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
        card.innerHTML = `
          <div class="day-header">
            <div><strong>Day ${day.number}</strong> — <span class="muted">${dateLabel}</span></div>
            <div class="day-actions">
              <button class="btn btn--tiny add-loc" data-day="${di}">+ Location</button>
              <button class="btn btn--tiny remove-day" data-day="${di}">Remove</button>
            </div>
          </div>
          <div id="locations-${di}" class="locations-list"></div>
        `;
        container.appendChild(card);

        // ensure at least one row
        if (!day.locations || !day.locations.length) day.locations = [''];
        day.locations.forEach((loc, li) => this.createLocationRow(di, li, loc));
      });

      // bind day buttons
      $$('.add-loc').forEach(b => b.addEventListener('click', e => this.addLocationRow(parseInt(e.dataset.day))));
      $$('.remove-day').forEach(b => b.addEventListener('click', e => {
        const d = parseInt(e.dataset.day);
        if (confirm('Remove this day?')) this.removeDay(d);
      }));
    }

    // Add day
    addDay() {
      const start = $('#startDate')?.value;
      if (!start) { this.show('Set start date first'); return; }
      const idx = this.it.days.length;
      const dt = new Date(start);
      dt.setDate(dt.getDate() + idx);
      this.it.days.push({ number: idx + 1, date: dt.toISOString().split('T')[0], locations: [''] });
      this.renderDays();
      setTimeout(() => {
        const el = document.querySelector(`#daysContainer .day-item:last-child`);
        if (el) el.scrollIntoView({behavior:'smooth', block:'center'});
      }, 60);
    }

    removeDay(i) {
      const removed = this.it.days.splice(i,1)[0];
      if (removed && removed.locations) removed.locations.forEach(l => { if (l) this.it.selectedLocations.delete(l); });
      // renumber and update dates
      this.updateDayDates();
      this.renderDays();
    }

    updateDayDates() {
      const start = $('#startDate')?.value;
      if (!start) return;
      this.it.startDate = start;
      this.it.days.forEach((d, idx) => {
        const dt = new Date(start);
        dt.setDate(dt.getDate() + idx);
        d.number = idx + 1;
        d.date = dt.toISOString().split('T')[0];
      });
      this.renderDays();
    }

    createLocationRow(dayIndex, locIndex, selected) {
      const container = $(`#locations-${dayIndex}`);
      if (!container) return;
      const row = document.createElement('div');
      row.className = 'location-row';

      // build available options (excluding already selected except current)
      const used = Array.from(this.it.selectedLocations);
      const available = this.data.locations.filter(l => l === selected || !used.includes(l));
      const options = available.map(o => `<option value="${o}">${o}</option>`).join('');

      row.innerHTML = `
        <div class="loc-left">
          <input list="dlist-${dayIndex}-${locIndex}" class="location-input" data-day="${dayIndex}" data-index="${locIndex}" placeholder="Search or type" value="${selected||''}" />
          <datalist id="dlist-${dayIndex}-${locIndex}">${options}</datalist>
          <select class="location-select" data-day="${dayIndex}" data-index="${locIndex}">
            <option value="">Select</option>
            ${options}
          </select>
        </div>
        <div class="loc-right">
          <div class="selected-text">${selected?selected:'not selected'}</div>
          <div class="row-actions">
            <button class="btn btn--tiny remove-loc" data-day="${dayIndex}" data-index="${locIndex}">Remove</button>
          </div>
        </div>
      `;
      container.appendChild(row);

      // ensure array slot
      const day = this.it.days[dayIndex];
      if (!day.locations) day.locations = [];
      day.locations[locIndex] = selected || '';

      this.bindLocationEvents(dayIndex, locIndex);
    }

    addLocationRow(dayIndex) {
      const day = this.it.days[dayIndex];
      if (!day) return;
      day.locations.push('');
      this.renderDays();
    }

    bindLocationEvents(dayIndex, locIndex) {
      const input = document.querySelector(`input.location-input[data-day="${dayIndex}"][data-index="${locIndex}"]`);
      const select = document.querySelector(`select.location-select[data-day="${dayIndex}"][data-index="${locIndex}"]`);
      const removeBtn = document.querySelector(`button.remove-loc[data-day="${dayIndex}"][data-index="${locIndex}"]`);

      if (select) select.addEventListener('change', e => {
        this.selectLocation(dayIndex, locIndex, e.target.value);
        setTimeout(()=> { const day = this.it.days[dayIndex]; if (day && day.locations && day.locations.length -1 === locIndex) this.addLocationRow(dayIndex); }, 40);
      });
      if (input) {
        input.addEventListener('change', e => {
          const v = e.target.value.trim();
          if (v) {
            this.selectLocation(dayIndex, locIndex, v);
            setTimeout(()=> { const day = this.it.days[dayIndex]; if (day && day.locations && day.locations.length -1 === locIndex) this.addLocationRow(dayIndex); }, 40);
          }
        });
        input.addEventListener('keypress', e => {
          if (e.key === 'Enter') {
            e.preventDefault();
            const v = input.value.trim();
            if (v) {
              this.selectLocation(dayIndex, locIndex, v);
              setTimeout(()=> { const day = this.it.days[dayIndex]; if (day && day.locations && day.locations.length -1 === locIndex) this.addLocationRow(dayIndex); }, 40);
            }
          }
        });
      }
      if (removeBtn) removeBtn.addEventListener('click', () => this.removeLocation(dayIndex, locIndex));
    }

    selectLocation(dayIndex, locIndex, location) {
      if (!location) return;
      const day = this.it.days[dayIndex];
      if (!day) return;
      const old = day.locations[locIndex];

      // block duplicates across itinerary unless reselecting same
      if (this.it.selectedLocations.has(location) && old !== location) {
        this.show('Location already used');
        this.renderDays();
        return;
      }

      // if user typed a location not in master list, add to master (so datalist includes it)
      if (!this.data.locations.includes(location)) {
        this.data.locations.push(location);
        this.save();
      }

      if (old) this.it.selectedLocations.delete(old);
      day.locations[locIndex] = location;
      this.it.selectedLocations.add(location);

      // re-render to update datalists/selects excluding used locations
      this.renderDays();
    }

    removeLocation(dayIndex, locIndex) {
      const day = this.it.days[dayIndex];
      if (!day) return;
      const removed = day.locations.splice(locIndex, 1)[0];
      if (removed) this.it.selectedLocations.delete(removed);
      if (!day.locations.length) day.locations.push('');
      this.renderDays();
    }

    // setup actions
    bulkAddLocations() {
      const raw = $('#locationInput').value.trim();
      if (!raw) { this.show('Enter locations'); return; }
      const parts = raw.split(',').map(s => s.trim()).filter(Boolean);
      let added = 0;
      parts.forEach(p => { if (!this.data.locations.includes(p)) { this.data.locations.push(p); added++; }});
      $('#locationInput').value = '';
      if (added) { this.save(); this.show(`${added} added`); } else this.show('No new locations added');
    }

    addPackageFromForm() {
      const hours = parseInt($('#packageHours').value || '0',10) || 0;
      const kms = parseInt($('#packageKms').value || '0',10) || 0;
      let name = $('#packageName').value.trim();
      const desc = $('#packageDesc').value.trim();
      const base = parseInt($('#packagePrice').value || '0',10) || 0;
      const kmRate = parseInt($('#packageKmRate').value || '0',10) || 0;
      const hrRate = parseInt($('#packageHrRate').value || '0',10) || 0;

      if ((!name) && hours && kms) name = `${hours} Hours Package - ${kms} Kms`;

      if (!name || !desc || !base || !kmRate || !hrRate) { this.show('Fill all package fields'); return; }

      const pkg = { id: 'pkg' + Date.now(), name, description: desc, basePrice: base, additionalKmRate: kmRate, additionalHrRate: hrRate, hours, kms };

      if (this.editingPackageIndex >= 0) {
        this.data.packages[this.editingPackageIndex] = pkg;
        this.editingPackageIndex = -1;
      } else {
        this.data.packages.push(pkg);
      }
      this.save();
      // clear form
      ['#packageName','#packageDesc','#packageHours','#packageKms','#packagePrice','#packageKmRate','#packageHrRate'].forEach(sel => $(sel).value = '');
    }

    editPackage(i) {
      const p = this.data.packages[i];
      if (!p) return;
      this.editingPackageIndex = i;
      $('#packageName').value = p.name;
      $('#packageDesc').value = p.description;
      $('#packageHours').value = p.hours || '';
      $('#packageKms').value = p.kms || '';
      $('#packagePrice').value = p.basePrice || '';
      $('#packageKmRate').value = p.additionalKmRate || '';
      $('#packageHrRate').value = p.additionalHrRate || '';
    }

    // save itinerary
    saveItinerary() {
      // remove empty trailing locations
      this.it.days.forEach(d => { d.locations = (d.locations || []).filter(l => l && l.trim()); });

      if (!this.it.id) this.it.id = 'it' + Date.now();
      const copy = JSON.parse(JSON.stringify(this.it));
      delete copy.selectedLocations;
      this.data.itineraries.push(copy);

      // save agency details
      this.data.agency.name = $('#agencyName').value.trim();
      this.data.agency.mobile = $('#agencyMobile').value.trim();

      this.save();
      this.show('Saved');

      // reset current itinerary
      this.it = { id:null, customer:'Customer', startDate: $('#startDate').value, days:[], packages:[] };
      this.it.selectedLocations = new Set();
      this.addDay();
    }

    renderSaved() {
      const out = $('#savedList');
      out.innerHTML = '';
      if (!this.data.itineraries.length) { out.innerHTML = '<div class="muted">No saved itineraries</div>'; return; }
      this.data.itineraries.forEach((it, idx) => {
        const el = document.createElement('div');
        el.className = 'saved-item';
        const start = new Date(it.startDate).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
        el.innerHTML = `<div><strong>${it.customer}</strong><div class="muted">Starts ${start} • ${it.days.length} day(s)</div></div>
          <div class="row-actions">
            <button class="btn btn--tiny export-pdf" data-i="${idx}">Export PDF</button>
            <button class="btn btn--tiny export-wa" data-i="${idx}">Export WhatsApp</button>
            <button class="btn btn--tiny del-it" data-i="${idx}">Delete</button>
          </div>`;
        out.appendChild(el);
      });
      $$('.export-pdf').forEach(b => b.addEventListener('click', e => this.exportPDF(parseInt(e.target.dataset.i))));
      $$('.export-wa').forEach(b => b.addEventListener('click', e => this.exportWhatsApp(parseInt(e.target.dataset.i))));
      $$('.del-it').forEach(b => b.addEventListener('click', e => {
        const i = parseInt(e.target.dataset.i);
        if (confirm('Delete itinerary?')) { this.data.itineraries.splice(i,1); this.save(); }
      }));
    }

    exportWhatsApp(i) {
      const it = this.data.itineraries[i];
      if (!it) return;
      let msg = `${this.data.agency.name||''}\nItinerary: ${it.customer}\nStart: ${new Date(it.startDate).toLocaleDateString('en-GB')}\n`;
      it.days.forEach(d => {
        msg += `\nDay ${d.number} (${new Date(d.date).toLocaleDateString('en-GB', {day:'2-digit',month:'short'})}):\n`;
        (d.locations||[]).forEach(l => { msg += `- ${l}\n`; });
      });
      const wa = `https://wa.me/?text=${encodeURIComponent(msg)}`;
      window.open(wa, '_blank');
    }

    exportPDF(i) {
      const it = this.data.itineraries[i];
      if (!it) return;
      if (typeof window.jspdf === 'undefined') { alert('PDF library missing'); return; }
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      const pw = doc.internal.pageSize.getWidth();
      const margin = 18;
      let y = 22;

      // agency top-right bold
      doc.setFontSize(12);
      doc.setFont('helvetica','bold');
      const agencyText = `${this.data.agency.name||''}${this.data.agency.mobile ? ' | ' + this.data.agency.mobile : ''}`;
      const aw = doc.getTextWidth(agencyText);
      doc.text(agencyText, pw - margin - aw, 12);

      // title
      doc.setFontSize(16); doc.setFont('helvetica','bold');
      doc.text(`${it.customer} - Itinerary`, margin, y); y += 8;

      // date range (format 23 Sep 2025)
      const s = new Date(it.startDate);
      const e = new Date(s); e.setDate(e.getDate() + it.days.length - 1);
      const fmt = d => d.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
      doc.setFont('helvetica','normal'); doc.setFontSize(11);
      doc.text(`Duration: ${fmt(s)} - ${fmt(e)}`, margin, y);
      y += 10;

      // days
      doc.setFont('helvetica','bold'); doc.setFontSize(13);
      doc.text('Day-wise Itinerary:', margin, y); y += 8;
      doc.setFont('helvetica','normal'); doc.setFontSize(11);
      it.days.forEach(d => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.setFont('helvetica','bold');
        doc.text(`Day ${d.number} (${fmt(new Date(d.date))}):`, margin+4, y); y += 6;
        doc.setFont('helvetica','normal');
        if (d.locations && d.locations.length) {
          d.locations.forEach(loc => {
            if (!loc) return;
            if (y > 270) { doc.addPage(); y = 20; }
            doc.text(`• ${loc}`, margin + 10, y); y += 6;
          });
        } else {
          doc.text('No locations selected.', margin + 10, y); y += 6;
        }
        y += 4;
      });

      // packages block (if itinerary stored packages)
      if (it.packages && it.packages.length) {
        if (y > 260) { doc.addPage(); y = 20; }
        doc.setFont('helvetica','bold'); doc.setFontSize(13);
        doc.text('Selected Packages:', margin, y); y += 8;
        doc.setFont('helvetica','normal'); doc.setFontSize(11);
        it.packages.forEach(p => {
          doc.text(`${p.name}`, margin + 6, y); y += 6;
          doc.text(`Base Price: Rs ${p.basePrice}`, margin + 8, y); y += 6;
          doc.text(`Additional: Rs ${p.additionalKmRate}/Km, Rs ${p.additionalHrRate}/Hr`, margin + 8, y); y += 8;
        });
      }

      // footer page numbers
      const total = doc.getNumberOfPages();
      for (let pg = 1; pg <= total; pg++) {
        doc.setPage(pg);
        const footer = `${pg} of ${total}`;
        const fw = doc.getTextWidth(footer);
        doc.setFontSize(10);
        doc.text(footer, (pw - fw) / 2, doc.internal.pageSize.getHeight() - 10);
      }

      doc.save(`${it.customer.replace(/\s+/g,'_')}_itinerary.pdf`);
    }

    // events
    bindEvents() {
      $('#addDayBtn').addEventListener('click', () => this.addDay());
      $('#startDate').addEventListener('change', () => this.updateDayDates());
      $('#addLocationBtn').addEventListener('click', () => this.bulkAddLocations());
      $('#addPackageBtn').addEventListener('click', () => this.addPackageFromForm());
      $('#clearPackageBtn').addEventListener('click', () => {
        ['#packageName','#packageDesc','#packageHours','#packageKms','#packagePrice','#packageKmRate','#packageHrRate'].forEach(s => $(s).value='');
        this.editingPackageIndex = -1;
      });
      $('#saveItineraryBtn').addEventListener('click', () => this.saveItinerary());

      $('#agencyName').addEventListener('blur', () => { this.data.agency.name = $('#agencyName').value.trim(); this.save(); });
      $('#agencyMobile').addEventListener('blur', () => { this.data.agency.mobile = $('#agencyMobile').value.trim(); this.save(); });
    }
  }

  window.app = new App();
})();
