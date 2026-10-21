"use client"

import { useState } from "react"
import { AnimatePresence, motion, type Variants } from "motion/react"

import { Badge } from "./badge"
import { Button } from "./button"
import { Switch } from "./switch"
import { FancyButton } from "./pricing-9-utils/fancy-button"
import {
  ArrowUpRightIcon,
  ChartLineIcon,
  CheckIcon,
  CircleCheckIcon,
  CodeIcon,
  DatabaseIcon,
  LifeBuoyIcon,
  LockIcon,
  RepeatIcon,
  SparklesIcon,
} from "lucide-react"

const animVariant: Variants = {
  initial: { opacity: 0, y: 10, filter: "blur(4px)", scale: 0.98 },
  animate: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    scale: 1,
    transition: {
      delay: i * 0.03,
      type: "spring",
      damping: 22,
      stiffness: 280,
    },
  }),
  exit: {
    opacity: 0,
    y: -10,
    filter: "blur(4px)",
    scale: 0.98,
    transition: { duration: 0.14 },
  },
};

export type FeatureToggle = {
  id: string
  label: string
  icon?: React.ReactNode
  price: number
  enabled: boolean
}

const defaultFeatures: FeatureToggle[] = [
  {
    id: "suporte",
    label: "Módulo de Suporte Técnico",
    icon: <LifeBuoyIcon className="size-4" />,
    price: 20000,
    enabled: false,
  },
  {
    id: "novidades",
    label: "Módulo Novidades (blog & destaques)",
    icon: <SparklesIcon className="size-4" />,
    price: 15000,
    enabled: false,
  },
  {
    id: "usuarios",
    label: "+5 utilizadores do painel",
    icon: <CodeIcon className="size-4" />,
    price: 12000,
    enabled: false,
  },
  {
    id: "storage",
    label: "+25 GB de armazenamento",
    icon: <DatabaseIcon className="size-4" />,
    price: 10000,
    enabled: false,
  },
  {
    id: "sla",
    label: "Suporte prioritário (SLA 8h)",
    icon: <RepeatIcon className="size-4" />,
    price: 18000,
    enabled: false,
  },
  {
    id: "relatorios",
    label: "Relatórios avançados & metas",
    icon: <ChartLineIcon className="size-4" />,
    price: 8000,
    enabled: false,
  },
];

const includedFeatures = [
  "Site público + catálogo + checkout B2B",
  "Módulo Comercial (pedidos, proforma, fatura FT)",
  "Registo de actividades (auditoria) + backups .json",
  "Códigos de emergência mestre (48h)",
];

const basePrice = 45000;
const kz = (n: number) => n.toLocaleString("pt-PT").replace(/\u00a0/g, " ");

type PricingProps = {
  /** Envia o pedido real à Nexora — devolve true se foi aceite. */
  onRequest?: (itensTexto: string, totalTexto: string) => Promise<boolean> | boolean
}

export function Pricing({ onRequest }: PricingProps) {
  const [features, setFeatures] = useState<FeatureToggle[]>(defaultFeatures)
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  const totalPedido = features.filter((f) => f.enabled).reduce((sum, f) => sum + f.price, 0);
  const totalPreco = basePrice + totalPedido;

  const priceChars = kz(totalPreco).split("");

  const toggleFeature = (id: string) => {
    setFeatures((prev) => prev.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f)));
  };

  const itensActivos = features.filter((f) => f.enabled)

  const solicitar = async () => {
    if (enviando || enviado || !onRequest) return
    setEnviando(true)
    try {
      const itens =
        itensActivos.length > 0
          ? itensActivos.map((f) => `• ${f.label} (+Kz ${kz(f.price)}/mês)`).join("\n")
          : "• Apenas o plano base (sem add-ons adicionais)"
      const total = `Kz ${kz(totalPreco)}/mês (Plano Base Kz ${kz(basePrice)} + Add-ons Kz ${kz(totalPedido)})`
      const ok = await onRequest(itens, total)
      if (ok) {
        setEnviado(true)
        window.setTimeout(() => setEnviado(false), 6000)
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section aria-label="Pricing" className="mx-auto w-full max-w-4xl">
      <div className="flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <Badge variant="secondary" className="w-fit">
            Upgrade do plano
          </Badge>
          <h2 className="font-heading text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Pague apenas pelo que precisa
          </h2>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Comece pelo plano base de manutenção e adicione módulos conforme a operação
            cresce. Envia o pedido e a Nexora Systems trata do resto.
          </p>
        </div>

        <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="flex flex-col gap-6 rounded-4xl bg-card p-8 shadow-elevated-lg">
            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-medium text-foreground">Add-ons do plano</h3>
              <p className="text-sm text-muted-foreground">
                Active os módulos de que precisa. O valor actualiza em tempo real.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              {features.map((feature) => (
                <div
                  key={feature.id}
                  className="flex items-center justify-between gap-4 rounded-lg p-2"
                >
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => toggleFeature(feature.id)}
                    className="h-auto flex-1 justify-start rounded-lg px-0 py-0 hover:bg-transparent"
                  >
                    <div className="flex items-center gap-3 text-left">
                      <div
                        className={`flex size-9 shrink-0 items-center justify-center rounded-full transition-colors ${
                          feature.enabled
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {feature.icon}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">
                          {feature.label}
                        </span>
                        <span className="text-start text-xs text-muted-foreground">
                          +Kz {kz(feature.price)}/mês
                        </span>
                      </div>
                    </div>
                  </Button>
                  <Switch
                    checked={feature.enabled}
                    onCheckedChange={() => toggleFeature(feature.id)}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-6 rounded-4xl bg-muted p-8">
            <div className="flex flex-col gap-2">
              <h3 className="text-xl font-medium text-foreground">O vosso plano</h3>
              <p className="text-sm text-muted-foreground">
                Plano base + {itensActivos.length} add-on(s) seleccionado(s)
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-semibold tracking-tight text-foreground">Kz</span>
                <AnimatePresence mode="popLayout">
                  {priceChars.map((char, idx) => (
                    <motion.span
                      key={`${totalPreco}-${char}-${idx}`}
                      variants={animVariant}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      custom={idx}
                      className="inline-block text-7xl font-semibold tracking-tight text-foreground"
                    >
                      {char === " " ? "\u00A0" : char}
                    </motion.span>
                  ))}
                </AnimatePresence>
                <span key="period" className="text-xl text-muted-foreground">/mês</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Base: Kz {kz(basePrice)} · Add-ons: Kz {kz(totalPedido)}
              </p>
            </div>

            {enviado ? (
              <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <CircleCheckIcon className="size-8 shrink-0 text-emerald-600" />
                <div>
                  <p className="text-sm font-semibold text-emerald-800">Pedido enviado à Nexora Systems!</p>
                  <p className="text-xs text-emerald-700">Recebe a confirmação e a fase de reactivação por e-mail/WhatsApp.</p>
                </div>
              </div>
            ) : (
              <FancyButton size="lg" className="w-full" onClick={solicitar} disabled={enviando}>
                {enviando ? "A enviar o pedido…" : "Solicitar upgrade à Nexora"}
                <ArrowUpRightIcon className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </FancyButton>
            )}
            {!enviado && (
              <p className="text-center text-xs text-muted-foreground">
                O pedido entra nas Definições (contacto do painel) e vai por e-mail directo à Nexora Systems.
              </p>
            )}

            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium text-foreground">Sempre incluído</p>
              <ul className="flex flex-col gap-3">
                {includedFeatures.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary">
                      <CheckIcon className="size-3 text-primary-foreground" />
                    </div>
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
export default Pricing;
