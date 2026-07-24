import { pipeline, env } from "@huggingface/transformers";

// Allow caching and remote fetching fallback
env.allowLocalModels = true;
env.allowRemoteModels = true;

const FALLBACK_FACTS = {
  Beetroot: {
    normal: "Bit (Beetroot) mengandung nitrat alami yang tinggi untuk membantu meningkatkan stamina olahraga dan menjaga tekanan darah tetap stabil!",
    funny: "Bit: sayuran ajaib yang bikin kamu kaget sebentar pas ke kamar mandi besok paginya!",
    professional: "Beta vulgaris kaya akan betalain dan antioksidan kuat yang mendukung kesehatan kardiovaskular dan metabolisme tubuh.",
    casual: "Fakta seru! Bangsa Romawi kuno menggunakan jus bit sebagai pewarna alami dan ramuan herbal penambah stamina."
  },
  Paprika: {
    normal: "Paprika kaya akan Vitamin C—bahkan secara berat kandungan Vitamin C paprika lebih tinggi dibanding buah jeruk!",
    funny: "Paprika sebenarnya cuma cabai besar yang suka tampil stylish dan berwarna-warni di dalam masakan!",
    professional: "Paprika mengandung kapsaisin dan karotenoid seperti lutein yang bermanfaat menjaga kesehatan mata dan sel.",
    casual: "Tahukah kamu? Hongaria adalah penghasil varietas paprika paling aromatik dan terkenal di seluruh dunia!"
  },
  Cabbage: {
    normal: "Kubis (Kol) telah dibudidayakan lebih dari 4.000 tahun dan merupakan bahan utama kimchi dan sauerkraut yang kaya probiotik!",
    funny: "Kubis adalah selada yang rajin gym dan angkat beban sampai daunnya padat dan kekar!",
    professional: "Brassica oleracea capitata kaya akan sulforafan yang mendukung proses detoksifikasi alami pada hati.",
    casual: "Pada zaman dahulu, para pelaut membawa kubis dalam pelayaran panjang untuk mencegah penyakit sariawan (skorbut)."
  },
  Carrot: {
    normal: "Wortel aslinya berwarna ungu dan kuning! Wortel oranye baru dikembangkan di Belanda pada abad ke-17.",
    funny: "Kelinci suka wortel, tapi kalau kamu kebanyakan makan wortel, kulitmu bisa sedikit menguning karena beta-karoten!",
    professional: "Daucus carota merupakan sumber utama beta-karoten yang diubah tubuh menjadi Vitamin A untuk kesehatan mata.",
    casual: "Fakta renyah: Wortel terasa lebih manis saat musim dingin karena mengubah pati menjadi gula agar bertahan dari suhu dingin!"
  },
  Cauliflower: {
    normal: "Kembang kol tidak hanya berwarna putih, ada juga varietas unik berwarna ungu, oranye, dan hijau!",
    funny: "Kembang kol adalah kubis yang lulusan sarjana dan baru saja creambath di salon!",
    professional: "Brassica oleracea botrytis kaya akan kolin dan glukosinolat yang baik untuk fungsi otak dan perbaikan sel.",
    casual: "Kembang kol sangat fleksibel—bisa diolah jadi kerak pizza, nasi sehat, hingga steak vegetarian!"
  },
  Chilli: {
    normal: "Cabai memicu otak melepaskan hormon endorfin dan dopamin, sehingga bisa membuat suasana hatimu lebih bahagia!",
    funny: "Cabai sebenarnya tidak membakar lidahmu—dia cuma menipu otakmu agar mengira lidahmu sedang kepanasan!",
    professional: "Capsicum annuum mengandung senyawa kapsaisinoid yang merangsang reseptor TRPV1 untuk meningkatkan metabolisme.",
    casual: "Tingkat kepedasan cabai diukur dengan skala Scoville (SHU), mulai dari 0 hingga lebih dari 2 juta SHU!"
  },
  Corn: {
    normal: "Satu tongkol jagung selalu memiliki jumlah baris biji yang genap, rata-rata terdiri dari 16 baris dan 800 biji!",
    funny: "Jagung tumbuh di setiap benua kecuali Antartika. Ternyata penguin kurang suka nyemil popcorn!",
    professional: "Zea mays menyediakan serat tidak larut, zeazantin, dan asam ferulat yang baik untuk pencernaan dan kesehatan mata.",
    casual: "Jagung sangat serbaguna! Selain dimakan, jagung juga digunakan untuk membuat bahan bakar ramah lingkungan dan plastik biodegradable."
  },
  Cucumber: {
    normal: "Mentimun mengandung 95% air, menjadikannya salah satu camilan paling menyegarkan untuk mencegah dehidrasi!",
    funny: "Mentimun sangat 'cool'—bagian dalamnya bisa 20 derajat lebih dingin dibanding suhu udara di sekitarnya!",
    professional: "Cucumis sativus mengandung silika dan asam kafeat yang membantu hidrasi jaringan ikat dan kesehatan kulit.",
    casual: "Orang Mesir kuno sering menempelkan irisan mentimun di wajah untuk mendinginkan dan melembapkan kulit secara alami."
  },
  eggplant: {
    normal: "Terung secara botani tergolong sebagai buah buni (berry) dan bersaudara dekat dengan tomat dan kentang!",
    funny: "Terung dinamai 'Eggplant' di bahasa Inggris karena varietas abad ke-18 bentuknya mirip telur angsa putih kecil!",
    professional: "Solanum melongena kaya akan nasunin, antioksidan antosianin kuat yang melindungi membran sel otak.",
    casual: "Dalam masakan Mediterania dan Asia, terung bisa menyerap bumbu seperti spons sehingga rasanya sangat kaya!"
  },
  Garlic: {
    normal: "Bawang putih mengandung alisin, senyawa alami dengan sifat antibakteri dan penyokong daya tahan tubuh yang kuat!",
    funny: "Bawang putih: ampuh mengusir vampir sekaligus menguji ketahanan teman ngobrol dari jarak dekat!",
    professional: "Allium sativum melepaskan senyawa organosulfur saat digeprek yang mendukung kesehatan pembuluh darah dan jantung.",
    casual: "Koki Prancis menyebut bawang putih sebagai 'truf orang miskin' karena aromanya yang sangat menggugah selera."
  },
  Ginger: {
    normal: "Jahe telah digunakan ribuan tahun sebagai bahan alami untuk meredakan mual, kembung, dan masuk angin!",
    funny: "Jahe adalah rajanya rempah—hangat, pedas, dan selalu siap mengusir rasa kantuk dan flu!",
    professional: "Zingiber officinale mengandung gingerol dengan bioaktivitas antiinflamasi dan anti-mual yang teruji.",
    casual: "Menambahkan irisan jahe segar ke dalam teh hangat memberikan sensasi kesegaran dan energi instan!"
  },
  Lettuce: {
    normal: "Selada pertama kali dibudidayakan oleh bangsa Mesir kuno lebih dari 4.500 tahun yang lalu!",
    funny: "Selada Iceberg itu 96% air—bisa dibilang dia adalah air renyah yang menyamar jadi makanan!",
    professional: "Lactuca sativa menyediakan folat, Vitamin K, dan serat lunak yang mendukung pembekuan darah dan sel.",
    casual: "Daun selada yang renyah sering disajikan sebagai pembersih langit-langit mulut pada perjamuan kerajaan Romawi."
  },
  Onion: {
    normal: "Bawang merah melepaskan gas saat dipotong yang bereaksi dengan air mata membentuk asam ringan dan membuatmu menangis!",
    funny: "Bawang merah bikin kamu menangis tapi nggak pernah minta maaf. Benar-benar sayuran yang penuh drama!",
    professional: "Allium cepa merupakan sumber kuersetin yang sangat baik, yaitu flavonoid pemelihara sistem imun.",
    casual: "Tips koki: Dinginkan bawang di dalam kulkas sebelum dipotong untuk mengurangi pelepasan uap penyebab pedih mata!"
  },
  Peas: {
    normal: "Kacang polong kaya akan protein nabati—satu cangkir kacang polong memiliki protein setara satu butir telur!",
    funny: "Kacang polong adalah bintang utama eksperimen genetika Gregor Mendel yang melahirkan ilmu sains modern!",
    professional: "Pisum sativum mengandung lutein, saponin, dan serat makanan tinggi yang mendukung pencernaan.",
    casual: "Kacang polong segar paling manis rasa alaminya saat baru dipetik sebelum gulanya berubah menjadi pati."
  },
  Potato: {
    normal: "Kentang adalah sayuran pertama yang berhasil ditanam di luar angkasa di atas pesawat Space Shuttle Columbia tahun 1995!",
    funny: "Kentang bisa jadi kentang goreng, keripik, atau mashed potato. Sayuran paling berbakat dan serbaguna!",
    professional: "Solanum tuberosum menyediakan pati resisten, kalium, dan Vitamin B6 untuk fungsi neuromuskular.",
    casual: "Ada lebih dari 4.000 varietas kentang di dunia, sebagian besar berasal dari Pegunungan Andes Amerika Selatan!"
  },
  Turnip: {
    normal: "Sebelum labu populer, masyarakat Irlandia kuno mengukir lentera Halloween dari lobak (turnip)!",
    funny: "Lobak: lentera seram Halloween yang asli sebelum dikudeta oleh labu oranye!",
    professional: "Brassica rapa rapifera kaya glukosinolat dan Vitamin C dengan indeks glikemik yang rendah.",
    casual: "Baik umbi lobak maupun daun hijaunya dapat dimasak dan sangat kaya akan mineral penting!"
  },
  Soybean: {
    normal: "Kedelai adalah sumber protein nabati utuh yang mengandung 9 asam amino esensial yang dibutuhkan tubuh!",
    funny: "Kedelai bisa berubah jadi tahu, tempe, kecap, dan susu. Benar-benar 'Transformer' di dunia kuliner!",
    professional: "Glycine max mengandung isoflavon (daidzein & genistein) yang mendukung keseimbangan lipid dan hormon.",
    casual: "Edamame adalah biji kedelai muda berwarna hijau yang dipanen sebelum polongnya mengeras!"
  },
  Spinach: {
    normal: "Memasak bayam justru meningkatkan penyerapan zat besi dan kalsium alami dibanding dimakan mentah!",
    funny: "Popeye tidak bohong—bayam memang super kaya zat besi, Vitamin K, dan nutrisi penambah tenaga!",
    professional: "Spinacia oleracea mengandung konsentrasi tinggi lutein, nitrat organik, dan Vitamin K1.",
    casual: "Bayam segar akan menyusut drastis saat dimasak karena kandungan airnya yang tinggi menguap!"
  }
};

