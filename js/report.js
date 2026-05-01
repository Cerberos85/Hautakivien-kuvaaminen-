/**
 * report.js - Varma offline-versio Word-generoinnille
 */

async function generateWordReport() {
    try {
        if (!window.docx) {
            alert("Järjestelmä latautuu vielä, yritä hetken kuluttua uudelleen.");
            return;
        }

        const { Document, Packer, Paragraph, TextRun, ImageRun, AlignmentType } = window.docx;

        // 1. Haetaan kuvat
        const graves = await getAllGraves();
        if (graves.length === 0) {
            alert("Ota ensin vähintään yksi kuva!");
            return;
        }

        alert("Luodaan raporttia " + graves.length + " kuvasta. Odota hetki...");

        const children = [];

        // Otsikko
        children.push(new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
            children: [new TextRun({ text: "HOITAMATTOMUUS-RAPORTTI", bold: true, size: 32 })],
        }));

        // 2. Käydään kuvat läpi
        for (let i = 0; i < graves.length; i++) {
            const grave = graves[i];

            // Muunnetaan Base64 -> ArrayBuffer suoraan JavaScriptillä (Ohittaa PWA Service Workerin)
            const arrayBuffer = base64ToArrayBuffer(grave.image_data);

            // Lasketaan kuvan todellinen koko
            const dimensions = await getImageDimensions(grave.image_data);
            const ratio = dimensions.width / dimensions.height;
            
            // Määritetään kuvan koko sivulla (A4 leveys on rajallinen)
            const targetWidth = 450;
            const targetHeight = targetWidth / ratio;

            // Lisätään kuva dokumenttiin
            children.push(new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                    new ImageRun({
                        data: arrayBuffer,
                        transformation: {
                            width: targetWidth,
                            height: targetHeight,
                        },
                    }),
                ],
            }));

            // Tekstiedot kuvan alle
            children.push(new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 400, before: 200 },
                children: [
                    new TextRun({ text: `Kuva ${i + 1}: ${grave.timestamp}`, italics: true, size: 20 }),
                ],
            }));

            // Sivunvaihto joka toisen kuvan jälkeen
            if ((i + 1) % 2 === 0 && i !== graves.length - 1) {
                children.push(new Paragraph({ text: "", pageBreakBefore: true }));
            }
        }

        // 3. Tallennus
        const doc = new Document({
            sections: [{ children: children }]
        });

        // Pakataan Word-tiedostoksi
        const blob = await Packer.toBlob(doc);
        
        // Ladataan puhelimeen
        saveAs(blob, `Hautaraportti_${new Date().getTime()}.docx`);
        
        alert("Raportti on nyt ladattu puhelimesi Tiedostot/Lataukset -kansioon!");

    } catch (err) {
        // Jos jokin menee pieleen, puhelin ilmoittaa virheen tekstinä
        console.error(err);
        alert("Virhe raportin luonnissa: " + err.message);
    }
}

// APUFUNKTIO 1: Selvittää kuvan koon
function getImageDimensions(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.onerror = () => reject(new Error("Kuvan koon laskenta epäonnistui"));
        img.src = url;
    });
}

// APUFUNKTIO 2: Turvallinen Base64 -> ArrayBuffer muunnos
function base64ToArrayBuffer(base64) {
    // Poistetaan otsake (esim. "data:image/jpeg;base64,")
    const base64Data = base64.split(',')[1];
    const binaryString = window.atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}