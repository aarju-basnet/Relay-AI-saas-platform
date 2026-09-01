import React, { useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "How does Relay's AI Widget work on my website?",
    answer: "You copy a single line script tag provided in your Relay dashboard into your site HTML. Relay automatically loads a modern chat bubble that answers user questions using information from your Knowledge Base."
  },
  {
    question: "What is the Knowledge Base and how do I train the AI?",
    answer: "The Knowledge Base is available on our Pro plan. You upload text, FAQs, or documents about your business. Relay processes and indexes them so your widget answers customer questions with your exact context."
  },
  {
    question: "Do I need my own OpenAI or LLM API key?",
    answer: "No! Relay manages the vector storage and AI model pipeline automatically. You do not need to sign up for external AI services."
  },
  {
    question: "Will the script tag slow down my website?",
    answer: "No. The Relay script loads asynchronously (`defer`), ensuring zero impact on your site's initial load performance or PageSpeed scores."
  }
];

export const FAQ: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const toggle = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-center mb-2">Frequently Asked Questions</h1>
      <p className="text-center text-slate-500 mb-10">Everything you need to know about Relay analytics and AI assistance.</p>

      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div key={index} className="border border-slate-200 rounded-lg overflow-hidden transition">
            <button
              onClick={() => toggle(index)}
              className="w-full text-left px-6 py-4 flex justify-between items-center font-medium text-slate-800 hover:bg-slate-50"
            >
              <span>{faq.question}</span>
              <span className="text-slate-400 font-bold">{openIdx === index ? '−' : '+'}</span>
            </button>
            {openIdx === index && (
              <div className="px-6 pb-4 text-slate-600 text-sm border-t border-slate-100 pt-3">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};