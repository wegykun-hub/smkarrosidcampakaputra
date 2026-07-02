import { NewsItem, GalleryItem } from './types';

export const VISI_MISI = {
  visi: "Menjadi Sekolah Menengah Kejuruan yang Unggul, Berkarakter Islami, Kompeten di Bidang Teknologi dan Pemasaran, serta Berdaya Saing Global pada Tahun 2030.",
  misi: [
    "Menyelenggarakan sistem pendidikan kejuruan yang terintegrasi dengan nilai-nilai akhlakul karimah dan keislaman.",
    "Mengembangkan kurikulum yang link and match dengan kebutuhan dunia usaha, industri, dan kerja (DUDIKA).",
    "Membekali peserta didik dengan keterampilan profesional di bidang Teknik Komputer & Jaringan (TKJ) serta Pemasaran Digital.",
    "Meningkatkan jiwa kewirausahaan (entrepreneurship) yang kreatif dan mandiri pada seluruh siswa.",
    "Menyediakan fasilitas pembelajaran berbasis teknologi modern serta menjalin kemitraan strategis tingkat nasional dan internasional."
  ]
};

export const JURUSAN_DETAILS = [
  {
    id: "tkj",
    name: "Teknik Komputer dan Jaringan (TKJ)",
    abbr: "TKJ",
    tagline: "Building the Connected Future",
    description: "Jurusan TKJ SMK Ar Rosyid Campaka Putra mencetak tenaga ahli yang kompeten di bidang instalasi jaringan, administrasi server, perawatan perangkat komputer, serta jaringan kabel dan nirkabel. Siswa akan dibekali keahlian siber, mikrotik, cisco, dan komputasi awan.",
    prospek: [
      "Network Engineer / Network Administrator",
      "IT Support / Helpdesk Specialist",
      "System Administrator",
      "Cybersecurity Specialist",
      "Technopreneur di bidang IT"
    ],
    materi: [
      "Dasar Desain Grafis & Perakitan PC",
      "Jaringan Nirkabel (Wireless) & Fiber Optic",
      "Administrasi Sistem Jaringan & Server",
      "Keamanan Jaringan (Network Security)",
      "Teknologi Layanan Jaringan"
    ],
    icon: "Network",
    color: "from-blue-600 to-orange-500"
  },
  {
    id: "pemasaran",
    name: "Bisnis Daring dan Pemasaran (PDB)",
    abbr: "PEMASARAN",
    tagline: "Shaping Innovative Entrepreneurs",
    description: "Jurusan Pemasaran membekali siswa dengan keahlian pemasaran modern, strategi e-commerce, content creation, social media marketing, pengelolaan ritel fisik maupun digital, serta teknik negosiasi dan komunikasi bisnis.",
    prospek: [
      "Digital Marketer / SEO Specialist",
      "Social Media Strategist / Content Creator",
      "Supervisor Penjualan (Sales Supervisor)",
      "Pengelola Toko Online / E-commerce Specialist",
      "Wirausahawan Mandiri (Entrepreneur)"
    ],
    materi: [
      "Perencanaan & Strategi Bisnis",
      "Komunikasi Bisnis & Negosiasi",
      "Digital Marketing & Social Media Advertising",
      "Administrasi Transaksi & Ritel",
      "Produk Kreatif & Kewirausahaan"
    ],
    icon: "TrendingUp",
    color: "from-emerald-600 to-yellow-500"
  }
];

export const SAMBUTAN_KEPALA_SEKOLAH = {
  nama: "ZODI ZULKARNAEN S.Pd.",
  foto: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400",
  isi: "Assalamu'alaikum Warahmatullahi Wabarakatuh.\n\nSelamat datang di website resmi SMK Ar Rosyid Campaka Putra. Sebagai lembaga pendidikan kejuruan yang berkomitmen melahirkan generasi unggul, terampil, dan berakhlak mulia, kami terus berinovasi untuk menyelaraskan kualitas pendidikan dengan tuntutan zaman.\n\nDengan didukung oleh tenaga pendidik yang berkompeten, sarana prasarana modern, serta lingkungan belajar yang asri dan kental dengan nilai-nilai religi, kami siap membimbing putra-putri terbaik bangsa untuk meraih masa depan gemilang di bidang Teknologi Informasi dan Dunia Pemasaran.\n\nSemoga kehadiran website ini dapat menjadi jembatan informasi dan komunikasi yang efektif bagi seluruh civitas akademika, orang tua siswa, industri mitra, dan masyarakat umum.\n\nWassalamu'alaikum Warahmatullahi Wabarakatuh."
};

