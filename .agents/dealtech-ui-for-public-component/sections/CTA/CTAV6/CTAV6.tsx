import { useEffect, useRef } from 'react';

import './cta-v6.css';

export default function CTAV6() {
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('cta-v6__visible');
                        entry.target.classList.remove('cta-v6__hidden');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
        );

        section.querySelectorAll('.cta-v6__reveal').forEach((element) => observer.observe(element));
        return () => observer.disconnect();
    }, []);

    return (
        <section ref={sectionRef} className="cta-v6">
            <div className="cta-v6__inner">
                <div className="cta-v6__content cta-v6__reveal cta-v6__hidden">
                    <a href="https://github.com/Deal-Tech/dealtech-ui-for-public-component/tree/main/sections/CTA/CTAV6" target="_blank" rel="noreferrer" className="cta-v6__eyebrow">CTA/CTAV6</a>
                    <h2 className="cta-v6__title">
                        <span>Siap Bangun UI Lebih Cepat untuk </span>
                        <span className="cta-v6__title-accent">Proyek Berikutnya?</span>
                    </h2>

                    <p className="cta-v6__description">
                        Pilih komponen siap pakai, salin ke proyek, lalu sesuaikan tanpa perlu memulai dari nol.
                    </p>

                    <div className="cta-v6__actions">
                        <a className="cta-v6__button" href="#fitur">
                            Jelajahi Komponen
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}
