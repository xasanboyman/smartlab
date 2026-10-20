// "Genetika": Punnett square for one trait. Pick both parent genotypes and read
// the genotype/phenotype ratios; the grid lights dominant outcomes in emerald.
import LabWorkspace from "@/lab/components/LabWorkspace";
import useObjectState from "@/shared/hooks/useObjectState";
import { BIO_WORKSPACE } from "../shared/bioTheme";
import { BioSection, BioStat } from "../shared/BioUi";

const TRAITS = [
  { id: "eye", name: "Ko'z rangi", dom: "Jigarrang", rec: "Ko'k", note: "Jigarrang ko'z (A) ko'k ko'zga (a) nisbatan dominant." },
  { id: "height", name: "Bo'y", dom: "Baland", rec: "Past", note: "Mendel no'xatida baland poya (A) past poyaga (a) nisbatan dominant." },
  { id: "widow", name: "Soch chizig'i", dom: "Uchli", rec: "Tekis", note: "Peshonadagi uchli soch chizig'i (A) tekis chiziqqa (a) nisbatan dominant." },
];

const GENOTYPES = ["AA", "Aa", "aa"];

// Ikki allelni birlashtirib normal genotip beradi (A doim oldinda: aA -> Aa).
const combine = (a, b) => [a, b].sort().join("");

const getTrait = (id) => TRAITS.find((t) => t.id === id) ?? TRAITS[0];

const GenoPicker = ({ label, value, onChange }) => (
  <div>
    <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    <div className="flex gap-1.5">
      {GENOTYPES.map((g) => (
        <button
          key={g}
          type="button"
          onClick={() => onChange(g)}
          className={
            "flex-1 rounded-lg border px-3 py-1.5 font-mono text-sm font-semibold transition-colors " +
            (value === g ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background/60 text-foreground hover:bg-secondary")
          }
        >
          {g}
        </button>
      ))}
    </div>
  </div>
);

// Genotip bo'yicha rang: dominant (A bor) emerald, retsessiv (aa) kulrang.
const cellColor = (geno) =>
  geno === "aa"
    ? "border-border bg-secondary/60 text-muted-foreground"
    : geno === "AA"
      ? "border-primary/70 bg-primary/25 text-primary shadow-[0_0_24px_-6px_hsl(var(--primary)/0.6)]"
      : "border-primary/40 bg-primary/10 text-primary";

const GeneticsPage = () => {
  const st = useObjectState({ trait: "eye", p1: "Aa", p2: "Aa" });
  const trait = getTrait(st.trait);

  const a1 = st.p1.split("");
  const a2 = st.p2.split("");
  // 4 ta avlod: har bir ota-ona allelining kombinatsiyasi (Punnett 2x2).
  const grid = a1.map((x) => a2.map((y) => combine(x, y)));
  const offspring = grid.flat();

  const cAA = offspring.filter((g) => g === "AA").length;
  const cAa = offspring.filter((g) => g === "Aa").length;
  const caa = offspring.filter((g) => g === "aa").length;

  const dom = cAA + cAa; // kamida bitta A -> dominant fenotip
  const rec = caa;

  const genoRatio = [cAA, cAa, caa].join(" : ");
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const g = gcd(dom, rec) || 1;
  const phenoRatio = `${dom / g} : ${rec / g}`;
  const domPct = Math.round((dom / 4) * 100);

  const onSelect = (id) => st.setField("trait", id);

  const scene = (
    <div className="grid h-full w-full place-items-center overflow-y-auto p-6">
      <div className="w-full max-w-md">
        <div className="mb-3 flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Punnett jadvali</span>
          <span className="rounded-full border border-border bg-background/70 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {st.p1} × {st.p2}
          </span>
        </div>
        <div className="grid grid-cols-[auto_1fr_1fr] gap-2">
          <div />
          {a2.map((y, j) => (
            <div key={j} className="text-center font-mono text-lg font-bold text-foreground">
              {y}
            </div>
          ))}
          {a1.map((x, i) => (
            <RowGroup key={i} label={x} cells={grid[i]} />
          ))}
        </div>

        <div className="mt-5 flex flex-wrap justify-center gap-5 text-xs">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block size-3 rounded border border-primary/50 bg-primary/20" />
            {trait.dom} (dominant)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block size-3 rounded border border-border bg-secondary/60" />
            {trait.rec} (retsessiv)
          </span>
        </div>

        <div className="mt-5 h-2 overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${domPct}%` }} />
        </div>
        <div className="mt-1.5 flex justify-between font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          <span>{trait.dom} {domPct}%</span>
          <span>{trait.rec} {100 - domPct}%</span>
        </div>
      </div>
    </div>
  );

  const info = (
    <div className="space-y-5 text-sm">
      <BioSection label="Ota-ona genotiplari">
        <div className="space-y-3">
          <GenoPicker label="1-ota-ona" value={st.p1} onChange={(v) => st.setField("p1", v)} />
          <GenoPicker label="2-ota-ona" value={st.p2} onChange={(v) => st.setField("p2", v)} />
        </div>
      </BioSection>

      <BioSection label="Natija">
        <div className="grid grid-cols-2 gap-2">
          <BioStat label="Genotip (AA:Aa:aa)" value={genoRatio} />
          <BioStat label="Fenotip" value={phenoRatio} accent />
          <BioStat label="Dominant" value={`${domPct}%`} accent />
          <BioStat label="Belgi" value={trait.name} />
        </div>
      </BioSection>

      <BioSection label="Izoh">
        <p className="text-xs leading-relaxed text-muted-foreground">{trait.note}</p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Ikki geterozigota (Aa × Aa) ota-ona 3 : 1 fenotip nisbatini beradi - klassik Mendel qonuni.
        </p>
      </BioSection>
    </div>
  );

  return (
    <LabWorkspace
      {...BIO_WORKSPACE}
      eyebrow="Biologiya · Genetika"
      title="Genetika (Punnett)"
      description="Ota-ona allellarini tanlab, avlod nisbatlarini Punnett jadvalida ko'ring."
      items={TRAITS}
      activeId={st.trait}
      onSelect={onSelect}
      aiContext={{ ota1: st.p1, ota2: st.p2, fenotip_nisbat: phenoRatio }}
      scene={scene}
      info={info}
    />
  );
};

const RowGroup = ({ label, cells }) => (
  <>
    <div className="grid place-items-center font-mono text-lg font-bold text-foreground">{label}</div>
    {cells.map((geno, j) => (
      <div
        key={j}
        className={"grid aspect-square place-items-center rounded-xl border font-mono text-2xl font-bold tabular-nums transition-colors " + cellColor(geno)}
      >
        {geno}
      </div>
    ))}
  </>
);

export default GeneticsPage;
