import { useState } from 'react';
import { Link, useNavigate, useParams } from '@remix-run/react';
import { Sheet, SheetContent, SheetTrigger } from '~/components/ui/sheet';
import { Button } from '~/components/ui/button';
import { MenuIcon } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';

interface Area {
  id: string;
  name: string;
  order: number;
  slug: string;
}

interface HeaderProps {
  areas: Area[];
}

export function Header({ areas }: HeaderProps) {
  const navigate = useNavigate();
  const params = useParams();
  const [isOpen, setIsOpen] = useState(false);
  const currentArea = areas.find((area) => area.slug === params.areaSlug) || areas[0];

  const handleAreaChange = (areaSlug: string) => {
    navigate(`/${areaSlug}`);
  };

  return (
    <header className="flex h-14 items-center justify-center border-b border-[#c9c9c9] bg-background pl-3 md:h-[77px]">
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-x-[30px]">
          <Link to={`/${currentArea.slug}`}>
            <img
              src="/logo-icon.svg"
              alt="居抜きビュッフェ"
              width="141"
              height="27"
              className="md:h-10 md:w-[212px]"
            />
          </Link>
          <Select onValueChange={handleAreaChange} value={currentArea.slug}>
            <SelectTrigger>
              <SelectValue placeholder={currentArea.name} />
            </SelectTrigger>
            <SelectContent>
              {areas.map((area) => (
                <SelectItem key={area.id} value={area.slug}>
                  {area.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-x-4">
          <Button
            to="https://t-kaitori.com/restaurantexit/"
            target="_blank"
            variant="secondary"
            size="sm"
            className="mx-auto hidden w-full max-w-[464px] md:flex"
          >
            店舗撤退をご検討の方
          </Button>
          <Button
            to="https://t-kaitori.com/restaurantstart/"
            target="_blank"
            variant="secondary"
            size="sm"
            className="mx-auto hidden w-full max-w-[464px] md:flex"
          >
            出店支援をご検討の方
          </Button>
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-14 min-w-14 rounded-none bg-[#3B5998]"
              >
                <MenuIcon className="size-6 text-white" />
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[300px] sm:w-[400px]">
              <nav className="flex h-full flex-col">
                <div className="grow">
                  <ul className="mt-6 space-y-2">
                    <li>
                      {/* <Button variant="ghost" className="w-full justify-start"> */}
                      <Link
                        to={`/${currentArea.slug}`}
                        className="inline-flex h-14 w-full items-center justify-start whitespace-nowrap rounded-[8px] px-8 text-base font-bold text-primary ring-offset-background transition-opacity hover:text-accent-foreground hover:opacity-80 disabled:pointer-events-none disabled:opacity-50"
                        onClick={() => setIsOpen(false)}
                      >
                        トップ
                      </Link>
                    </li>
                    <li>
                      <Link
                        to={`/${currentArea.slug}/properties`}
                        className="inline-flex h-14 w-full items-center justify-start whitespace-nowrap rounded-[8px] px-8 text-base font-bold text-primary ring-offset-background transition-opacity hover:text-accent-foreground hover:opacity-80 disabled:pointer-events-none disabled:opacity-50"
                        onClick={() => setIsOpen(false)}
                      >
                        新着物件ピックアップ
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/privacy-policy"
                        className="inline-flex h-14 w-full items-center justify-start whitespace-nowrap rounded-[8px] px-8 text-base font-bold text-primary ring-offset-background transition-opacity hover:text-accent-foreground hover:opacity-80 disabled:pointer-events-none disabled:opacity-50"
                        onClick={() => setIsOpen(false)}
                      >
                        プライバシーポリシー
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/term-of-use"
                        className="inline-flex h-14 w-full items-center justify-start whitespace-nowrap rounded-[8px] px-8 text-base font-bold text-primary ring-offset-background transition-opacity hover:text-accent-foreground hover:opacity-80 disabled:pointer-events-none disabled:opacity-50"
                        onClick={() => setIsOpen(false)}
                      >
                        利用規約
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/contact"
                        className="inline-flex h-14 w-full items-center justify-start whitespace-nowrap rounded-[8px] px-8 text-base font-bold text-primary ring-offset-background transition-opacity hover:text-accent-foreground hover:opacity-80 disabled:pointer-events-none disabled:opacity-50"
                        onClick={() => setIsOpen(false)}
                      >
                        お問い合わせ
                      </Link>
                    </li>
                  </ul>
                </div>
                <div className="mt-auto pb-6">
                  <p className="mb-4 text-sm text-gray-600">
                    飲食店の出店や撤退を最適な方法でサポートします
                  </p>
                  <Button
                    to="https://t-kaitori.com/restaurantexit/"
                    target="_blank"
                    className="mb-2 w-full"
                  >
                    店舗撤退をご検討の方
                  </Button>
                  <Button
                    to="https://t-kaitori.com/restaurantstart/"
                    target="_blank"
                    className="w-full"
                  >
                    出店支援をご検討の方
                  </Button>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
