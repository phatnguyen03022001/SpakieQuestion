"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h2 className="text-xl font-semibold">Có lỗi xảy ra!</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400">{error.message || "Vui lòng thử lại sau"}</p>
      <Button onClick={reset} variant="outline">
        Thử lại
      </Button>
    </div>
  );
}
