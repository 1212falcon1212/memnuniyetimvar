"use client";

interface ShareButtonsProps {
  url: string;
  title: string;
}

export function ShareButtons({ url, title }: ShareButtonsProps) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const platforms = [
    {
      name: "Twitter",
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      color: "bg-sky-50 text-sky-600 hover:bg-sky-100",
      icon: "𝕏",
    },
    {
      name: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      color: "bg-blue-50 text-blue-600 hover:bg-blue-100",
      icon: "f",
    },
    {
      name: "WhatsApp",
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      color: "bg-green-50 text-green-600 hover:bg-green-100",
      icon: "W",
    },
  ];

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500">Paylas:</span>
      {platforms.map((platform) => (
        <a
          key={platform.name}
          href={platform.href}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors ${platform.color}`}
          title={platform.name}
        >
          {platform.icon}
        </a>
      ))}
      <button
        onClick={handleCopy}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 text-gray-600 hover:bg-gray-100 text-xs transition-colors"
        title="Linki Kopyala"
      >
        🔗
      </button>
    </div>
  );
}
