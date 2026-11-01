/**
 * app.js - Käyttöliittymän looginen ohjaus
 */

// Elementit
const cameraInput = document.getElementById('camera-input');
const photoList = document.getElementById('photo-list');
const generateBtn = document.getElementById('generate-report');

// Kuvan pakkausasetukset
const MAX_DIMENSION = 1200; // Kuvan pisimmän sivun maksimipikselimäärä
const JPEG_QUALITY = 0.75;  // Pakkauslaatu (0.0 - 1.0)

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

    try {
        // Pienennetään ja pakataan kuva JPEG-muotoon ennen tallennusta
        const compressedBase64 = await compressImage(file, MAX_DIMENSION, JPEG_QUALITY);
        
        // Luodaan dataobjekti tulevaisuutta varten
        const graveEntry = {
            image_data: compressedBase64,
            timestamp: new Date().toLocaleString('fi-FI'),
            grave_id: "",        // Paikka tulevalle tunnisteelle
            extracted_text: "",  // Paikka OCR-tekstille
            notes: ""            // Paikka muistiinpanoille
        };

        await saveGraveData(graveEntry); // Tallennus (storage.js)
        renderGallery(); // Päivitetään galleria
    } catch (error) {
        console.error("Virhe kuvan käsittelyssä:", error);
        alert("Kuvan käsittely epäonnistui: " + error.message);
    } finally {
        cameraInput.value = ""; // Tyhjennetään syöte
    }
});

/**
 * Skaalaa ja pakkaa kuvatiedoston HTML5 Canvasin avulla JPEG Base64 -muotoon
 */
function compressImage(file, maxDimension, quality) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (event) => {
            const img = new Image();
            
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                // Lasketaan uudet mitat kuvasuhde säilyttäen
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

                // Piirretään kuva pienempänä canvasille
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas
