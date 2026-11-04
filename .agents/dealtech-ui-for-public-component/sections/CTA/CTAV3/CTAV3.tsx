import { useEffect, useRef } from 'react';

import './cta-v3.css';

const personImage = new URL('./assets/person-holding-phone.png', import.meta.url).href;

export default function CTAV3() {
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('cta-v3__visible');
                        entry.target.classList.remove('cta-v3__hidden');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
        );

        section.querySelectorAll('.cta-v3__reveal').forEach((element) => observer.observe(element));
        return () => observer.disconnect();
    }, []);

    return (
        <section ref={sectionRef} className="cta-v3">
            <div className="cta-v3__surface">
                <div className="cta-v3__shell">
                    <div className="cta-v3__content">
                        <a href="https://github.com/Deal-Tech/dealtech-ui-for-public-component/tree/main/sections/CTA/CTAV3" target="_blank" rel="noreferrer" className="cta-v3__eyebrow">CTA/CTAV3</a>
                        <h2 className="cta-v3__title cta-v3__reveal cta-v3__hidden">
                            <span>Siap Bangun UI Lebih Cepat untuk </span>
                            <span className="cta-v3__title-accent">Proyek Berikutnya?</span>
                        </h2>

                        <p className="cta-v3__description cta-v3__reveal cta-v3__hidden">
                            Pilih komponen siap pakai, salin ke proyek, lalu sesuaikan tanpa perlu memulai dari nol.
                        </p>

                        <div className="cta-v3__actions cta-v3__reveal cta-v3__hidden">
                            <a className="cta-v3__button cta-v3__button--primary" href="#fitur">
                                Jelajahi Komponen
                            </a>
                            <a className="cta-v3__button cta-v3__button--secondary" href="#tentang">
                                Lihat Dokumentasi
                            </a>
                        </div>
                    </div>

                    <div className="cta-v3__visual cta-v3__reveal cta-v3__hidden">
                        <div className="cta-v3__glow" aria-hidden="true" />
                        <img
                            src={personImage}
                            alt="Profesional memegang ponsel."
                            width={1024}
                            height={1536}
                            decoding="async"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
