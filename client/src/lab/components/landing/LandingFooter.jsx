import { Link } from "react-router-dom";
import { PixelLogo, PixelSprite, SUBJECT_SPRITES } from "@/shared/components/ui/pixel";
import { SUBJECTS } from "@/lab/data/subjects";

const LandingFooter = () => (
  <footer className="border-t-2 border-pixel-ink bg-card">
    <div className="container flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <PixelLogo />
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
          Fanlarni 3D, VR va AI yordamida o'rganadigan virtual laboratoriya.
        </p>
      </div>

      <nav aria-label="Fanlar" className="flex flex-wrap gap-x-5 gap-y-3">
        {SUBJECTS.map((subject) => (
          <Link
            key={subject.slug}
            to={`/${subject.slug}`}
            className="flex items-center gap-1.5 font-pixel text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <PixelSprite name={SUBJECT_SPRITES[subject.slug]} size={16} />
            {subject.title}
          </Link>
        ))}
      </nav>
    </div>

    <div className="border-t border-pixel-ink/20 py-4">
      <div className="container flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>© SmartLab. Interaktiv 3D Virtual Laboratoriya.</span>
        <a
          href="https://github.com/xasanboyman"
          target="_blank"
          rel="noopener noreferrer"
          className="font-pixel hover:text-foreground transition-colors"
        >
          Muallif: xasanboyman
        </a>
      </div>
    </div>
  </footer>
);

export default LandingFooter;
