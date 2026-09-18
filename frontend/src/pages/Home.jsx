import React from "react";
import { Link } from "react-router-dom";
import { ClipboardList, ListChecks, ShieldCheck, ArrowRight } from "lucide-react";
import PageContainer from "../components/PageContainer.jsx";
import Button from "../components/Button.jsx";

const FEATURES = [
  {
    number: "01",
    icon: ClipboardList,
    title: "Understand your request",
    description:
      "The system distinguishes requests for government action from requests for information.",
  },
  {
    number: "02",
    icon: ListChecks,
    title: "Build the facts",
    description:
      "Important details are organized and missing information can be identified.",
  },
  {
    number: "03",
    icon: ShieldCheck,
    title: "Review before submission",
    description: "You remain in control of the final application.",
  },
];

const FLOW_STEPS = ["Describe", "Understand", "Clarify", "Draft", "Review", "Track"];

export default function Home() {
  return (
    <PageContainer>
      <section className="grid gap-10 py-6 md:grid-cols-[1.1fr_0.9fr] md:items-center md:py-14">
        <div>
          <p className="text-[13px] font-medium uppercase tracking-wide text-accent-dark">
            Citizen assistance
          </p>
          <h1 className="mt-3 text-[34px] font-semibold leading-tight text-ink-900 sm:text-[42px]">
            Turn your issue into a formal application.
          </h1>
          <p className="mt-4 max-w-[520px] text-[16px] leading-relaxed text-ink-500">
            Describe your problem in simple language. The Grievance Scribe helps
            identify whether you need a grievance or an RTI request, organizes the
            important details, and prepares a draft you can review before submission.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link to="/start">
              <Button className="px-6 py-3 text-[15px]">
                Start a Request
                <ArrowRight size={16} />
              </Button>
            </Link>
            <Link to="/how-it-works">
              <Button variant="secondary" className="px-6 py-3 text-[15px]">
                How It Works
              </Button>
            </Link>
          </div>
        </div>

        <div className="rounded-lg border border-line bg-white p-6">
          <p className="text-[13px] font-medium text-ink-500">Example</p>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-700">
            "There are large potholes on the road near my area. They have been
            there for three months and I want the road repaired."
          </p>
          <div className="mt-5 flex items-center gap-2 border-t border-line pt-4">
            <span className="rounded-full bg-accent-light px-3 py-1 text-[12px] font-medium text-accent-dark">
              Classified as GRIEVANCE
            </span>
            <span className="text-[12px] text-ink-300">Road Maintenance</span>
          </div>
        </div>
      </section>

      <section className="border-t border-line py-14">
        <div className="grid gap-8 md:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.number}>
              <div className="flex items-center gap-3">
                <span className="text-[13px] font-medium text-ink-300">
                  {feature.number}
                </span>
                <feature.icon size={18} className="text-accent" aria-hidden="true" />
              </div>
              <h3 className="mt-3 text-[17px] font-semibold text-ink-900">
                {feature.title}
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-500">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-line py-14">
        <h2 className="text-[22px] font-semibold text-ink-900">How it works</h2>
        <div className="mt-6 flex flex-wrap items-center gap-2">
          {FLOW_STEPS.map((step, index) => (
            <React.Fragment key={step}>
              <span className="rounded-full border border-line bg-white px-4 py-2 text-[14px] font-medium text-ink-700">
                {step}
              </span>
              {index < FLOW_STEPS.length - 1 && (
                <ArrowRight size={14} className="text-ink-300" aria-hidden="true" />
              )}
            </React.Fragment>
          ))}
        </div>
      </section>

      <section className="border-t border-line py-8">
        <p className="text-[13px] leading-relaxed text-ink-500">
          This service assists with drafting. Review the application carefully
          before submission.
        </p>
      </section>
    </PageContainer>
  );
}
