// Estructura de datos para almacenar carpetas y códigos
let data = {
    folders: []
};

// Variables globales
let currentFolderId = null;
let model = null;
let videoElement = null;
let canvasElement = null;
let canvasContext = null;
let scanning = false;
let detectionInterval = null;
let detectedLetters = new Set();

// Inicializar datos desde el localStorage si existen
function initData() {
    const savedData = localStorage.getItem('enrutadorData');
    if (savedData) {
        data = JSON.parse(savedData);
    }
}

// Guardar datos en localStorage
function saveData() {
    localStorage.setItem('enrutadorData', JSON.stringify(data));
}

// Generar un ID único
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Mostrar una pantalla específica
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

// Renderizar la lista de carpetas
function renderFoldersList() {
    const foldersList = document.getElementById('folders-list');
    foldersList.innerHTML = '';

    data.folders.forEach(folder => {
        const li = document.createElement('li');
        li.innerHTML = `<i class="fas fa-folder"></i> ${folder.name}`;
        li.setAttribute('data-id', folder.id);
        li.addEventListener('click', () => openFolder(folder.id));
        foldersList.appendChild(li);
    });
}

// Abrir una carpeta
function openFolder(folderId) {
    currentFolderId = folderId;
    const folder = data.folders.find(f => f.id === folderId);
    document.getElementById('current-folder-name').textContent = folder.name;
    renderCodesList();
    showScreen('codes-screen');
}

