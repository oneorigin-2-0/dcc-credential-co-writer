'use client';

import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';


export default function AboutPage() {
  const router = useRouter();

  const aboutContent = [
    {
      heading: "",
      title: "",
      subtitle: "",
      text: `The Credential Co-writer was developed through a collaborative effort led by the Digital Credentials Consortium (DCC) and funded by Walmart. The DCC is a global network of postsecondary education institutions working together advancing the understanding and effective use of portable, verifiable credentials in higher education through technology leadership, educational outreach, research and advocacy.`
    },
    {
      heading: "",
      title: "",
      subtitle: "",
      text: `Collaborators on the Credential Co-writer project includes OneOrigin, contracted to research generative AI models and develop the prototype and example UI, Western Governors University who provided their extensive catalog of credential data to train the model, George Washington University LAiSER who connected their AI-powered skills extraction tool, and Axim Collaborative Open edX which developed a platform extension, enabling course designers to leverage the Credential Co-writer for issuing credentials.`
    },
    {
      heading: "About Open Badges 3.0",
      title: "",
      subtitle: "",
      text: `Though the Credential Co-writer could be developed further to work with a number of different standards, this project focuses on authoring credentials aligned with 1Edtech’s Open Badges 3.0 (OBv3). This standard offers significant advantages to traditional paper or PDF credentials or web hosted badges including:

- Digital signatures which offer trust and transparency
- Learner controlled access to data for sharing 
- Structured data and portability to avoid vendor lock in 
- Capability for rich metadata describing skills and competencies

OBv3 credential metadata has both required and optional fields including criteria, description, alignments, and badge image. This data conveys much more valuable information about the credential holders skills and abilities. However, for the issuer, the process for designing and authoring this customizable information can be a time consuming manual undertaking, especially for organizations who offer tens of thousands of credentials. The Credential Co-writer harnesses the power of generative AI to streamline and simplify this process.`
    },
    {
      heading: "What models we used",
      title: "",
      subtitle: "",
      text: `The Credential Co-writer is based primarily on the open source Microsoft Phi-4 Mini Instruct which has been fine tuned, trained on data from a number of sources, and available under the MIT License. Training data was obtained from publicly available credential data from Credential Engine, public skills and competencies frameworks, and contributions from participating institutions within and beyond the DCC network.`
    },
    {
      heading: "About LAiSER",
      title: "",
      subtitle: "",
      text: `The Credential Co-writer enables the option to connect to LAiSER an AI-powered skills extraction tool developed by George Washington University. LAiSER identities and parses skills from human readable text linking them to an evolving skills database. To learn more about LAiSER <a class="text-primary font-bold" href="https://laiser.gwu.edu/" target="_blank" rel="noopener noreferrer">visit their website</a>.`
    }
  ];

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
          <Button
            variant="outline"
            onClick={() => window.open('https://forms.gle/n53SsaqPoabzmgAG9', '_blank', 'noopener,noreferrer')}
            className="flex-shrink-0 md:absolute md:right-0"
          >
            <span className="hidden sm:inline">Give Feedback</span>
            <span className="sm:hidden">Feedback</span>
          </Button>
          <h1 className="text-2xl md:text-3xl font-headline font-bold text-gray-900 text-center">
            About Credential Co-writer
          </h1>
        </div>
      </div>

      <div className="container mx-auto p-4 md:p-8 max-w-4xl">
        {aboutContent.map((section, idx) => (
          <section key={idx} className="space-y-4 mb-8">
            {section.heading && <h2 className="text-xl font-semibold text-foreground">{section.heading}</h2>}
            {section.title && <h3 className="text-lg font-medium text-gray-900">{section.title}</h3>}
            {section.subtitle && <p className="text-sm text-muted-foreground">{section.subtitle}</p>}
            {section.text && section.text.includes('<a ') ? (
              <p
                className="text-sm md:text-base text-muted-foreground leading-relaxed font-body"
                dangerouslySetInnerHTML={{ __html: section.text }}
              />
            ) : (
              section.text && <p className="text-sm md:text-base text-muted-foreground leading-relaxed font-body whitespace-pre-wrap">{section.text}</p>
            )}
          </section>
        ))}

      </div>
    </main>
  );
}

