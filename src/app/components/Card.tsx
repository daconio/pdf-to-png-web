import React from 'react';

export const Card = ({ title, children, className = '' }: any) => (
    <div className={`bg-white border-2 border-black shadow-neo p-0 overflow-hidden ${className}`}>
        <div className="border-b-2 border-black bg-gray-50 px-4 py-2 flex items-center justify-between">
            <span className="font-bold uppercase tracking-wider text-sm">{title}</span>
            <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full border border-black bg-red-400"></div>
                <div className="w-2 h-2 rounded-full border border-black bg-yellow-400"></div>
            </div>
        </div>
        <div className="p-6">
            {children}
        </div>
    </div>
);
