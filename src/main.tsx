import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./dev.css";

const toggleDark = () => document.documentElement.classList.toggle("dark");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <main className="fui:min-h-screen fui:bg-surface-page fui:font-sans fui:p-10 fui:flex fui:flex-col fui:gap-6">
      <header className="fui:flex fui:items-center fui:justify-between">
        <h1 className="fui:text-h2 fui:font-medium fui:text-text-primary">
          Faster UI — token playground
        </h1>
        <button
          type="button"
          onClick={toggleDark}
          className="fui:text-body fui:text-action-secondary-text fui:border fui:border-action-secondary-border fui:rounded-control fui:px-3 fui:py-1.5 fui:hover:text-action-secondary-text-hover fui:hover:border-action-secondary-border-hover"
        >
          Toggle dark mode
        </button>
      </header>

      <p className="fui:text-body fui:text-text-secondary fui:max-w-prose">
        Sample elements styled exclusively with semantic tokens extracted from the TapTap Design
        System. Rebranding or switching modes touches only
        <code> src/tokens/tokens.css</code>.
      </p>

      <section className="fui:flex fui:flex-wrap fui:items-center fui:gap-3">
        <span className="fui:inline-flex fui:items-center fui:bg-action-primary fui:text-on-action fui:text-body fui:font-medium fui:rounded-control fui:px-4 fui:py-2 fui:hover:bg-action-primary-hover fui:active:bg-action-primary-active">
          Primary action
        </span>
        <span className="fui:inline-flex fui:items-center fui:bg-action-primary-disabled fui:text-on-action fui:text-body fui:font-medium fui:rounded-control fui:px-4 fui:py-2">
          Disabled
        </span>
        <span className="fui:inline-flex fui:items-center fui:bg-action-danger fui:text-on-action fui:text-body fui:font-medium fui:rounded-control fui:px-4 fui:py-2 fui:hover:bg-action-danger-hover">
          Danger action
        </span>
      </section>

      <section className="fui:bg-surface-raised fui:shadow-elevation-2 fui:rounded-surface fui:border fui:border-border-subtle fui:p-6 fui:w-90 fui:flex fui:flex-col fui:gap-3">
        <h2 className="fui:text-title fui:font-medium fui:text-text-primary">Raised surface</h2>
        <div className="fui:border fui:border-border-default fui:rounded-control fui:px-3 fui:py-2 fui:text-body fui:text-text-placeholder">
          Input placeholder…
        </div>
        <div className="fui:border-2 fui:border-focus-ring fui:rounded-control fui:px-3 fui:py-2 fui:text-body fui:text-text-primary">
          Focused control
        </div>
        <p className="fui:text-caption fui:text-feedback-error">Error message text</p>
      </section>

      <section className="fui:flex fui:gap-2">
        {(
          [
            ["error", "fui:bg-feedback-error"],
            ["warning", "fui:bg-feedback-warning"],
            ["success", "fui:bg-feedback-success"],
            ["info", "fui:bg-feedback-info"],
          ] as const
        ).map(([label, bg]) => (
          <span
            key={label}
            className={`${bg} fui:text-on-action fui:text-caption fui:rounded-control fui:px-2 fui:py-1`}
          >
            {label}
          </span>
        ))}
      </section>
    </main>
  </StrictMode>,
);
