import { Link } from '@remix-run/react';
import { Button } from '~/components/ui/button';

interface FooterProps {
  currentAreaSlug: string;
}

export function Footer({ currentAreaSlug }: FooterProps) {
  return (
    <footer className="space-y-6 bg-[#3B5998] px-3">
      <div className="mx-auto max-w-[950px] space-y-[80px] border-b border-[rbga(255,255,255,0.5)] py-8 md:flex md:justify-between md:space-y-0">
        <Link to={`/${currentAreaSlug}`} prefetch="render">
          <img
            src="/footer_icon-logo.svg"
            alt="居抜きビュッフェ Presented by 店舗高値買取センター"
            width="223"
            height="42"
            className="md:w-[298px]"
          />
        </Link>
        <ul className="gap-x-5 md:flex md:items-center">
          <li className="p-[9px]">
            <Link to="/term-of-use" prefetch="render" className="text-sm font-bold text-white">
              利用規約
            </Link>
          </li>
          <li className="p-[9px]">
            <Link to="/privacy-policy" prefetch="render" className="text-sm font-bold text-white">
              プライバシーポリシー
            </Link>
          </li>
          <li className="p-[9px]">
            <Link to="/contact" prefetch="render" className="text-sm font-bold text-white">
              お問い合わせ
            </Link>
          </li>
        </ul>
      </div>
      <div className="mx-auto flex max-w-[950px] flex-col items-center justify-between space-y-4 md:flex-row md:items-end md:space-y-0">
        <div className="flex w-full flex-col gap-x-5 gap-y-4 md:flex-row">
          <div className="flex w-full flex-col gap-y-4 bg-[rgba(255,255,255,0.1)] px-3 py-4 md:max-w-[290px]">
            <div className="border-b border-[rbga(255,255,255,0.5)]">
              <img
                src="/footer_title01.png"
                width="187"
                height="24"
                alt="格安出店アシスト"
                className="mx-auto h-10 w-auto pb-4"
              />
            </div>
            <div>
              <div className="flex gap-x-2">
                <img src="/footer_shop-icon.svg" alt="" width="25" height="25" />
                <span className="text-base font-bold text-white">出店支援サービス</span>
              </div>
              <p className="mt-2 text-xs text-white">
                弊社の仕組みで初期費用100万円での出店も可能です！
                <br />
                <br />
                サラリーマンでも、副業でも、多くの人が店舗ビジネスをやりやすくする仕組みを提供します。
              </p>
            </div>
            <Button
              to="https://t-kaitori.com/restaurantstart/"
              target="_blank"
              className="w-full bg-white text-primary"
              variant="secondary"
              size="sm"
            >
              出店をご検討中の方はこちら
            </Button>
          </div>
          <div className="flex flex-col gap-y-4 bg-[rgba(255,255,255,0.1)] px-3 py-4 md:max-w-[290px]">
            <div className="border-b border-[rbga(255,255,255,0.5)]">
              <img
                src="/footer_title02.png"
                width="187"
                height="24"
                alt="店舗高値買取センター"
                className="mx-auto h-10 w-auto pb-4"
              />
            </div>
            <div>
              <div className="flex gap-x-2">
                <img src="/footer_shop-icon.svg" alt="" width="25" height="25" />
                <span className="text-base font-bold text-white">撤退支援サービス</span>
              </div>
              <p className="mt-2 text-xs text-white">
                居抜きで飲食店をそのまま引き継ぎます。弊社が直接引き継ぐため、スピーディーに撤退が可能です。
                <br />
                賃貸物件も可能で、撤退を考えていることが従業員にも気付かれる心配はありません。
              </p>
            </div>
            <Button
              to="https://t-kaitori.com/restaurantexit/"
              target="_blank"
              className="w-full bg-white text-primary"
              variant="secondary"
              size="sm"
            >
              撤退をご検討中の方はこちら
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-y-4 py-5 text-center md:py-0 md:text-end">
          <img
            src="/footer_title02.png"
            width="187"
            height="24"
            alt="店舗高値買取センター"
            className="mx-auto md:w-[142px]"
          />
          <Link
            className="text-xs text-white underline"
            to="https://t-kaitori.com/"
            target="_blank"
            rel="noreferrer"
          >
            https://t-kaitori.com/
          </Link>
          <div className="flex justify-center gap-x-5">
            <Link
              className="text-sm text-white underline"
              to="https://note.com/tenpo_kaitori/"
              target="_blank"
              rel="noreferrer"
            >
              <img src="/footer_note-icon.png" alt="note" width="61" height="61" />
            </Link>
            <Link
              className="text-sm text-white underline"
              to="https://twitter.com/t_kaitori0414"
              target="_blank"
              rel="noreferrer"
            >
              <img src="/footer_x-icon.png" alt="x" width="61" height="61" />
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-[rbga(255,255,255,0.5)] p-6 text-center">
        <span className="text-sm text-white">© 2024 株式会社店舗高値買取センター</span>
      </div>
    </footer>
  );
}
