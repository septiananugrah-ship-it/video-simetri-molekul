// Naskah narasi "Bahasa Simetri" — Kimia Kuantum pertemuan 12–13: Simetri Molekul & Grup Titik.
// Setiap adegan berisi baris narasi. Durasi baris dihitung otomatis dari jumlah
// suku kata (lihat timeline.ts) atau dari rekaman suara bila sudah ada,
// jadi cukup ubah teks di sini: visual, subtitle, dan musik ikut menyesuaikan.
//
// Aturan menulis teks narasi (dibaca mesin TTS):
//  - angka & simbol ditulis sebagai kata ("dua puluh meter per detik"),
//  - rumus ditulis sebagai kalimat; rumus rapi tampil di layar (komponen Formula).
// Angka & term sudah dicek di naskah/AUDIT.md (Atkins, Levine, CRC, NIST CCCBDB).
//
// hl     : kata/frasa yang disorot pada subtitle
// pause  : jeda (detik) SETELAH baris dibacakan
// lead   : jeda (detik) sebelum baris pertama adegan
// tail   : jeda (detik) setelah baris terakhir adegan
// fixed  : durasi tetap (detik) untuk adegan tanpa narasi

export type Line = {
  text: string;
  /** Teks khusus TTS (opsional). Bila kosong, dibuat otomatis oleh src/tts.ts. */
  tts?: string;
  hl?: string[];
  pause?: number;
};

export type SceneScript = {
  id: string;
  chapter: string; // nomor bab di heading, "" untuk tanpa heading
  part?: 1 | 2 | 3; // 1 prinsip & teori dasar, 2 implementasi dalam kimia, 3 penerapan
  title: string;
  lines: Line[];
  lead?: number;
  tail?: number;
  fixed?: number;
  mood: 'mystery' | 'title' | 'wonder' | 'build' | 'quantum' | 'tension' | 'bright' | 'resolve' | 'outro';
};

