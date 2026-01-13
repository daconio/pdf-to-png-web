
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export function SortableItem({ id, file }: { id: string, file: File }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : 'auto',
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="aspect-square rounded-xl glass-panel border-[--card-border] p-2 relative group overflow-hidden cursor-move touch-none">
            <img
                src={URL.createObjectURL(file)}
                alt={file.name}
                className="w-full h-full object-cover rounded-lg pointer-events-none"
                onLoad={(e) => URL.revokeObjectURL((e.target as any).src)}
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                <p className="text-xs text-white truncate px-2">{file.name}</p>
            </div>
        </div>
    );
}
