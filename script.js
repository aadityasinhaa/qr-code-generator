// State and Settings
let currentTab = 'text-tab';
let currentPayload = ''; // holds text or base64 image
let qrInstance = null;

// DOM Elements
const themeToggle = document.getElementById('theme-toggle');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Inputs
const textInput = document.getElementById('qr-text');
const imageInput = document.getElementById('qr-image');
const uploadArea = document.getElementById('upload-area');
const imagePreviewContainer = document.getElementById('image-preview-container');
const imagePreview = document.getElementById('image-preview');
const uploadPlaceholder = document.getElementById('upload-placeholder');
const resizeWarning = document.getElementById('image-resize-warning');
const removeImageBtn = document.getElementById('remove-image');
const sizeSelect = document.getElementById('qr-size');

// Actions & Output
const btnGenerate = document.getElementById('btn-generate');
const btnClear = document.getElementById('btn-clear');
const outputContainer = document.getElementById('output-container');
const qrcodeBox = document.getElementById('qrcode-box');
const loadingOverlay = document.getElementById('loading-overlay');
const btnDownload = document.getElementById('btn-download');
const btnCopy = document.getElementById('btn-copy');

// History
const historySection = document.getElementById('history-section');
const historyList = document.getElementById('history-list');
const btnClearHistory = document.getElementById('btn-clear-history');
const resizeCanvas = document.getElementById('resize-canvas');

// Icons Initialize
lucide.createIcons();

// --- Theme Management ---
const toggleTheme = () => {
    const htmlObj = document.documentElement;
    const currentTheme = htmlObj.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    htmlObj.setAttribute('data-theme', newTheme);
    localStorage.setItem('qr-theme', newTheme);
    
    // Switch Icon
    const iconStr = newTheme === 'light' ? 'moon' : 'sun';
    themeToggle.innerHTML = `<i data-lucide="${iconStr}"></i>`;
    lucide.createIcons();
};

const loadTheme = () => {
    const savedTheme = localStorage.getItem('qr-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    const iconStr = savedTheme === 'light' ? 'moon' : 'sun';
    themeToggle.innerHTML = `<i data-lucide="${iconStr}"></i>`;
    lucide.createIcons();
};
themeToggle.addEventListener('click', toggleTheme);
loadTheme();

// --- Tab Management ---
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // clear output when switching tabs
        hideOutput();
        
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        
        btn.classList.add('active');
        const targetId = btn.getAttribute('data-target');
        document.getElementById(targetId).classList.add('active');
        currentTab = targetId;
        
        // Disable copy button if on image tab
        if(currentTab === 'image-tab') {
            btnCopy.classList.add('hidden');
            resizeWarning.classList.remove('hidden');
        } else {
            btnCopy.classList.remove('hidden');
            resizeWarning.classList.add('hidden');
        }
    });
});

// --- Image Handling & Resizing ---
const MAX_IMG_DIMENSION = 64; // Aggressive downscale for generic QR capacity
const MAX_IMG_KB = 2; // For informational purposes

uploadArea.addEventListener('click', (e) => {
    if(e.target === removeImageBtn || removeImageBtn.contains(e.target)) return;
    imageInput.click();
});

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = 'var(--accent)';
});
uploadArea.addEventListener('dragleave', () => {
    uploadArea.style.borderColor = 'var(--upload-border)';
});
uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = 'var(--upload-border)';
    if(e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleImageFile(e.dataTransfer.files[0]);
    }
});

imageInput.addEventListener('change', (e) => {
    if(e.target.files && e.target.files[0]) {
        handleImageFile(e.target.files[0]);
    }
});

removeImageBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    resetImageState();
});

