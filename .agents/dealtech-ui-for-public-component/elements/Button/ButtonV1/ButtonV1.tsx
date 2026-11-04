import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';

import './button-v1.css';

type Variant = 'primary' | 'outline';

type BaseProps = {
    variant?: Variant;
    className?: string;
    children: ReactNode;
};

type AnchorProps = BaseProps & { href: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'children'>;
type ButtonProps = BaseProps & { href?: undefined } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'>;

export type ButtonV1Props = AnchorProps | ButtonProps;

export default function ButtonV1({ variant = 'primary', className = '', children, ...rest }: ButtonV1Props) {
    const kelas = `btn-v1 btn-v1--${variant}${className ? ` ${className}` : ''}`;

    // Ada href, render anchor
    if ('href' in rest && rest.href) {
        const { href, ...anchorProps } = rest as AnchorProps;
        return (
            <a className={kelas} href={href} {...anchorProps}>
                <span>{children}</span>
            </a>
        );
    }

    const { type = 'button', ...buttonProps } = rest as ButtonProps;
    return (
        <button className={kelas} type={type} {...buttonProps}>
            <span>{children}</span>
        </button>
    );
}

export function ButtonV1Group({ children, className = '' }: { children: ReactNode; className?: string }) {
    return <div className={`btn-v1-group${className ? ` ${className}` : ''}`}>{children}</div>;
}
