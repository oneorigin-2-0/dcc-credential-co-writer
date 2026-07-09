'use client';

import Link from 'next/link';
import { useState } from 'react';
import { PrivacyPolicyModal } from '@/components/genai/privacy-policy-modal';

export function Footer() {
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  return (
    <>
      <footer className="w-full bg-card border-t border-gray-200 py-4 mt-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-center space-y-3">
            {/* DCC Logo linking back to home */}
            <div className="flex items-center justify-center">
              <Link href="/">
                <img
                  src="/assets/DCC_LOGO.png"
                  alt="DCC Digital Credentials Consortium"
                  className="h-8 max-h-16 w-auto object-contain"
                />
              </Link>
            </div>

            {/* Privacy Policy Link (bottom popup trigger) */}
            <button
              onClick={() => setIsPrivacyModalOpen(true)}
              className="text-sm text-primary underline hover:text-primary"
              aria-label="View Privacy Policy"
            >
              Privacy Policy
            </button>
          </div>
        </div>
      </footer>

      <PrivacyPolicyModal
        open={isPrivacyModalOpen}
        onOpenChange={setIsPrivacyModalOpen}
      />
    </>
  );
}
