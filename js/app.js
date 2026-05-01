/**
 * app.js - Käyttöliittymän looginen ohjaus
 */

// Elementit
const cameraInput = document.getElementById('camera-input');
const photoList = document.getElementById('photo-list');
const generateBtn = document.getElementById('generate-report');

// Alustetaan sovellus
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initDB(); // Avataan tietokanta (storage.js)
        renderGallery(); // Ladataan olemassa olevat kuvat näkyviin
    } catch (error) {
        alert("Tietokannan alustus epäonnistui: " + error);
    }
});

// Kuvan ottaminen / valitseminen
cameraInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const base64Image = await convertToBase64(file);
    
    // Luodaan dataobjekti tulevaisuutta varten
    const graveEntry = {
        image_data: base64Image,
        timestamp: new Date().toLocaleString('fi-FI'),
        grave_id: "",        // Paikka tulevalle tunnisteelle
        extracted_text: "",  // Paikka OCR-tekstille
        notes: ""            // Paikka muistiinpanoille
    };

    await saveGraveData(graveEntry); // Tallennus (storage.js)
    renderGallery(); // Päivitetään galleria
    cameraInput.value = ""; // Tyhjennetään syöte
});

// Muunnetaan tiedosto Base64-muotoon
function convertToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
}

// Päivitetään gallerianäkymä
async function renderGallery() {
    const graves = await getAllGraves();
    photoList.innerHTML = ""; // Tyhjennetään lista

    // Näytetään kuvat uusimmasta vanhimpaan
    graves.reverse().forEach(grave => {
        const card = document.createElement('div');
        card.className = 'photo-card';
        
        card.innerHTML = `
            <img src="${grave.image_data}" alt="Hautakuva">
            <div class="photo-info">
                <p><strong>Aika:</strong> ${grave.timestamp}</p>
                <div class="photo-metadata">
                    ${grave.extracted_text || "Ei tekstitunnistusta (tulossa)"}
                </div>
                    <button class="btn-delete" onclick="handleDelete(${grave.id})">
                    <span class="material-symbols-outlined" style="font-size: 18px;">delete</span>
                    Poista kuva
                </button>
            </div>
        `;
        photoList.appendChild(card);
    });
}

// Poistotoiminto
async function handleDelete(id) {
    if (confirm("Haluatko varmasti poistaa tämän kuvan?")) {
        await deleteGrave(id);
        renderGallery();
    }
}

// Raportin luonti (tämä kytketään report.js:ään seuraavaksi)
generateBtn.addEventListener('click', () => {
    if (typeof generateWordReport === 'function') {
        generateWordReport();
    } else {
        alert("Raportointiominaisuutta ladataan vielä...");
    }
});