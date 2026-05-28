import { RouterProvider } from 'react-router-dom';
import { Providers } from './providers';
import { router } from './routes';
import { UnconfiguredBanner } from '@/components/feedback/UnconfiguredBanner';

export default function App() {
  return (
    <Providers>
      <UnconfiguredBanner />
      <RouterProvider router={router} />
    </Providers>
  );
}
