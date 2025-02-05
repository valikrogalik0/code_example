import { useCallback } from 'react';
import moment from 'moment-timezone';

import Amount from 'NDA/amount';
import Id from 'NDA//Id';
import { DATE_TIME_FORMAT_LOCALE_SHORT_DETAIL, DATE_TIME_FORMAT_SQL_PREPARE } from 'NDA/date';
import { useSellerContext } from 'NDA/contexts';

import { SalesReport, ReportSalesDesktopTableRowType } from 'NDA/types';

export type SalesReportRowItemType = SalesReportTitle |
SalesReportPriceLevel |
SalesReportSubtotal |
SalesReportGrandTotal;

export enum SalesRowGroupType {
  TITLE,
  PRICE_LEVEL,
  SUBTOTAL,
  GRAND_TOTAL,
}

export type SalesReportTitle = Partial<ReportSalesDesktopTableRowType> & {
  type: SalesRowGroupType.TITLE,
  subRows: Array<SalesReportPriceLevel | SalesReportSubtotal>,
  data: {
    name: string,
    netProceeds: unknown,
    start: string,
    faceValue: unknown,
    countRefunded: unknown,
    NDAFeesCollected: unknown,
    NDAFeesOwed: unknown,
  },
  totalSold: unknown,
  ticketType: unknown,
  totalTicketSale: unknown,
  discounts: unknown,
  ticketsRefunded: unknown,
  amountRefunded: unknown,
  netProceeds: unknown,
};

export type SalesReportPriceLevel = ReportSalesDesktopTableRowType & {
  type: SalesRowGroupType.PRICE_LEVEL,
  subRows: never,
  data: {
    name: string,
    netProceeds: unknown,
    start: unknown,
    faceValue: Amount,
    countRefunded: number,
    NDAFeesCollected: Amount,
    NDAeapFeesOwed: Amount,
  },
  totalSold: 0,
  ticketType: string,
  totalTicketSale: Amount,
  discounts: Amount,
  ticketsRefunded: number,
  amountRefunded: Amount,
  netProceeds: Amount,
};

export type SalesReportSubtotal = {
  type: SalesRowGroupType.SUBTOTAL,
  subRows: never,
  data: {
    salesTaxCollected: Amount,
    NDAFeesCollected: Amount,
    NDAeapFeesOwed: Amount,
    totalAmount: Amount,
    netProceeds: Amount,
    name: unknown,
    start: unknown,
    faceValue: unknown,
    countRefunded: unknown,
  },
  totalSold: unknown,
  ticketType: unknown,
  totalTicketSale: unknown,
  discounts: unknown,
  ticketsRefunded: unknown,
  amountRefunded: unknown,
  netProceeds: unknown,
};

export type SalesReportGrandTotal = {
  type: SalesRowGroupType.GRAND_TOTAL,
  data: never,
  subRows: [
    {
      salesTaxCollected: Amount,
      NDAFeesCollected: Amount,
      NDAFeesOwed: Amount,
      totalAmount: Amount,
    },
  ],
  totalSold: unknown,
  ticketType: unknown,
  totalTicketSale: unknown,
  discounts: unknown,
  ticketsRefunded: unknown,
  amountRefunded: unknown,
  netProceeds: unknown,
};

export type ReportData = Pick<SalesReport, 'cols' | 'dateFormat'>;

const isRowHeaderGroup = (col: ReportData['cols'][number]) => !col.price_level_name;

