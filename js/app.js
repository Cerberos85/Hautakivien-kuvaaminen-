/**
 * app.js - Käyttöliittymän looginen ohjaus (Vikasietoinen versio)
 */

const cameraInput = document.getElementById('camera-input');
const photoList = document.getElementById('photo-list');
const generateBtn = document.getElementById('generate-report');

// Kuvan pakkausasetukset
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
if (cameraInput) {
    cameraInput.addEventListener('change', async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        try {
            // 1. Varmistetaan, että tietokantayhteys on auki (mobiiliselain voi sulkea sen kameran ajaksi)
            if (typeof db === 'undefined' || !db) {
                await initDB();
            }

            // 2. Pienennetään kuva (ja jos se epäonnistuu, käytetään suoraa Base64-muunnosta)
            let base64Image;
            try {
                base64Image = await compressImage(file, MAX_DIMENSION, JPEG_QUALITY);
            } catch (compressErr) {
                console.warn("Pakkaus epäonnistui, käytetään alkuperäistä kuvaa:", compressErr);
                base64Image = await convertToBase64(file);
            }

            // 3. Luodaan tietue
            const graveEntry = {
                image_data: base64Image,
                timestamp: new Date().toLocaleString('fi-FI'),
                grave_id: "",
                extracted_text: "",
                notes: ""
            };

            // 4. Tallennetaan ja päivitetään näkymä
            await saveGraveData(graveEntry);
            await renderGallery();

        } catch (error) {
            console.error("Virhe kuvan tallennuksessa:", error);
            alert("Kuvan tallennus epäonnistui: " + (error.message || error));
        } finally {
            // Tyhjennetään vasta kun kaikki on valmista
            cameraInput.value = "";
        }
    });
}

/**
 * Muistia säästävä kuvan pienennys (käyttää ObjectURL-viitettä raskaan FileReaderin sijaan)
 */
function compressImage(file, maxDimension, quality) {
    return new Promise((resolve, reject) => {
        const objectUrl = URL.createObjectURL(file);
        const img = new Image();

        img.onload = () => {
            URL.revokeObjectURL(objectUrl); // Vapautetaan muisti heti

            try {
                let width = img.naturalWidth || img.width;
                let height = img.naturalHeight || img.height;

                if (!width || !height) {
                    reject(new Error("Kuvan mittoja ei voitu lukea."));
                    return;
                }

                // Skaalataan kuvasuhde säilyttäen
                if (width > height) {
                    if (width > maxDimension) {
                        height = Math.round((height * maxDimension) / width);
                        width = maxDimension;
                    }
                } else {
                    if (height > maxDimension) {
                        width = Math.round((width * maxDimension) / height);
                        height = maxDimension;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);

                const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(compressedDataUrl);
            } catch (err) {
                reject(err);
            }
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error("Kuvan lataaminen epäonnistui."));
        };

        img.src = objectUrl;
    });
}

// Varafunktio: Muunnetaan tiedosto suoraan Base64-muotoon
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
    if (typeof db === 'undefined' || !db) {
        await initDB();
    }
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
        await deleteGrave(id);
        await renderGallery();
    }
}

// Raportin luonti
if (generateBtn) {
    generateBtn.addEventListener('click', () => {
        if (typeof generateWordReport === 'function') {
            generateWordReport();
        } else {
            alert("Raportointiominaisuutta ladataan vielä...");
        }
    });
}/**
 * app.js - Käyttöliittymän looginen ohjaus (Vikasietoinen versio)
 */

const cameraInput = document.getElementById('camera-input');
const photoList = document.getElementById('photo-list');
const generateBtn = document.getElementById('generate-report');

// Kuvan pakkausasetukset
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
if (cameraInput) {
    cameraInput.addEventListener('change', async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        try {
            // 1. Varmistetaan, että tietokantayhteys on auki (mobiiliselain voi sulkea sen kameran ajaksi)
            if (typeof db === 'undefined' || !db) {
                await initDB();
            }

            // 2. Pienennetään kuva (ja jos se epäonnistuu, käytetään suoraa Base64-muunnosta)
            let base64Image;
            try {
                base64Image = await compressImage(file, MAX_DIMENSION, JPEG_QUALITY);
            } catch (compressErr) {
                console.warn("Pakkaus epäonnistui, käytetään alkuperäistä kuvaa:", compressErr);
                base64Image = await convertToBase64(file);
            }

            // 3. Luodaan tietue
            const graveEntry = {
                image_data: base64Image,
                timestamp: new Date().toLocaleString('fi-FI'),
                grave_id: "",
                extracted_text: "",
                notes: ""
            };

            // 4. Tallennetaan ja päivitetään näkymä
            await saveGraveData(graveEntry);
            await renderGallery();

        } catch (error) {
            console.error("Virhe kuvan tallennuksessa:", error);
            alert("Kuvan tallennus epäonnistui: " + (error.message || error));
        } finally {
            // Tyhjennetään vasta kun kaikki on valmista
            cameraInput.value = "";
        }
    });
}

/**
 * Muistia säästävä kuvan pienennys (käyttää ObjectURL-viitettä raskaan FileReaderin sijaan)
 */
function compressImage(file, maxDimension, quality) {
    return new Promise((resolve, reject) => {
        const objectUrl = URL.createObjectURL(file);
        const img = new Image();

        img.onload = () => {
            URL.revokeObjectURL(objectUrl); // Vapautetaan muisti heti

            try {
                let width = img.naturalWidth || img.width;
                let height = img.naturalHeight || img.height;

                if (!width || !height) {
                    reject(new Error("Kuvan mittoja ei voitu lukea."));
                    return;
                }

                // Skaalataan kuvasuhde säilyttäen
                if (width > height) {
                    if (width > maxDimension) {
                        height = Math.round((height * maxDimension) / width);
                        width = maxDimension;
                    }
                } else {
                    if (height > maxDimension) {
                        width = Math.round((width * maxDimension) / height);
                        height = maxDimension;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);

                const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(compressedDataUrl);
            } catch (err) {
                reject(err);
            }
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error("Kuvan lataaminen epäonnistui."));
        };

        img.src = objectUrl;
    });
}

// Varafunktio: Muunnetaan tiedosto suoraan Base64-muotoon
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
    if (typeof db === 'undefined' || !db) {
        await initDB();
    }
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
        await deleteGrave(id);
        await renderGallery();
    }
}

// Raportin luonti
if (generateBtn) {
    generateBtn.addEventListener('click', () => {
        if (typeof generateWordReport === 'function') {
            generateWordReport();
        } else {
            alert("Raportointiominaisuutta ladataan vielä...");
        }
    });
}
