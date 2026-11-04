import { useEffect, useRef } from 'react';
import { Check, CheckCircle2, X, XCircle } from 'lucide-react';

import './section-compare-v1.css';

const oldItems = [
    {
        title: 'Mulai dari nol:',
        description: 'Setiap halaman dirancang ulang sehingga waktu pengembangan menjadi lebih panjang.',
    },
    {
        title: 'Style tidak konsisten:',
        description: 'Warna, spacing, dan pola komponen berbeda di setiap bagian produk.',
    },
    {
        title: 'Responsif belakangan:',
        description: 'Tampilan mobile baru diperbaiki setelah layout desktop selesai dibuat.',
    },
    {
        title: 'Copy paste berulang:',
        description: 'Kode yang sama tersebar di banyak file dan sulit diperbarui bersama.',
    },
    {
        title: 'Sulit dikembangkan:',
        description: 'Setiap variasi baru membutuhkan perubahan besar pada struktur yang sudah ada.',
    },
];

const newItems = [
    {
        title: 'Komponen siap pakai:',
        description: 'Elemen dan section dapat langsung digunakan sebagai fondasi halaman.',
    },
    {
        title: 'Satu design system:',
        description: 'Warna, spacing, dan pola visual tetap konsisten di seluruh tampilan.',
    },
    {
        title: 'Responsif sejak awal:',
        description: 'Setiap komponen disiapkan untuk desktop, tablet, dan mobile.',
    },
    {
        title: 'Variasi mudah dibuat:',
        description: 'Struktur yang rapi memudahkan pembuatan versi baru tanpa mengulang semuanya.',
    },
    {
        title: 'Siap dikembangkan:',
        description: 'Komponen dapat disesuaikan dan dikembangkan mengikuti kebutuhan produk.',
    },
];

export default function SectionCompareV1() {
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    section.classList.add('section-compare-v1--visible');
                    observer.disconnect();
                }
            },
            { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
        );

        observer.observe(section);
        return () => observer.disconnect();
    }, []);

    return (
        <section ref={sectionRef} className="section-compare-v1">
            <div className="section-compare-v1__shell">
                <h2 className="section-compare-v1__heading">
                    Mengapa Proses Design Terasa{' '}
                    <span className="section-compare-v1__heading-accent">Selalu Kewalahan?</span>
                </h2>

                <p className="section-compare-v1__subtitle">
                    Bukan karena tim kurang kreatif, tetapi karena fondasi komponennya belum tertata.
                </p>

                <div className="section-compare-v1__grid">
                    <div className="section-compare-v1__column section-compare-v1__column--old">
                        <h3 className="section-compare-v1__title section-compare-v1__title--old">
                            <XCircle size={20} strokeWidth={2.5} /> TANPA DEALTECH UI
                        </h3>
                        <ul className="section-compare-v1__list">
                            {oldItems.map((item) => (
                                <li key={item.title}>
                                    <X size={16} strokeWidth={3} />
                                    <span>
                                        <strong>{item.title}</strong> {item.description}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="section-compare-v1__column section-compare-v1__column--new">
                        <a href="https://github.com/Deal-Tech/dealtech-ui-for-public-component/tree/main/sections/Compare/SectionCompareV1" target="_blank" rel="noreferrer" className="section-compare-v1__badge">Compare/SectionCompareV1</a>
                        <h3 className="section-compare-v1__title section-compare-v1__title--new">
                            <CheckCircle2 size={20} strokeWidth={2.5} /> DENGAN DEALTECH UI
                        </h3>
                        <ul className="section-compare-v1__list">
                            {newItems.map((item) => (
                                <li key={item.title}>
                                    <Check size={16} strokeWidth={3} />
                                    <span>
                                        <strong>{item.title}</strong> {item.description}
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
