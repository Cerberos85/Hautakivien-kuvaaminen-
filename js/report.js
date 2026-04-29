/**
 * report.js - Word-dokumentin generointi (docx.js)
 */

async function generateWordReport() {
    const { Document, Packer, Paragraph, TextRun, ImageRun, AlignmentType } = window.docx;

    // 1. Haetaan kaikki kuvat tietokannasta
    const graves = await getAllGraves();

    if (graves.length === 0) {
        alert("Ei kuvia raporttia varten. Ota ensin muutama kuva.");
        return;
    }

    // 2. Luodaan dokumentin sisältö
    const children = [];

    // Lisätään otsikko
    children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
        children: [
            new TextRun({
                text: "HAUTAPAIKKARAPORTTI",
                bold: true,
                size: 32,
            }),
        ],
    }));

    // 3. Iteroidaan kuvat ja lisätään ne dokumenttiin
    for (let i = 0; i < graves.length; i++) {
        const grave = graves[i];

        try {
            // Muunnetaan Base64-data Bufferiksi/Blobiksi docx.js:lle
            const imageResponse = await fetch(grave.image_data);
            const imageBlob = await imageResponse.blob();

            // Lisätään kuva
            children.push(new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                    new ImageRun({
                        data: imageBlob,
                        transformation: {
                            width: 500,  // n. 13-14 cm leveys (sopii hyvin A4:lle)
                            height: 350, // n. 9-10 cm korkeus
                        },
                    }),
                ],
            }));

            // Lisätään kuvan tiedot (Aika ja mahdollinen OCR-teksti)
            children.push(new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 600, before: 200 },
                children: [
                    new TextRun({
                        text: `Kuva ${i + 1}: ${grave.timestamp}`,
                        italics: true,
                        size: 20,
                    }),
                    new TextRun({
                        text: grave.extracted_text ? `\nTunnistettu teksti: ${grave.extracted_text}` : "",
                        bold: true,
                        size: 20,
                    }),
                ],
            }));

            // Pakotetaan sivunvaihto joka toisen kuvan jälkeen
            // Näin saadaan tasan 2 kuvaa per sivu
            if ((i + 1) % 2 === 0 && i !== graves.length - 1) {
                children.push(new Paragraph({
                    children: [new TextRun({ text: "", break: 1 })],
                    pageBreakBefore: true,
                }));
            }

        } catch (err) {
            console.error("Kuvan lisääminen epäonnistui:", err);
        }
    }

    // 4. Luodaan dokumenttiolio
    const doc = new Document({
        sections: [{
            properties: {},
            children: children,
        }],
    });

    // 5. Generoidaan tiedosto ja käynnistetään lataus
    Packer.toBlob(doc).then((blob) => {
        const filename = `Hautapaikkaraportti_${new Date().toLocaleDateString('fi-FI')}.docx`;
        saveAs(blob, filename);
    });
}