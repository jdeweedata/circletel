'use client';

import { useEffect, useState } from 'react';
import { PiCheckBold, PiMapPinBold, PiWifiHighBold } from 'react-icons/pi';

import { ShopCta } from '@/components/home/shop/ShopCta';
import { useOrderContext } from '@/components/order/context/OrderContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getWhatsAppLink } from '@/lib/constants/contact';
import {
  FIVE_G_CASH_CPE_PRICE_INCL_VAT,
  buildFiveGCashCpeAddon,
  clearFiveGCashCpeSelection,
  formatFiveGCashCpePrice,
  readFiveGCashCpeSelection,
  writeFiveGCashCpeSelection,
  type FiveGCashCpeRouter,
} from '@/lib/products/five-g-cash-cpe';
import { cn } from '@/lib/utils';

const outlineButtonClass =
  'inline-flex items-center justify-center rounded-full px-8 py-3.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-circleTel-orange focus-visible:ring-offset-2 border-2 border-circleTel-navy bg-transparent text-circleTel-navy hover:bg-circleTel-navy hover:text-white';

interface FiveGProductActionsProps {
  dealSku: string;
  dealName: string;
  isSim: boolean;
  routers: FiveGCashCpeRouter[];
  whatsappHref: string;
}

export function FiveGProductActions({
  dealSku,
  dealName,
  isSim,
  routers,
  whatsappHref,
}: FiveGProductActionsProps) {
  const { state, actions } = useOrderContext();
  const [open, setOpen] = useState(false);
  const [pickedSku, setPickedSku] = useState<string>(routers[0]?.sku ?? '');
  const [selected, setSelected] = useState<FiveGCashCpeRouter | null>(null);

  useEffect(() => {
    const stored = readFiveGCashCpeSelection(dealSku);
    if (!stored) return;
    const match = routers.find((row) => row.sku === stored.sku) ?? stored;
    setSelected(match);
    setPickedSku(match.sku);
  }, [dealSku, routers]);

  const coverageHref = selected
    ? `/coverage?sku=${encodeURIComponent(dealSku)}&cpe=${encodeURIComponent(selected.sku)}`
    : `/coverage?sku=${encodeURIComponent(dealSku)}`;

  function persistRouter(router: FiveGCashCpeRouter) {
    writeFiveGCashCpeSelection(dealSku, router);
    const addon = buildFiveGCashCpeAddon(router);
    const current = state.orderData.package.selectedAddons || [];
    actions.updateOrderData({
      package: {
        ...state.orderData.package,
        selectedAddons: [
          ...current.filter((row) => !row.addon.id.startsWith('cash-cpe:')),
          { addon, quantity: 1 },
        ],
      },
    });
  }

  function handleAddToDeal() {
    const router = routers.find((row) => row.sku === pickedSku);
    if (!router) return;
    setSelected(router);
    persistRouter(router);
    setOpen(false);
  }

  function handleRemove() {
    setSelected(null);
    clearFiveGCashCpeSelection();
    const current = state.orderData.package.selectedAddons || [];
    actions.updateOrderData({
      package: {
        ...state.orderData.package,
        selectedAddons: current.filter((row) => !row.addon.id.startsWith('cash-cpe:')),
      },
    });
  }

  return (
    <div className="mt-8 flex flex-col gap-3">
      {selected ? (
        <div className="rounded-xl border border-ui-border bg-ui-bg p-4">
          <p className="font-heading text-[11px] font-bold uppercase tracking-wide text-circleTel-grey600">
            Router added to this deal
          </p>
          <p className="mt-1 font-heading text-sm font-semibold text-circleTel-navy">{selected.name}</p>
          <p className="mt-1 font-body text-sm text-circleTel-navy">
            {formatFiveGCashCpePrice(FIVE_G_CASH_CPE_PRICE_INCL_VAT)} once-off
          </p>
          <button
            type="button"
            onClick={handleRemove}
            className="mt-2 font-body text-xs font-semibold text-circleTel-orange-accessible underline-offset-2 hover:underline"
          >
            Remove router
          </button>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <ShopCta href={coverageHref} className="gap-2">
          <PiMapPinBold className="h-4 w-4" aria-hidden="true" />
          Check coverage
        </ShopCta>
        {isSim ? (
          <button type="button" className={outlineButtonClass} onClick={() => setOpen(true)}>
            {selected ? 'Change router' : 'Add router'}
          </button>
        ) : (
          <ShopCta href={whatsappHref} variant="outline-navy">
            WhatsApp us
          </ShopCta>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] w-[95vw] max-w-xl overflow-y-auto rounded-xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl text-circleTel-navy">
              Add a 5G router
            </DialogTitle>
            <DialogDescription className="font-body text-sm text-circleTel-grey600">
              Approved 5G CPE from Esquire. {formatFiveGCashCpePrice(FIVE_G_CASH_CPE_PRICE_INCL_VAT)} once-off.
              The SIM plan stays month-to-month.
            </DialogDescription>
          </DialogHeader>

          {routers.length === 0 ? (
            <p className="font-body text-sm text-circleTel-navy">
              No approved 5G routers are in stock right now.{' '}
              <a href={getWhatsAppLink(`Hi CircleTel, I need a 5G router for ${dealName}`)} className="font-semibold text-circleTel-orange-accessible underline">
                WhatsApp us
              </a>
              .
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {routers.map((router) => {
                const active = pickedSku === router.sku;
                return (
                  <li key={router.sku}>
                    <button
                      type="button"
                      onClick={() => setPickedSku(router.sku)}
                      className={cn(
                        'flex w-full items-center gap-4 rounded-xl border p-3 text-left transition-colors',
                        active
                          ? 'border-circleTel-orange bg-orange-50'
                          : 'border-ui-border bg-white hover:border-circleTel-navy'
                      )}
                    >
                      <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-ui-bg">
                        {router.imageUrl ? (
                          <img src={router.imageUrl} alt="" className="h-full w-full object-contain" />
                        ) : (
                          <PiWifiHighBold className="h-7 w-7 text-circleTel-orange" aria-hidden="true" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-heading text-sm font-semibold text-circleTel-navy">
                          {router.name}
                        </span>
                        <span className="mt-1 block font-body text-sm text-circleTel-grey600">
                          {formatFiveGCashCpePrice(router.sellInclVat)} once-off
                        </span>
                      </span>
                      {active ? (
                        <PiCheckBold className="h-5 w-5 shrink-0 text-circleTel-orange" aria-hidden="true" />
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <DialogFooter className="gap-2 sm:justify-end">
            <button type="button" className={outlineButtonClass} onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              disabled={routers.length === 0 || !pickedSku}
              onClick={handleAddToDeal}
              className="inline-flex items-center justify-center rounded-full bg-circleTel-orange px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-circleTel-orange-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              Add to deal
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
