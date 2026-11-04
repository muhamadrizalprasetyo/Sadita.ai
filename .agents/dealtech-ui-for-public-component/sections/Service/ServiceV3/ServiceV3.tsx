import { useEffect, useRef, type CSSProperties } from 'react';
import {
    ArrowRight,
    Blocks,
    Braces,
    LayoutTemplate,
    MonitorSmartphone,
    Palette,
    ScanSearch,
    Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import './service-v3.css';

interface ServiceItem {
    title: string;
    description: string;
    href: string;
    icon: LucideIcon;
}

const services: ServiceItem[] = [
    {
        title: 'Desain Antarmuka',
        description: 'Rancang tampilan yang jelas, terarah, dan sesuai dengan karakter produkmu.',
        href: '#desain-antarmuka',
        icon: Palette,
    },
    {
        title: 'Sistem Komponen',
        description: 'Satukan pola, token, dan komponen agar setiap halaman tetap konsisten.',
        href: '#sistem-komponen',
        icon: Blocks,
    },
    {
        title: 'Pengembangan React',
        description: 'Bangun komponen React mandiri yang mudah dipasang dan dikembangkan.',
        href: '#pengembangan-react-v3',
        icon: Braces,
    },
    {
        title: 'Layout Responsif',
        description: 'Susun pengalaman yang nyaman digunakan pada setiap ukuran layar.',
        href: '#layout-responsif',
        icon: MonitorSmartphone,
    },
    {
        title: 'Halaman Siap Pakai',
        description: 'Mulai lebih cepat dari contoh halaman lengkap yang mudah disesuaikan.',
        href: '#halaman-siap-pakai',
        icon: LayoutTemplate,
    },
    {
        title: 'Audit Tampilan',
        description: 'Temukan detail yang tidak konsisten dan rapikan kualitas visual produk.',
        href: '#audit-tampilan',
        icon: ScanSearch,
    },
];

export default function ServiceV3() {
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('service-v3__visible');
                        entry.target.classList.remove('service-v3__hidden');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
        );

        section.querySelectorAll('.service-v3__reveal').forEach((element) => observer.observe(element));
        return () => observer.disconnect();
    }, []);

    return (
        <section ref={sectionRef} className="service-v3">
            <div className="service-v3__shell">
                <div className="service-v3__header">
                    <div className="service-v3__heading-copy">
                        <a href="https://github.com/Deal-Tech/dealtech-ui-for-public-component/tree/main/sections/Service/ServiceV3" target="_blank" rel="noreferrer" className="service-v3__eyebrow service-v3__reveal service-v3__hidden">
                            <Sparkles size={16} strokeWidth={2.4} aria-hidden="true" /> Service/ServiceV3
                        </a>

                        <h2 className="service-v3__title service-v3__reveal service-v3__hidden">
                            Wujudkan UI Berkualitas melalui{' '}
                            <span className="service-v3__title-accent">Layanan Kami</span>
                        </h2>

                        <p className="service-v3__description service-v3__reveal service-v3__hidden">
                            Pilih dukungan yang paling sesuai untuk mempercepat dan merapikan pengembangan produkmu.
                        </p>
                    </div>
                </div>

                <div className="service-v3__grid" id="service-v3-list">
                    {services.map(({ title, description, href, icon: Icon }, index) => (
                        <article
                            className="service-v3__card service-v3__reveal service-v3__hidden"
                            id={href.slice(1)}
                            style={{ '--service-v3-delay': `${index * 60}ms` } as CSSProperties}
                            key={title}
                        >
                            <span className="service-v3__card-icon">
                                <Icon size={23} strokeWidth={1.9} aria-hidden="true" />
                            </span>

                            <h3>{title}</h3>

                            <p>{description}</p>

                            <div className="service-v3__card-action">
                                <a href={href} aria-label={`Pelajari ${title}`}>
                                    <ArrowRight size={18} strokeWidth={2.2} aria-hidden="true" />
                                </a>
                            </div>
                        </article>
                    ))}
                </div>

                <div className="service-v3__header-action service-v3__reveal service-v3__hidden">
                    <a className="service-v3__button" href="#service-v3-list">
                        Lihat Semua Layanan
                    </a>
                </div>
            </div>
        </section>
    );
}