export const FASILITAS = [
  {
    name: "Laboratorium Komputer TKJ",
    desc: "Lab ber-AC dengan koneksi internet serat optik berkecepatan tinggi, dilengkapi server mandiri dan perangkat Cisco/Mikrotik untuk praktik jaringan.",
    image: "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&q=80&w=800"
  },
  {
    name: "Business Center & Laboratorium Retail",
    desc: "Tempat praktik mini-market dan digital marketing, di mana siswa Pemasaran langsung mengelola transaksi riil dan strategi promosi.",
    image: "https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?auto=format&fit=crop&q=80&w=800"
  },
  {
    name: "Perpustakaan & Ruang Baca",
    desc: "Koleksi buku kurikulum, literatur teknis, keislaman, serta fiksi yang lengkap dengan area membaca yang kondusif serta e-library.",
    image: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&q=80&w=800"
  },
  {
    name: "Masjid & Sarana Beribadah",
    desc: "Pusat kegiatan keagamaan siswa untuk membiasakan shalat berjamaah, pengajian harian, serta pembangunan karakter Islami.",
    image: "https://images.unsplash.com/photo-1597935258735-e254c1839512?auto=format&fit=crop&q=80&w=800"
  },
  {
    name: "Lapangan Olahraga Serbaguna",
    desc: "Fasilitas olahraga terbuka untuk Futsal, Basket, Voli, dan kegiatan upacara bendera serta ekstrakurikuler rutin.",
    image: "https://images.unsplash.com/photo-1544698310-74ea9d1c8258?auto=format&fit=crop&q=80&w=800"
  }
];

export const KEGIATAN_SEKOLAH = [
  {
    title: "Praktik Kerja Lapangan (PKL)",
    desc: "Siswa diterjunkan langsung ke industri mitra (DUDIKA) selama 3-6 bulan untuk mengaplikasikan ilmu langsung di dunia kerja.",
    icon: "Briefcase",
    category: "Akademik"
  },
  {
    title: "Uji Kompetensi Keahlian (UKK)",
    desc: "Ujian sertifikasi keahlian siswa berstandar nasional dan industri untuk memastikan siswa siap pakai setelah lulus.",
    icon: "Award",
    category: "Akademik"
  },
  {
    title: "Ekstrakurikuler Pramuka & Paskibra",
    desc: "Wahana pembentukan disiplin, kepemimpinan, kerja sama tim, dan cinta tanah air bagi seluruh siswa.",
    icon: "ShieldAlert",
    category: "Karakter"
  },
  {
    title: "Rohani Islam (ROHIS) & Tahfidz Quran",
    desc: "Kegiatan rutin pembinaan akhlak, pengkajian kitab suci, dan bimbingan hafalan Al-Qur'an.",
    icon: "Heart",
    category: "Religi"
  },
  {
    title: "Lomba Kompetensi Siswa (LKS)",
    desc: "Keikutsertaan aktif siswa dalam ajang kompetensi vokasi tingkat kabupaten hingga provinsi.",
    icon: "Trophy",
    category: "Prestasi"
  }
];

