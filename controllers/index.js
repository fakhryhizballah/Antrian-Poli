const axios = require('axios');
const { tr } = require('date-fns/locale');
module.exports = (chatNamespace) => {
    chatNamespace.on("connection", (socket) => {
        console.log("User:", socket.id);
        getAntrean("ANA").then((data) => {
            chatNamespace.emit("ANA", data);
        }
        );
        getAntrean("U0011").then((data) => {
            chatNamespace.emit("U0011", data);
        }
        );
        getAntrean("U0006").then((data) => {
            chatNamespace.emit("U0006", data);
        }
        );
        getAntrean("INT").then((data) => {
            chatNamespace.emit("INT", data);
        }
        );
        getAntrean("U0002").then((data) => {
            chatNamespace.emit("U0010", data);
        }
        );
        getAntrean("U0044").then((data) => {
            chatNamespace.emit("U0044", data);
        }
        );
    });
    setInterval(() => {
        getAntrean("ANA").then((data) => {
            chatNamespace.emit("ANA", data);
        }
        );
        getAntrean("U0011").then((data) => {
            chatNamespace.emit("U0011", data);
        }
        );
        getAntrean("U0006").then((data) => {
            chatNamespace.emit("U0006", data);
        }
        );
        getAntrean("INT").then((data) => {
            chatNamespace.emit("INT", data);
        }
        );
        getAntrean("U0002").then((data) => {
            chatNamespace.emit("U0002", data);
        }
        );
        getAntrean("U0044").then((data) => {
            chatNamespace.emit("U0044", data);
        }
        );
        let dateNow = new Date();
        console.log(`${dateNow.toLocaleString('id', { weekday: 'long' })}, ${dateNow.getDate()} ${dateNow.toLocaleString('en', { month: 'long' })} ${dateNow.getFullYear()}`);
        chatNamespace.emit("tanggal", `${dateNow.toLocaleString('id', { weekday: 'long' })}, ${dateNow.getDate()} ${dateNow.toLocaleString('en', { month: 'long' })} ${dateNow.getFullYear()}`);
    }, 10000);
};
async function getAntrean(kd_poli) {
    let dateNow = new Date();
    let date = dateNow.getDate();
    let month = dateNow.getMonth() + 1;
    let year = dateNow.getFullYear();
    let tgl = `${year}-${month}-${date}`;
    // console.log(tgl);

    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: `${process.env.HOST}/api/ralan/antiran/poli?tgl_antrean=${tgl}&kd_poli=${kd_poli}`,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': process.env.TOKEN
        }
    };

    try {
        const response = await axios.request(config)
    let antrians = [];
    let sudah = 0;
    let belum = 0;
    let batal = 0;
    let total = response.data.data.length;
    for (let i of response.data.data) {
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

    let resut = {
        nm_poli: response.data.data[0].poliklinik.nm_poli,
        status_antrian: {
            sudah: sudah,
            belum: total - sudah - batal,
            batal: batal,
            total: total
        },
        data: antrians,
    }
    return resut;
    } catch (error) {
        console.log(error);
    }
        

}