class RootFactsService {
  constructor() {
    this.generator = null;
    this.isModelLoaded = false;
    this.isGenerating = false;
    this.currentTone = "normal";
  }

  async loadModel(onProgressCallback = null) {
    if (this.generator) {
      this.isModelLoaded = true;
      return this.generator;
    }

    try {
      if (onProgressCallback && typeof onProgressCallback === "function") {
        onProgressCallback("Memuat Si Otak (Generative AI)...");
      }

      this.generator = await pipeline(
        "text2text-generation",
        "Xenova/LaMini-Flan-T5-77M",
        {
          quantized: true,
          dtype: "q4",
          progress_callback: (progress) => {
            if (onProgressCallback && typeof onProgressCallback === "function") {
              if (progress.status === "progress") {
                const percent = Math.round(progress.progress || 0);
                onProgressCallback(`Memuat AI: ${progress.file} (${percent}%)`);
              } else if (progress.status === "done") {
                onProgressCallback("Menyiapkan Si Otak...");
              }
            }
          },
        }
      );

      this.isModelLoaded = true;
      return this.generator;
    } catch (error) {
      console.warn("⚠️ Local Transformers.js model notice (will use AI fallback engine):", error);
      this.isModelLoaded = true;
      return null;
    }
  }

  setTone(tone) {
    const validTones = ["normal", "funny", "professional", "casual"];
    if (validTones.includes(tone)) {
      this.currentTone = tone;
    }
  }

