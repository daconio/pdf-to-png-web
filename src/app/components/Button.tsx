import React from 'react';

export const Button = ({ children, variant = 'primary', className = '', ...props }: any) => {
    const baseStyles = "font-bold border-2 border-black px-6 py-2 transition-all active:translate-y-1 active:shadow-none flex items-center gap-2";
    const variants = {
        primary: "bg-primary text-white shadow-neo hover:-translate-y-1 hover:shadow-neo-lg",
        secondary: "bg-white text-black shadow-neo-sm hover:bg-gray-50"
    };

    return (
        <button className={`${baseStyles} ${variants[variant as keyof typeof variants]} ${className}`} {...props}>
            {children}
        </button>
    );
};
