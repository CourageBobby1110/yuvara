import React from "react";

export default function AccessibilityPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">
        Accessibility Statement
      </h1>

      <div className="prose prose-lg max-w-none text-gray-600">
        <p className="mb-6">
          At Yuvara, we are committed to ensuring digital accessibility for
          people with disabilities. We are continually improving the user
          experience for everyone and applying the relevant accessibility
          standards.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
          Conformance Status
        </h2>
        <p className="mb-6">
          The Web Content Accessibility Guidelines (WCAG) defines requirements
          for designers and developers to improve accessibility for people with
          disabilities. It defines three levels of conformance: Level A, Level
          AA, and Level AAA. Yuvara is partially conformant with WCAG 2.1 level
          AA. Partially conformant means that some parts of the content do not
          fully conform to the accessibility standard.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Feedback</h2>
        <p className="mb-6">
          We welcome your feedback on the accessibility of Yuvara. Please let us
          know if you encounter accessibility barriers on Yuvara:
        </p>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li>E-mail: accessibility@yuvara.com</li>
          <li>Postal Address: 123 Fashion Ave, Lagos, Nigeria</li>
        </ul>
        <p className="mb-6">
          We try to respond to feedback within 2 business days.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
          Technical Specifications
        </h2>
        <p className="mb-6">
          Accessibility of Yuvara relies on the following technologies to work
          with the particular combination of web browser and any assistive
          technologies or plugins installed on your computer:
        </p>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li>HTML</li>
          <li>WAI-ARIA</li>
          <li>CSS</li>
          <li>JavaScript</li>
        </ul>
        <p className="mb-6">
          These technologies are relied upon for conformance with the
          accessibility standards used.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
          Assessment Approach
        </h2>
        <p className="mb-6">
          Yuvara assessed the accessibility of Yuvara by the following
          approaches:
        </p>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li>Self-evaluation</li>
        </ul>
      </div>
    </div>
  );
}
