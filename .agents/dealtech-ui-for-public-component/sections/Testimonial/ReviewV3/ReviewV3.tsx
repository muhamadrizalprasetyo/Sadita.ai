import { useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, Quote, Star } from 'lucide-react';

import './review-v3.css';

const reviews = [
    {
        name: 'A**** M.',
        role: 'Frontend Developer',
        initials: 'AM',
        text: 'Dulu setiap halaman dimulai dari nol. Sekarang kami memilih komponen yang sesuai lalu menyesuaikan konten dan warnanya.',
    },
    {
        name: 'R**** H.',
        role: 'Product Designer',
        initials: 'RH',
        text: 'Komponen yang responsif sejak awal membuat proses review lebih singkat dan mengurangi revisi tampilan mobile.',
    },
    {
        name: 'S**** F.',
        role: 'UI Engineer',
        initials: 'SF',
        text: 'Struktur file dan CSS yang konsisten memudahkan tim memindahkan section tanpa mengubah design dasarnya.',
    },
    {
        name: 'D**** P.',
        role: 'Creative Lead',
        initials: 'DP',
        text: 'Komponen yang konsisten membuat proses menyusun halaman lebih cepat dan hasil akhirnya terasa jauh lebih rapi.',
    },
    {
        name: 'N**** A.',
        role: 'Web Developer',
        initials: 'NA',
        text: 'Strukturnya mudah dipahami. Penyesuaian warna, teks, dan detail tampilan dapat dilakukan tanpa perubahan besar.',
    },
    {
        name: 'F**** R.',
        role: 'Project Manager',
        initials: 'FR',
        text: 'Waktu pengerjaan UI lebih terukur karena seluruh anggota tim menggunakan pola komponen yang sama.',
    },
    {
        name: 'I**** K.',
        role: 'Business Owner',
        initials: 'IK',
        text: 'Kami dapat meluncurkan halaman baru lebih cepat tanpa mengorbankan konsistensi di setiap perangkat.',
    },
    {
        name: 'L**** S.',
        role: 'React Developer',
        initials: 'LS',
        text: 'Setiap komponen mudah dikembangkan kembali saat kebutuhan produk bertambah dan layout baru diperlukan.',
    },
    {
        name: 'M**** T.',
        role: 'Design Lead',
        initials: 'MT',
        text: 'Design tetap fleksibel mengikuti identitas brand, sementara fondasi layout sudah tertata dengan baik.',
    },
];

export default function ReviewV3() {
    const sectionRef = useRef<HTMLElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);

    const slideReview = (direction: -1 | 1) => {
        const track = trackRef.current;
        if (!track) return;

        const card = track.querySelector('.review-v3__item');
        const step = card ? card.getBoundingClientRect().width + 12 : track.clientWidth;
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        track.scrollBy({ left: direction * step, behavior: reduceMotion ? 'auto' : 'smooth' });
    };

    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    section.classList.add('review-v3--visible');
                    observer.disconnect();
                }
            },
            { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
        );

        observer.observe(section);
        return () => observer.disconnect();
    }, []);

    return (
        <section ref={sectionRef} className="review-v3">
            <div className="review-v3__shell">
                <a href="https://github.com/Deal-Tech/dealtech-ui-for-public-component/tree/main/sections/Testimonial/ReviewV3" target="_blank" rel="noreferrer" className="review-v3__eyebrow">Testimonial/ReviewV3</a>
                <div className="review-v3__heading-wrap">
                    <h2 className="review-v3__heading">
                        Lihat pengalaman mereka,
                        <strong>bangun UI dengan percaya diri.</strong>
                    </h2>

                    <div className="review-v3__rating" aria-label="Nilai 4.9 dari 5 berdasarkan 9 ulasan">
                        <span>4.9/5</span>
                        <Star size={24} strokeWidth={0} fill="currentColor" aria-hidden="true" />
                        <strong>Dealtech UI</strong>
                        <small>Berdasarkan 9 ulasan</small>
                    </div>
                </div>

                <div className="review-v3__layout">
                    <aside className="review-v3__intro">
                        <Quote size={52} strokeWidth={0} fill="currentColor" aria-hidden="true" />
                        <h3>Apa kata developer kami</h3>
                        <div className="review-v3__nav">
                            <button type="button" onClick={() => slideReview(-1)} aria-label="Ulasan sebelumnya">
                                <ArrowLeft size={17} strokeWidth={2} aria-hidden="true" />
                            </button>
                            <span />
                            <button type="button" onClick={() => slideReview(1)} aria-label="Ulasan berikutnya">
                                <ArrowRight size={17} strokeWidth={2} aria-hidden="true" />
                            </button>
                        </div>
                    </aside>

                    <div className="review-v3__track" ref={trackRef}>
                        {reviews.map((review, index) => (
                            <article className="review-v3__item" key={review.name}>
                                <div className="review-v3__card">
                                    <p>{review.text}</p>
                                    <div className="review-v3__stars" aria-label="Nilai 5 dari 5">
                                        {Array.from({ length: 5 }).map((_, starIndex) => (
                                            <Star
                                                key={starIndex}
                                                size={14}
                                                strokeWidth={0}
                                                fill="currentColor"
                                                aria-hidden="true"
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="review-v3__author">
                                    <span className={`review-v3__avatar review-v3__avatar--${(index % 4) + 1}`}>
                                        {review.initials}
                                    </span>
                                    <span>
                                        <strong>{review.name}</strong>
                                        <small>{review.role}</small>
                                    </span>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
