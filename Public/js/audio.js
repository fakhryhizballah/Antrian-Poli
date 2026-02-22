let dataAudio = [];
let sedangProses = false;
function playAudiosSequentially(audioPaths) {
    // let index = 0;
    // console.log("Playing audios sequentially:", audioPaths);

    // function playNext() {
    //     if (index < audioPaths.length) {
    //         const audio = new Audio(audioPaths[index]);
    //         audio.play();
    //         audio.onended = () => {
    //             index++;
    //             playNext(); // Lanjutkan ke audio berikutnya setelah selesai
    //         };
    //     }
    // }

    // playNext(); // Mulai pemutaran
    if (sedangProses || dataAudio.length === 0) {
        return;
    }
    sedangProses = true;
    const data = dataAudio.shift();

    const audio = new Audio(data);
            audio.play();
            audio.onended = () => {
                sedangProses = false;
                playAudiosSequentially(); // Lanjutkan ke audio berikutnya setelah selesai
            };
}

async function generateTTS(pesan) {
    try {
        // 1. Await the fetch call with options
        const response = await fetch('http://10.99.0.55:3000/generate-tts', {
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