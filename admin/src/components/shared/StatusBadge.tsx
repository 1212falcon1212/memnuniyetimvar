interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusStyles: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  bekleyen: "bg-yellow-100 text-yellow-800 border-yellow-200",
  published: "bg-green-100 text-green-800 border-green-200",
  active: "bg-green-100 text-green-800 border-green-200",
  onaylanan: "bg-green-100 text-green-800 border-green-200",
  aktif: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  reddedilen: "bg-red-100 text-red-800 border-red-200",
  banned: "bg-red-100 text-red-800 border-red-200",
  hidden: "bg-gray-100 text-gray-800 border-gray-200",
  gizli: "bg-gray-100 text-gray-800 border-gray-200",
  featured: "bg-blue-100 text-blue-800 border-blue-200",
};

const statusLabels: Record<string, string> = {
  pending: "Bekleyen",
  bekleyen: "Bekleyen",
  published: "Yayinda",
  active: "Aktif",
  onaylanan: "Onaylandi",
  aktif: "Aktif",
  rejected: "Reddedildi",
  reddedilen: "Reddedildi",
  banned: "Yasakli",
  hidden: "Gizli",
  gizli: "Gizli",
  featured: "One Cikan",
};

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const style = statusStyles[status] || "bg-gray-100 text-gray-800 border-gray-200";
  const label = statusLabels[status] || status;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style} ${className}`}
    >
      {label}
    </span>
  );
}
