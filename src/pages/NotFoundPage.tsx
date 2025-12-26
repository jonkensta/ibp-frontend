import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileQuestion } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-center justify-center">
            <FileQuestion className="h-6 w-6" />
            Page Not Found
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <div className="text-6xl font-bold text-muted-foreground">404</div>
          <p className="text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="flex gap-2 justify-center">
            <Button asChild variant="default">
              <Link to="/">Go to Home</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/search">Search Inmates</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
