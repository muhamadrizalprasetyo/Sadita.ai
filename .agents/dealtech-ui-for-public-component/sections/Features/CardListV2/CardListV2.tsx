import { BookOpen, Code2, MonitorSmartphone, Palette } from 'lucide-react';

import './card-list-v2.css';

const features = [
    {
        title: 'Komponen Siap Pakai',
        description: 'Bangun halaman lebih cepat tanpa mulai dari nol.',
        Icon: Code2,
    },
    {
        title: 'Responsif Otomatis',
        description: 'Tampilan tetap rapi di desktop hingga mobile.',
        Icon: MonitorSmartphone,
    },
    {
        title: 'Mudah Disesuaikan',
        description: 'Warna dan konten mudah mengikuti kebutuhan brand.',
        Icon: Palette,
    },
    {
        title: 'Dokumentasi Jelas',
        description: 'Struktur sederhana dan siap digunakan dalam proyek.',
        Icon: BookOpen,
    },
];

export default function CardListV2() {
    return (
        <section className="card-list-v2" aria-label="Keunggulan Dealtech UI">
            <a href="https://github.com/Deal-Tech/dealtech-ui-for-public-component/tree/main/sections/Features/CardListV2" target="_blank" rel="noreferrer" className="card-list-v2__eyebrow">Features/CardListV2</a>
            <div className="card-list-v2__shell">
                {features.map(({ title, description, Icon }) => (
                    <article className="card-list-v2__item" key={title}>
                        <span className="card-list-v2__icon">
                            <Icon size={19} strokeWidth={2} aria-hidden="true" />
                        </span>
                        <span className="card-list-v2__copy">
                            <h2>{title}</h2>
                            <p>{description}</p>
                        </span>
                    </article>
                ))}
            </div>
        </section>
    );
}
