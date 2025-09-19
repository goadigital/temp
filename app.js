document.addEventListener("DOMContentLoaded", () => {
  // Set start date to today's date by default
  const startDateInput = document.getElementById('startDate');
  if (startDateInput) {
    startDateInput.value = new Date().toISOString().split('T')[0];
  }

  // Bulk locations upload
  document.getElementById('updateBulkLocationsBtn')?.addEventListener('click', () => {
    const bulkInput = document.getElementById('bulkLocationsInput').value;
    if (bulkInput.trim()) {
      const locs = bulkInput.split(',').map(loc => loc.trim()).filter(Boolean);
      const uniqueLocs = Array.from(new Set([...window.app.data.locations, ...locs]));
      window.app.data.locations = uniqueLocs;
      window.app.saveData();
      window.app.renderLocations();
      document.getElementById('bulkLocationsInput').value = '';
    }
  });

  // Package name auto-generation
  function updatePackageName() {
    const h = document.getElementById('packageHours').value || '';
    const k = document.getElementById('packageKms').value || '';
    document.getElementById('packageName').value = `${h} Hours Package - ${k} Kms`;
  }
  document.getElementById('packageHours')?.addEventListener('input', updatePackageName);
  document.getElementById('packageKms')?.addEventListener('input', updatePackageName);

  // Main application logic (existing code, add/replace relevant functions below)

  // Render location dropdown+search with no duplicates
  function createLocationRow(dayIndex, locationIndex, selectedLocation) {
    // Used locations in all days to keep options unique
    const usedLocations = new Set();
    window.app.currentItinerary.days.forEach(day =>
      day.locations?.forEach(loc => loc && usedLocations.add(loc))
    );
    const availableLocations = window.app.data.locations.filter(loc => !usedLocations.has(loc));
    const locationsContainer = document.getElementById('locations-' + dayIndex);
    if (!locationsContainer) return;
    const locationRow = document.createElement('div');
    locationRow.className = 'location-row';
    locationRow.innerHTML = `
      <input type="text"
        class="form-control location-search-input"
        list="locationOptions-${dayIndex}-${locationIndex}"
        data-day-index="${dayIndex}"
        data-location-index="${locationIndex}"
        value="${selectedLocation || ''}"
        placeholder="Search or select location">
      <datalist id="locationOptions-${dayIndex}-${locationIndex}">
        ${availableLocations.map(loc => `<option value="${loc}"></option>`).join('')}
      </datalist>
      ${selectedLocation ? `<div class="selected-location">
        <span class="selected-location-text">${selectedLocation}</span>
        <button class="remove-location-btn" data-day-index="${dayIndex}" data-location-index="${locationIndex}">Remove</button>
      </div>` : ''}
    `;
    locationsContainer.appendChild(locationRow);
    bindLocationRowEvents(dayIndex, locationIndex);
  }

  // PDF export formatting (refer to jsPDF usage)
  function exportToPDF(itineraryId) {
    try {
      const itinerary = window.app.data.itineraries.find(it => it.id === itineraryId);
      const jsPDF = window.jspdf.jsPDF;
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Top right agency info, bold
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(`${itinerary.agency.name}`, pageWidth - 20, 15, {align: 'right'});
      doc.setFontSize(11);
      doc.text(`Mobile: ${itinerary.agency.mobile}`, pageWidth - 20, 23, {align: 'right'});

      doc.setFontSize(18);
      doc.text("Travel Itinerary", 20, 40);
      doc.setFontSize(13);
      doc.text(`Customer: ${itinerary.customer}`, 20, 55);

      // Day formatting
      doc.setFontSize(14);
      let yPos = 70;
      itinerary.days.forEach((day, i) => {
        const dateStr = new Date(day.date).toLocaleDateString('en-IN', {day: 'numeric', month: 'short', year: 'numeric'});
        doc.setFont("helvetica", "bold");
        doc.text(`Day ${day.number} (${dateStr})`, 20, yPos);
        yPos += 7;
        doc.setFont("helvetica", "normal");
        day.locations.forEach(loc => {
          doc.text(`- ${loc}`, 30, yPos);
          yPos += 7;
        });
        yPos += 3;
      });

      // Selected packages section, 3 lines with Rs
      yPos += 10;
      doc.setFontSize(14);
      doc.text("Selected Packages:", 20, yPos);
      yPos += 9;
      itinerary.packages.forEach(pkg => {
        doc.setFontSize(13);
        doc.text(`Package name: ${pkg.name}`, 25, yPos);
        yPos += 7;
        doc.text(`Base Price: Rs ${pkg.basePrice}`, 25, yPos);
        yPos += 7;
        doc.text(`Add. Rate/Km: Rs ${pkg.additionalKmRate}, Rate/Hour: Rs ${pkg.additionalHrRate}`, 25, yPos);
        yPos += 9;
      });

      // Notes
      if (itinerary.notes) {
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.text("Terms & Conditions:", 20, yPos);
        yPos += 7;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        const notesList = itinerary.notes.split("\n");
        notesList.forEach(note => {
          doc.text(note, 25, yPos);
          yPos += 7;
        });
      }

      // Page numbers "X of Y"
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.text(`${i} of ${totalPages}`, pageWidth/2, pageHeight-10, {align:"center"});
      }

      doc.save(`${itinerary.customer}-Itinerary.pdf`);
    } catch (error) {
      alert("Error exporting PDF!");
    }
  }

  // Remaining methods: Export WhatsApp, Save itinerary, bind events etc. (use your current logic)
});
