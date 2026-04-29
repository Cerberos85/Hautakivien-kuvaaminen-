/**
 * storage.js - Hallitsee IndexedDB-tietokantaa
 */

const DB_NAME = "HautausmaaDB";
const DB_VERSION = 1;
const STORE_NAME = "graves";

let db;

// Avaa tietokanta
const initDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                // Luodaan tietovarasto. 'id' on automaattinen avain.
                const store = db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
                // Luodaan indeksi mahdollista myöhempää hakua varten
                store.createIndex("grave_id", "grave_id", { unique: false });
            }
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            resolve(db);
        };

        request.onerror = (event) => {
            console.error("IndexedDB virhe:", event.target.error);
            reject("Tietokannan avaaminen epäonnistui");
        };
    });
};

// Tallenna uusi kuva ja tiedot
const saveGraveData = async (graveObject) => {
    /* graveObject rakenne tulevaisuutta ajatellen:
       {
           image_data: "data:image/jpeg;base64...",
           timestamp: Date.now(),
           grave_id: "",
           extracted_text: "",
           notes: ""
       }
    */
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.add(graveObject);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject("Tallennus epäonnistui");
    });
};

// Hae kaikki tallennetut hautapaikat
const getAllGraves = async () => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject("Hakeminen epäonnistui");
    });
};

// Poista tietty merkintä
const deleteGrave = async (id) => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject("Poisto epäonnistui");
    });
};