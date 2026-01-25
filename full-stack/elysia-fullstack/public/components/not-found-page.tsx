import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

export function NotFoundPage() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">404</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Oops! The page you're looking for doesn't exist.
          </p>
          <Button asChild>
            <a href="/">Go Home</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