function handleImageFile(file) {
    if(!file.type.startsWith('image/')) {
        alert("Please upload a valid image file.");
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            // Display Preview
            imagePreview.src = img.src;
            uploadPlaceholder.classList.add('hidden');
            imagePreviewContainer.classList.remove('hidden');
            
            // Downscale to Canvas for QR constraints
            downscaleImageForQR(img);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function downscaleImageForQR(img) {
    const ctx = resizeCanvas.getContext('2d');
    
    let width = img.width;
    let height = img.height;
    
    // Calculate new dimensions (keeping aspect ratio)
    if (width > height) {
        if (width > MAX_IMG_DIMENSION) {
            height = Math.round((height * MAX_IMG_DIMENSION) / width);
            width = MAX_IMG_DIMENSION;
        }
    } else {
        if (height > MAX_IMG_DIMENSION) {
            width = Math.round((width * MAX_IMG_DIMENSION) / height);
            height = MAX_IMG_DIMENSION;
        }
    }
    
    resizeCanvas.width = width;
    resizeCanvas.height = height;
    
    // Draw white background (in case of transparent PNGs)
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, width, height);
    
    ctx.drawImage(img, 0, 0, width, height);
    
    // Very compressed quality
    const base64Str = resizeCanvas.toDataURL('image/jpeg', 0.5);
    currentPayload = base64Str;
}

function resetImageState() {
    imageInput.value = '';
    imagePreview.src = '';
    currentPayload = '';
    uploadPlaceholder.classList.remove('hidden');
    imagePreviewContainer.classList.add('hidden');
    hideOutput();
}

// --- Generator Logic ---

btnGenerate.addEventListener('click', () => {
    let payloadStr = '';
    let type = 'text';

    if (currentTab === 'text-tab') {
        payloadStr = textInput.value.trim();
        if (!payloadStr) {
            alert("Please enter a URL or text.");
            textInput.focus();
            return;
        }
        type = 'text';
    } else {
        payloadStr = currentPayload;
        if (!payloadStr) {
            alert("Please upload an image first.");
            return;
        }
        type = 'image';
    }

    // Trigger Generation
    generateQRCode(payloadStr, parseInt(sizeSelect.value), type);
});

function generateQRCode(data, size, type) {
    // Show Output container with loading overlay
    outputContainer.classList.remove('hidden');
    loadingOverlay.classList.remove('hidden');
    
    // Clear previous
    qrcodeBox.innerHTML = '';
    
    // Use setTimeout to allow browser to render UI first
    setTimeout(() => {
        try {
            qrInstance = new QRCode(qrcodeBox, {
                text: data,
                width: size,
                height: size,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.L // Low ECC since data might be large
            });
            
            // Artificial delay for UX
            setTimeout(() => {
                loadingOverlay.classList.add('hidden');
                saveToHistory(data, type);
                loadHistory(); // refresh view
            }, 500);
            
        } catch (err) {
            console.error(err);
            loadingOverlay.classList.add('hidden');
            hideOutput();
            alert("Data too large for QR Code generation. Try shorter text or smaller image.");
        }
    }, 50);
}

function hideOutput() {
    outputContainer.classList.add('hidden');
    loadingOverlay.classList.add('hidden');
    qrcodeBox.innerHTML = '';
    qrInstance = null;
}

btnClear.addEventListener('click', () => {
    textInput.value = '';
    resetImageState();
    hideOutput();
});


// --- Download & Copy Actions ---

btnDownload.addEventListener('click', () => {
    // QRCode.js creates either a Canvas or an Img inside the container
    const canvas = qrcodeBox.querySelector('canvas');
    const img = qrcodeBox.querySelector('img');
    
    let finalSrc = "";
    
    if (canvas) {
        finalSrc = canvas.toDataURL("image/png");
    } else if (img && img.src) {
        finalSrc = img.src;
    }
    
    if(!finalSrc) {
        alert("Failed to render QR Code for download.");
        return;
    }
    
    const link = document.createElement('a');
    link.download = `QR_Code_${new Date().getTime()}.png`;
    link.href = finalSrc;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

btnCopy.addEventListener('click', () => {
    const textToCopy = textInput.value.trim();
    if(textToCopy) {
        navigator.clipboard.writeText(textToCopy).then(() => {
            const originalText = btnCopy.innerHTML;
            btnCopy.innerHTML = `<i data-lucide="check"></i> Copied!`;
            lucide.createIcons();
            
            setTimeout(() => {
                btnCopy.innerHTML = originalText;
                lucide.createIcons();
            }, 2000);
        }).catch(err => {
            console.error("Failed to copy", err);
            alert("Failed to copy to clipboard");
        });
    }
});


// --- History Management ---
// Limit string length to avoid extreme localStorage bloat
const MAX_HISTORY_ITEMS = 5; 

function saveToHistory(data, type) {
    let history = JSON.parse(localStorage.getItem('qr-history') || '[]');
    
    // Avoid exact duplicates
    history = history.filter(item => item.data !== data);
    
    const displayStr = type === 'image' ? "Image QR (Base64)" : data;
    
    history.unshift({
        id: Date.now(),
        type: type,
        data: data,
        display: displayStr,
        timestamp: new Date().toISOString()
    });
    
    if (history.length > MAX_HISTORY_ITEMS) {
        history.pop();
    }
    
    try {
        localStorage.setItem('qr-history', JSON.stringify(history));
    } catch(e) {
        // Quota exceeded
        console.warn("Local storage limit reached.");
    }
}

function loadHistory() {
    let history = JSON.parse(localStorage.getItem('qr-history') || '[]');
    historyList.innerHTML = '';
    
    if(history.length === 0) {
        historySection.classList.add('hidden');
        return;
    }
    
    historySection.classList.remove('hidden');
    
    history.forEach(item => {
        const dt = new Date(item.timestamp);
        const dateStr = `${dt.toLocaleDateString()} ${dt.toLocaleTimeString()}`;
        
        const historyEl = document.createElement('div');
        historyEl.className = 'history-item';
        historyEl.innerHTML = `
            <div class="history-icon">
                <i data-lucide="${item.type === 'text' ? 'link' : 'image'}"></i>
            </div>
            <div class="history-content" title="${item.display}">
                ${item.display}
            </div>
            <div class="history-date">${dateStr}</div>
        `;
        
        // Re-generate on click
        historyEl.addEventListener('click', () => {
            generateQRCode(item.data, parseInt(sizeSelect.value), item.type);
            
            // Switch tab to text if it was text (for UX)
            if(item.type === 'text') {
                document.querySelector('[data-target="text-tab"]').click();
                textInput.value = item.data;
            }
        });
        
        historyList.appendChild(historyEl);
    });
    
    lucide.createIcons();
}

btnClearHistory.addEventListener('click', () => {
    if(confirm("Are you sure you want to clear your recent QR codes?")) {
        localStorage.removeItem('qr-history');
        loadHistory();
    }
});

// Initialize History
loadHistory();
