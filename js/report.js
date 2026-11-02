/**
 * report.js - 100% omavarainen raporttigenerointi (Ei ulkoisia kirjastoja)
 * Toimii offline-tilassa ja aukeaa selaimessa, Wordissa ja LibreOfficessa.
 */

async function generateWordReport() {
    try {
        // Varmistetaan että tietokanta on auki
        if (typeof db === 'undefined' || !db) {
            await initDB();
        }

        const graves = await getAllGraves();
        if (graves.length === 0) {
            alert("Ota ensin vähintään yksi kuva!");
            return;
        }

        const reportDate = new Date().toLocaleDateString('fi-FI');

        // Rakennetaan kuvalohkot (2 kuvaa per sivu, kuten aiemmassa Word-mallissa)
        let itemsHtml = '';
        graves.forEach((grave, index) => {
            const isPageBreak = (index + 1) % 2 === 0 && index !== graves.length - 1;
            
            itemsHtml += `
                <div class="grave-item">
                    <img src="${grave.image_data}" alt="Kuva ${index + 1}">
                    <p class="caption"><strong>Kuva ${index + 1}:</strong> ${grave.timestamp}</p>${grave.grave_id ? `<p class="meta">Hautatunnus: ${grave.grave_id}</p>` : ''}
                    ${grave.notes ? `<p class="meta">Huomiot: ${grave.notes}</p>` : ''}
                </div>
                ${isPageBreak ? '<div class="page-break"></div>' : ''}
            `;
        });

        // Koko HTML-dokumentti sisäisillä A4- ja Word-tyyleillä
        const htmlContent = `<!DOCTYPE html>
<html lang="fi">
<head>
    <meta charset="UTF-8">
    <title>Hoitamattomuus-raportti ${reportDate}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            color: #222;
            max-width: 210mm;
            margin: 0 auto;
            padding: 15mm;
            background: #fff;
        }
        h1 {
            text-align: center;
            color: #2b4c3b;
            font-size: 20pt;
            margin-bottom: 5mm;
            border-bottom: 2px solid #2b4c3b;
            padding-bottom: 4mm;
        }
        .report-info {
            text-align: center;
            color: #555;
            margin-bottom: 10mm;
            font-size: 11pt;
        }
        .grave-item {
            text-align: center;
            margin-bottom: 12mm;
            page-break-inside: avoid;
            break-inside: avoid;
        }
        .grave-item img {
            max-width: 150mm;
            max-height: 95mm;
            width: auto;
            height: auto;
            border: 1px solid #ccc;
        }
        .caption {
            margin-top: 3mm;
            font-style: italic;
            font-size: 11pt;
        }
        .meta {
            margin-top: 1mm;
            font-size: 10pt;
        }
        .page-break {
            page-break-after: always;
            break-after: page;
            height: 0;
            margin: 0;
        }
        .no-print-bar {
            background: #f4f7f6;
            border: 1px solid #2b4c3b;
