import { useEffect, useRef } from 'react';
import {
    BookOpen,
    ClipboardList,
    HeartPulse,
    Landmark,
    LayoutDashboard,
    Library,
    ShieldCheck,
    Smartphone,
    Users,
    Wallet,
} from 'lucide-react';

import './card-list-v3.css';

const features = [
    {
        icon: Users,
        title: 'Komponen siap pakai',
        text: 'Gunakan elemen dan section siap pakai tanpa membangun tampilan dari awal.',
    },
    {
        icon: Wallet,
        title: 'Variasi layout',
        text: 'Pilih berbagai versi layout untuk menyesuaikan kebutuhan setiap halaman.',
    },
    {
        icon: Landmark,
        title: 'Design responsif',
        text: 'Setiap komponen tetap rapi dari layar desktop hingga perangkat mobile.',
    },
    {
        icon: ClipboardList,
        title: 'Styling terisolasi',
        text: 'CSS setiap komponen tersusun mandiri agar mudah dipindahkan dan dirawat.',
    },
    {
        icon: BookOpen,
        title: 'Struktur konsisten',
        text: 'Penamaan file dan class dibuat konsisten untuk mempercepat pengembangan.',
    },
    {
        icon: Smartphone,
        title: 'Mudah dikustomisasi',
        text: 'Ubah warna, konten, dan detail visual agar sesuai dengan identitas brand.',
    },
    {
        icon: Library,
        title: 'Aset siap digunakan',
        text: 'Setiap section membawa aset lokal yang dibutuhkan untuk menjaga tampilannya.',
    },
    {
        icon: HeartPulse,
        title: 'Integrasi React',
        text: 'Komponen TSX siap dipasang ke proyek React dengan struktur yang sederhana.',
    },
    {
        icon: LayoutDashboard,
        title: 'Preview komponen',
        text: 'Lihat setiap variasi langsung sebelum memilihnya untuk digunakan dalam proyek.',
    },
    {
        icon: ShieldCheck,
        title: 'Siap dikembangkan',
        text: 'Jadikan setiap versi sebagai fondasi untuk membuat variasi design berikutnya.',
    },
];

export default function CardListV3() {
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    section.classList.add('card-list-v3--visible');
                    observer.disconnect();
                }
            },
            { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
        );

        observer.observe(section);
        return () => observer.disconnect();
    }, []);

    return (
        <section ref={sectionRef} className="card-list-v3">
            <div className="card-list-v3__shell">
                <a href="https://github.com/Deal-Tech/dealtech-ui-for-public-component/tree/main/sections/Features/CardListV3" target="_blank" rel="noreferrer" className="card-list-v3__eyebrow">Features/CardListV3</a>
                <h2 className="card-list-v3__heading">
                    Satu Library untuk{' '}
                    <span className="card-list-v3__heading-accent">Seluruh Kebutuhan UI</span>
                </h2>

                <div className="card-list-v3__grid">
                    {features.map((feature) => (
                        <article key={feature.title} className="card-list-v3__card">
                            <span className="card-list-v3__icon" aria-hidden="true">
                                <feature.icon size={21} strokeWidth={2.2} />
                            </span>
                            <h3 className="card-list-v3__title">{feature.title}</h3>
                            <p className="card-list-v3__text">{feature.text}</p>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
