import { redirect } from '@remix-run/node';
import type { LoaderFunctionArgs } from '@remix-run/node';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  if (url.pathname === '/') {
    return redirect('/kanto');
  }
  return null;
};

export default function App() {
  return null;
}
