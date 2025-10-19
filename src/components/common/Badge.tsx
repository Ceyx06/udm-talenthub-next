export default function Badge({ children, tone = "gray" }: {
    children: React.ReactNode; tone?: "gray" | "green" | "yellow" | "red" | "blue" | "purple";
}) {
    const map: any = {
        gray: "bg-gray-100 text-gray-700",
        green: "bg-green-100 text-green-700",
        yellow: "bg-yellow-100 text-yellow-800",
        red: "bg-red-100 text-red-700",
        blue: "bg-blue-100 text-blue-700",
        purple: "bg-purple-100 text-purple-700",
    };
    return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${map[tone]}`}>{children}</span>;
}
