"use client";

import Link from "next/link";

export type GettingStartedItem = {
  title: string;
  description: string;
  action: string;
  href: string;
};

type GettingStartedChecklistProps = {
  items: GettingStartedItem[];
  title: string;
};

export function GettingStartedChecklist({ items, title }: GettingStartedChecklistProps) {
  return (
    <section className="dashboard-card" data-tutorial="overview-getting-started">
      <div className="dashboard-card-header">
        <h2 className="dashboard-card-title">{title}</h2>
      </div>
      <ul className="dashboard-checklist">
        {items.map((item, index) => (
          <li
            key={item.title}
            className={`dashboard-checklist-item ${index === 0 ? "dashboard-checklist-item-active" : ""}`}
          >
            <span className="dashboard-check-circle" aria-hidden />
            <div className="dashboard-checklist-body">
              <p className="dashboard-checklist-title">{item.title}</p>
              <p className="dashboard-checklist-desc">{item.description}</p>
              <Link href={item.href} className="dashboard-btn dashboard-btn-primary">
                {item.action}
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
