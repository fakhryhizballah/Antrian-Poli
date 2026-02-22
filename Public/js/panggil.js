// Ambil kd_poli dari URL atau EJS variable
const kd_poli = document.querySelector('span#poli_name').textContent.trim();
const socket = io();

// Menyimpan data pasien yang dimuat
let pasienList = [];

// Fungsi untuk fetch data pasien dari poli
async function fetchPasienData() {
    let dateNow = new Date();
    let date = dateNow.getDate();
    let month = dateNow.getMonth() + 1;
    let year = dateNow.getFullYear();
    let tgl = `${year}-${month}-${date}`;

    try {
        const response = await fetch(`/api/antrian?tgl_antrean=${tgl}&kd_poli=${kd_poli}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.data && data.data.length > 0) {
            pasienList = data.data;
            renderPasienList();
        }
    } catch (err) {
        console.error('Fetch error:', err);
        document.getElementById('pasien_list').innerHTML = '<p class="text-red-500 text-center py-8">Error loading data</p>';
    }
}

// Fungsi untuk render list pasien
function renderPasienList() {
    const container = document.getElementById('pasien_list');
    
    if (pasienList.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-8">Tidak ada pasien</p>';
        return;
    }

    container.innerHTML = '';

    // Urutkan pasien - yang belum dipanggil di atas
    const sorted = pasienList.sort((a, b) => {
        if (a.stts === 'Belum' && b.stts !== 'Belum') return -1;
        if (a.stts !== 'Belum' && b.stts === 'Belum') return 1;
        return 0;
    });

    sorted.forEach((pasien, index) => {
        const statusColor = {
            'Belum': 'bg-yellow-100 border-l-4 border-yellow-500',
            'Sudah': 'bg-green-100 border-l-4 border-green-500',
            'Batal': 'bg-red-100 border-l-4 border-red-500'
        };

        const card = document.createElement('div');
        card.className = `pasien-card p-4 rounded-lg ${statusColor[pasien.stts] || 'bg-gray-100'} flex justify-between items-center`;
        card.innerHTML = `
            <div class="flex-1">
                <div class="flex items-center gap-3">
                    <div class="text-2xl font-bold text-gray-700 w-12 h-12 bg-white rounded-full flex items-center justify-center">
                        ${pasien.no_reg}
                    </div>
                    <div>
                        <p class="font-semibold text-lg">${pasien.pasien.nm_pasien}</p>
                        <p class="text-sm text-gray-600">Dokter: ${pasien.dokter.nm_dokter}</p>
                        <p class="text-xs text-gray-500">No Rawat: ${pasien.no_rawat}</p>
                    </div>
                </div>
            </div>
            <div class="flex gap-2">
                <span class="px-3 py-1 rounded-full text-sm font-semibold ${
                    pasien.stts === 'Belum' ? 'bg-yellow-500 text-white' :
                    pasien.stts === 'Sudah' ? 'bg-green-500 text-white' :
                    'bg-red-500 text-white'
                }">
                    ${pasien.stts}
                </span>
                ${pasien.stts === 'Belum' ? `
                    <button onclick="callPasien('${pasien.no_reg}', '${pasien.pasien.nm_pasien.replace(/'/g, "\\'")}', '${pasien.dokter.nm_dokter.replace(/'/g, "\\'")}', '${pasien.poliklinik.nm_poli.replace(/'/g, "\\'")}')" 
                        class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition">
                        PANGGIL
                    </button>
                ` : ''}
            </div>
        `;
        container.appendChild(card);
    });
}

// Fungsi untuk panggil pasien
function callPasien(no_reg, nm_pasien, nm_dokter, nm_poli) {
    // Emit ke server
    socket.emit('panggil_pasien', {
        kd_poli: kd_poli,
        no_reg: no_reg,
        nm_pasien: nm_pasien,
        nm_dokter: nm_dokter,
        nm_poli: nm_poli
    });
    document.querySelector("button").disabled = true;
    console.log(`Memanggil pasien: ${nm_pasien}`);
}

// Socket.IO Connection
socket.on('connect', () => {
    console.log('Connected to server:', socket.id);
    socket.emit('subscribe_poli', kd_poli);
    console.log(`Subscribed to poli: ${kd_poli}`);
});

// Listen untuk panggil update dari server
socket.on('panggil_update', (data) => {
    console.log('Panggil update received:', data);
    
    // Update display panel
    document.getElementById('display_no_reg').textContent = data.no_reg;
    document.getElementById('display_nm_pasien').textContent = data.nm_pasien;
    document.getElementById('display_nm_dokter').textContent = data.nm_dokter;
    
    // Update waktu panggilan
    const now = new Date();
    const timeString = now.toLocaleTimeString('id-ID');
    document.getElementById('last_call_time').textContent = `Dipanggil: ${timeString}`;
    
    // Play sound notification (optional)
    playNotification();

    // Highlight the called patient
    highlightCalled(data.no_reg);
});

// Highlight pasien yang dipanggil
function highlightCalled(no_reg) {
    const cards = document.querySelectorAll('.pasien-card');
    cards.forEach(card => {
        card.classList.remove('called');
    });
    
    // Find dan highlight yang dipanggil
    setTimeout(() => {
        const allCards = document.querySelectorAll('.pasien-card');
        allCards.forEach(card => {
            if (card.textContent.includes(no_reg)) {
                card.classList.add('called');
                card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        });
    }, 100);
}

// Play notification sound
function playNotification() {
    // Membuat simple beep sound menggunakan Web Audio API
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
        console.log('Audio notification failed:', e.message);
    }
}

// Listen untuk antrian update (refresh pasien list)
socket.on('antrian_update', (data) => {
    if (data.kd_poli === kd_poli) {
        console.log('Antrian update received for this poli');
        // Update pasien list
        pasienList = data.data;
        renderPasienList();
    }
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
});

// Initial load
document.addEventListener('DOMContentLoaded', () => {
    console.log('Page loaded');
    fetchPasienData();
    
    // Refresh data setiap 10 detik
    setInterval(() => {
        fetchPasienData();
    }, 10000);
});
