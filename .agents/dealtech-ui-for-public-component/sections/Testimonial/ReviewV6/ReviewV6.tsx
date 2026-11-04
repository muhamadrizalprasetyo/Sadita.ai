import { useEffect, useRef } from 'react';
import { Heart, Instagram, MessageCircle, Star } from 'lucide-react';

import './review-v6.css';

type Platform = 'instagram' | 'facebook' | 'x';

type ReviewItem = {
    type: 'review';
    name: string;
    username: string;
    initials: string;
    platform: Platform;
    text: string;
    likes: string;
    comments: string;
};

type RatingItem = {
    type: 'rating';
    source: string;
    score: string;
    caption: string;
};

type Item = ReviewItem | RatingItem;

const columns: Item[][] = [
    [
        { type: 'rating', source: 'Komunitas Developer', score: '5.0', caption: 'Pengalaman membangun UI' },
        {
            type: 'review', name: 'A**** M.', username: '@arifbuilds', initials: 'AM', platform: 'x', likes: '1.2k', comments: '86',
            text: 'Tampilannya segar, responsif, dan mudah dipakai. Hanya butuh beberapa menit untuk mulai menyusun halaman pertama.',
        },
        {
            type: 'review', name: 'R**** H.', username: '@rani.design', initials: 'RH', platform: 'instagram', likes: '980', comments: '54',
            text: 'Fondasi UI yang intuitif untuk membawa ide design menjadi halaman siap pakai tanpa proses panjang.',
        },
    ],
    [
        {
            type: 'review', name: 'S**** F.', username: '@syafrontend', initials: 'SF', platform: 'facebook', likes: '760', comments: '42',
            text: 'Mudah dipahami dengan pengalaman implementasi yang menyenangkan. Struktur setiap komponennya terasa jelas sejak awal.',
        },
        {
            type: 'review', name: 'D**** P.', username: '@dimas.product', initials: 'DP', platform: 'facebook', likes: '1k', comments: '63',
            text: 'Koleksi komponen ini mengubah cara tim kami mengembangkan halaman. Lebih cepat, konsisten, dan tetap fleksibel.',
        },
        {
            type: 'review', name: 'N**** A.', username: '@nabila.codes', initials: 'NA', platform: 'instagram', likes: '845', comments: '38',
            text: 'Suka sekali karena proses membangun antarmuka menjadi lebih sederhana, efisien, dan mudah dikembangkan kembali.',
        },
    ],
    [
        {
            type: 'review', name: 'F**** R.', username: '@fajarships', initials: 'FR', platform: 'x', likes: '1.4k', comments: '91',
            text: 'Benar-benar membantu tim menghasilkan tampilan berstandar tinggi dengan waktu pengerjaan yang jauh lebih singkat.',
        },
        { type: 'rating', source: 'Pengguna Dealtech UI', score: '4.9', caption: 'Kepuasan penggunaan' },
        {
            type: 'review', name: 'L**** S.', username: '@laras.ui', initials: 'LS', platform: 'instagram', likes: '1.1k', comments: '72',
            text: 'Cepat digunakan, mudah disesuaikan, dan hasilnya tetap rapi di setiap ukuran layar.',
        },
    ],
];

function PlatformIcon({ platform }: { platform: Platform }) {
    if (platform === 'instagram') return <Instagram size={16} aria-label="Instagram" />;
    return <span aria-label={platform === 'facebook' ? 'Facebook' : 'X'}>{platform === 'facebook' ? 'f' : 'X'}</span>;
}

function RatingCard({ item }: { item: RatingItem }) {
    return (
        <article className="review-v6__rating-card">
            <span>{item.source}</span>
            <strong>{item.score}</strong>
            <div aria-label={`Nilai ${item.score} dari 5`}>
                {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} size={16} strokeWidth={0} fill="currentColor" aria-hidden="true" />
                ))}
            </div>
            <small>{item.caption}</small>
        </article>
    );
}

function ReviewCard({ item, index }: { item: ReviewItem; index: number }) {
    return (
        <article className="review-v6__card">
            <header className="review-v6__author">
                <span className={`review-v6__avatar review-v6__avatar--${(index % 3) + 1}`}>{item.initials}</span>
                <span className="review-v6__identity">
                    <strong>{item.name}</strong>
                    <small>{item.username}</small>
                </span>
                <span className="review-v6__platform"><PlatformIcon platform={item.platform} /></span>
            </header>
            <p>{item.text}</p>
            <footer className="review-v6__meta">
                <span><Heart size={13} aria-hidden="true" /> {item.likes}</span>
                <span><MessageCircle size={13} aria-hidden="true" /> {item.comments}</span>
                <time>Hari ini</time>
            </footer>
        </article>
    );
}

export default function ReviewV6() {
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    section.classList.add('review-v6--visible');
                    observer.disconnect();
                }
            },
            { threshold: 0.08, rootMargin: '0px 0px -40px 0px' },
        );

        observer.observe(section);
        return () => observer.disconnect();
    }, []);

    return (
        <section ref={sectionRef} className="review-v6">
            <a href="https://github.com/Deal-Tech/dealtech-ui-for-public-component/tree/main/sections/Testimonial/ReviewV6" target="_blank" rel="noreferrer" className="review-v6__eyebrow">Testimonial/ReviewV6</a>
            <div className="review-v6__shell">
                {columns.map((column, columnIndex) => (
                    <div className="review-v6__column" key={columnIndex}>
                        {column.map((item, itemIndex) => item.type === 'rating' ? (
                            <RatingCard item={item} key={item.source} />
                        ) : (
                            <ReviewCard item={item} index={(columnIndex * 3) + itemIndex} key={item.username} />
                        ))}
                    </div>
                ))}
            </div>
        </section>
    );
}
