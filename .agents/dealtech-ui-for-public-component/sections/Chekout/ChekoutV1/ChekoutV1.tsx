import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import {
    Banknote,
    Building2,
    Check,
    CheckCircle2,
    Clock3,
    Copy,
    CreditCard,
    ImagePlus,
    Info,
    QrCode,
    ReceiptText,
    ShoppingCart,
    Upload,
    type LucideIcon,
} from 'lucide-react';

import './chekout-v1.css';

export type ChekoutMode = 'baru' | 'perpanjang';

export interface ChekoutCustomer {
    orderCode: string;
    name: string;
    email: string;
    phone: string;
    status: string;
}

export interface ChekoutPlan {
    name: string;
    price: number;
    validUntil: string;
}

export interface ChekoutPaymentMethod {
    id: string;
    type: 'bank_transfer' | 'virtual_account' | 'qris' | 'cash' | string;
    name: string;
    provider?: string;
    accountNumber?: string;
    accountName?: string;
    qrisImage?: string;
    instructions?: string;
}

export interface ChekoutV1Props {
    mode?: ChekoutMode;
    customer?: ChekoutCustomer;
    plan?: ChekoutPlan;
    paymentMethods?: ChekoutPaymentMethod[];
    onProofSubmit?: (file: File) => void;
}

const proofTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

function ProofCanvas({ file }: { file: File }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        let active = true;

        void createImageBitmap(file)
            .then((bitmap) => {
                if (!active) {
                    bitmap.close();
                    return;
                }

                const canvas = canvasRef.current;
                const context = canvas?.getContext('2d');
                if (!canvas || !context) {
                    bitmap.close();
                    return;
                }

                const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
                canvas.width = Math.max(1, Math.round(bitmap.width * scale));
                canvas.height = Math.max(1, Math.round(bitmap.height * scale));
                context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
                bitmap.close();
            })
            .catch(() => {
                const canvas = canvasRef.current;
                if (!canvas) return;
                canvas.width = 1;
                canvas.height = 1;
            });

        return () => {
            active = false;
        };
    }, [file]);

    return <canvas ref={canvasRef} role="img" aria-label="Pratinjau bukti pembayaran" />;
}

const defaultCustomer: ChekoutCustomer = {
    orderCode: 'ORD-2026-001',
    name: 'Nama Pelanggan',
    email: 'pelanggan@example.com',
    phone: '0812 3456 7890',
    status: 'Aktif',
};

const defaultPlan: ChekoutPlan = {
    name: 'Pro',
    price: 1_200_000,
    validUntil: '21 September 2027',
};

const defaultPaymentMethods: ChekoutPaymentMethod[] = [
    {
        id: 'bank-transfer',
        type: 'bank_transfer',
        name: 'Transfer Bank',
        provider: 'BANK',
        accountNumber: '1234567890',
        accountName: 'PT Nama Perusahaan',
        instructions: 'Transfer sesuai total pembayaran, lalu unggah bukti pada langkah berikutnya.',
    },
    {
        id: 'virtual-account',
        type: 'virtual_account',
        name: 'Virtual Account',
        provider: 'VA',
        accountNumber: '8800123456789',
        accountName: 'PT Nama Perusahaan',
        instructions: 'Gunakan nomor virtual account dan pastikan nominal pembayaran sesuai tagihan.',
    },
    {
        id: 'qris',
        type: 'qris',
        name: 'QRIS',
        provider: 'QRIS',
        instructions: 'Pindai kode QR dan selesaikan pembayaran melalui aplikasi pilihan Anda.',
    },
];

const methodIcons: Record<string, LucideIcon> = {
    bank_transfer: Banknote,
    virtual_account: Building2,
    qris: QrCode,
    cash: Banknote,
};

function formatCurrency(value: number) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(value);
}

