import React from "react";
import styles from "./FAQ.module.css";

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
    <div className={styles.container}>
      <h1 className={styles.title}>Frequently Asked Questions</h1>

      <div className={styles.faqList}>
        {faqs.map((faq, index) => (
          <div key={index} className={styles.faqItem}>
            <h3 className={styles.question}>{faq.question}</h3>
            <p className={styles.answer}>{faq.answer}</p>
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <p className={styles.footerText}>
          Can't find what you're looking for?{" "}
          <a href="/contact" className={styles.contactLink}>
            Contact Us
          </a>
        </p>
      </div>
    </div>
  );
}
