import { ArrowRight, Check } from 'lucide-react';

import './price-card-v1.css';

interface Paket {
    nama: string;
    badge?: string;
    hargaLabel?: string;
    harga: string;
    satuan?: string;
    deskripsi: string;
    cta: string;
    fiturTitle: string;
    fitur: string[];
    sorot?: boolean;
}

const paketList: Paket[] = [
    {
        nama: 'Free',
        harga: 'Gratis',
        deskripsi: 'Untuk developer yang ingin mencoba koleksi komponen publik Dealtech UI.',
        cta: 'Mulai Gratis',
        fiturTitle: 'Yang sudah termasuk:',
        fitur: [
            '25 komponen pilihan',
            'Elemen UI dasar',
            'Section landing page',
            'Design responsif',
            'Preview komponen',
            'Aset SVG lokal',
            '1 proyek personal',
        ],
    },
    {
        nama: 'Basic',
        hargaLabel: 'Mulai dari',
        harga: 'Rp149rb',
        satuan: '/bulan',
        deskripsi: 'Untuk developer yang membutuhkan lebih banyak variasi dalam proyek aktif.',
        cta: 'Pilih Basic',
        fiturTitle: 'Semua fitur Free, plus:',
        fitur: [
            '150 komponen pilihan',
            'Hero dan features',
            'About dan testimonial',
            'File React TSX',
            'CSS terisolasi',
            'Variasi layout',
            'Update komponen',
            '5 proyek aktif',
        ],
    },
    {
        nama: 'Plus',
        badge: 'Paling populer',
        hargaLabel: 'Mulai dari',
        harga: 'Rp349rb',
        satuan: '/bulan',
        deskripsi: 'Untuk studio dan tim produk yang membangun banyak halaman secara konsisten.',
        cta: 'Pilih Plus',
        fiturTitle: 'Semua fitur Basic, plus:',
        fitur: [
            '500 komponen pilihan',
            'Semua kategori section',
            'Semua variasi layout',
            'Aset lokal lengkap',
            'Komponen interaktif',
            'Template landing page',
            'Dokumentasi implementasi',
            'Lisensi komersial',
            'Update prioritas',
            'Proyek tanpa batas',
        ],
    },
    {
        nama: 'Pro',
        harga: 'Rp1,2jt',
        satuan: '/tahun',
        deskripsi: 'Untuk agency dan perusahaan yang membutuhkan koleksi serta dukungan penuh.',
        cta: 'Pilih Pro',
        fiturTitle: 'Semua fitur Plus, plus:',
        fitur: [
            'Semua komponen Dealtech UI',
            'Lisensi untuk seluruh tim',
            'Request variasi komponen',
            'Review implementasi UI',
            'Pendampingan integrasi',
            'Update koleksi rutin',
            'Prioritas dukungan teknis',
        ],
    },
];

export default function PriceCardV1() {
    return (
        <div className="price-card-v1 pk-grid">
            {paketList.map((paket) => (
                <article
                    key={paket.nama}
                    className={`pk-card${paket.sorot || paket.badge ? ' pk-card--sorot' : ''}`}
                >
                    <div className="pk-card__head">
                        <h3 className="pk-card__name">{paket.nama}</h3>
                        {paket.badge && <span className="pk-card__badge">{paket.badge}</span>}
                    </div>

                    {paket.hargaLabel && <p className="pk-card__price-label">{paket.hargaLabel}</p>}

                    <p className="pk-card__price">
                        {paket.harga}
                        {paket.satuan && <span className="pk-card__price-unit">{paket.satuan}</span>}
                    </p>

                    <p className="pk-card__desc">{paket.deskripsi}</p>

                    <a className="pk-card__cta" href="#kontak">
                        <span>{paket.cta}</span>
                        <ArrowRight size={16} strokeWidth={2.4} aria-hidden="true" />
                    </a>

                    <p className="pk-card__fitur-title">{paket.fiturTitle}</p>

                    <ul className="pk-card__fitur">
                        {paket.fitur.map((fitur) => (
                            <li key={fitur}>
                                <span className="pk-card__check" aria-hidden="true">
                                    <Check size={11} strokeWidth={3.5} />
                                </span>
                                {fitur}
                            </li>
                        ))}
                    </ul>
                </article>
            ))}
        </div>
    );
}