async function copyText(text: string) {
    if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return;
    }

    const input = document.createElement('textarea');
    input.value = text;
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.appendChild(input);
    input.select();
    const copied = document.execCommand('copy');
    document.body.removeChild(input);
    if (!copied) throw new Error('Gagal menyalin');
}

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'normal' | 'ghost';
    icon?: LucideIcon;
    children?: ReactNode;
}

function ActionButton({
    variant = 'normal',
    icon: Icon,
    children,
    className = '',
    type = 'button',
    ...props
}: ActionButtonProps) {
    return (
        <button
            type={type}
            className={`chekout-v1__button chekout-v1__button--${variant}${children ? '' : ' chekout-v1__button--icon'}${className ? ` ${className}` : ''}`}
            {...props}
        >
            {Icon ? <Icon aria-hidden="true" /> : null}
            {children ? <span>{children}</span> : null}
        </button>
    );
}

function PaymentDetails({ method }: { method: ChekoutPaymentMethod }) {
    const [copied, setCopied] = useState(false);

    const copyAccount = async () => {
        if (!method.accountNumber) return;

        try {
            await copyText(method.accountNumber);
            setCopied(true);
        } catch {
            setCopied(false);
        }
    };

    return (
        <div className="chekout-v1__payment-details">
            <div className="chekout-v1__payment-head">
                <div>
                    <span className="chekout-v1__payment-label">Metode terpilih</span>
                    <strong>{method.name}</strong>
                </div>
                {method.provider ? <span className="chekout-v1__provider">{method.provider}</span> : null}
            </div>

            {method.qrisImage ? (
                <img className="chekout-v1__qris" src={method.qrisImage} alt={`QRIS ${method.name}`} />
            ) : null}

            {method.accountNumber ? (
                <dl className="chekout-v1__account-data">
                    <div>
                        <dt>Nomor rekening / VA</dt>
                        <dd>
                            <span>{method.accountNumber}</span>
                            <ActionButton
                                variant="ghost"
                                icon={copied ? Check : Copy}
                                onClick={copyAccount}
                                aria-label={copied ? 'Nomor rekening tersalin' : 'Salin nomor rekening'}
                                title={copied ? 'Tersalin' : 'Salin nomor rekening'}
                            />
                        </dd>
                    </div>
                    {method.accountName ? (
                        <div>
                            <dt>Atas nama</dt>
                            <dd>{method.accountName}</dd>
                        </div>
                    ) : null}
                </dl>
            ) : null}

            {method.type === 'qris' && !method.qrisImage ? (
                <div className="chekout-v1__notice chekout-v1__notice--info" role="status">
                    <Info aria-hidden="true" />
                    <span>Kode QR akan diberikan oleh penyedia pembayaran.</span>
                </div>
            ) : null}

            {method.instructions ? <p className="chekout-v1__instructions">{method.instructions}</p> : null}
        </div>
    );
}

