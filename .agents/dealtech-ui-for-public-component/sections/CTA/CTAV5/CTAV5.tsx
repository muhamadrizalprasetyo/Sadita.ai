import { useEffect, useRef } from 'react';

import './cta-v5.css';

export default function CTAV5() {
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('cta-v5__visible');
                        entry.target.classList.remove('cta-v5__hidden');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
        );

        section.querySelectorAll('.cta-v5__reveal').forEach((element) => observer.observe(element));
        return () => observer.disconnect();
    }, []);

    return (
        <section ref={sectionRef} className="cta-v5">
            <div className="cta-v5__surface">
                <div className="cta-v5__shell">
                    <div className="cta-v5__content">
                        <a href="https://github.com/Deal-Tech/dealtech-ui-for-public-component/tree/main/sections/CTA/CTAV5" target="_blank" rel="noreferrer" className="cta-v5__eyebrow">CTA/CTAV5</a>
                        <h2 className="cta-v5__title cta-v5__reveal cta-v5__hidden">
                            <span>Siap Bangun UI Lebih Cepat untuk </span>
                            <span className="cta-v5__title-accent">Proyek Berikutnya?</span>
                        </h2>

                        <p className="cta-v5__description cta-v5__reveal cta-v5__hidden">
                            Pilih komponen siap pakai, salin ke proyek, lalu sesuaikan tanpa perlu memulai dari nol.
                        </p>

                        <div className="cta-v5__actions cta-v5__reveal cta-v5__hidden">
                            <a className="cta-v5__button cta-v5__button--primary" href="#fitur">
                                Jelajahi Komponen
                            </a>
                            <a className="cta-v5__button cta-v5__button--secondary" href="#tentang">
                                Lihat Dokumentasi
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
