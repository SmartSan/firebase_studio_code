
"use client";

import * as React from 'react';
import { AppHeader } from '@/components/app-header';
import { CombinedOutput } from '@/components/combined-output';
import { HistorySidebar } from '@/components/history-sidebar';
import { QrCodeDisplay } from '@/components/qr-code-display';
import { ReceiptUploader } from '@/components/receipt-uploader';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useToast } from '@/hooks/use-toast';
import { extractReceiptData } from '@/ai/flows/extract-receipt-data';
import { useHistory } from '@/hooks/use-history';

export default function HomePage() {
  const { toast } = useToast();
  const { addHistoryItem } = useHistory();

  const [receiptImage, setReceiptImage] = React.useState<string | null>(null);
  const [extractedText, setExtractedText] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleImageUpload = async (file: File) => {
    setIsLoading(true);
    setReceiptImage(null);
    setExtractedText(null);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        const imageDataUri = reader.result as string;
        setReceiptImage(imageDataUri);

        const result = await extractReceiptData({ receiptDataUri: imageDataUri });
        const text = result.extractedData;

        if (!text) {
          throw new Error("Could not extract text from the receipt.");
        }

        setExtractedText(text);

        await addHistoryItem({
          receiptImageUri: imageDataUri,
          extractedText: text,
        });

        toast({
          title: "Success",
          description: "Receipt processed and saved to your history.",
        });
      } catch (error) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to process receipt: ${errorMessage}`,
        });
        setReceiptImage(null);
        setExtractedText(null);
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to read the image file.",
      });
      setIsLoading(false);
    };
  };

  const handleReset = () => {
    setReceiptImage(null);
    setExtractedText(null);
  }

  return (
    <SidebarProvider>
      <div className="flex flex-col h-screen bg-background">
        <AppHeader />
        <div className="flex flex-1 overflow-hidden">
          <HistorySidebar />
          <div className="flex-1 flex flex-col">
            <main className="flex-1 overflow-y-auto p-4 md:p-8">
              <div className="max-w-7xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-8 items-start">
                  <ReceiptUploader
                    onUpload={handleImageUpload}
                    isLoading={isLoading}
                    receiptImage={receiptImage}
                    onReset={handleReset}
                  />
                  <div className="space-y-8">
                    <QrCodeDisplay extractedText={extractedText} isLoading={isLoading} />
                    <CombinedOutput receiptImage={receiptImage} extractedText={extractedText} />
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