export const NEWS_DATA: NewsItem[] = [
  {
    id: "news-1",
    title: "Pelepasan Siswa PKL Angkatan 2026 ke Perusahaan Telekomunikasi Nasional",
    excerpt: "Sebanyak 45 siswa-siswi jurusan TKJ resmi diterjunkan untuk magang industri di Telkom Indonesia dan beberapa ISP besar.",
    content: "SMK Ar Rosyid Campaka Putra menyelenggarakan upacara pemberangkatan Praktik Kerja Lapangan (PKL) Angkatan 2026. Kepala Sekolah menyampaikan agar siswa selalu menjaga nama baik almamater, bersikap disiplin, dan proaktif menyerap ilmu teknis penanganan fiber optic, router, server, and networking di lapangan.\n\nKerja sama ini menjadi bukti komitmen link and match kurikulum SMK Ar Rosyid dengan dunia industri komputasi.",
    date: "10 Juni 2026",
    category: "Akademik",
    image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "news-2",
    title: "Grand Opening Ar Rosyid Business Center: Praktik Nyata Siswa Pemasaran",
    excerpt: "Siswa jurusan Bisnis Daring & Pemasaran meluncurkan minimarket sekolah dan studio branding digital.",
    content: "Sebagai bentuk inovasi Teaching Factory (TEFA), jurusan Bisnis Daring dan Pemasaran SMK Ar Rosyid Campaka Putra resmi mengoperasikan Business Center. Fasilitas ini mengintegrasikan kasir pintar berbasis POS, pojok display produk UMKM lokal, serta studio desain kemasan dan live stream digital marketing.\n\nSiswa bergantian mengelola stok, pencatatan keuangan, promosi media sosial, hingga pelayanan pelanggan di bawah supervisi guru produktif.",
    date: "05 Juni 2026",
    category: "Praktik",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "news-3",
    title: "SMK Ar Rosyid Tempati Peringkat 3 Turnamen Jaringan Komputer Se-Cianjur",
    excerpt: "Tim robotik dan jaringan komputer sekolah meraih medali perunggu di ajang LKS IT Network Systems Kabupaten Cianjur.",
    content: "Siswa kelas XI TKJ berhasil membawa pulang trofi juara ketiga setelah berkompetisi sengit selama 3 hari dalam konfigurasi routing dinamis, keamanan firewall, dan troubleshooting server Linux. Pencapaian ini memicu semangat sisa siswa lain untuk terus berkompetisi sehat.",
    date: "28 Mei 2026",
    category: "Prestasi",
    image: "https://images.unsplash.com/photo-1484807352052-23338990c6c6?auto=format&fit=crop&q=80&w=800"
  }
];

export const GALLERY_DATA: GalleryItem[] = [
  {
    id: "gal-1",
    title: "Gedung Utama Sekolah",
    description: "Ruang kelas modern dan nyaman berasitektur modern religius.",
    category: "Infrastruktur",
    image: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "gal-2",
    title: "Praktik Perakitan Server TKJ",
    description: "Siswa merakit server fisik untuk kebutuhan infrastruktur lokal sekolah.",
    category: "Praktik",
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "gal-3",
    title: "Live Streaming Praktik Pemasaran",
    description: "Siswa melakukan promosi online melalui Tiktok Shop dan Shopee Live.",
    category: "Praktik",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "gal-4",
    title: "Peringatan Hari Besar Islam",
    description: "Kajian akbar siswa dan pembagian santunan sosial di Masjid Al-Ikhlas SMK.",
    category: "Event",
    image: "https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "gal-5",
    title: "Pertandingan Futsal Persahabatan",
    description: "Tim futsal sekolah beraksi dalam kompetisi persahabatan antar-SMK.",
    category: "Ekstrakurikuler",
    image: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "gal-6",
    title: "Wisuda dan Kelulusan Angkatan VI",
    description: "Keceriaan wisudawan didampingi jajaran guru setelah dikukuhkan.",
    category: "Event",
    image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=800"
  }
];

export const CONTACT_INFO = {
  alamat: "Jl. Campaka Putra No. 45, Kecamatan Campaka, Kabupaten Cianjur, Jawa Barat, Kode Pos 43263",
  telepon: "+62 812-3456-7890",
  email: "info@smkarrosyidcampaka.sch.id",
  jamKerja: "Senin - Sabtu (07.00 - 15.00 WIB)",
  instagram: "@smkutils_arrosyid",
  youtube: "SMK Ar Rosyid Campaka Official",
  mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d126689.8708170289!2d107.0906233481237!3d-6.814275037920786!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e6852ec6a236683%3A0x6bba8c227eb0dcad!2sCianjur%2C%20Kec.%20Cianjur%2C%20Kabupaten%20Cianjur%2C%20Jawa%20Barat!5e0!3m2!1sid!2sid!4v1718164000000!5m2!1sid!2sid"
};