// Renderizar la lista de códigos
function renderCodesList() {
    const codesList = document.getElementById('codes-list');
    codesList.innerHTML = '';

    const folder = data.folders.find(f => f.id === currentFolderId);
    if (folder && folder.codes) {
        folder.codes.forEach(code => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${code.value}</span>
                <span>${code.route}</span>
            `;
            li.setAttribute('data-id', code.id);
            codesList.appendChild(li);
        });
    }
}

// Mostrar modal para agregar carpeta
function showAddFolderModal() {
    document.getElementById('folder-name-input').value = '';
    document.getElementById('add-folder-modal').style.display = 'block';
}

// Mostrar modal para agregar código
function showAddCodeModal() {
    document.getElementById('code-input').value = '';
    document.getElementById('route-input').value = '';
    document.getElementById('add-code-modal').style.display = 'block';
}

// Mostrar modal para eliminar carpeta
function showDeleteFolderModal() {
    const deleteList = document.getElementById('delete-folders-list');
    deleteList.innerHTML = '';

    data.folders.forEach(folder => {
        const item = document.createElement('div');
        item.className = 'checkbox-item';
        item.innerHTML = `
            <input type="checkbox" id="folder-${folder.id}" data-id="${folder.id}">
            <label for="folder-${folder.id}">${folder.name}</label>
        `;
        deleteList.appendChild(item);
    });

    document.getElementById('delete-folder-modal').style.display = 'block';
}

// Mostrar modal para eliminar código
function showDeleteCodeModal() {
    const deleteList = document.getElementById('delete-codes-list');
    deleteList.innerHTML = '';

    const folder = data.folders.find(f => f.id === currentFolderId);
    if (folder && folder.codes) {
        folder.codes.forEach(code => {
            const item = document.createElement('div');
            item.className = 'checkbox-item';
            item.innerHTML = `
                <input type="checkbox" id="code-${code.id}" data-id="${code.id}">
                <label for="code-${code.id}">${code.value} - ${code.route}</label>
            `;
            deleteList.appendChild(item);
        });
    }

    document.getElementById('delete-code-modal').style.display = 'block';
}

// Agregar una nueva carpeta
function addFolder() {
    const folderName = document.getElementById('folder-name-input').value.trim();
    if (folderName) {
        const newFolder = {
            id: generateId(),
            name: folderName,
            codes: []
        };
        data.folders.push(newFolder);
        saveData();
        renderFoldersList();
        document.getElementById('add-folder-modal').style.display = 'none';
    }
}

// Agregar un nuevo código
function addCode() {
    const codeValue = document.getElementById('code-input').value.trim();
    const routeValue = document.getElementById('route-input').value.trim().toUpperCase();

    if (codeValue && routeValue && routeValue.length === 1) {
        const folder = data.folders.find(f => f.id === currentFolderId);
        if (folder) {
            const newCode = {
                id: generateId(),
                value: codeValue,
                route: routeValue
            };
            if (!folder.codes) {
                folder.codes = [];
            }
            folder.codes.push(newCode);
            saveData();
            renderCodesList();
            document.getElementById('add-code-modal').style.display = 'none';
        }
    } else {
        alert('Por favor, ingresa un código válido y una ruta de una sola letra.');
    }
}

// Eliminar carpetas seleccionadas
function deleteFolders() {
    const checkboxes = document.querySelectorAll('#delete-folders-list input:checked');
    const idsToDelete = Array.from(checkboxes).map(cb => cb.getAttribute('data-id'));

    if (idsToDelete.length > 0) {
        data.folders = data.folders.filter(folder => !idsToDelete.includes(folder.id));
        saveData();
        renderFoldersList();
        document.getElementById('delete-folder-modal').style.display = 'none';
    }
}

// Eliminar códigos seleccionados
function deleteCodes() {
    const checkboxes = document.querySelectorAll('#delete-codes-list input:checked');
    const idsToDelete = Array.from(checkboxes).map(cb => cb.getAttribute('data-id'));

    if (idsToDelete.length > 0) {
        const folder = data.folders.find(f => f.id === currentFolderId);
        if (folder) {
            folder.codes = folder.codes.filter(code => !idsToDelete.includes(code.id));
            saveData();
            renderCodesList();
            document.getElementById('delete-code-modal').style.display = 'none';
        }
    }
}

// Inicializar la cámara
async function initCamera() {
    videoElement = document.getElementById('video');
    canvasElement = document.getElementById('canvas');
    canvasContext = canvasElement.getContext('2d');

    try {
        const constraints = {
            video: {
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        videoElement.srcObject = stream;

        return new Promise((resolve) => {
            videoElement.onloadedmetadata = () => {
                videoElement.play();
                canvasElement.width = videoElement.videoWidth;
                canvasElement.height = videoElement.videoHeight;
                document.getElementById('scanner-status').textContent = 'Cámara lista. Buscando códigos...';
                resolve();
            };
        });
    } catch (error) {
        console.error('Error al acceder a la cámara:', error);
        document.getElementById('scanner-status').textContent = 'Error al acceder a la cámara: ' + error.message;
        throw error;
    }
}

// Cargar el modelo COCO-SSD
async function loadModel() {
    try {
        document.getElementById('scanner-status').textContent = 'Cargando modelo de detección...';
        model = await cocoSsd.load();
        document.getElementById('scanner-status').textContent = 'Modelo cargado. Preparando cámara...';
        return model;
    } catch (error) {
        console.error('Error al cargar el modelo:', error);
        document.getElementById('scanner-status').textContent = 'Error al cargar el modelo: ' + error.message;
        throw error;
    }
}

// Iniciar el escaneo
async function startScanning() {
    if (scanning) return;
    scanning = true;
    detectedLetters.clear();
    document.getElementById('detected-codes').innerHTML = '';

    try {
        if (!model) {
            await loadModel();
        }
        await initCamera();

        // Configurar la detección a 4 FPS (cada 250ms)
        detectionInterval = setInterval(detectCodes, 250);
    } catch (error) {
        console.error('Error al iniciar el escaneo:', error);
        scanning = false;
    }
}

// Detener el escaneo
function stopScanning() {
    if (!scanning) return;
    
    if (detectionInterval) {
        clearInterval(detectionInterval);
        detectionInterval = null;
    }

    if (videoElement && videoElement.srcObject) {
        videoElement.srcObject.getTracks().forEach(track => track.stop());
        videoElement.srcObject = null;
    }

    scanning = false;
    document.getElementById('scanner-status').textContent = 'Escaneo detenido';
}

// Detectar códigos en el video
async function detectCodes() {
    if (!model || !videoElement || !canvasContext) return;

    try {
        // Realizar la detección con el modelo COCO-SSD
        const predictions = await model.detect(videoElement);
        
        // Limpiar el canvas
        canvasContext.clearRect(0, 0, canvasElement.width, canvasElement.height);
        
        // Dibujar el frame actual del video
        canvasContext.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
        
        // Buscar todos los códigos en todas las carpetas
        const allCodes = [];
        data.folders.forEach(folder => {
            if (folder.codes && folder.codes.length > 0) {
                folder.codes.forEach(code => {
                    allCodes.push(code);
                });
            }
        });

        // Procesar las detecciones
        predictions.forEach(prediction => {
            // El modelo COCO-SSD no detecta códigos específicamente, así que estamos usando la clase "person" como ejemplo
            // En una implementación real, se necesitaría un modelo entrenado para detectar códigos o usar una biblioteca específica
            if (prediction.score > 0.5) {
                const [x, y, width, height] = prediction.bbox;
                
                // Extraer texto del área detectada (esto es simulado)
                const detectedText = prediction.class;
                
                // Buscar el código en nuestra base de datos
                const matchedCode = allCodes.find(code => code.value.includes(detectedText));
                
                if (matchedCode) {
                    // Dibujar recuadro
                    canvasContext.strokeStyle = '#00FF00';
                    canvasContext.lineWidth = 3;
                    canvasContext.strokeRect(x, y, width, height);
                    
                    // Dibujar la letra de ruta
                    canvasContext.fillStyle = 'white';
                    canvasContext.font = 'bold 24px sans-serif';
                    canvasContext.fillText(matchedCode.route, x, y - 10);
                    
                    // Agregar a la lista de letras detectadas
                    if (!detectedLetters.has(matchedCode.route)) {
                        detectedLetters.add(matchedCode.route);
                        updateDetectedLetters();
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error durante la detección:', error);
    }
}

// Actualizar la lista de letras detectadas
function updateDetectedLetters() {
    const container = document.getElementById('detected-codes');
    container.innerHTML = '';
    
    Array.from(detectedLetters).sort().forEach(letter => {
        const letterElement = document.createElement('div');
        letterElement.className = 'detected-code';
        letterElement.textContent = letter;
        container.appendChild(letterElement);
    });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar datos
    initData();
    
    // Navegación principal
    document.getElementById('folders-btn').addEventListener('click', () => {
        renderFoldersList();
        showScreen('folders-screen');
    });
    
    document.getElementById('scan-btn').addEventListener('click', () => {
        showScreen('scan-screen');
        startScanning();
    });
    
    // Botones de volver
    document.getElementById('back-to-main').addEventListener('click', () => {
        showScreen('main-screen');
    });
    
    document.getElementById('back-to-folders').addEventListener('click', () => {
        showScreen('folders-screen');
    });
    
    document.getElementById('back-to-main-from-scan').addEventListener('click', () => {
        stopScanning();
        showScreen('main-screen');
    });
    
    // Botones de acción
    document.getElementById('add-folder-btn').addEventListener('click', showAddFolderModal);
    document.getElementById('delete-folder-btn').addEventListener('click', showDeleteFolderModal);
    document.getElementById('add-code-btn').addEventListener('click', showAddCodeModal);
    document.getElementById('delete-code-btn').addEventListener('click', showDeleteCodeModal);
    
    // Confirmar acciones
    document.getElementById('confirm-add-folder').addEventListener('click', addFolder);
    document.getElementById('confirm-add-code').addEventListener('click', addCode);
    document.getElementById('confirm-delete-folder').addEventListener('click', deleteFolders);
    document.getElementById('confirm-delete-code').addEventListener('click', deleteCodes);
    
    // Cerrar modales
    document.querySelectorAll('.close-modal').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
        });
    });
    
    // Cerrar modal al hacer clic fuera
    window.addEventListener('click', (event) => {
        document.querySelectorAll('.modal').forEach(modal => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // Renderizar listas iniciales
    renderFoldersList();
});