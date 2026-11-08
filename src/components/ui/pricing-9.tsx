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
  ReceiptTextIcon,
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
  /** Já está activo no contrato (pago) — aparece trancado e não volta a cobrar. */
  pago?: boolean
}

const defaultFeatures: FeatureToggle[] = [
  {
    id: "faturacao",
    label: "Módulo de Faturação — auto-serviço no portal",
    icon: <ReceiptTextIcon className="size-4" />,
    price: 10000,
    enabled: false,
  },
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
  /** Módulos já autorizados pelo Developer (sysLic) — ficam trancados + «Pago». */
  modulosPagos?: Record<string, boolean>
}

export function Pricing({ onRequest, modulosPagos }: PricingProps) {
  const [features, setFeatures] = useState<FeatureToggle[]>(() =>
    defaultFeatures.map((f) => ({
      ...f,
      pago: modulosPagos?.[f.id] === true,
      enabled: modulosPagos?.[f.id] === true || f.enabled,
    }))
  )
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  const totalPedido = features.filter((f) => f.enabled && !f.pago).reduce((sum, f) => sum + f.price, 0);
  const totalPreco = basePrice + totalPedido;

  const priceChars = kz(totalPreco).split("");

  const toggleFeature = (id: string) => {
    setFeatures((prev) => prev.map((f) => (f.id === id && !f.pago ? { ...f, enabled: !f.enabled } : f)));
  };

  const itensActivos = features.filter((f) => f.enabled && !f.pago)
  const itensPagos = features.filter((f) => f.pago)

  const solicitar = async () => {
    if (enviando || enviado || !onRequest) return
    setEnviando(true)
    try {
      let itens =
        itensActivos.length > 0
          ? itensActivos.map((f) => `• ${f.label} (+Kz ${kz(f.price)}/mês)`).join("\n")
          : "• Apenas o plano base (sem add-ons adicionais)"
      if (itensPagos.length > 0) {
        itens += `\n\nJá no vosso plano (pagos anteriormente, não voltam a cobrar): ${itensPagos.map((f) => f.label).join(" · ")}`
      }
      const total = `Kz ${kz(totalPreco)}/mês (Plano Base Kz ${kz(basePrice)} + Add-ons novos Kz ${kz(totalPedido)}${itensPagos.length > 0 ? ` · ${itensPagos.length} módulo(s) já pago(s)` : ''})`
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
                  className={`flex items-center justify-between gap-4 rounded-lg p-2 ${feature.pago ? "opacity-80" : ""}`}
                >
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => toggleFeature(feature.id)}
                    disabled={feature.pago}
                    className="h-auto flex-1 justify-start rounded-lg px-0 py-0 hover:bg-transparent aria-disabled:cursor-default"
                  >
                    <div className="flex items-center gap-3 text-left">
                      <div
                        className={`flex size-9 shrink-0 items-center justify-center rounded-full transition-colors ${
                          feature.enabled
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {feature.pago ? <LockIcon className="size-4" /> : feature.icon}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">
                          {feature.label}
                        </span>
                        <span className="text-start text-xs text-muted-foreground">
                          {feature.pago ? "Já no vosso plano — activo e pago" : `+Kz ${kz(feature.price)}/mês`}
                        </span>
                      </div>
                    </div>
                  </Button>
                  {feature.pago ? (
                    <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      <LockIcon className="size-3" />
                      Pago
                    </span>
                  ) : (
                    <Switch
                      checked={feature.enabled}
                      onCheckedChange={() => toggleFeature(feature.id)}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-6 rounded-4xl bg-muted p-8">
            <div className="flex flex-col gap-2">
              <h3 className="text-xl font-medium text-foreground">O vosso plano</h3>
              <p className="text-sm text-muted-foreground">
                Plano base + {itensActivos.length} add-on(s) a activar agora
              </p>
              {itensPagos.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  Já pagos (mantidos): {itensPagos.map((f) => f.label).join(" · ")}
                </p>
              )}
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
                Base: Kz {kz(basePrice)} · Add-ons novos: Kz {kz(totalPedido)}
                {itensPagos.length > 0 && <> · módulos já pagos: Kz {kz(itensPagos.reduce((s, f) => s + f.price, 0))}/mês (já incluídos)</>}
              </p>
            </div>

            {enviado ? (
              <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <CircleCheckIcon className="size-8 shrink-0 text-emerald-600" />
                <div>
                  <p className="text-sm font-semibold text-emerald-800">Pedido enviado à Nexora Systems!</p>
                  <p className="text-xs text-emerald-700">O Developer (Nexora Systems) autoriza o pedido e recebe a activação dos módulos em seguida.</p>
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
                O pedido chega ao Painel do Developer, que autoriza ou recusa — também recebe o aviso por e-mail.
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
