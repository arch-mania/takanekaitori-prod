import { Link } from '@remix-run/react';
import ContentsLayout from '../layouts/ContentsLayout';
import { Button } from '../ui/button';

export const ErrorPage = () => (
  <ContentsLayout className="mx-auto max-w-[950px] p-3">
    <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4 text-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-xl">ページが見つかりません</p>
      <p className="text-gray-600">
        お探しのページは削除されたか、URLが間違っている可能性があります。
      </p>
      <Button asChild variant="default" size="sm" className="mt-8">
        <Link to="/">トップページへ戻る</Link>
      </Button>
    </div>
  </ContentsLayout>
);
