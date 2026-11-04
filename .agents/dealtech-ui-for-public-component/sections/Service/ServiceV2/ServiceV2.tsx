import { useEffect, useRef, type CSSProperties } from 'react';
import {
    ArrowRight,
    Blocks,
    Braces,
    Compass,
    MonitorSmartphone,
    ScanSearch,
    SlidersHorizontal,
    Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import './service-v2.css';

interface ServiceItem {
    title: string;
    description: string;
    href: string;
    icon: LucideIcon;
    featured?: boolean;
}

const services: ServiceItem[] = [
    {
        title: 'Perencanaan UI',
        description: 'Susun arah visual dan pola antarmuka yang sesuai dengan kebutuhan produk.',
        href: '#perencanaan-ui',
        icon: Compass,
    },
    {
        title: 'Design System',
        description: 'Bangun fondasi komponen, token, dan aturan visual agar produk tetap konsisten.',
        href: '#design-system',
        icon: Blocks,
        featured: true,
    },
    {
        title: 'Pengembangan React',
        description: 'Implementasikan komponen React yang mandiri, responsif, dan mudah dirawat.',
        href: '#pengembangan-react',
        icon: Braces,
    },
    {
        title: 'Design Responsif',
        description: 'Pastikan pengalaman pengguna tetap nyaman di desktop, tablet, dan mobile.',
        href: '#design-responsif',
        icon: MonitorSmartphone,
    },
    {
        title: 'Kustomisasi Komponen',
        description: 'Sesuaikan warna, konten, dan detail visual tanpa mengubah struktur utama.',
        href: '#kustomisasi-komponen',
        icon: SlidersHorizontal,
    },
    {
        title: 'Audit Konsistensi',
        description: 'Tinjau kembali pola UI untuk menemukan perbedaan dan detail yang perlu dirapikan.',
        href: '#audit-konsistensi',
        icon: ScanSearch,
    },
];

export default function ServiceV2() {
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('service-v2__visible');
                        entry.target.classList.remove('service-v2__hidden');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
        );

        section.querySelectorAll('.service-v2__reveal').forEach((element) => observer.observe(element));
        return () => observer.disconnect();
    }, []);

    return (
        <section ref={sectionRef} className="service-v2">
            <div className="service-v2__shell">
                <div className="service-v2__header">
                    <a href="https://github.com/Deal-Tech/dealtech-ui-for-public-component/tree/main/sections/Service/ServiceV2" target="_blank" rel="noreferrer" className="service-v2__eyebrow service-v2__reveal service-v2__hidden">
                        <Sparkles size={16} strokeWidth={2.4} aria-hidden="true" /> Service/ServiceV2
                    </a>

                    <h2 className="service-v2__title service-v2__reveal service-v2__hidden">
                        Layanan UI untuk{' '}
                        <span className="service-v2__title-accent">Setiap Kebutuhan</span>
                    </h2>

                    <p className="service-v2__description service-v2__reveal service-v2__hidden">
                        Pilih layanan yang membantu proyekmu bergerak lebih cepat dengan tampilan yang responsif,
                        konsisten, dan mudah dikembangkan.
                    </p>
                </div>

                <div className="service-v2__grid">
                    {services.map(({ title, description, href, icon: Icon, featured }, index) => (
                        <article
                            className={`service-v2__card${featured ? ' service-v2__card--featured' : ''} service-v2__reveal service-v2__hidden`}
                            id={href.slice(1)}
                            style={{ '--service-v2-delay': `${index * 60}ms` } as CSSProperties}
                            key={title}
                        >
                            <span className="service-v2__card-icon">
                                <Icon size={25} strokeWidth={1.9} aria-hidden="true" />
                            </span>
                            <h3>{title}</h3>
                            <p>{description}</p>
                            <a href={href} aria-label={`Pelajari ${title}`}>
                                Pelajari <ArrowRight size={15} strokeWidth={2.2} aria-hidden="true" />
                            </a>
                        </article>
                    ))}
                </div>

                <div className="service-v2__action service-v2__reveal service-v2__hidden">
                    <a className="service-v2__button" href="#layanan-lainnya">
                        Lihat Semua Layanan
                    </a>
                </div>
            </div>
        </section>
    );
}
