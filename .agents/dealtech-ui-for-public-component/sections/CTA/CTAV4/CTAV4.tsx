import { useEffect, useRef } from 'react';

import './cta-v4.css';

const stats = [
    { value: '92%', label: 'Kepuasan Developer', className: 'cta-v4__stat--retention' },
    { value: '350+', label: 'Komponen Aktif', className: 'cta-v4__stat--components' },
    { value: '18K+', label: 'Developer Aktif', className: 'cta-v4__stat--users' },
    { value: '99.9%', label: 'Tampilan Responsif', className: 'cta-v4__stat--uptime' },
];

export default function CTAV4() {
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('cta-v4__visible');
                        entry.target.classList.remove('cta-v4__hidden');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
        );

        section.querySelectorAll('.cta-v4__reveal').forEach((element) => observer.observe(element));
        return () => observer.disconnect();
    }, []);

    return (
        <section ref={sectionRef} className="cta-v4">
            <div className="cta-v4__surface">
                <div className="cta-v4__shell">
                    <div className="cta-v4__content">
                        <a href="https://github.com/Deal-Tech/dealtech-ui-for-public-component/tree/main/sections/CTA/CTAV4" target="_blank" rel="noreferrer" className="cta-v4__eyebrow">CTA/CTAV4</a>
                        <h2 className="cta-v4__title cta-v4__reveal cta-v4__hidden">
                            <span>Siap Bangun UI Lebih Cepat untuk </span>
                            <span className="cta-v4__title-accent">Proyek Berikutnya?</span>
                        </h2>

                        <p className="cta-v4__description cta-v4__reveal cta-v4__hidden">
                            Pilih komponen siap pakai, salin ke proyek, lalu sesuaikan tanpa perlu memulai dari nol.
                        </p>

                        <div className="cta-v4__actions cta-v4__reveal cta-v4__hidden">
                            <a className="cta-v4__button cta-v4__button--primary" href="#fitur">
                                Jelajahi Komponen
                            </a>
                            <a className="cta-v4__button cta-v4__button--secondary" href="#tentang">
                                Lihat Dokumentasi
                            </a>
                        </div>
                    </div>

                    <div className="cta-v4__visual cta-v4__reveal cta-v4__hidden">
                        {stats.map((stat) => (
                            <article className={`cta-v4__stat ${stat.className}`} key={stat.label}>
                                <strong>{stat.value}</strong>
                                <span>{stat.label}</span>
                            </article>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
