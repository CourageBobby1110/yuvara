import React from "react";

export default function FAQ() {
  const faqs = [
    {
      question: "How do I track my order?",
      answer:
        "Once your order has shipped, you will receive an email confirmation with a tracking number. You can use this number to track your package on our website or the carrier's site.",
    },
    {
      question: "What payment methods do you accept?",
      answer:
        "We accept all major credit cards (Visa, MasterCard, Verve) via Paystack, as well as bank transfers.",
    },
    {
      question: "Do you offer international shipping?",
      answer:
        "Yes, we ship worldwide! Shipping costs and delivery times vary by location.",
    },
    {
      question: "Can I change or cancel my order?",
      answer:
        "We process orders quickly, but if you need to make a change, please contact us immediately at support@yuvara.com. If the order hasn't shipped, we'll do our best to accommodate your request.",
    },
    {
      question: "How do I determine my size?",
      answer:
        "Please refer to our Size Guide located on each product page for detailed measurements and fitting advice.",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Frequently Asked Questions
      </h1>

      <div className="space-y-6">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-100"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {faq.question}
            </h3>
            <p className="text-gray-600">{faq.answer}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <p className="text-gray-600">
          Can't find what you're looking for?{" "}
          <a href="/contact" className="text-black font-semibold underline">
            Contact Us
          </a>
        </p>
      </div>
    </div>
  );
}