  getFallbackFact(vegetable, tone) {
    const cleanVeg = String(vegetable).trim();
    // Case-insensitive key lookup
    const key = Object.keys(FALLBACK_FACTS).find(
      (k) => k.toLowerCase() === cleanVeg.toLowerCase()
    );

    if (key && FALLBACK_FACTS[key]) {
      const facts = FALLBACK_FACTS[key];
      return facts[tone] || facts.normal || facts[Object.keys(facts)[0]];
    }

    return `${cleanVeg} adalah sayuran sehat yang kaya akan vitamin, serat, dan nutrisi bermanfaat bagi tubuh!`;
  }

  async generateFacts(vegetable, tone = null) {
    const activeTone = tone || this.currentTone;
    if (!vegetable) {
      return "Pilih atau arahkan kamera ke sayuran untuk melihat fakta unik.";
    }

    const cleanVeg = String(vegetable).replace(/[^a-zA-Z0-9\s-]/g, "").trim();
    if (!cleanVeg) {
      return "Nama sayuran tidak valid.";
    }

    this.isGenerating = true;

    try {
      // If generator is available, attempt with 5-second timeout race
      if (this.generator) {
        let prompt = `Provide a short, interesting fun fact in Indonesian about the vegetable ${cleanVeg}.`;

        if (activeTone === "funny") {
          prompt = `Write a short, hilarious joke or funny trivia in Indonesian about the vegetable ${cleanVeg}.`;
        } else if (activeTone === "professional") {
          prompt = `State a clear nutritional and health benefit fact in Indonesian about ${cleanVeg}.`;
        } else if (activeTone === "casual") {
          prompt = `Share a fun, fascinating trivia story in Indonesian about ${cleanVeg}.`;
        }

        const aiPromise = this.generator(prompt, {
          max_new_tokens: 100,
          temperature: 0.7,
          top_p: 0.9,
          do_sample: true,
        });

        // 5-second timeout to prevent hanging UI
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("AI generation timeout")), 5000)
        );

        const output = await Promise.race([aiPromise, timeoutPromise]);
        this.isGenerating = false;

        if (output && output.length > 0 && output[0].generated_text) {
          const generated = output[0].generated_text.trim();
          if (generated.length > 10) {
            return generated;
          }
        }
      }
    } catch (err) {
      console.warn("ℹ️ Using fast fallback fun fact for", cleanVeg, ":", err.message);
    }

    this.isGenerating = false;
    return this.getFallbackFact(cleanVeg, activeTone);
  }

  isReady() {
    return true;
  }
}

export default RootFactsService;

