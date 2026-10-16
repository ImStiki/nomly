import { Link } from 'react-router';
import { EmptyState } from '@/components/ui';

export default function NotFound() {
  return (
    <div className="container-app py-10">
      <EmptyState
        emoji="🛵"
        title="This page took a wrong turn"
        text="We couldn’t find what you were looking for. It may have moved or never existed."
        action={
          <Link to="/discovery" className="btn-primary">
            Back to Discovery
          </Link>
        }
      />
    </div>
  );
}
