import { useEffect, useRef, type CSSProperties } from 'react';
import { Check, CheckCircle2, X, XCircle } from 'lucide-react';

import './section-compare-v3.css';

const oldItems = [
    {
        title: 'Mulai dari Nol',
        description: 'Setiap halaman dirancang ulang sehingga waktu pengembangan menjadi lebih panjang.',
    },
    {
        title: 'Style Tidak Konsisten',
        description: 'Warna, spacing, dan pola komponen berbeda di setiap bagian produk.',
    },
    {
        title: 'Responsif Belakangan',
        description: 'Tampilan mobile baru diperbaiki setelah layout desktop selesai dibuat.',
    },
    {
        title: 'Copy Paste Berulang',
        description: 'Kode yang sama tersebar di banyak file dan sulit diperbarui bersama.',
    },
    {
        title: 'Sulit Dikembangkan',
        description: 'Setiap variasi baru membutuhkan perubahan besar pada struktur yang sudah ada.',
    },
];

const newItems = [
    {
        title: 'Komponen Siap Pakai',
        description: 'Elemen dan section dapat langsung digunakan sebagai fondasi halaman.',
    },
    {
        title: 'Satu Design System',
        description: 'Warna, spacing, dan pola visual tetap konsisten di seluruh tampilan.',
    },
    {
        title: 'Responsif Sejak Awal',
        description: 'Setiap komponen disiapkan untuk desktop, tablet, dan mobile.',
    },
    {
        title: 'Variasi Mudah Dibuat',
        description: 'Struktur yang rapi memudahkan pembuatan versi baru tanpa mengulang semuanya.',
    },
    {
        title: 'Siap Dikembangkan',
        description: 'Komponen dapat disesuaikan dan dikembangkan mengikuti kebutuhan produk.',
    },
];

export default function SectionCompareV3() {
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('section-compare-v3__visible');
                        entry.target.classList.remove('section-compare-v3__hidden');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
        );

        section.querySelectorAll('.section-compare-v3__reveal').forEach((element) => observer.observe(element));
        return () => observer.disconnect();
    }, []);

    return (
        <section ref={sectionRef} className="section-compare-v3">
            <div className="section-compare-v3__shell">
                <h2 className="section-compare-v3__heading section-compare-v3__reveal section-compare-v3__hidden">
                    Mengapa Proses Design Terasa{' '}
                    <span className="section-compare-v3__heading-accent">Selalu Kewalahan?</span>
                </h2>

                <p className="section-compare-v3__subtitle section-compare-v3__reveal section-compare-v3__hidden">
                    Bukan karena tim kurang kreatif, tetapi karena fondasi komponennya belum tertata.
                </p>

                <div className="section-compare-v3__grid">
                    <div className="section-compare-v3__column section-compare-v3__column--old section-compare-v3__reveal section-compare-v3__hidden">
                        <h3 className="section-compare-v3__title section-compare-v3__title--old">
                            <XCircle size={20} strokeWidth={2.5} aria-hidden="true" /> Tanpa Dealtech UI
                        </h3>
                        <ul className="section-compare-v3__list">
                            {oldItems.map(({ title, description }, index) => (
                                <li
                                    className="section-compare-v3__item section-compare-v3__reveal section-compare-v3__hidden"
                                    style={{ '--section-compare-v3-delay': `${index * 80}ms` } as CSSProperties}
                                    key={title}
                                >
                                    <span className="section-compare-v3__icon">
                                        <X size={14} strokeWidth={3} aria-hidden="true" />
                                    </span>
                                    <span className="section-compare-v3__copy">
                                        <strong>{title}</strong>
                                        <small>{description}</small>
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="section-compare-v3__column section-compare-v3__column--new section-compare-v3__reveal section-compare-v3__hidden">
                        <a href="https://github.com/Deal-Tech/dealtech-ui-for-public-component/tree/main/sections/Compare/SectionCompareV3" target="_blank" rel="noreferrer" className="section-compare-v3__badge">Compare/SectionCompareV3</a>
                        <h3 className="section-compare-v3__title section-compare-v3__title--new">
                            <CheckCircle2 size={20} strokeWidth={2.5} aria-hidden="true" /> Dengan Dealtech UI
                        </h3>
                        <ul className="section-compare-v3__list">
                            {newItems.map(({ title, description }, index) => (
                                <li
                                    className="section-compare-v3__item section-compare-v3__reveal section-compare-v3__hidden"
                                    style={{ '--section-compare-v3-delay': `${index * 80}ms` } as CSSProperties}
                                    key={title}
                                >
                                    <span className="section-compare-v3__icon">
                                        <Check size={14} strokeWidth={3} aria-hidden="true" />
                                    </span>
                                    <span className="section-compare-v3__copy">
                                        <strong>{title}</strong>
                                        <small>{description}</small>
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
}
