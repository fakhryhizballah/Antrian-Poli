async function getAntrean(kd_poli, tgl) {
    try {
        const response = await fetch(`https://api.rsudaa.singkawangkota.go.id/api/ralan/antiran/poli?tgl_antrean=${tgl}&kd_poli=${kd_poli}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjdkYzJmMDUwLTI2NzYtNGUyNC1iNDQyLWM2MDg2MWFhYmY2NyIsImlhdCI6MTczMjk1MDQyMH0.Eu-RpGsilnbxR1YS-C1U1KbyQWdOArmt8FpZXfbSPAo'
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
// console.log(bath1, bath2, bath3);
// let poli = [bath1, bath2, bath3];
// let allParams = [];
// for (let [key, value] of urlParams) {
//     allParams.push({ key, value });
// }
// console.log(allParams);

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
    document.getElementById('tanggal3').innerHTML = tanggal;
    x = 1;
    for (let i of poli) {
        console.log(x);
        let data = await getAntrean(i, tgl);
        if (data == null) {
            continue;
        }
        listing(x,data);
        x++;
    }
   
}
// main();

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
        console.log(i);
        const newElement = document.createElement("div");
        newElement.className = "bg-white p-4 rounded-lg shadow flex";
        console.log(i.status);
        if (i.status == "Sudah") {
            newElement.innerHTML = `
            <div class="bg-green-200 p-4 rounded-lg text-xl font-bold w-16 text-center">${i.no_reg}</div>
            <div class="ml-4">
                <p>No Rawat: ${i.no_rawat}</p>
                <p>Nama: ${i.nm_pasien}</p>
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
                <p>Dokter: ${i.nm_dokter}</p>
                <p>Status: ${i.status}</p>
            </div>
        `;
        }
        
        antrianContainer.appendChild(newElement);
    }
}

setTimeout(() => {
    console.log('10 detik telah berlalu');
    main();
}, 10000);
document.addEventListener("DOMContentLoaded", function (event) {
    console.log("Document is ready");
    main();
});
