async function getAntrean(kd_poli, tgl) {
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

        if (data.data.length == 0) {
            return null;
        }
        return data;
    } catch (err) {
        console.error('Fetch error:', err);
        return null;
    }
}
let urlParams = new URLSearchParams(window.location.search);
let kdpoli = urlParams.get('kdpoli');
let poli = kdpoli.split(',');
console.log(poli);

// Mapping kd_poli ke index (1, 2, 3)
let poliIndex = {};
poli.forEach((kd, idx) => {
    poliIndex[kd] = idx + 1;
});

// Socket.IO Client Setup
const socket = io();

socket.on('connect', () => {
    console.log('Connected to server:', socket.id);
});
socket.on('panggil_update', async (data) => {
    console.log('Panggil update received:', data.kd_poli);
    if (poli.some(kd => kd.toLowerCase() === data.kd_poli.toLowerCase())) {
        console.log('Panggil update received:', data);
        // playAudiosSequentially(data);
        // await generateTTS(data);
        let namapx = await generateTTS(data.nm_pasien);
        dataAudio.push(namapx.url);
        let polis = await generateTTS("Di Panggil ke " + data.nm_poli);
        dataAudio.push(polis.url);
        playAudiosSequentially(dataAudio);
    }
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
});



async function main() {
    let dateNow = new Date();
    let date = dateNow.getDate();
    let month = dateNow.getMonth() + 1;
    let year = dateNow.getFullYear();
    let tgl = `${year}-${month}-${date}`;
    let hari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    let bulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    let tanggal = `${hari[dateNow.getDay()]}, ${date} ${bulan[dateNow.getMonth()]} ${year}`;
    document.getElementById('tanggal').innerHTML = tanggal;
    document.getElementById('tanggal2').innerHTML = tanggal;
    x = 1;
    for (let i of poli) {
        let data = await getAntrean(i, tgl);
        if (data == null) {
            continue;
        }
        listing(x,data);
        x++;
    }
   
}

function listing(x,data) {
        let antrians = [];
        let sudah = 0;
        let belum = 0;
        let batal = 0;
        let total = data.data.length;
    for (let i of data.data) {
        if (i.stts == "Sudah") {
            sudah++;
        } else if (i.stts == "Belum") {
            belum++;
        } else if (i.stts == "Batal") {
            batal++;
        }
        let dataPasien = {}
        dataPasien.no_reg = i.no_reg;
        dataPasien.no_rawat = i.no_rawat;
        dataPasien.nm_pasien = i.pasien.nm_pasien;
        dataPasien.status = i.stts;
        dataPasien.nm_dokter = i.dokter.nm_dokter;
        dataPasien.kd_poli = i.kd_poli;
        antrians.push(dataPasien);
    }
    antrians.sort((a, b) => {
        if (a.status === "Sudah" && b.status !== "Sudah") {
            return 1;
        } else if (a.status !== "Sudah" && b.status === "Sudah") {
            return -1;
        } else {
            return 0;
        }
    }); 
    console.log(data.data[0].poliklinik.nm_poli + " " + x);
    document.getElementById(`bath${x}_poliklinik`).innerHTML = data.data[0].poliklinik.nm_poli;
    document.getElementById(`bath${x}_sudah`).innerHTML = sudah;
    document.getElementById(`bath${x}_belum`).innerHTML = belum;
    document.getElementById(`bath${x}_batal`).innerHTML = batal;
    document.getElementById(`bath${x}_total`).innerHTML = total;
    let antrianContainer = document.getElementById(`bath${x}_antrian`);

    if (!antrianContainer) {
        console.error(`Element dengan id 'bath${x}_antrian' tidak ditemukan.`);
        return;
    }
    document.getElementById(`bath${x}_antrian`).innerHTML = "";
    for (let i of antrians) {
        const newElement = document.createElement("div");
        newElement.className = "bg-gray-50 p-4 rounded-lg inset-ring flex";
        if (i.status == "Sudah") {
            newElement.innerHTML = `
            <div class="bg-green-200 p-4 rounded-lg text-xl font-bold w-16 text-center">${i.no_reg}</div>
            <div class="ml-4">
                <p>No Rawat: ${i.no_rawat}</p>
                <p>Nama: ${i.nm_pasien}</p>
                <p>Poli: ${data.data[0].poliklinik.nm_poli}</p>
                <p>Dokter: ${i.nm_dokter}</p>
                <p>Status: ${i.status}</p>
            </div>
        `;
        }
        if (i.status == 'Belum') {
            newElement.innerHTML = `
            <div class="bg-yellow-200 p-4 rounded-lg text-xl font-bold w-16 text-center">${i.no_reg}</div>
            <div class="ml-4">
                <p>No Rawat: ${i.no_rawat}</p>
                <p>Nama: ${i.nm_pasien}</p>
                <p>Poli: ${data.data[0].poliklinik.nm_poli}</p>
                <p>Dokter: ${i.nm_dokter}</p>
                <p>Status: ${i.status}</p>
            </div>
        `;
        }
        if (i.status == 'Batal') {
            newElement.innerHTML = `
            <div class="bg-red-200 p-4 rounded-lg text-xl font-bold w-16 text-center">${i.no_reg}</div>
            <div class="ml-4">
                <p>No Rawat: ${i.no_rawat}</p>
                <p>Nama: ${i.nm_pasien}</p>
                <p>Poli: ${data.data[0].poliklinik.nm_poli}</p>
                <p>Dokter: ${i.nm_dokter}</p>
                <p>Status: ${i.status}</p>
            </div>
        `;
        }
        
        antrianContainer.appendChild(newElement);
    }
}
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


setInterval(() => {
    console.log('10 detik telah berlalu');
    main();
}, 10000);
document.addEventListener("DOMContentLoaded", function (event) {
    console.log("Document is ready");
    main();
    playNotification();
});
// // Kecepatan scroll (pixel per step)
// let speed = 1;

// // Arah awal scroll (down)
// let direction = 1;

// function autoScroll() {
//     window.scrollBy(0, speed * direction);

//     // Jika sudah sampai bawah → balik arah
//     if ((window.innerHeight + window.scrollY) >= document.body.scrollHeight) {
//         direction = -1; // scroll up
//     }

//     // Jika sudah sampai atas → balik arah
//     if (window.scrollY <= 0) {
//         direction = 1; // scroll down
//     }

//     requestAnimationFrame(autoScroll); // loop tanpa jeda
// }

// // Start
// autoScroll();
