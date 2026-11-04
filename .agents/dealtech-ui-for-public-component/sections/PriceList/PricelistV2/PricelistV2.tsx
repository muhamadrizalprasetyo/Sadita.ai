import { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';

import './pricelist-v2.css';

const plans = [
    {
        name: 'Free',
        description: 'Untuk developer yang ingin mencoba koleksi komponen publik Dealtech UI.',
        monthly: 'Gratis',
        yearly: 'Gratis',
        periodMonthly: '',
        periodYearly: '',
        cta: 'Mulai Gratis',
        features: ['25 komponen pilihan', 'Elemen UI dasar', 'Section landing page', 'Design responsif', '1 proyek personal'],
    },
    {
        name: 'Creator',
        description: 'Untuk developer dan kreator yang membutuhkan lebih banyak variasi dalam proyek aktif.',
        monthly: 'Rp149rb',
        yearly: 'Rp1,49jt',
        periodMonthly: '/bulan',
        periodYearly: '/tahun',
        cta: 'Pilih Creator',
        featured: true,
        features: ['Semua fitur Free', '150 komponen pilihan', 'File React TSX', 'CSS terisolasi', '5 proyek aktif'],
    },
    {
        name: 'Studio',
        description: 'Untuk studio dan tim produk yang membangun banyak halaman secara konsisten.',
        monthly: 'Rp349rb',
        yearly: 'Rp3,49jt',
        periodMonthly: '/bulan',
        periodYearly: '/tahun',
        cta: 'Pilih Studio',
        features: ['Semua fitur Creator', '500 komponen pilihan', 'Semua variasi layout', 'Lisensi komersial', 'Proyek tanpa batas'],
    },
];

export default function PricelistV2() {
    const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');

    return (
        <section className="pricelist-v2">
            <div className="pricelist-v2__shell">
                <a href="https://github.com/Deal-Tech/dealtech-ui-for-public-component/tree/main/sections/PriceList/PricelistV2" target="_blank" rel="noreferrer" className="pricelist-v2__eyebrow">PriceList/PricelistV2</a>
                <h2 className="pricelist-v2__heading">
                    Pilih Akses Sesuai{' '}
                    <span>Kebutuhan Proyek Anda</span>
                </h2>
                <p className="pricelist-v2__subtitle">
                    Pilih koleksi Dealtech UI yang sesuai dan tingkatkan akses kapan saja saat proyek berkembang.
                </p>

                <div className="pricelist-v2__billing" role="tablist" aria-label="Periode pembayaran">
                    <button
                        type="button"
                        role="tab"
                        aria-selected={billing === 'monthly'}
                        className={billing === 'monthly' ? 'pricelist-v2__billing-active' : ''}
                        onClick={() => setBilling('monthly')}
                    >
                        Bulanan
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={billing === 'yearly'}
                        className={billing === 'yearly' ? 'pricelist-v2__billing-active' : ''}
                        onClick={() => setBilling('yearly')}
                    >
                        Tahunan
                        <span>Hemat</span>
                    </button>
                </div>

                <div className="pricelist-v2__grid">
                    {plans.map((plan) => {
                        const price = billing === 'monthly' ? plan.monthly : plan.yearly;
                        const period = billing === 'monthly' ? plan.periodMonthly : plan.periodYearly;

                        return (
                            <article
                                key={plan.name}
                                className={`pricelist-v2__card${plan.featured ? ' pricelist-v2__card--featured' : ''}`}
                            >
                                <header className="pricelist-v2__card-header">
                                    <h3>{plan.name}</h3>
                                    {plan.featured && <span>Paling populer</span>}
                                </header>

                                <div className="pricelist-v2__card-body">
                                    <p className="pricelist-v2__description">{plan.description}</p>

                                    <div className="pricelist-v2__price-box">
                                        <p className="pricelist-v2__price">
                                            {price}
                                            {period && <span>{period}</span>}
                                        </p>
                                        <a href="#kontak">
                                            {plan.cta}
                                            <ArrowRight size={16} strokeWidth={2.4} aria-hidden="true" />
                                        </a>
                                    </div>

                                    <ul>
                                        {plan.features.map((feature) => (
                                            <li key={feature}>
                                                <span className="pricelist-v2__check" aria-hidden="true">
                                                    <Check size={11} strokeWidth={3.5} />
                                                </span>
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
