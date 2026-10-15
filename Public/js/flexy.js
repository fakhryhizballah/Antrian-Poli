async function getAntrean(kd_poli, tgl) {
    try {
        // Endpoint dan parameter API tetap sama.
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

const urlParams = new URLSearchParams(window.location.search);
const kdpoli = urlParams.get('kdpoli') || '';
const poli = kdpoli.split(',').map(kd => kd.trim()).filter(Boolean).slice(0, 2);
console.log(poli);

// Mapping kd_poli ke index display (1, 2).
const poliIndex = {};
poli.forEach((kd, idx) => {
    poliIndex[kd] = idx + 1;
});

// Menyimpan pasien terakhir yang dipanggil per poli agar tetap berada di posisi pertama
// setelah daftar dimuat ulang. Ini hanya state tampilan; tidak mengubah API/backend.
const calledPatientsByPoli = new Map();
const CALL_ANIMATION_DURATION = 4000;
let callAnimationSequence = 0;

function normalizeText(value) {
    return String(value ?? '').trim().toLocaleLowerCase('id-ID');
}

function isCalledPatient(patient, kdPoli) {
    const called = calledPatientsByPoli.get(normalizeText(kdPoli));
    if (!called) return false;

    // Utamakan identitas unik bila disertakan payload panggilan.
    if (called.no_reg !== undefined && called.no_reg !== null && called.no_reg !== '') {
        return String(patient.no_reg ?? '') === String(called.no_reg);
    }
    if (called.no_rawat !== undefined && called.no_rawat !== null && called.no_rawat !== '') {
        return String(patient.no_rawat ?? '') === String(called.no_rawat);
    }

    return normalizeText(patient.nm_pasien) === normalizeText(called.nm_pasien);
}

function setCalledPatient(data, { animate = false } = {}) {
    if (!data || !data.kd_poli) return;

    const poliKey = normalizeText(data.kd_poli);
    const previousCall = calledPatientsByPoli.get(poliKey);
    const animationToken = animate ? ++callAnimationSequence : previousCall?.animationToken;
    const animationUntil = animate
        ? Date.now() + CALL_ANIMATION_DURATION
        : (previousCall?.animationUntil ?? 0);

    calledPatientsByPoli.set(poliKey, {
        nm_pasien: data.nm_pasien,
        no_reg: data.no_reg,
        no_rawat: data.no_rawat,
        animationToken,
        animationUntil
    });

    // Pindahkan langsung jika kartu pasien sudah ada di layar.
    promotePatientToTop(data);

    if (animate) {
        // Hentikan animasi setelah beberapa detik. Token mencegah timer
        // panggilan lama menghentikan animasi panggilan yang lebih baru.
        window.setTimeout(() => {
            const currentCall = calledPatientsByPoli.get(poliKey);
            if (!currentCall || currentCall.animationToken !== animationToken) return;

            currentCall.animationUntil = 0;
            document.querySelectorAll('[data-call-animation="true"]').forEach((card) => {
                if (normalizeText(card.dataset.kdPoli) !== poliKey) return;
                card.classList.remove(
                    'animate-pulse', 'ring-4', 'ring-amber-400',
                    'shadow-xl', 'relative', 'z-10'
                );
                card.classList.add('ring-2', 'ring-amber-200', 'shadow-md');
                delete card.dataset.callAnimation;

                const badge = card.querySelector('[data-called-badge]');
                if (badge) badge.classList.remove('animate-bounce');
            });
        }, CALL_ANIMATION_DURATION);
    }
}

function isCallAnimationActive(kdPoli) {
    const called = calledPatientsByPoli.get(normalizeText(kdPoli));
    return Boolean(called && called.animationUntil > Date.now());
}

function applyCallAnimation(card, kdPoli) {
    if (!isCallAnimationActive(kdPoli)) return;

    card.dataset.callAnimation = 'true';
    card.classList.remove('ring-2', 'ring-amber-200');
    card.classList.add(
        'animate-pulse', 'ring-4', 'ring-amber-400',
        'shadow-xl', 'relative', 'z-10'
    );

    const badge = card.querySelector('[data-called-badge]');
    if (badge) badge.classList.add('animate-bounce');
}

function promotePatientToTop(data) {
    const containers = document.querySelectorAll('[id$="_antrian"]');
    const calledName = normalizeText(data.nm_pasien);

    containers.forEach((container) => {
        const cards = Array.from(container.children);
        const card = cards.find((item) => {
            if (!item.dataset || item.dataset.patientCard !== 'true') return false;

            const cardPoli = normalizeText(item.dataset.kdPoli);
            if (data.kd_poli && cardPoli && cardPoli !== normalizeText(data.kd_poli)) return false;

            if (data.no_reg !== undefined && data.no_reg !== null && data.no_reg !== '') {
                return String(item.dataset.noReg ?? '') === String(data.no_reg);
            }
            if (data.no_rawat !== undefined && data.no_rawat !== null && data.no_rawat !== '') {
                return String(item.dataset.noRawat ?? '') === String(data.no_rawat);
            }
            return normalizeText(item.dataset.patientName) === calledName;
        });

        if (card) {
            container.prepend(card);
            setCalledCardAppearance(card, true);
        }
    });
}

function setCalledCardAppearance(card, isCalled) {
    const badge = card.querySelector('[data-called-badge]');
    if (isCalled) {
        card.classList.add('border-amber-400', 'bg-amber-50', 'ring-2', 'ring-amber-200', 'shadow-md');
        card.classList.remove('border-slate-200', 'bg-white');
        if (badge) badge.classList.remove('hidden');
        applyCallAnimation(card, card.dataset.kdPoli);
    } else {
        card.classList.remove(
            'border-amber-400', 'bg-amber-50', 'ring-2', 'ring-amber-200',
            'shadow-md', 'animate-pulse', 'ring-4', 'ring-amber-400',
            'shadow-xl', 'relative', 'z-10'
        );
        card.classList.add('border-slate-200', 'bg-white');
        delete card.dataset.callAnimation;
        if (badge) {
            badge.classList.add('hidden');
            badge.classList.remove('animate-bounce');
        }
    }
}

// Socket.IO Client Setup (alur koneksi dan audio tetap dipertahankan).
const socket = io();

socket.on('connect', () => {
    console.log('Connected to server:', socket.id);
});

socket.on('panggil_update', async (data) => {
    console.log('Panggil update received:', data.kd_poli);
    if (data?.kd_poli && poli.some(kd => kd.toLowerCase() === String(data.kd_poli).toLowerCase())) {
        console.log('Panggil update received:', data);

        setCalledPatient(data);

        // playAudiosSequentially(data);
        // await generateTTS(data);
        let namapx = await generateTTS(data.nm_pasien);
        dataAudio.push(namapx.path);
        let polis = await generateTTS("Di Panggil ke " + data.nm_poli);
        dataAudio.push(polis.path);
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

    document.getElementById('tanggal').textContent = tanggal;
    document.getElementById('tanggal2').textContent = tanggal;

    // Initial load untuk maksimal dua display. Indeks mengikuti urutan kd_poli
    // pada query string supaya poli kedua tidak bergeser ketika poli pertama kosong.
    for (let idx = 0; idx < poli.length && idx < 2; idx++) {
        const data = await getAntrean(poli[idx], tgl);
        if (data == null) {
            continue;
        }
        listing(idx + 1, data);
    }
}

function listing(x, data) {
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

        antrians.push({
            no_reg: i.no_reg,
            no_rawat: i.no_rawat,
            nm_pasien: i.pasien.nm_pasien,
            status: i.stts,
            nm_dokter: i.dokter.nm_dokter,
            kd_poli: i.kd_poli
        });
    }

    const kdPoli = data.data[0].kd_poli;

    antrians.sort((a, b) => {
        // Satu-satunya prioritas baru: pasien yang dipanggil ditempatkan di paling atas.
        const aCalled = isCalledPatient(a, kdPoli);
        const bCalled = isCalledPatient(b, kdPoli);
        if (aCalled !== bCalled) return aCalled ? -1 : 1;

        // Urutan status existing dipertahankan.
        if (a.status === "Sudah" && b.status !== "Sudah") {
            return 1;
        } else if (a.status !== "Sudah" && b.status === "Sudah") {
            return -1;
        }
        return 0;
    });

    document.getElementById(`bath${x}_poliklinik`).textContent = data.data[0].poliklinik.nm_poli;
    document.getElementById(`bath${x}_sudah`).textContent = sudah;
    document.getElementById(`bath${x}_belum`).textContent = belum;
    document.getElementById(`bath${x}_batal`).textContent = batal;
    document.getElementById(`bath${x}_total`).textContent = total;

    const antrianContainer = document.getElementById(`bath${x}_antrian`);
    if (!antrianContainer) {
        console.error(`Element dengan id 'bath${x}_antrian' tidak ditemukan.`);
        return;
    }
    antrianContainer.replaceChildren();

    for (const pasien of antrians) {
        const called = isCalledPatient(pasien, kdPoli);
        const statusClasses = getStatusClasses(pasien.status);

        const card = document.createElement('article');
        card.dataset.patientCard = 'true';
        card.dataset.patientName = pasien.nm_pasien ?? '';
        card.dataset.noReg = pasien.no_reg ?? '';
        card.dataset.noRawat = pasien.no_rawat ?? '';
        card.dataset.kdPoli = pasien.kd_poli ?? '';
        card.className = 'flex items-center gap-3 rounded-xl border px-3 py-2.5 shadow-sm transition-all duration-300 ' +
            (called
                ? 'border-amber-400 bg-amber-50 ring-2 ring-amber-200 shadow-md'
                : 'border-slate-200 bg-white');

        const reg = document.createElement('div');
        reg.className = `flex h-12 w-[4.25rem] shrink-0 items-center justify-center rounded-lg px-1 text-center text-lg font-extrabold tabular-nums ${statusClasses.number}`;
        reg.textContent = pasien.no_reg ?? '-';
        card.appendChild(reg);

        const detail = document.createElement('div');
        detail.className = 'min-w-0 flex-1';

        const nameRow = document.createElement('div');
        nameRow.className = 'flex min-w-0 flex-wrap items-center gap-1.5';

        const name = document.createElement('p');
        name.className = 'min-w-0 flex-1 break-words text-sm font-extrabold leading-snug text-slate-900 sm:text-base';
        name.textContent = pasien.nm_pasien ?? '-';
        nameRow.appendChild(name);

        const calledBadge = document.createElement('span');
        calledBadge.dataset.calledBadge = 'true';
        calledBadge.className = 'inline-flex shrink-0 items-center rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-extrabold tracking-wide text-white' +
            (called ? '' : ' hidden');
        calledBadge.textContent = 'DIPANGGIL';
        nameRow.appendChild(calledBadge);
        detail.appendChild(nameRow);

        const statusRow = document.createElement('div');
        statusRow.className = 'mt-1.5 flex flex-wrap items-center gap-1.5';

        const statusBadge = document.createElement('span');
        statusBadge.className = `inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${statusClasses.badge}`;
        statusBadge.textContent = pasien.status ?? 'Tidak diketahui';
        statusRow.appendChild(statusBadge);

        const rawat = document.createElement('span');
        rawat.className = 'break-all text-[11px] leading-4 text-slate-500';
        rawat.textContent = `No. Rawat: ${pasien.no_rawat ?? '-'}`;
        statusRow.appendChild(rawat);
        detail.appendChild(statusRow);

        const doctor = document.createElement('p');
        doctor.className = 'mt-1 break-words text-xs leading-4 text-slate-600';
        doctor.textContent = `Dokter: ${pasien.nm_dokter ?? '-'}`;
        detail.appendChild(doctor);

        card.appendChild(detail);
        antrianContainer.appendChild(card);

        if (called) {
            setCalledCardAppearance(card, true);
            if (isCallAnimationActive(kdPoli)) {
                // Pastikan pasien yang dipanggil langsung terlihat di awal daftar.
                antrianContainer.scrollTop = 0;
            }
        }
    }
}

function getStatusClasses(status) {
    switch (status) {
        case 'Sudah':
            return {
                number: 'bg-emerald-100 text-emerald-900',
                badge: 'bg-emerald-100 text-emerald-800'
            };
        case 'Belum':
            return {
                number: 'bg-amber-100 text-amber-900',
                badge: 'bg-amber-100 text-amber-800'
            };
        case 'Batal':
            return {
                number: 'bg-rose-100 text-rose-900',
                badge: 'bg-rose-100 text-rose-800'
            };
        case 'Rujukan Internal Poli':
            return {
                number: 'bg-pink-100 text-pink-900',
                badge: 'bg-pink-100 text-pink-800'
            };
        default:
            return {
                number: 'bg-slate-100 text-slate-800',
                badge: 'bg-slate-100 text-slate-700'
            };
    }
}

document.addEventListener('DOMContentLoaded', function () {
    console.log('Document is ready');
    main();
});

const eventSource = new EventSource('/api/stream');

eventSource.onopen = () => {
    console.log('Connected to server');
};

eventSource.onmessage = async (event) => {
    const data = JSON.parse(event.data);
    console.log('[SSE] Webhook payload:', data);

    if (data?.kd_poli && poli.some(kd => kd.toLowerCase() === String(data.kd_poli).toLowerCase())) {
        console.log('Panggil update received:', data);
        // Event SSE menandai panggilan baru dan menjalankan animasi kartu.
        setCalledPatient(data, { animate: true });
        main();

        let namapx = await generateTTS(data.nm_pasien);
        dataAudio.push(namapx.path);
        let polis = await generateTTS("Di Panggil ke " + data.nm_poli);
        dataAudio.push(polis.path);
        playAudiosSequentially(dataAudio);
    }
};

window.addEventListener('beforeunload', () => {
    eventSource.close();
});
