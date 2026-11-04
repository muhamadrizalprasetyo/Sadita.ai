import './heading-stroke-v1.css';

export interface HeadingStrokeV1Props {
    title?: string;
    accent?: string;
    suffix?: string;
    className?: string;
}

export default function HeadingStrokeV1({
    title = 'Sederhanakan Design UI, Pakai',
    accent = 'Dealtech UI',
    suffix = 'For Public Components',
    className = '',
}: HeadingStrokeV1Props) {
    return (
        <h1 className={`heading-stroke-v1${className ? ` ${className}` : ''}`}>
            <span>{title}</span>{' '}
            <span className="heading-stroke-v1__accent">{accent}</span>{' '}
            <span>{suffix}</span>
        </h1>
    );
}
