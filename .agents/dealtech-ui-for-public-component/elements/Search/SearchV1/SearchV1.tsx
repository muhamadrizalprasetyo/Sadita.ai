import type { FormEventHandler } from 'react';
import { Search } from 'lucide-react';

import './search-v1.css';

interface SearchV1Props {
    placeholder?: string;
    buttonLabel?: string;
    name?: string;
    onSubmit?: FormEventHandler<HTMLFormElement>;
}

export default function SearchV1({
    placeholder = 'Masukkan kata kunci',
    buttonLabel = 'Mulai Sekarang',
    name = 'search',
    onSubmit,
}: SearchV1Props) {
    return (
        <form className="search-v1" role="search" onSubmit={onSubmit}>
            <Search className="search-v1__icon" size={18} strokeWidth={2} aria-hidden="true" />
            <input className="search-v1__input" type="search" name={name} placeholder={placeholder} />
            <button className="search-v1__button" type="submit">
                {buttonLabel}
            </button>
        </form>
    );
}
