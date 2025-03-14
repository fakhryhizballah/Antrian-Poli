console.log('hello world');
const socket = io('/rooms');
let urlParams = new URLSearchParams(window.location.search);
let bath1 = urlParams.get('bath1');
let bath2 = urlParams.get('bath2');
let bath3 = urlParams.get('bath3');
console.log(bath1, bath2, bath3);

socket.on(bath1, (data) => {
    document.getElementById('bath1_poliklinik').innerHTML = data.nm_poli;
    document.getElementById('bath1_sudah').innerHTML = data.status_antrian.sudah;
    document.getElementById('bath1_belum').innerHTML = data.status_antrian.belum;
    document.getElementById('bath1_batal').innerHTML = data.status_antrian.batal;
    document.getElementById('bath1_total').innerHTML = data.status_antrian.total;
    let antrianContainer = document.getElementById("bath1_antrian");

    if (!antrianContainer) {
        console.error("Element dengan id 'bath1_antrian' tidak ditemukan.");
        return;
    }
    document.getElementById("bath1_antrian").innerHTML = "";
    for (let i of data.data) {
        console.log(i);
        const newElement = document.createElement("div");
        newElement.className = "bg-white p-4 rounded-lg shadow flex";
        newElement.innerHTML = `
            <div class="bg-green-200 p-4 rounded-lg text-xl font-bold w-16 text-center">${i.no_reg}</div>
            <div class="ml-4">
                <p>No Rawat: ${i.no_rawat}</p>
                <p>Nama: ${i.nm_pasien}</p>
                <p>Dokter: ${i.nm_dokter}</p>
                <p>Status: ${i.status}</p>
            </div>
        `;
        antrianContainer.appendChild(newElement);
    }
});
socket.on(bath2, (data) => {
    document.getElementById('bath2_poliklinik').innerHTML = data.nm_poli;
    document.getElementById('bath2_sudah').innerHTML = data.status_antrian.sudah;
    document.getElementById('bath2_belum').innerHTML = data.status_antrian.belum;
    document.getElementById('bath2_batal').innerHTML = data.status_antrian.batal;
    document.getElementById('bath2_total').innerHTML = data.status_antrian.total;
    let antrianContainer = document.getElementById("bath2_antrian");

    if (!antrianContainer) {
        console.error("Element dengan id 'bath2_antrian' tidak ditemukan.");
        return;
    }
    document.getElementById("bath2_antrian").innerHTML = "";
    for (let i of data.data) {
        console.log(i);
        const newElement = document.createElement("div");
        newElement.className = "bg-white p-4 rounded-lg shadow flex";
        newElement.innerHTML = `
            <div class="bg-green-200 p-4 rounded-lg text-xl font-bold w-16 text-center">${i.no_reg}</div>
            <div class="ml-4">
                <p>No Rawat: ${i.no_rawat}</p>
                <p>Nama: ${i.nm_pasien}</p>
                <p>Dokter: ${i.nm_dokter}</p>
                <p>Status: ${i.status}</p>
            </div>
        `;
        antrianContainer.appendChild(newElement);
    }
});
socket.on(bath3, (data) => {
    document.getElementById('bath3_poliklinik').innerHTML = data.nm_poli;
    document.getElementById('bath3_sudah').innerHTML = data.status_antrian.sudah;
    document.getElementById('bath3_belum').innerHTML = data.status_antrian.belum;
    document.getElementById('bath3_batal').innerHTML = data.status_antrian.batal;
    document.getElementById('bath3_total').innerHTML = data.status_antrian.total;
    let antrianContainer = document.getElementById("bath3_antrian");

    if (!antrianContainer) {
        console.error("Element dengan id 'bath3_antrian' tidak ditemukan.");
        return;
    }
    document.getElementById("bath3_antrian").innerHTML = "";
    for (let i of data.data) {
        console.log(i);
        const newElement = document.createElement("div");
        newElement.className = "bg-white p-4 rounded-lg shadow flex";
        newElement.innerHTML = `
            <div class="bg-green-200 p-4 rounded-lg text-xl font-bold w-16 text-center">${i.no_reg}</div>
            <div class="ml-4">
                <p>No Rawat: ${i.no_rawat}</p>
                <p>Nama: ${i.nm_pasien}</p>
                <p>Dokter: ${i.nm_dokter}</p>
                <p>Status: ${i.status}</p>
            </div>
        `;
        antrianContainer.appendChild(newElement);
    }
});