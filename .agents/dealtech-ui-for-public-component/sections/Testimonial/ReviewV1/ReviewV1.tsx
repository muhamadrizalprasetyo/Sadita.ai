import { useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

import './review-v1.css';

const reviews = [
    {
        name: 'A**** M. — Finance Manager',
        text: 'Dulu setiap halaman dimulai dari nol. Sekarang kami memilih komponen yang sesuai lalu menyesuaikan konten dan warnanya.',
    },
    {
        name: 'R**** H. — Customer Support',
        text: 'Komponen yang responsif sejak awal membuat proses review lebih singkat dan mengurangi revisi tampilan mobile.',
    },
    {
        name: 'S**** F. — Operations Lead',
        text: 'Struktur file dan CSS yang konsisten memudahkan tim memindahkan section ke proyek tanpa mengubah design dasarnya.',
    },
    {
        name: 'D**** P. — Product Designer',
        text: 'Komponen yang konsisten membuat proses menyusun halaman jauh lebih cepat dan hasil akhirnya terasa lebih rapi.',
    },
    {
        name: 'N**** A. — Frontend Developer',
        text: 'Strukturnya mudah dipahami dan responsif sejak awal. Penyesuaian warna serta konten juga sangat praktis.',
    },
    {
        name: 'F**** R. — Project Manager',
        text: 'Waktu pengerjaan antarmuka menjadi lebih terukur karena seluruh tim menggunakan pola komponen yang sama.',
    },
    {
        name: 'I**** K. — Business Owner',
        text: 'Kami dapat meluncurkan halaman baru lebih cepat tanpa mengorbankan konsistensi tampilan di setiap perangkat.',
    },
    {
        name: 'L**** S. — UI Engineer',
        text: 'Setiap komponen mudah dikembangkan kembali dan tidak menyulitkan saat kebutuhan produk mulai bertambah.',
    },
    {
        name: 'M**** T. — Creative Lead',
        text: 'Design tetap fleksibel mengikuti identitas brand, sementara fondasi layout sudah tertata dengan baik.',
    },
];

export default function ReviewV1() {
    const sectionRef = useRef<HTMLElement>(null);
    const reviewTrackRef = useRef<HTMLDivElement>(null);

    const slideReview = (direction: -1 | 1) => {
        const track = reviewTrackRef.current;
        if (!track) return;

        const card = track.querySelector('.review-v1__card');
        const step = card ? card.getBoundingClientRect().width + 16 : track.clientWidth;
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        track.scrollBy({ left: direction * step, behavior: reduceMotion ? 'auto' : 'smooth' });
    };

    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    section.classList.add('review-v1--visible');
                    observer.disconnect();
                }
            },
            { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
        );

        observer.observe(section);
        return () => observer.disconnect();
    }, []);

    return (
        <section ref={sectionRef} className="review-v1">
            <div className="review-v1__shell">
                <a href="https://github.com/Deal-Tech/dealtech-ui-for-public-component/tree/main/sections/Testimonial/ReviewV1" target="_blank" rel="noreferrer" className="review-v1__eyebrow">Testimonial/ReviewV1</a>
                <h2 className="review-v1__heading">
                    Sudah Dipakai Berbagai Tim untuk{' '}
                    <span className="review-v1__heading-accent">Membangun UI Lebih Cepat</span>
                </h2>

                <p className="review-v1__subtitle">
                    Dibangun bersama developer dan designer untuk kebutuhan produk digital sehari-hari.
                </p>

                <div className="review-v1__slider">
                    <div className="review-v1__track" ref={reviewTrackRef}>
                        {reviews.map((review) => (
                            <article key={review.name} className="review-v1__card">
                                <div className="review-v1__stars" aria-label="Nilai 5 dari 5">
                                    {Array.from({ length: 5 }).map((_, index) => (
                                        <Star
                                            key={index}
                                            size={14}
                                            strokeWidth={0}
                                            fill="currentColor"
                                            aria-hidden="true"
                                        />
                                    ))}
                                </div>
                                <p className="review-v1__text">{review.text}</p>
                                <span className="review-v1__name">{review.name}</span>
                            </article>
                        ))}
                    </div>

                    <div className="review-v1__nav">
                        <button
                            type="button"
                            className="review-v1__nav-button"
                            onClick={() => slideReview(-1)}
                            aria-label="Ulasan sebelumnya"
                        >
                            <ChevronLeft size={18} strokeWidth={2.2} aria-hidden="true" />
                        </button>
                        <button
                            type="button"
                            className="review-v1__nav-button"
                            onClick={() => slideReview(1)}
                            aria-label="Ulasan berikutnya"
                        >
                            <ChevronRight size={18} strokeWidth={2.2} aria-hidden="true" />
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
