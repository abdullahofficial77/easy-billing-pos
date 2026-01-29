import { useState, useEffect } from 'react';
import { verifyPIN } from '../../db/database';

export default function PinLock({ onUnlock }) {
    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (pin.length === 4) {
            handleVerify(pin);
        }
    }, [pin]);

    // Keyboard support - type numbers or use backspace
    useEffect(() => {
        const handleKeyDown = (e) => {
            const key = e.key;
            if (/^\d$/.test(key)) {
                setPin(prev => {
                    if (prev.length < 4) return prev + key;
                    return prev;
                });
            } else if (key === 'Backspace') {
                setPin(prev => prev.slice(0, -1));
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleVerify = async (currentPin) => {
        const valid = await verifyPIN(currentPin);

        if (valid) {
            onUnlock();
        } else {
            setError(true);
            setErrorMsg('Wrong PIN');
            setTimeout(() => {
                setError(false);
                setErrorMsg('');
                setPin('');
            }, 500);
        }
    };

    const handleKeyPress = (key) => {
        if (pin.length < 4) {
            setPin(prev => prev + key);
        }
    };

    const handleBackspace = () => {
        setPin(prev => prev.slice(0, -1));
    };

    const renderDots = () => {
        return Array.from({ length: 4 }, (_, i) => (
            <div
                key={i}
                className={`pin-dot ${i < pin.length ? 'filled' : ''} ${error ? 'error' : ''}`}
            />
        ));
    };

    const renderKey = (key) => {
        if (key === '') {
            return <div className="pin-key empty" />;
        }
        if (key === 'back') {
            return (
                <button className="pin-key backspace" onClick={handleBackspace}>
                    ⌫
                </button>
            );
        }
        return (
            <button className="pin-key" onClick={() => handleKeyPress(key)}>
                {key}
            </button>
        );
    };

    return (
        <div className="pin-screen">
            <div className="pin-logo">Easy Billing POS</div>
            <div className="pin-subtitle">Enter 4-digit PIN</div>

            <div className="pin-dots">
                {renderDots()}
            </div>

            <div className="pin-keypad">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'].map((key, i) => (
                    <div key={i}>{renderKey(key)}</div>
                ))}
            </div>

            <div className="pin-error-msg">{errorMsg}</div>
        </div>
    );
}
