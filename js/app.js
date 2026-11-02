/**
 * app.js - Käyttöliittymän looginen ohjaus
 */

const cameraInput = document.getElementById('camera-input');
const photoList = document.getElementById('photo-list');
const generateBtn = document.getElementById('generate-report');

const MAX_DIMENSION = 1200;
const JPEG_QUALITY = 0.75;

// Alustetaan sovellus
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initDB();
        await renderGallery();
    } catch (error) {
        alert("Tietokannan alustus epäonnistui: " + error);
    }
});

// Kuvan ottaminen / valitseminen
cameraInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
        // Varmistetaan että tietokanta on auki kamerasta palatessa
        await initDB();

        // 1. Luetaan tiedosto varmalla FileReaderilla (kuten alkuperäisessä toimivassa versiossa)
        const rawBase64 = await convertToBase64(file);

        // 2. Pienennetään kuva Canvasilla (jos epäonnistuu, käytetään suoraan alkuperäistä)
        let finalBase64 = rawBase64;
        try {
            finalBase64 = await resizeBase64Image(rawBase64, MAX_DIMENSION, JPEG_QUALITY);
        } catch (resizeErr) {
            console.warn("Käytetään pakkaamatonta kuvaa:", resizeErr);
        }

        // 3. Tallennetaan tietokantaan
        const graveEntry = {
            image_data: finalBase64,
            timestamp: new Date().toLocaleString('fi-FI'),
            grave_id: "",
            extracted_text: "",
            notes: ""
        };

        await saveGraveData(graveEntry);
        await renderGallery();

    } catch (error) {
        alert("Virhe kuvan latauksessa: " + error);
    } finally {
        cameraInput.value = "";
    }
});

// Alkuperäinen, toimiva tiedostonlukija
function convertToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject("Tiedoston lukeminen epäonnistui");
        reader.readAsDataURL(file);
    });
}

// Pienentää jo muistissa olevan Base64-kuvan ilman blob-osoitteita
function resizeBase64Image(base64Str, maxDimension, quality) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            let width = img.width;
            let height = img.height;

            if (width > height && width > maxDimension) {
                height = Math.round((height * maxDimension) / width);
                width = maxDimension;
            } else if (height >= width && height > maxDimension) {
                width = Math.round((width * maxDimension) / height);
                height = maxDimension;
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);

            resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => reject("Kuvan pienennys epäonnistui");
        img.src = base64Str;
    });
}

// Päivitetään gallerianäkymä
async function renderGallery() {
    await initDB();
    const graves = await getAllGraves();
    photoList.innerHTML = "";

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
        await initDB();
        await deleteGrave(id);
        await renderGallery();
    }
}

// Raportin luonti
generateBtn.addEventListener('click', () => {
    if (typeof generateWordReport === 'function') {
        generateWordReport();
    } else {
        alert("Raportointiominaisuutta ladataan vielä...");
    }
});
