interface CollegeCardProps {
    name: string;
    description: string;
    imageUrl?: string;
}

export function CollegeCard({ name, description, imageUrl }: CollegeCardProps) {
    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
            {imageUrl && (
                <img src={imageUrl} alt={name} className="w-full h-32 object-cover rounded-lg mb-4" />
            )}
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{name}</h3>
            <p className="text-gray-600">{description}</p>
        </div>
    );
}
