import { ArrowRight, Check } from 'lucide-react';

import './pricelist-v4.css';

const plans = [
    {
        name: 'Free',
        price: 'Gratis',
        period: '',
        description: 'Untuk developer yang ingin mencoba koleksi komponen publik Dealtech UI.',
        cta: 'Mulai Gratis',
    },
    {
        name: 'Basic',
        price: 'Rp149rb',
        period: '/bulan',
        description: 'Untuk developer yang membutuhkan lebih banyak variasi dalam proyek aktif.',
        cta: 'Pilih Basic',
    },
    {
        name: 'Plus',
        price: 'Rp349rb',
        period: '/bulan',
        description: 'Untuk studio dan tim produk yang membangun banyak halaman secara konsisten.',
        cta: 'Pilih Plus',
        featured: true,
    },
    {
        name: 'Pro',
        price: 'Rp1,2jt',
        period: '/tahun',
        description: 'Untuk agency dan perusahaan yang membutuhkan koleksi serta dukungan penuh.',
        cta: 'Pilih Pro',
    },
    {
        name: 'Custom',
        price: 'Negosiasi',
        period: '',
        description: 'Untuk kebutuhan khusus yang ingin disesuaikan bersama tim Dealtech UI.',
        cta: 'Konsultasi Custom',
        custom: true,
    },
];

const availableFeatures = [
    '25 komponen pilihan',
    'Elemen UI dasar',
    'Section landing page',
    'Design responsif',
    'Preview komponen',
    'Aset SVG lokal',
    'File React TSX',
    'CSS terisolasi',
    'Variasi layout',
    'Update komponen',
    'Komponen interaktif',
    'Template landing page',
    'Lisensi komersial',
    'Dokumentasi implementasi',
    'Proyek tanpa batas',
];

export default function PricelistV4() {
    return (
        <section id="harga" className="pricelist-v4">
            <div className="pricelist-v4__shell">
                <a href="https://github.com/Deal-Tech/dealtech-ui-for-public-component/tree/main/sections/PriceList/PricelistV4" target="_blank" rel="noreferrer" className="pricelist-v4__eyebrow">PriceList/PricelistV4</a>
                <h2 className="pricelist-v4__heading">
                    Pilih Akses Sesuai <span>Kebutuhan Proyek Anda</span>
                </h2>
                <p className="pricelist-v4__subtitle">
                    Pilih koleksi Dealtech UI yang sesuai dan tingkatkan akses kapan saja saat proyek berkembang.
                </p>

                <div className="pricelist-v4__grid">
                    {plans.map((plan) => (
                        <article
                            key={plan.name}
                            className={`pricelist-v4__card${plan.featured ? ' pricelist-v4__card--featured' : ''}${plan.custom ? ' pricelist-v4__card--custom' : ''}`}
                        >
                            {plan.featured && <span className="pricelist-v4__badge">Paling populer</span>}
                            <h3>{plan.name}</h3>
                            <p className="pricelist-v4__price">
                                {plan.price}
                                {plan.period && <span>{plan.period}</span>}
                            </p>
                            <p className="pricelist-v4__description">{plan.description}</p>
                            <a href="#kontak">
                                {plan.cta}
                                <ArrowRight size={16} strokeWidth={2.4} aria-hidden="true" />
                            </a>
                        </article>
                    ))}
                </div>

                <div className="pricelist-v4__included">
                    <h3>Fitur yang tersedia sesuai paket:</h3>
                    <ul>
                        {availableFeatures.map((feature) => (
                            <li key={feature}>
                                <span aria-hidden="true"><Check size={11} strokeWidth={3.5} /></span>
                                {feature}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    );
}
