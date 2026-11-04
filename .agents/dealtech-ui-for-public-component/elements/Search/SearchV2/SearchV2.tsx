import type { FormEventHandler } from 'react';
import { Code2, LayoutGrid, Palette, Search } from 'lucide-react';

import './search-v2.css';

interface SearchV2Props {
    buttonLabel?: string;
    onSubmit?: FormEventHandler<HTMLFormElement>;
}

const fields = [
    { label: 'Kategori', placeholder: 'Pilih kategori', name: 'category', Icon: LayoutGrid },
    { label: 'Teknologi', placeholder: 'Pilih teknologi', name: 'technology', Icon: Code2 },
    { label: 'Style', placeholder: 'Pilih style', name: 'style', Icon: Palette },
];

export default function SearchV2({ buttonLabel = 'Cari Komponen', onSubmit }: SearchV2Props) {
    return (
        <form className="search-v2" role="search" onSubmit={onSubmit}>
            <div className="search-v2__fields">
                {fields.map(({ label, placeholder, name, Icon }) => (
                    <label className="search-v2__field" key={name}>
                        <Icon className="search-v2__icon" size={22} strokeWidth={2.5} aria-hidden="true" />
                        <span className="search-v2__field-copy">
                            <strong>{label}</strong>
                            <input type="text" name={name} placeholder={placeholder} />
                        </span>
                    </label>
                ))}
            </div>

            <button className="search-v2__button" type="submit">
                <Search size={16} strokeWidth={2.5} aria-hidden="true" />
                {buttonLabel}
            </button>
        </form>
    );
}
