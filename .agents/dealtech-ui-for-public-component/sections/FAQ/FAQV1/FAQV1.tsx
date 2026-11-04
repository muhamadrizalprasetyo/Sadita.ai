import { useEffect, useRef } from 'react';
import {
    BadgeHelp,
    Box,
    CircleDollarSign,
    Code2,
    CreditCard,
    FileBadge,
    GitPullRequest,
    Layers3,
    Palette,
    RefreshCw,
    ScanLine,
    Smartphone,
    Sparkles,
} from 'lucide-react';

import './faq-v1.css';

const faqs = [
    {
        question: 'Apakah semua komponen gratis?',
        answer: 'Ya. Seluruh komponen publik dapat disalin, diubah, dan digunakan tanpa biaya.',
        Icon: CircleDollarSign,
    },
    {
        question: 'Bagaimana cara memakai komponennya?',
        answer: 'Pilih komponen, salin file TSX dan CSS, lalu sesuaikan konten dengan kebutuhan proyek.',
        Icon: Code2,
    },
    {
        question: 'Bisa dipakai untuk proyek komersial?',
        answer: 'Bisa. Komponen boleh digunakan untuk proyek pribadi maupun komersial.',
        Icon: FileBadge,
    },
    {
        question: 'Apakah perlu proses instalasi?',
        answer: 'Tidak ada instalasi khusus. Ambil file yang dibutuhkan dan pindahkan langsung ke proyek.',
        Icon: Box,
    },
    {
        question: 'Teknologi apa yang digunakan?',
        answer: 'Komponen ditulis dengan React TSX, CSS mandiri, dan ikon dari Lucide React.',
        Icon: Layers3,
    },
    {
        question: 'Apakah tampilannya responsif?',
        answer: 'Ya. Setiap komponen dirancang agar tetap nyaman pada layar desktop dan mobile.',
        Icon: Smartphone,
    },
    {
        question: 'Bolehkah desainnya diubah?',
        answer: 'Tentu. Warna, teks, spacing, dan struktur visual bebas disesuaikan.',
        Icon: Palette,
    },
    {
        question: 'Apakah aset sudah tersedia?',
        answer: 'Komponen yang membutuhkan aset menyertakannya di dalam folder komponennya.',
        Icon: ScanLine,
    },
    {
        question: 'Bisa dipakai untuk banyak proyek?',
        answer: 'Bisa. Tidak ada batas jumlah proyek untuk menggunakan koleksi publik ini.',
        Icon: CreditCard,
    },
    {
        question: 'Apakah koleksi akan diperbarui?',
        answer: 'Ya. Komponen dan variasi baru akan ditambahkan secara bertahap.',
        Icon: RefreshCw,
    },
    {
        question: 'Bagaimana cara berkontribusi?',
        answer: 'Kirim pull request dengan komponen yang mandiri, rapi, dan responsif.',
        Icon: GitPullRequest,
    },
    {
        question: 'Apakah wajib mencantumkan kredit?',
        answer: 'Tidak wajib. Kamu tetap boleh mencantumkan sumber bila ingin mendukung proyek.',
        Icon: Sparkles,
    },
];

export default function FAQV1() {
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('faq-v1__visible');
                        entry.target.classList.remove('faq-v1__hidden');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
        );

        section.querySelectorAll('.faq-v1__reveal').forEach((element) => observer.observe(element));
        return () => observer.disconnect();
    }, []);

    return (
        <section ref={sectionRef} className="faq-v1">
            <div className="faq-v1__shell">
                <header className="faq-v1__header faq-v1__reveal faq-v1__hidden">
                    <a href="https://github.com/Deal-Tech/dealtech-ui-for-public-component/tree/main/sections/FAQ/FAQV1" target="_blank" rel="noreferrer" className="faq-v1__eyebrow">
                        <BadgeHelp size={15} strokeWidth={2.4} aria-hidden="true" />
                        FAQ/FAQV1
                    </a>
                    <h2 className="faq-v1__heading">
                        Pertanyaan yang <span>Sering Diajukan</span>
                    </h2>
                    <p className="faq-v1__description">
                        Temukan jawaban singkat seputar penggunaan komponen publik Dealtech UI.
                    </p>
                </header>

                <div className="faq-v1__grid">
                    {faqs.map(({ question, answer, Icon }) => (
                        <article className="faq-v1__item faq-v1__reveal faq-v1__hidden" key={question}>
                            <span className="faq-v1__icon" aria-hidden="true">
                                <Icon size={17} strokeWidth={2} />
                            </span>
                            <div>
                                <h3>{question}</h3>
                                <p>{answer}</p>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