const useParseSalesReport = () => {
  const { currentSeller } = useSellerContext();
  const { locale = '' } = currentSeller?.attributes || {};

  return useCallback((report: ReportData | undefined, groupByPriceLevel: boolean = false) => {
    if (!report) {
      return [];
    }

    const { cols, dateFormat } = report;
    const map: {
      [key: Id]: {
        header: SalesReportTitle;
        levels: Record<string, SalesReportPriceLevel>;
        subtotal: SalesReportSubtotal;
      };
    } = {};

    for (const col of cols) {
      if (col.transaction_type === 'Chargeback') {
        // eslint-disable-next-line no-continue
        continue;
      }

      const id = col.event_id as string;
      const salesTaxCollected = Amount.parse(col.seller_tax_collected as string);
      const NDAFeesCollected = Amount.parse(col.credit_card_fee_collected as string).add(
        Amount.parse(col.ticket_service_fees_collected as string)
      );
      const NDAFeesOwed = Amount.parse(col.service_fee_owed as string).add(
        Amount.parse(col.credit_card_processing_fee_owed as string)
      );
      const totalAmount = Amount.parse(col.ticket_face_value_collected as string).add(
        Amount.parse(col.ticket_discounts_collected as string)
      );

      if (!map[id] && groupByPriceLevel) {
        let time = moment();
        let zoneAbbr = '';
        let start = '';

        if (col.event_start) {
          time = moment(col.event_start, dateFormat);
          zoneAbbr = col.venue_timezone_name
            ? moment(col.event_start, dateFormat).tz(col.venue_timezone_name).zoneAbbr()
            : '';
          start = moment(new Date(col.event_start.toUpperCase().replace(/(AM|PM)/, (val) => ` ${val}`))).format(
            DATE_TIME_FORMAT_SQL_PREPARE
          );
        }

        map[id] = {
          header: {
            type: SalesRowGroupType.TITLE,
            subRows: [],
            data: {
              name: `${col.event_name} (${time
                .locale(locale)
                .format(`${DATE_TIME_FORMAT_LOCALE_SHORT_DETAIL}`)} ${zoneAbbr})`,
              netProceeds: undefined,
              start,
              faceValue: undefined,
              NDAFeesCollected: undefined,
              countRefunded: undefined,
              NDAFeesOwed: undefined,
            },
            totalSold: undefined,
            ticketType: undefined,
            totalTicketSale: undefined,
            discounts: undefined,
            ticketsRefunded: undefined,
            amountRefunded: undefined,
            netProceeds: undefined,
          } as SalesReportTitle,
          levels: {},
          subtotal: {
            type: SalesRowGroupType.SUBTOTAL,
            data: {
              salesTaxCollected: Amount.zero(),
              NDAFeesCollected: Amount.zero(),
              NDAFeesOwed: Amount.zero(),
              totalAmount: Amount.zero(),
              netProceeds: Amount.zero(),
            },
          } as SalesReportSubtotal,
        };
      } else if (!map[id]) {
        map[id] = {
          header: {} as SalesReportTitle,
          levels: {},
          subtotal: {
            type: SalesRowGroupType.SUBTOTAL,
            data: {
              salesTaxCollected: Amount.zero(),
              NDAFeesCollected: Amount.zero(),
              NDAFeesOwed: Amount.zero(),
              totalAmount: Amount.zero(),
              netProceeds: Amount.zero(),
            },
          } as SalesReportSubtotal,
        };
      }

      const event = map[id];

      if (!groupByPriceLevel && (isRowHeaderGroup(col) || col.transaction_type === 'Exchange')) {
        if (!event.header.type) {
          let time = moment();
          let zoneAbbr = '';
          let start = '';

          if (col.event_start) {
            time = moment(col.event_start, dateFormat);
            zoneAbbr = col.venue_timezone_name
              ? moment(col.event_start, dateFormat).tz(col.venue_timezone_name).zoneAbbr()
              : '';
            start = moment(new Date(col.event_start.toUpperCase().replace(/(AM|PM)/, (val) => ` ${val}`))).format(
              DATE_TIME_FORMAT_SQL_PREPARE
            );
          }

          event.header = {
            type: SalesRowGroupType.TITLE,
            subRows: [],
            data: {
              name: `${col.event_name} (${time
                .locale(locale)
                .format(`${DATE_TIME_FORMAT_LOCALE_SHORT_DETAIL}`)} ${zoneAbbr})`,
              netProceeds: undefined,
              start,
              faceValue: undefined,
              NDAFeesCollected: undefined,
              countRefunded: undefined,
              NDAFeesOwed: undefined,
            },
            totalSold: undefined,
            ticketType: undefined,
            totalTicketSale: undefined,
            discounts: undefined,
            ticketsRefunded: undefined,
            amountRefunded: undefined,
            netProceeds: undefined,
          };
        }

        const { subtotal } = event;

        subtotal.data.salesTaxCollected = subtotal.data.salesTaxCollected.add(salesTaxCollected);
        subtotal.data.NDAFeesCollected = subtotal.data.NDAFeesCollected.add(NDAFeesCollected);
        subtotal.data.NDAFeesOwed = subtotal.data.NDAFeesOwed.add(NDAFeesOwed);
        subtotal.data.totalAmount = subtotal.data.totalAmount.add(totalAmount);
        subtotal.data.netProceeds = subtotal.data.netProceeds.add(
          totalAmount,
          NDAFeesCollected,
          NDAFeesOwed
        );

        // eslint-disable-next-line no-continue
        continue;
      }

      const totalSold =
        parseInt(col.count_live_tickets as string, 10) + parseInt(col.count_canceled_tickets as string, 10);
      const priceLevelName = col.price_level_name as string;

      if (!event.levels[priceLevelName]) {
        event.levels[priceLevelName] = {
          type: SalesRowGroupType.PRICE_LEVEL,
          data: {
            name: col.price_level_name,
            netProceeds: undefined,
            start: undefined,
            faceValue: Amount.parse(col.ticket_face_value_collected as string),
            NDAFeesCollected: Amount.zero(),
            NDAFeesOwed: Amount.zero(),
            countRefunded: 0,
          },
          totalSold: 0,
          ticketType: priceLevelName,
          totalTicketSale: Amount.zero(),
          discounts: Amount.zero(),
          ticketsRefunded: 0,
          amountRefunded: Amount.zero(),
          netProceeds: Amount.zero(),
        } as SalesReportPriceLevel;
      }

      const level = event.levels[priceLevelName];

      const { subtotal } = event;

      level.netProceeds = level.netProceeds.add(Amount.parse(col.ticket_face_value_collected as string));
      level.data.NDAFeesCollected = level.data.NDAFeesCollected.add(NDAFeesCollected);
      subtotal.data.salesTaxCollected = subtotal.data.salesTaxCollected.add(salesTaxCollected);
      subtotal.data.NDAFeesCollected = subtotal.data.NDAFeesCollected.add(NDAFeesCollected);
      subtotal.data.netProceeds = subtotal.data.netProceeds.add(
        totalAmount,
        NDAFeesCollected,
        NDAFeesOwed
      );

      if (col.transaction_type === 'Payment') {
        level.totalSold += totalSold;
        level.totalTicketSale = level.totalTicketSale.add(Amount.parse(col.ticket_face_value_collected as string));
        level.discounts = level.discounts.add(Amount.parse(col.ticket_discounts_collected as string));
        level.ticketsRefunded += parseInt(col.count_canceled_tickets as string, 10);
        level.data.NDAFeesOwed = level.data.NDAFeesOwed.add(NDAFeesOwed);

        subtotal.data.NDAFeesOwed = subtotal.data.NDAFeesOwed.add(NDAFeesOwed);
        subtotal.data.totalAmount = subtotal.data.totalAmount.add(totalAmount);
      }

      if (col.transaction_type === 'Refund') {
        level.amountRefunded = level.amountRefunded.add(Amount.parse(col.ticket_face_value_collected as string));
        level.data.countRefunded += parseInt(col.count_canceled_tickets as string, 10);
        level.data.NDAFeesOwed = level.data.NDAFeesOwed.add(NDAFeesOwed);

        if (!subtotal?.data?.salesTaxCollected) {
          subtotal.data.salesTaxCollected = Amount.zero();
        }

        subtotal.data.NDAFeesOwed = subtotal.data.NDAFeesOwed.add(NDAFeesOwed);
      }

      if (col.transaction_type === 'Swap') {
        level.totalTicketSale = level.totalTicketSale.add(Amount.parse(col.ticket_face_value_collected as string));
      }
    }

    return Object.values(map).reduce((carry, row) => {
      // eslint-disable-next-line no-param-reassign
      row.header.subRows = [...Object.values(row.levels), row.subtotal];

      return [...carry, row.header];
    }, [] as SalesReportTitle[]);
  }, [locale]);
};

export default useParseSalesReport;
