import { fontHeading, fontMedium, fontRegular, fontSemi } from "../fonts";
import { useApp } from "../store";
import NotFoundIllustration from "./NotFoundIllustration";
import { buttonClass } from "./Button"

export default function NotFoundPage({
  title = "Page not found",
  text = "The page you are looking for doesn't exist or has been moved.",
}: {
  title?: string;
  text?: string;
}) {
  const { goHome, openSearch } = useApp();
  const link = `underline decoration-slate-300 decoration-1 underline-offset-4 transition hover:text-primary-700 hover:decoration-primary-700 ${fontMedium}`;
  return (
    <main className="flex min-h-dvh w-full flex-col items-center justify-center px-5 pb-16 pt-22 text-center">
      <NotFoundIllustration className="h-auto w-52 sm:w-62" />
      <p className={`mt-8 rounded-full bg-amber-50 px-3 py-1 text-xs tracking-label text-amber-700 ${fontSemi}`}>ERROR 404</p>
      <h1 className={`m-0 mt-3 max-w-170 text-balance text-26 leading-8.5 text-slate-800 sm:text-3xl sm:leading-10 ${fontHeading}`}>{title}</h1>
      <p className={`mt-3 max-w-130 text-pretty text-15 leading-6 text-slate-600 sm:text-base ${fontRegular}`}>
        {text} Find your way back to the{" "}
        <button type="button" onClick={goHome} className={link}>
          homepage
        </button>{" "}
        or{" "}
        <button type="button" onClick={() => openSearch({})} className={link}>
          browse all courses
        </button>
        .
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={goHome} className={`${buttonClass("yellow", "lg")}`}>
          Go to homepage
        </button>
        <button type="button" onClick={() => window.history.back()} className={`${buttonClass("secondary", "lg")}`}>
          Go back
        </button>
      </div>
    </main>
  );
}
