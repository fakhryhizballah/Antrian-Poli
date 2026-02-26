let dataAudio = [];
let sedangProses = false;
function playAudiosSequentially(audioPaths) {
    // 1. Cek apakah sedang ada yang diputar atau antrean kosong
    if (sedangProses || dataAudio.length === 0) {
        console.log(sedangProses ? 'Sedang dalam proses pemutaran...' : 'Antrean audio kosong.');
        return;
    }

    // 2. Tandai status sedang memproses
    sedangProses = true;

    // 3. Ambil data pertama dari antrean
    const source = dataAudio.shift();

    try {
        const audio = new Audio(source);

        // Handler saat audio selesai diputar
        audio.onended = () => {
            console.log('Audio selesai diputar.');
            sedangProses = false;
            playAudiosSequentially(); // Lanjut ke antrean berikutnya
        };

        // Handler jika terjadi error saat memuat atau memutar audio
        audio.onerror = (e) => {
            console.error('Gagal memuat audio:', source, e);
            sedangProses = false;
            playAudiosSequentially(); // Lewati yang error, lanjut ke berikutnya
        };

        // Mulai pemutaran
        const playPromise = audio.play();

        // Browser modern mengembalikan promise pada audio.play()
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.error('Error saat mencoba memutar audio (Auto-play policy?):', error);
                sedangProses = false;
                playAudiosSequentially();
            });
        }

    } catch (error) {
        console.error('Terjadi kesalahan fatal pada objek Audio:', error);
        sedangProses = false;
        playAudiosSequentially();
    }
}
function audiotest() {
    try {
        const audio = new Audio('/api/voice/ON.wav');
        audio.play();
    } catch (error) {
        console.log(error);
    }

}

async function generateTTS(pesan) {
    try {
        // 1. Await the fetch call with options
        const response = await fetch('/generate-tts', {
            method: 'POST', // Specify the method
            headers: {
                'Content-Type': 'application/json' // Indicate the content type
            },
            body: JSON.stringify({
                "text": pesan,
                "model": "id_ID-news_tts-medium.onnx"
            }) 
        });

        // 2. Check if the request was successful (status in the 200-299 range)
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // 3. Await the response body to be parsed (e.g., as JSON)
        const result = await response.json();

        console.log('Success:', result);
        return result;

    } catch (error) {
        // 4. Handle any errors that occurred during the fetch operation
        console.error('Error:', error);
        throw error;
    }
}