// Ambil kd_poli dari URL atau EJS variable
const kd_poli = document.querySelector('span#poli_name').textContent.trim();

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

    if (!pasienList || pasienList.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-8">Tidak ada pasien</p>';
        return;
    }

    container.innerHTML = '';

    // Clone array agar tidak memutasi state asli saat sorting
    const sorted = [...pasienList].sort((a, b) => {
        if (a.stts === 'Belum' && b.stts !== 'Belum') return -1;
        if (a.stts !== 'Belum' && b.stts === 'Belum') return 1;
        return 0;
    });

    // Menggunakan DocumentFragment untuk batch DOM insertion (optimasi performa)
    const fragment = document.createDocumentFragment();

    // Helper untuk string escape yang lebih rapi di inline-handler
    const escapeStr = (str) => (str || '').toString().replace(/'/g, "\\'");

    sorted.forEach((pasien) => {
        const statusConfig = {
            'Belum': { bg: 'bg-yellow-50 border-l-4 border-yellow-400', badge: 'bg-yellow-500 text-white' },
            'Sudah': { bg: 'bg-green-50 border-l-4 border-green-400', badge: 'bg-green-500 text-white' },
            'Batal': { bg: 'bg-red-50 border-l-4 border-red-400', badge: 'bg-red-500 text-white' },
            'Rujukan Internal Poli': { bg: 'bg-pink-50 border-l-4 border-pink-400', badge: 'bg-pink-500 text-white' }
        };

        const config = statusConfig[pasien.stts] || { bg: 'bg-gray-50', badge: 'bg-gray-500 text-white' };

        const card = document.createElement('div');
        // flex-col untuk mobile (stacking), sm:flex-row untuk desktop
        card.className = `p-4 rounded-lg shadow-sm ${config.bg} flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition-all hover:shadow-md`;

        const isBelum = pasien.stts === 'Belum' || pasien.stts === 'Rujukan Internal Poli';

        card.innerHTML = `
            <!-- Sisi Kiri / Atas: Info Pasien -->
            <div class="flex items-start sm:items-center gap-3 w-full sm:w-auto">
                <div class="text-xl sm:text-2xl font-bold text-gray-700 min-w-[3rem] h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 shrink-0">
                    ${pasien.no_reg}
                </div>
                <div class="flex-1 min-w-0"> <!-- min-w-0 penting untuk efek truncate pada teks panjang -->
                    <p class="font-semibold text-base sm:text-lg text-gray-800 truncate" title="${pasien.pasien?.nm_pasien || '-'}">
                        ${pasien.pasien?.nm_pasien || '-'}
                    </p>
                    <p class="text-xs sm:text-sm text-gray-600 truncate">Dr. ${pasien.dokter?.nm_dokter || '-'}</p>
                    <p class="text-xs text-gray-500">No Rawat: ${pasien.no_rawat || '-'}</p>
                </div>
            </div>

            <!-- Sisi Kanan / Bawah: Status & Aksi -->
            <div class="flex flex-row sm:flex-col md:flex-row items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 mt-1 sm:mt-0 border-gray-200">
                <span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${config.badge}">
                    ${pasien.stts}
                </span>

                ${isBelum ? `
                    <button onclick="callPasien('${pasien.no_reg}', '${escapeStr(pasien.pasien?.nm_pasien)}', '${escapeStr(pasien.dokter?.nm_dokter)}', '${escapeStr(pasien.poliklinik?.nm_poli)}')" 
                        class="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition shadow-sm active:scale-95 flex-shrink-0">
                        PANGGIL
                    </button>
                ` : ''}
            </div>
        `;
        fragment.appendChild(card);
    });

    container.appendChild(fragment);
}


// Fungsi untuk panggil pasien
async function callPasien(no_reg, nm_pasien, nm_dokter, nm_poli) {
    updateDisplayPanggilan(no_reg, nm_pasien, nm_dokter);
    console.log(`Memanggil pasien: ${nm_pasien}`);
    document.querySelectorAll('button').forEach(btn => btn.disabled = true);
    const response = await fetch(`/api/antiran/poli/${kd_poli}/${nm_poli}/${nm_pasien}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    setTimeout(() => {
        console.log("Jalan setelah 5 detik!");
        fetchPasienData();
    }, 5000);


}
function updateDisplayPanggilan(no_reg, nm_pasien, nm_dokter) {
    // Update teks pada elemen UI (dengan fallback jika data kosong)
    document.getElementById('display_no_reg').textContent = no_reg || '--';
    document.getElementById('display_nm_pasien').textContent = nm_pasien || '-';
    document.getElementById('display_nm_dokter').textContent = nm_dokter ? `Dr. ${nm_dokter}` : '-';

    // Update waktu panggilan terakhir dengan format waktu lokal (WIB)
    const now = new Date();
    const timeString = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    document.getElementById('last_call_time').textContent = `Terakhir dipanggil: ${timeString}`;

    // Opsional: Tambahkan efek animasi berkedip (pulse) sebentar pada panel untuk menarik perhatian
    const displayPanel = document.getElementById('display_no_reg').parentElement;
    displayPanel.classList.add('animate-pulse', 'bg-opacity-25');
    setTimeout(() => {
        displayPanel.classList.remove('animate-pulse', 'bg-opacity-25');
    }, 1500);
}


// Highlight pasien yang dipanggil

// Play notification sound

// Listen untuk antrian update (refresh pasien list)

// Initial load
document.addEventListener('DOMContentLoaded', () => {
    console.log('Page loaded');
    fetchPasienData();
    
    // Refresh data setiap 10 detik

});
