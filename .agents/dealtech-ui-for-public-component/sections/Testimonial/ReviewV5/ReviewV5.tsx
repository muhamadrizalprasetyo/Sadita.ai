import { useEffect, useRef } from 'react';
import { Heart, Instagram, MessageCircle } from 'lucide-react';

import './review-v5.css';

type Platform = 'instagram' | 'facebook' | 'x';

const reviews: Array<{
    name: string;
    username: string;
    initials: string;
    platform: Platform;
    text: string;
    likes: string;
    comments: string;
}> = [
    {
        name: 'A**** M.',
        username: '@arifbuilds',
        initials: 'AM',
        platform: 'x',
        text: 'Sudah beberapa kali memakai Dealtech UI untuk landing page. Komponennya membuat proses dari ide ke tampilan jadi jauh lebih cepat.',
        likes: '1.2k',
        comments: '86',
    },
    {
        name: 'R**** H.',
        username: '@rani.design',
        initials: 'RH',
        platform: 'instagram',
        text: 'Pilihan section-nya rapi dan mudah dikembangkan. Cocok untuk designer yang ingin hasil konsisten saat diteruskan ke developer.',
        likes: '980',
        comments: '54',
    },
    {
        name: 'S**** F.',
        username: '@syafrontend',
        initials: 'SF',
        platform: 'facebook',
        text: 'Baru mencoba beberapa hero dan hasilnya langsung responsif. Tinggal pilih varian, ubah konten, lalu sesuaikan kebutuhan produk.',
        likes: '760',
        comments: '42',
    },
    {
        name: 'D**** P.',
        username: '@dimas.product',
        initials: 'DP',
        platform: 'facebook',
        text: 'Dealtech UI membantu tim kami menyamakan bahasa visual antara design dan development tanpa proses yang panjang.',
        likes: '1k',
        comments: '63',
    },
    {
        name: 'N**** A.',
        username: '@nabila.codes',
        initials: 'NA',
        platform: 'instagram',
        text: 'Struktur komponen mudah dibaca dan tidak berlebihan. Saya bisa memindahkan section yang dibutuhkan tanpa membawa dependensi rumit.',
        likes: '845',
        comments: '38',
    },
    {
        name: 'F**** R.',
        username: '@fajarships',
        initials: 'FR',
        platform: 'x',
        text: 'Salah satu fondasi UI yang paling praktis untuk memulai proyek baru. Cepat, fleksibel, dan tetap terasa punya karakter.',
        likes: '1.4k',
        comments: '91',
    },
    {
        name: 'I**** K.',
        username: '@indrakreatif',
        initials: 'IK',
        platform: 'instagram',
        text: 'Pengerjaan revisi mobile menjadi lebih singkat karena setiap detail responsifnya sudah dipikirkan sejak awal.',
        likes: '690',
        comments: '29',
    },
    {
        name: 'L**** S.',
        username: '@laras.ui',
        initials: 'LS',
        platform: 'x',
        text: 'Akhirnya ada koleksi komponen publik yang tampil modern tetapi tetap mudah dikustom sesuai identitas brand.',
        likes: '1.1k',
        comments: '72',
    },
    {
        name: 'M**** T.',
        username: '@maultech',
        initials: 'MT',
        platform: 'facebook',
        text: 'Tim dapat fokus pada alur produk karena fondasi tampilannya sudah konsisten dan siap dipakai di berbagai halaman.',
        likes: '930',
        comments: '47',
    },
];

function PlatformIcon({ platform }: { platform: Platform }) {
    if (platform === 'instagram') {
        return <Instagram size={16} aria-label="Instagram" />;
    }

    return <span aria-label={platform === 'facebook' ? 'Facebook' : 'X'}>{platform === 'facebook' ? 'f' : 'X'}</span>;
}

export default function ReviewV5() {
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    section.classList.add('review-v5--visible');
                    observer.disconnect();
                }
            },
            { threshold: 0.08, rootMargin: '0px 0px -40px 0px' },
        );

        observer.observe(section);
        return () => observer.disconnect();
    }, []);

    return (
        <section ref={sectionRef} className="review-v5">
            <div className="review-v5__shell">
                <header className="review-v5__header">
                    <a href="https://github.com/Deal-Tech/dealtech-ui-for-public-component/tree/main/sections/Testimonial/ReviewV5" target="_blank" rel="noreferrer" className="review-v5__eyebrow">Testimonial/ReviewV5</a>
                    <h2>
                        Jangan hanya percaya kata kami.
                        <span>Dengarkan para pengguna</span>
                    </h2>
                    <p>Komentar nyata dari berbagai tim yang membangun produk digital bersama Dealtech UI.</p>
                </header>

                <div className="review-v5__masonry">
                    {reviews.map((review, index) => (
                        <article className="review-v5__card" key={review.username}>
                            <header className="review-v5__author">
                                <span className={`review-v5__avatar review-v5__avatar--${(index % 3) + 1}`}>
                                    {review.initials}
                                </span>
                                <span className="review-v5__identity">
                                    <strong>{review.name}</strong>
                                    <small>{review.username}</small>
                                </span>
                                <span className="review-v5__platform">
                                    <PlatformIcon platform={review.platform} />
                                </span>
                            </header>

                            <p>{review.text}</p>

                            <footer className="review-v5__meta">
                                <span><Heart size={13} aria-hidden="true" /> {review.likes}</span>
                                <span><MessageCircle size={13} aria-hidden="true" /> {review.comments}</span>
                                <time>Hari ini</time>
                            </footer>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