export default function ChekoutV1({
    mode = 'baru',
    customer = defaultCustomer,
    plan = defaultPlan,
    paymentMethods = defaultPaymentMethods,
    onProofSubmit,
}: ChekoutV1Props) {
    const [step, setStep] = useState<'checkout' | 'pembayaran'>('checkout');
    const [methodId, setMethodId] = useState('');
    const [proof, setProof] = useState<File | null>(null);
    const [proofSubmitted, setProofSubmitted] = useState(false);
    const proofInputRef = useRef<HTMLInputElement>(null);

    const selectedMethod = paymentMethods.find((method) => method.id === methodId) ?? null;

    const checkoutTitle = mode === 'perpanjang' ? 'Checkout perpanjangan paket' : 'Checkout pembelian paket';
    const checkoutDescription =
        mode === 'perpanjang'
            ? 'Periksa paket dan metode pembayaran untuk memperpanjang masa aktif layanan.'
            : 'Periksa paket yang dipilih sebelum melanjutkan pembelian.';

    const submitProof = () => {
        if (!proof || proofSubmitted) return;
        onProofSubmit?.(proof);
        setProofSubmitted(true);
    };

    return (
        <section className="chekout-v1">
            <div className="chekout-v1__shell">
                <a href="https://github.com/Deal-Tech/dealtech-ui-for-public-component/tree/main/sections/Chekout/ChekoutV1" target="_blank" rel="noreferrer" className="chekout-v1__eyebrow">Chekout/ChekoutV1</a>
                <div className="chekout-v1__page">
                    <div className="chekout-v1__bar" role="note">
                        {step === 'checkout' ? (
                            <ShoppingCart className="chekout-v1__bar-icon" aria-hidden="true" />
                        ) : (
                            <ReceiptText className="chekout-v1__bar-icon" aria-hidden="true" />
                        )}
                        <span>{step === 'checkout' ? checkoutTitle : 'Detail pesanan'}</span>
                        <strong>
                            {step === 'checkout'
                                ? checkoutDescription
                                : 'Lakukan pembayaran dan unggah bukti untuk memproses pesanan.'}
                        </strong>
                    </div>

                    {step === 'checkout' ? (
                        <div className="chekout-v1__grid">
                            <section className="chekout-v1__card">
                                <div className="chekout-v1__card-body chekout-v1__stack">
                                    <h2 className="chekout-v1__title">Data Pelanggan</h2>
                                    <dl className="chekout-v1__summary">
                                        <div>
                                            <dt>Kode pesanan</dt>
                                            <dd>{customer.orderCode}</dd>
                                        </div>
                                        <div>
                                            <dt>Nama pelanggan</dt>
                                            <dd>{customer.name}</dd>
                                        </div>
                                        <div>
                                            <dt>Email</dt>
                                            <dd>{customer.email}</dd>
                                        </div>
                                        <div>
                                            <dt>No. HP</dt>
                                            <dd>{customer.phone}</dd>
                                        </div>
                                        <div>
                                            <dt>Status</dt>
                                            <dd>{customer.status}</dd>
                                        </div>
                                    </dl>
                                </div>
                            </section>

                            <section className="chekout-v1__card">
                                <div className="chekout-v1__card-body chekout-v1__stack">
                                    <h2 className="chekout-v1__title">Ringkasan Checkout</h2>
                                    <dl className="chekout-v1__summary">
                                        <div>
                                            <dt>Paket yang dipilih</dt>
                                            <dd>Paket {plan.name}</dd>
                                        </div>
                                        <div>
                                            <dt>Harga yang harus dibayar</dt>
                                            <dd>{formatCurrency(plan.price)}</dd>
                                        </div>
                                        <div>
                                            <dt>Berlaku sampai</dt>
                                            <dd>{plan.validUntil}</dd>
                                        </div>
                                    </dl>

                                    <div className="chekout-v1__divider" />

                                    <div>
                                        <p className="chekout-v1__label">Metode pembayaran</p>
                                        <div
                                            className="chekout-v1__methods"
                                            role="radiogroup"
                                            aria-label="Metode pembayaran"
                                        >
                                            {paymentMethods.map((method) => {
                                                const Icon = methodIcons[method.type] ?? CreditCard;
                                                const active = method.id === methodId;

                                                return (
                                                    <button
                                                        key={method.id}
                                                        type="button"
                                                        role="radio"
                                                        aria-checked={active}
                                                        className={`chekout-v1__method${active ? ' chekout-v1__method--active' : ''}`}
                                                        onClick={() => setMethodId(method.id)}
                                                    >
                                                        <Icon aria-hidden="true" />
                                                        <span>
                                                            <strong>{method.name}</strong>
                                                        </span>
                                                        <CheckCircle2
                                                            className="chekout-v1__method-check"
                                                            aria-hidden="true"
                                                        />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {selectedMethod ? <PaymentDetails method={selectedMethod} /> : null}

                                    <div>
                                        <ActionButton
                                            icon={CreditCard}
                                            disabled={!selectedMethod}
                                            onClick={() => selectedMethod && setStep('pembayaran')}
                                        >
                                            Bayar Sekarang
                                        </ActionButton>
                                    </div>
                                </div>
                            </section>
                        </div>
                    ) : selectedMethod ? (
                        <div className="chekout-v1__grid">
                            <section className="chekout-v1__card">
                                <div className="chekout-v1__card-body chekout-v1__stack">
                                    <h2 className="chekout-v1__title">Detail Pesanan</h2>
                                    <dl className="chekout-v1__summary">
                                        <div>
                                            <dt>Kode pesanan</dt>
                                            <dd>{customer.orderCode}</dd>
                                        </div>
                                        <div>
                                            <dt>Jenis transaksi</dt>
                                            <dd>{mode === 'perpanjang' ? 'Perpanjangan' : 'Pembelian baru'}</dd>
                                        </div>
                                        <div>
                                            <dt>Paket</dt>
                                            <dd>Paket {plan.name}</dd>
                                        </div>
                                        <div>
                                            <dt>Total pembayaran</dt>
                                            <dd>{formatCurrency(plan.price)}</dd>
                                        </div>
                                        <div>
                                            <dt>Berlaku sampai</dt>
                                            <dd>{plan.validUntil}</dd>
                                        </div>
                                        <div>
                                            <dt>Status</dt>
                                            <dd>
                                                <span
                                                    className={`chekout-v1__status ${proofSubmitted ? 'chekout-v1__status--blue' : 'chekout-v1__status--amber'}`}
                                                >
                                                    {proofSubmitted ? (
                                                        <CheckCircle2 aria-hidden="true" />
                                                    ) : (
                                                        <Clock3 aria-hidden="true" />
                                                    )}
                                                    {proofSubmitted ? 'Menunggu Verifikasi' : 'Lakukan Pembayaran'}
                                                </span>
                                            </dd>
                                        </div>
                                    </dl>
                                </div>
                            </section>

                            <section className="chekout-v1__card">
                                <div className="chekout-v1__card-body chekout-v1__stack">
                                    <PaymentDetails method={selectedMethod} />
                                    <div className="chekout-v1__divider" />
                                    <div>
                                        <h2 className="chekout-v1__title">Bukti Pembayaran</h2>
                                        <p className="chekout-v1__description">
                                            Unggah satu bukti pembayaran yang jelas. Bukti tidak dapat diganti setelah
                                            dikirim.
                                        </p>
                                    </div>

                                    <input
                                        ref={proofInputRef}
                                        type="file"
                                        className="chekout-v1__proof-input"
                                        accept="image/jpeg,image/png,image/webp"
                                        disabled={proofSubmitted}
                                        onChange={(event) => {
                                            if (proofSubmitted) return;
                                            const file = event.target.files?.[0];
                                            setProof(file && proofTypes.has(file.type) ? file : null);
                                            event.target.value = '';
                                        }}
                                    />

                                    {proof ? (
                                        <div className="chekout-v1__proof-preview">
                                            <ProofCanvas file={proof} />
                                            <span>{proof.name}</span>
                                        </div>
                                    ) : null}

                                    {proofSubmitted ? (
                                        <>
                                            <div className="chekout-v1__notice chekout-v1__notice--success" role="status">
                                                <CheckCircle2 aria-hidden="true" />
                                                <span>Bukti pembayaran sudah diunggah dan tidak dapat diunggah ulang.</span>
                                            </div>
                                            <ActionButton icon={Check} disabled>
                                                Bukti Sudah Diunggah
                                            </ActionButton>
                                        </>
                                    ) : (
                                        <div className="chekout-v1__proof-actions">
                                            <ActionButton
                                                variant="ghost"
                                                icon={ImagePlus}
                                                onClick={() => proofInputRef.current?.click()}
                                            >
                                                {proof ? 'Ganti Bukti' : 'Pilih Bukti'}
                                            </ActionButton>
                                            <ActionButton icon={Upload} disabled={!proof} onClick={submitProof}>
                                                Unggah Bukti Pembayaran
                                            </ActionButton>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>
                    ) : null}
                </div>
            </div>
        </section>
    );
}
