import { Link, useLocation } from '@remix-run/react';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'floating-contact-popup-closed';

export function FloatingContactPopup() {
  const location = useLocation();
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const isClosed = window.localStorage.getItem(STORAGE_KEY) === '1';
    if (!isClosed) {
      setIsVisible(true);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    window.localStorage.setItem(STORAGE_KEY, '1');
  };

  if (!isMounted || !isVisible || location.pathname === '/contact') {
    return null;
  }

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-40">
      <div className="pointer-events-auto relative">
        <button
          type="button"
          onClick={handleClose}
          aria-label="ポップアップを閉じる"
          className="absolute -right-3 -top-3 z-10 flex size-9 items-center justify-center rounded-full bg-[#333333] text-white opacity-70 transition-opacity hover:opacity-85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <X className="size-[30px] md:size-6" strokeWidth={3} />
        </button>

        <Link
          to="/contact"
          aria-label="今すぐ申し込む 無料"
          className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#445A9C]"
        >
          <img
            src="/banner.png"
            alt="飲食店オーナー向けの掲載申し込み案内"
            width="212"
            height="154"
            className="w-[176px] drop-shadow-[0px_0px_12px_rgba(0,0,0,0.2)] md:w-[212px]"
          />
        </Link>
      </div>
    </div>
  );
}
