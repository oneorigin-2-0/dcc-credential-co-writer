'use client';

import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';


export default function AboutPage() {
  const router = useRouter();

  return (
    <main id="main-content" className="bg-gray-50 min-h-screen">
      <div className="container mx-auto p-4 md:p-8">
        <div className="relative flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-center">
          <Button
            variant="outline"
            onClick={() => router.push('/')}
            className="flex-shrink-0 md:absolute md:left-0"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
            <span className="sm:hidden">Back</span>
          </Button>
          <h1 className="text-2xl md:text-3xl font-headline font-bold text-gray-900 text-center">
            About Credential Co-writer
          </h1>
        </div>
      </div>

      <div className="container mx-auto p-4 md:p-8 max-w-4xl">

        <section className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold text-foreground">About the Project</h2>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed font-body">
            Credential Co-writer is an experimental tool that helps you craft Open Badges 3.0
            credential templates from course materials such as syllabi, learning objectives,
            course outlines, and summaries. It is designed to support educators and institutions
            in translating learning experiences into structured digital credentials.
          </p>
        </section>

        <section className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold text-foreground">About the Models</h2>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed font-body">
            The tool uses large language models to analyze the content you provide and suggest
            badge titles, descriptions, criteria, and related information. Model behavior may vary
            and outputs should always be reviewed and edited by a human before use.
          </p>
        </section>

        {/* <section className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold text-foreground">Source Code &amp; Feedback</h2>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed font-body">
            This project is under active development. You can explore the source code, open issues,
            or contribute via GitHub.
          </p>
          <ul className="list-disc list-inside text-sm md:text-base text-muted-foreground font-body space-y-1">
            <li>
              <a
                href="https://github.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-secondary hover:text-primary hover:underline"
              >
                Project repository (GitHub)
              </a>
            </li>
          </ul>
        </section> */}

      </div>
    </main>
  );
}

