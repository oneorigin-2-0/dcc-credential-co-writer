'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PrivacyPolicyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PrivacyPolicyModal({ open, onOpenChange }: PrivacyPolicyModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-headline font-bold text-primary">
            Privacy Policy
          </DialogTitle>
          <DialogDescription className="sr-only">
            Privacy policy information for the AI tool
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-4 text-sm text-foreground font-body leading-relaxed">
          <p>
            This AI tool is designed to operate without collecting, storing, or sharing any personal information. To help protect your privacy, do not enter any sensitive or personal information when using this tool. This includes, but is not limited to:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Full names</li>
            <li>Home or email addresses</li>
            <li>Phone numbers</li>
            <li>Government-issued identification numbers</li>
            <li>Any other data that could be used to identify you or someone else</li>
          </ul>
          <p className="mt-4">
            By using this tool, you acknowledge that you are responsible for ensuring that the information you provide does not contain PII or other sensitive data.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
