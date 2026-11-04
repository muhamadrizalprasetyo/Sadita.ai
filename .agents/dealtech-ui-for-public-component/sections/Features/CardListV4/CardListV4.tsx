import { BadgeCheck, LayoutGrid, PanelsTopLeft } from 'lucide-react';

import './card-list-v4.css';

const stats = [
    { value: '1.200+', label: 'Komponen Siap Pakai', Icon: PanelsTopLeft },
    { value: '99%', label: 'Responsif & Konsisten', Icon: BadgeCheck },
    { value: '34', label: 'Kategori Komponen', Icon: LayoutGrid },
];

export default function CardListV4() {
    return (
        <section className="card-list-v4" aria-label="Statistik Dealtech UI">
            <div className="card-list-v4__shell">
                <div className="card-list-v4__intro">
                    <a href="https://github.com/Deal-Tech/dealtech-ui-for-public-component/tree/main/sections/Features/CardListV4" target="_blank" rel="noreferrer" className="card-list-v4__eyebrow">Features/CardListV4</a>
                    <span>Dipercaya oleh</span>
                    <strong>Ribuan Developer dan Tim Produk</strong>
                </div>

                <div className="card-list-v4__stats">
                    {stats.map(({ value, label, Icon }) => (
                        <article className="card-list-v4__stat" key={label}>
                            <span className="card-list-v4__icon">
                                <Icon size={26} strokeWidth={2.2} aria-hidden="true" />
                            </span>
                            <span className="card-list-v4__copy">
                                <strong>{value}</strong>
                                <small>{label}</small>
                            </span>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
