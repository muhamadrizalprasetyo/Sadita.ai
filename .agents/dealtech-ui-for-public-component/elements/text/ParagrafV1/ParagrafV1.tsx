import './paragraf-v1.css';

export interface ParagrafV1Props {
    children?: string;
    className?: string;
}

export default function ParagrafV1({
    children = 'Rancang halaman lebih cepat dengan komponen UI siap pakai yang responsif, konsisten, dan mudah disesuaikan untuk berbagai kebutuhan proyek.',
    className = '',
}: ParagrafV1Props) {
    return <p className={`paragraf-v1${className ? ` ${className}` : ''}`}>{children}</p>;
}
