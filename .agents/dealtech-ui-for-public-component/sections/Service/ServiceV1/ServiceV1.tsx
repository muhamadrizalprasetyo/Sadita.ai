import { useEffect, useRef, type CSSProperties } from 'react';
import {
    Blocks,
    Braces,
    CheckCircle2,
    LayoutTemplate,
    MonitorSmartphone,
    Palette,
    Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import './service-v1.css';

interface ServiceItem {
    title: string;
    description: string;
    icon: LucideIcon;
}

const services: ServiceItem[] = [
    {
        title: 'Desain Antarmuka',
        description: 'Tampilan rapi yang selaras dengan karakter dan kebutuhan produk.',
        icon: Palette,
    },
    {
        title: 'Komponen React',
        description: 'Komponen siap pakai untuk mempercepat proses pengembangan.',
        icon: Braces,
    },
    {
        title: 'Sistem Komponen',
        description: 'Pola visual konsisten agar setiap halaman terasa menyatu.',
        icon: Blocks,
    },
    {
        title: 'Desain Responsif',
        description: 'Pengalaman yang tetap nyaman dari layar desktop hingga mobile.',
        icon: MonitorSmartphone,
    },
    {
        title: 'Layout Siap Pakai',
        description: 'Susunan halaman fleksibel yang mudah disesuaikan dan dirangkai.',
        icon: LayoutTemplate,
    },
    {
        title: 'Kualitas Terjaga',
        description: 'Struktur mandiri dan detail terukur untuk hasil yang mudah dirawat.',
        icon: CheckCircle2,
    },
];

export default function ServiceV1() {
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('service-v1__visible');
                        entry.target.classList.remove('service-v1__hidden');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
        );

        section.querySelectorAll('.service-v1__reveal').forEach((element) => observer.observe(element));
        return () => observer.disconnect();
    }, []);

    return (
        <section ref={sectionRef} className="service-v1">
            <div className="service-v1__shell">
                <div className="service-v1__content">
                    <a href="https://github.com/Deal-Tech/dealtech-ui-for-public-component/tree/main/sections/Service/ServiceV1" target="_blank" rel="noreferrer" className="service-v1__eyebrow service-v1__reveal service-v1__hidden">
                        <Sparkles size={16} strokeWidth={2.4} aria-hidden="true" /> Service/ServiceV1
                    </a>

                    <h2 className="service-v1__title service-v1__reveal service-v1__hidden">
                        Layanan UI untuk{' '}
                        <span className="service-v1__title-accent">Proyek Lebih Cepat</span>
                    </h2>

                    <p className="service-v1__description service-v1__reveal service-v1__hidden">
                        Semua yang kamu butuhkan untuk merancang, menyusun, dan mengembangkan antarmuka yang
                        responsif, konsisten, dan mudah disesuaikan.
                    </p>

                    <div className="service-v1__action service-v1__reveal service-v1__hidden">
                        <a className="service-v1__button" href="#layanan">
                            Jelajahi Layanan
                        </a>
                    </div>
                </div>

                <div className="service-v1__cards" id="layanan">
                    {services.map(({ title, description, icon: Icon }, index) => (
                        <article
                            className="service-v1__card service-v1__reveal service-v1__hidden"
                            style={{ '--service-v1-delay': `${index * 60}ms` } as CSSProperties}
                            key={title}
                        >
                            <span className="service-v1__card-icon">
                                <Icon size={25} strokeWidth={1.9} aria-hidden="true" />
                            </span>
                            <h3>{title}</h3>
                            <p>{description}</p>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
