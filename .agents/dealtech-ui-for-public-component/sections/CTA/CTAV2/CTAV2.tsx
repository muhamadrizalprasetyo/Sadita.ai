import { useEffect } from 'react';

import './cta-v2.css';

export default function CTAV2() {
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('cta-v2__fade-in');
                        entry.target.classList.remove('cta-v2__opacity-0');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
        );

        document.querySelectorAll('.cta-v2 .cta-v2__reveal').forEach((element) => observer.observe(element));
        return () => observer.disconnect();
    }, []);

    return (
        <section className="cta-v2">
            <div className="cta-v2__inner">
                <div className="cta-v2__content cta-v2__reveal cta-v2__opacity-0">
                    <a href="https://github.com/Deal-Tech/dealtech-ui-for-public-component/tree/main/sections/CTA/CTAV2" target="_blank" rel="noreferrer" className="cta-v2__eyebrow">CTA/CTAV2</a>
                    <h2 className="cta-v2__title">
                        <span>Siap Bangun UI Lebih Cepat untuk </span>
                        <span className="cta-v2__title-accent">Proyek Berikutnya?</span>
                    </h2>
                    <p className="cta-v2__description">
                        Pilih komponen siap pakai, salin ke proyek, lalu sesuaikan tanpa perlu memulai dari nol.
                    </p>
                </div>

                <div className="cta-v2__actions cta-v2__reveal cta-v2__opacity-0">
                    <a className="cta-v2__button" href="#fitur">
                        Jelajahi Komponen
                    </a>
                </div>
            </div>
        </section>
    );
}