export const SCRIPT: SceneScript[] = [
  {
    "id": "hook",
    "chapter": "",
    "title": "Mint atau jintan",
    "mood": "mystery",
    "lead": 1.6,
    "tail": 1.2,
    "lines": [
      {
        "text": "Dua molekul ini tersusun dari atom yang sama, dengan ikatan yang sama persis.",
        "hl": [
          "sama persis"
        ],
        "pause": 0.7
      },
      {
        "text": "Yang satu berbau daun mint. Yang lain berbau jintan.",
        "hl": [
          "daun mint",
          "jintan"
        ],
        "pause": 0.9
      },
      {
        "text": "Bedanya hanya satu: keduanya adalah bayangan cermin satu sama lain, seperti tangan kiri dan tangan kanan.",
        "hl": [
          "bayangan cermin"
        ],
        "pause": 0.9
      },
      {
        "text": "Hidung kita bisa membedakannya. Molekul pun bisa. Simetri ternyata bukan sekadar soal keindahan.",
        "hl": [
          "Simetri"
        ],
        "pause": 0.7
      },
      {
        "text": "Hari ini kita belajar bahasa simetri: cara menggambarkan bentuk molekul dengan tepat, dan meramal sifatnya dari bentuk itu.",
        "hl": [
          "bahasa simetri"
        ],
        "pause": 1.0
      }
    ]
  },
  {
    "id": "title",
    "chapter": "",
    "title": "Bahasa Simetri",
    "mood": "title",
    "fixed": 7,
    "lines": []
  },
  {
    "id": "roadmap",
    "chapter": "",
    "title": "Peta video",
    "mood": "wonder",
    "lead": 0.8,
    "tail": 1.4,
    "lines": [
      {
        "text": "Perjalanan kita punya tiga bagian.",
        "pause": 0.6
      },
      {
        "text": "Pertama, prinsip dasar: unsur dan operasi simetri, yaitu sumbu putar, bidang cermin, pusat inversi, dan putaran tak wajar.",
        "hl": [
          "prinsip dasar"
        ],
        "pause": 0.7
      },
      {
        "text": "Kedua, implementasi dalam kimia: grup titik, cara menentukannya, dan tabel karakter.",
        "hl": [
          "implementasi dalam kimia"
        ],
        "pause": 0.7
      },
      {
        "text": "Ketiga, penerapan: kepolaran, kiralitas, getaran yang aktif inframerah, dan gas rumah kaca.",
        "hl": [
          "penerapan"
        ],
        "pause": 0.9
      }
    ]
  },
  {
    "id": "operation",
    "chapter": "01",
    "title": "Operasi dan unsur simetri",
    "mood": "build",
    "part": 1,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Operasi simetri adalah gerakan yang membuat molekul tampak persis sama seperti sebelumnya.",
        "hl": [
          "Operasi simetri"
        ],
        "pause": 0.7
      },
      {
        "text": "Putar molekul air seratus delapan puluh derajat mengelilingi sumbu yang tepat, dan kedua hidrogen bertukar tempat. Hasilnya tak bisa dibedakan dari awal.",
        "hl": [
          "seratus delapan puluh derajat"
        ],
        "pause": 0.7
      },
      {
        "text": "Garis atau bidang yang dipakai untuk melakukan operasi itu disebut unsur simetri.",
        "hl": [
          "unsur simetri"
        ],
        "pause": 0.7
      },
      {
        "text": "Selalu ada satu operasi yang paling sepele: tidak melakukan apa-apa. Namanya identitas, E. Setiap molekul memilikinya.",
        "hl": [
          "identitas"
        ],
        "pause": 0.7,
        "tts": "Selalu ada satu operasi yang paling sepele: tidak melakukan apa-apa. Namanya identitas, e. Setiap molekul memilikinya."
      },
      {
        "text": "Hanya ada lima jenis unsur simetri untuk molekul. Kita bahas satu per satu.",
        "hl": [
          "lima jenis"
        ],
        "pause": 0.9
      }
    ]
  },
  {
    "id": "rotation",
    "chapter": "02",
    "title": "Sumbu putar Cₙ",
    "mood": "quantum",
    "part": 1,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Sumbu putar C n: putaran sebesar tiga ratus enam puluh derajat dibagi n yang mengembalikan bentuk molekul.",
        "hl": [
          "Sumbu putar"
        ],
        "pause": 0.7,
        "tts": "Sumbu putar ce en: putaran sebesar tiga ratus enam puluh derajat dibagi en yang mengembalikan bentuk molekul."
      },
      {
        "text": "Air punya sumbu C dua: putaran seratus delapan puluh derajat.",
        "hl": [
          "C dua"
        ],
        "pause": 0.7,
        "tts": "Air punya sumbu ce dua: putaran seratus delapan puluh derajat."
      },
      {
        "text": "Amonia punya sumbu C tiga: putaran seratus dua puluh derajat, tiga kali kembali ke awal.",
        "hl": [
          "C tiga"
        ],
        "pause": 0.7,
        "tts": "Amonia punya sumbu ce tiga: putaran seratus dua puluh derajat, tiga kali kembali ke awal."
      },
      {
        "text": "Benzena punya sumbu C enam tegak lurus cincin, dan enam sumbu C dua di bidang cincin.",
        "hl": [
          "C enam"
        ],
        "pause": 0.7,
        "tts": "Benzena punya sumbu ce enam tegak lurus cincin, dan enam sumbu ce dua di bidang cincin."
      },
      {
        "text": "Sumbu dengan n terbesar disebut sumbu utama, dan biasanya ditegakkan sebagai sumbu z.",
        "hl": [
          "sumbu utama"
        ],
        "pause": 0.7,
        "tts": "Sumbu dengan en terbesar disebut sumbu utama, dan biasanya ditegakkan sebagai sumbu zet."
      }
    ]
  },
  {
    "id": "mirror",
    "chapter": "03",
    "title": "Bidang cermin σ",
    "mood": "build",
    "part": 1,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Bidang cermin, sigma: pantulkan setiap atom melalui bidang ini, dan molekul tetap sama.",
        "hl": [
          "Bidang cermin"
        ],
        "pause": 0.7
      },
      {
        "text": "Bila bidang itu memuat sumbu utama, namanya sigma v, vertikal. Air punya dua: bidang molekul itu sendiri, dan bidang yang memotongnya tegak lurus.",
        "hl": [
          "sigma v"
        ],
        "pause": 0.7,
        "tts": "Bila bidang itu memuat sumbu utama, namanya sigma fe, vertikal. Air punya dua: bidang molekul itu sendiri, dan bidang yang memotongnya tegak lurus."
      },
      {
        "text": "Bila bidang itu tegak lurus sumbu utama, namanya sigma h, horizontal. Boron trifluorida punya satu, yaitu bidang molekulnya.",
        "hl": [
          "sigma h"
        ],
        "pause": 0.7,
        "tts": "Bila bidang itu tegak lurus sumbu utama, namanya sigma ha, horizontal. Boron trifluorida punya satu, yaitu bidang molekulnya."
      },
      {
        "text": "Ada juga sigma d, diagonal: bidang vertikal yang membelah sudut di antara dua sumbu C dua.",
        "hl": [
          "sigma d"
        ],
        "pause": 0.7,
        "tts": "Ada juga sigma de, diagonal: bidang vertikal yang membelah sudut di antara dua sumbu ce dua."
      }
    ]
  },
  {
    "id": "inversion",
    "chapter": "04",
    "title": "Pusat inversi & putaran tak wajar",
    "mood": "tension",
    "part": 1,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Pusat inversi, i: tarik setiap atom lurus melalui satu titik pusat, ke jarak yang sama di sisi seberang.",
        "hl": [
          "Pusat inversi"
        ],
        "pause": 0.7,
        "tts": "Pusat inversi, i: tarik setiap atom lurus melalui satu titik pusat, ke jarak yang sama di sisi seberang."
      },
      {
        "text": "Benzena dan karbon dioksida punya pusat inversi. Air dan amonia tidak.",
        "hl": [
          "Benzena dan karbon dioksida"
        ],
        "pause": 0.7
      },
      {
        "text": "Unsur terakhir paling licik: putaran tak wajar, S n. Putar dengan sudut tiga ratus enam puluh dibagi n, lalu pantulkan pada bidang yang tegak lurus sumbu itu.",
        "hl": [
          "putaran tak wajar"
        ],
        "pause": 0.7,
        "tts": "Unsur terakhir paling licik: putaran tak wajar, es en. Putar dengan sudut tiga ratus enam puluh dibagi en, lalu pantulkan pada bidang yang tegak lurus sumbu itu."
      },
      {
        "text": "Metana tidak punya sumbu C empat, tetapi punya S empat: putar sembilan puluh derajat, lalu cerminkan, dan metana kembali sama.",
        "hl": [
          "S empat"
        ],
        "pause": 0.7,
        "tts": "Metana tidak punya sumbu ce empat, tetapi punya es empat: putar sembilan puluh derajat, lalu cerminkan, dan metana kembali sama."
      },
      {
        "text": "Bidang cermin dan pusat inversi sebenarnya kasus khusus putaran tak wajar: S satu dan S dua.",
        "hl": [
          "kasus khusus"
        ],
        "pause": 0.7,
        "tts": "Bidang cermin dan pusat inversi sebenarnya kasus khusus putaran tak wajar: es satu dan es dua."
      }
    ]
  },
  {
    "id": "chiral",
    "chapter": "05",
    "title": "Kiral: tangan kiri dan kanan",
    "mood": "wonder",
    "part": 1,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Sekarang kita bisa mendefinisikan kiralitas dengan tepat.",
        "hl": [
          "kiralitas"
        ],
        "pause": 0.7
      },
      {
        "text": "Molekul kiral jika ia tidak punya putaran tak wajar sama sekali: tanpa bidang cermin, tanpa pusat inversi, tanpa S n.",
        "hl": [
          "tidak punya putaran tak wajar"
        ],
        "pause": 0.7,
        "tts": "Molekul kiral jika ia tidak punya putaran tak wajar sama sekali: tanpa bidang cermin, tanpa pusat inversi, tanpa es en."
      },
      {
        "text": "Molekul seperti itu tidak bisa ditumpuk tepat di atas bayangan cerminnya, sama seperti tangan kiri tidak cocok dengan sarung tangan kanan.",
        "hl": [
          "sarung tangan kanan"
        ],
        "pause": 0.7
      },
      {
        "text": "Karvon adalah contohnya. Bentuk R berbau mint, bentuk S berbau jintan, karena reseptor penciuman kita sendiri juga kiral.",
        "hl": [
          "Karvon"
        ],
        "pause": 0.7,
        "tts": "Karvon adalah contohnya. Bentuk er berbau mint, bentuk es berbau jintan, karena reseptor penciuman kita sendiri juga kiral."
      },
      {
        "text": "Itulah sebabnya obat sering dibuat hanya dalam satu bentuk cermin: tubuh kita membedakan kiri dan kanan.",
        "hl": [
          "satu bentuk cermin"
        ],
        "pause": 0.9
      }
    ]
  },
  {
    "id": "group",
    "chapter": "06",
    "title": "Grup titik",
    "mood": "quantum",
    "part": 2,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Kumpulan semua operasi simetri sebuah molekul membentuk struktur matematika yang disebut grup.",
        "hl": [
          "grup"
        ],
        "pause": 0.7
      },
      {
        "text": "Karena semua unsurnya melewati satu titik yang tetap, kita menyebutnya grup titik.",
        "hl": [
          "grup titik"
        ],
        "pause": 0.7
      },
      {
        "text": "Air punya empat operasi: E, C dua, dan dua sigma v. Grup titiknya diberi nama C dua v.",
        "hl": [
          "C dua v"
        ],
        "pause": 0.7,
        "tts": "Air punya empat operasi: e, ce dua, dan dua sigma fe. Grup titiknya diberi nama ce dua fe."
      },
      {
        "text": "Amonia termasuk C tiga v. Boron trifluorida, D tiga h. Metana, T d, grup tetrahedral.",
        "hl": [
          "T d"
        ],
        "pause": 0.7,
        "tts": "Amonia termasuk ce tiga fe. Boron trifluorida, de tiga ha. Metana, te de, grup tetrahedral."
      },
      {
        "text": "Molekul yang berbeda tapi grup titiknya sama akan berbagi banyak sifat: kepolaran, jumlah getaran aktif, bahkan pola orbitalnya.",
        "hl": [
          "berbagi banyak sifat"
        ],
        "pause": 0.9
      }
    ]
  },
  {
    "id": "flowchart",
    "chapter": "07",
    "title": "Menentukan grup titik",
    "mood": "build",
    "part": 2,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Untuk menentukan grup titik, ikuti diagram alir ini.",
        "hl": [
          "diagram alir"
        ],
        "pause": 0.7
      },
      {
        "text": "Apakah molekulnya linear? Jika ya dan punya pusat inversi, D tak hingga h, seperti karbon dioksida. Tanpa pusat inversi, C tak hingga v, seperti H Cl.",
        "hl": [
          "linear"
        ],
        "pause": 0.7,
        "tts": "Apakah molekulnya linear? Jika ya dan punya pusat inversi, de tak hingga ha, seperti karbon dioksida. Tanpa pusat inversi, ce tak hingga fe, seperti ha ce el."
      },
      {
        "text": "Apakah simetrinya sangat tinggi? Tetrahedron T d, oktahedron O h seperti belerang heksafluorida, ikosahedron I h seperti fulerena C enam puluh.",
        "hl": [
          "sangat tinggi"
        ],
        "pause": 0.7,
        "tts": "Apakah simetrinya sangat tinggi? Tetrahedron te de, oktahedron o ha seperti belerang heksafluorida, ikosahedron i ha seperti fulerena ce enam puluh."
      },
      {
        "text": "Jika tidak, cari sumbu utama C n. Ada n sumbu C dua yang tegak lurus padanya? Jika ya, grupnya keluarga D. Jika tidak, keluarga C.",
        "hl": [
          "keluarga D"
        ],
        "pause": 0.7,
        "tts": "Jika tidak, cari sumbu utama ce en. Ada en sumbu ce dua yang tegak lurus padanya? Jika ya, grupnya keluarga de. Jika tidak, keluarga ce."
      },
      {
        "text": "Terakhir, periksa bidang cermin: sigma h memberi akhiran h, sigma v atau sigma d memberi akhiran v atau d.",
        "hl": [
          "akhiran h"
        ],
        "pause": 0.7,
        "tts": "Terakhir, periksa bidang cermin: sigma ha memberi akhiran ha, sigma fe atau sigma de memberi akhiran fe atau de."
      },
      {
        "text": "Coba benzena: tidak linear, tidak kubik, sumbu utama C enam, enam C dua tegak lurus, ada sigma h. Jadi D enam h.",
        "hl": [
          "D enam h"
        ],
        "pause": 0.9,
        "tts": "Coba benzena: tidak linear, tidak kubik, sumbu utama ce enam, enam ce dua tegak lurus, ada sigma ha. Jadi de enam ha."
      }
    ]
  },
  {
    "id": "gallery",
    "chapter": "08",
    "title": "Galeri grup titik",
    "mood": "bright",
    "part": 2,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Mari lihat galeri molekul yang sudah kita kenal.",
        "hl": [
          "galeri"
        ],
        "pause": 0.7
      },
      {
        "text": "Air dan formaldehida: C dua v. Amonia: C tiga v. Etilena dan naftalena: D dua h.",
        "hl": [
          "D dua h"
        ],
        "pause": 0.7,
        "tts": "Air dan formaldehida: ce dua fe. Amonia: ce tiga fe. Etilena dan naftalena: de dua ha."
      },
      {
        "text": "Benzena: D enam h. Metana: T d. Belerang heksafluorida: O h. Fulerena: I h.",
        "hl": [
          "I h"
        ],
        "pause": 0.7,
        "tts": "Benzena: de enam ha. Metana: te de. Belerang heksafluorida: o ha. Fulerena: i ha."
      },
      {
        "text": "Dan molekul tanpa simetri apa pun selain identitas, seperti CHFClBr, termasuk grup C satu.",
        "hl": [
          "C satu"
        ],
        "pause": 0.7,
        "tts": "Dan molekul tanpa simetri apa pun selain identitas, seperti ce ha ef ce el be er, termasuk grup ce satu."
      }
    ]
  },
  {
    "id": "table",
    "chapter": "09",
    "title": "Tabel karakter",
    "mood": "quantum",
    "part": 2,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Setiap grup titik punya tabel karakter: kartu identitas yang mencatat bagaimana sesuatu berperilaku terhadap tiap operasi.",
        "hl": [
          "tabel karakter"
        ],
        "pause": 0.7
      },
      {
        "text": "Untuk C dua v, ada empat baris: A satu, A dua, B satu, dan B dua.",
        "hl": [
          "empat baris"
        ],
        "pause": 0.7,
        "tts": "Untuk ce dua fe, ada empat baris: a satu, a dua, be satu, dan be dua."
      },
      {
        "text": "Angka satu berarti tidak berubah oleh operasi itu. Minus satu berarti berganti tanda.",
        "hl": [
          "berganti tanda"
        ],
        "pause": 0.7
      },
      {
        "text": "Orbital p z oksigen pada air tidak berubah oleh semua operasi: ia termasuk A satu. Orbital p x berganti tanda oleh C dua: ia termasuk B satu.",
        "hl": [
          "A satu"
        ],
        "pause": 0.7,
        "tts": "Orbital pe zet oksigen pada air tidak berubah oleh semua operasi: ia termasuk a satu. Orbital pe eks berganti tanda oleh ce dua: ia termasuk be satu."
      },
      {
        "text": "Itulah asal label dua a satu, satu b dua, tiga a satu, dan satu b satu pada orbital molekul air di video sebelumnya.",
        "hl": [
          "video sebelumnya"
        ],
        "pause": 0.9,
        "tts": "Itulah asal label dua a satu, satu be dua, tiga a satu, dan satu be satu pada orbital molekul air di video sebelumnya."
      }
    ]
  },
  {
    "id": "overlap",
    "chapter": "10",
    "title": "Simetri dan tumpang tindih",
    "mood": "tension",
    "part": 2,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Tabel karakter juga menjawab pertanyaan lama: kapan dua orbital boleh bergabung?",
        "hl": [
          "kapan dua orbital boleh bergabung"
        ],
        "pause": 0.7
      },
      {
        "text": "Dua orbital hanya bertumpang tindih bila keduanya termasuk baris simetri yang sama.",
        "hl": [
          "baris simetri yang sama"
        ],
        "pause": 0.7
      },
      {
        "text": "Jika berbeda, bagian positif dan negatif tumpang tindihnya selalu saling menghapus: hasilnya tepat nol.",
        "hl": [
          "tepat nol"
        ],
        "pause": 0.7
      },
      {
        "text": "Aturan yang sama menentukan transisi mana yang diizinkan, seperti paritas pada atom. Paritas hanyalah simetri inversi.",
        "hl": [
          "Paritas hanyalah simetri inversi"
        ],
        "pause": 0.9
      }
    ]
  },
  {
    "id": "polar",
    "chapter": "11",
    "title": "Kepolaran dari simetri",
    "mood": "bright",
    "part": 3,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Molekul polar jika punya momen dipol permanen. Simetri bisa meramalnya tanpa hitungan.",
        "hl": [
          "tanpa hitungan"
        ],
        "pause": 0.7
      },
      {
        "text": "Momen dipol harus tetap sama oleh setiap operasi simetri. Jadi ia harus terletak pada setiap sumbu dan setiap bidang cermin sekaligus.",
        "hl": [
          "setiap sumbu"
        ],
        "pause": 0.7
      },
      {
        "text": "Akibatnya, hanya molekul dengan grup C n, C n v, atau C s yang bisa polar.",
        "hl": [
          "C n v"
        ],
        "pause": 0.7,
        "tts": "Akibatnya, hanya molekul dengan grup ce en, ce en fe, atau ce es yang bisa polar."
      },
      {
        "text": "Karbon dioksida, boron trifluorida, dan metana punya ikatan polar, tetapi momen ikatannya saling meniadakan. Molekulnya nonpolar.",
        "hl": [
          "nonpolar"
        ],
        "pause": 0.7
      },
      {
        "text": "Air, C dua v, polar. Itulah sebabnya air melarutkan garam dan naik di pipa kapiler.",
        "hl": [
          "polar"
        ],
        "pause": 0.9
      }
    ]
  },
  {
    "id": "ir",
    "chapter": "12",
    "title": "Getaran yang aktif inframerah",
    "mood": "wonder",
    "part": 3,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Molekul tak linear dengan N atom punya tiga N dikurangi enam getaran. Molekul linear, tiga N dikurangi lima.",
        "hl": [
          "tiga N dikurangi enam"
        ],
        "pause": 0.7,
        "tts": "Molekul tak linear dengan en atom punya tiga en dikurangi enam getaran. Molekul linear, tiga en dikurangi lima."
      },
      {
        "text": "Air punya tiga getaran: regangan simetris sekitar tiga ribu enam ratus lima puluh tujuh, tekukan seribu lima ratus sembilan puluh lima, dan regangan asimetris tiga ribu tujuh ratus lima puluh enam per sentimeter.",
        "hl": [
          "tiga getaran"
        ],
        "pause": 0.7
      },
      {
        "text": "Getaran menyerap inframerah hanya bila mengubah momen dipol. Dalam bahasa simetri: bila getarannya termasuk baris yang sama dengan x, y, atau z.",
        "hl": [
          "mengubah momen dipol"
        ],
        "pause": 0.7,
        "tts": "Getaran menyerap inframerah hanya bila mengubah momen dipol. Dalam bahasa simetri: bila getarannya termasuk baris yang sama dengan eks, ye, atau zet."
      },
      {
        "text": "Ketiga getaran air aktif inframerah. Tetapi pada molekul berpusat inversi, getaran yang aktif inframerah tidak aktif Raman, dan sebaliknya. Ini aturan saling meniadakan.",
        "hl": [
          "aturan saling meniadakan"
        ],
        "pause": 0.7
      }
    ]
  },
  {
    "id": "greenhouse",
    "chapter": "13",
    "title": "Mengapa CO₂ gas rumah kaca",
    "mood": "tension",
    "part": 3,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Karbon dioksida punya empat getaran: regangan simetris, regangan asimetris, dan dua tekukan.",
        "hl": [
          "empat getaran"
        ],
        "pause": 0.7
      },
      {
        "text": "Regangan simetris tidak mengubah dipol: tidak menyerap inframerah. Ia hanya terlihat pada spektrum Raman, sekitar seribu tiga ratus delapan puluh delapan per sentimeter.",
        "hl": [
          "tidak menyerap inframerah"
        ],
        "pause": 0.7
      },
      {
        "text": "Regangan asimetris, dua ribu tiga ratus empat puluh sembilan, dan tekukan, enam ratus enam puluh tujuh per sentimeter, mengubah dipol dan menyerap inframerah.",
        "hl": [
          "enam ratus enam puluh tujuh"
        ],
        "pause": 0.7
      },
      {
        "text": "Tekukan enam ratus enam puluh tujuh tepat berada di daerah tempat Bumi memancarkan panasnya ke angkasa.",
        "hl": [
          "memancarkan panasnya"
        ],
        "pause": 0.7
      },
      {
        "text": "Nitrogen dan oksigen, D tak hingga h, tidak punya getaran yang aktif inframerah. Karena itu hanya sebagian kecil udara, seperti karbon dioksida dan uap air, yang menahan panas Bumi.",
        "hl": [
          "menahan panas Bumi"
        ],
        "pause": 0.9,
        "tts": "Nitrogen dan oksigen, de tak hingga ha, tidak punya getaran yang aktif inframerah. Karena itu hanya sebagian kecil udara, seperti karbon dioksida dan uap air, yang menahan panas Bumi."
      }
    ]
  },
  {
    "id": "recap",
    "chapter": "14",
    "title": "Merangkai semuanya",
    "mood": "resolve",
    "lead": 1.0,
    "tail": 2.4,
    "lines": [
      {
        "text": "Mari rangkum.",
        "pause": 0.6
      },
      {
        "text": "Ada lima jenis unsur simetri: identitas, sumbu putar, bidang cermin, pusat inversi, dan putaran tak wajar.",
        "hl": [
          "lima jenis unsur simetri"
        ],
        "pause": 0.7
      },
      {
        "text": "Molekul tanpa putaran tak wajar bersifat kiral, seperti karvon mint dan karvon jintan.",
        "hl": [
          "kiral"
        ],
        "pause": 0.7
      },
      {
        "text": "Semua operasi sebuah molekul membentuk grup titik, yang ditentukan dengan diagram alir.",
        "hl": [
          "grup titik"
        ],
        "pause": 0.7
      },
      {
        "text": "Tabel karakter memberi label simetri pada orbital dan getaran, dan menentukan tumpang tindih serta transisi.",
        "hl": [
          "Tabel karakter"
        ],
        "pause": 0.7
      },
      {
        "text": "Dari simetri saja kita bisa meramal kepolaran, aktivitas inframerah, dan mengapa karbon dioksida menahan panas Bumi.",
        "hl": [
          "menahan panas Bumi"
        ],
        "pause": 0.7
      },
      {
        "text": "Berikutnya, kita gabungkan semuanya dalam spektroskopi molekul. Sampai jumpa.",
        "hl": [
          "spektroskopi molekul"
        ],
        "pause": 1.0
      }
    ]
  },
  {
    "id": "outro",
    "chapter": "",
    "title": "Penutup",
    "mood": "outro",
    "fixed": 15,
    "lines": []
  }
];
