import React from "react";
import { Link } from "react-router-dom";
import PageContainer from "../components/PageContainer.jsx";
import Card from "../components/Card.jsx";
import Button from "../components/Button.jsx";

const STEPS = [
  { title: "Describe your issue", description: "Write what happened in your own words." },
  { title: "Understand the request", description: "The system identifies whether this is a grievance or an RTI request." },
  { title: "Organize the facts", description: "Key details from your description are structured into fields you can check." },
  { title: "Identify missing details", description: "If anything important is unclear, you'll be asked a short follow-up question." },
  { title: "Prepare a draft", description: "A structured application is drafted based on your facts and relevant guidance." },
  { title: "Review and create a case", description: "You review, edit if needed, and create a case in the system." },
];

export default function HowItWorks() {
  return (
    <PageContainer>
      <h1 className="text-[28px] font-semibold text-ink-900">How It Works</h1>
      <p className="mt-2 max-w-[600px] text-[15px] leading-relaxed text-ink-500">
        The process is designed so you stay in control at every step.
      </p>

      <div className="mt-8 flex flex-col gap-4">
        {STEPS.map((step, index) => (
          <Card key={step.title} className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-light text-[14px] font-medium text-accent-dark">
              {index + 1}
            </span>
            <div>
              <h3 className="text-[16px] font-semibold text-ink-900">{step.title}</h3>
              <p className="mt-1 text-[14px] leading-relaxed text-ink-500">
                {step.description}
              </p>
            </div>
          </Card>
        ))}
      </div>

      <section className="mt-12 border-t border-line pt-10">
        <h2 className="text-[20px] font-semibold text-ink-900">What's the difference?</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Card>
            <p className="text-[13px] font-medium uppercase tracking-wide text-accent-dark">
              Grievance
            </p>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-700">
              Use this when you want an authority to take action regarding an
              issue.
            </p>
          </Card>
          <Card>
            <p className="text-[13px] font-medium uppercase tracking-wide text-accent-dark">
              RTI
            </p>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-700">
              Use this when you want access to information or records held by
              a public authority.
            </p>
          </Card>
        </div>
      </section>

      <div className="mt-10">
        <Link to="/start">
          <Button>Start a Request</Button>
        </Link>
      </div>
    </PageContainer>
  );
}
