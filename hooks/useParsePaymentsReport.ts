import { useCallback } from 'react';
import moment from 'moment-timezone';

import { getFormattedCurrency } from '@NDA/currency';

import { ApiData } from 'NDA/types/api';
import PaymentsSchemaAttributes from 'NDA/types/PaymentsSchemaAttributes';
import {
  DATE_FORMAT_LOCALE_AWARE_LONG,
  DATE_TIME_FORMAT_LOCALE_AWARE_LONG_DETAIL,
} from 'NDA/helpers/date';

import {
  ReportPaymentsTableRowType,
  PaymentsReport,
} from 'NDA/components/NDA/types';

const useParsePaymentsReport = () => (
  useCallback((report: PaymentsReport | []): ReportPaymentsTableRowType[] | [] => {
    if (!report.data) {
      return [];
    }

    return report?.data.map((col: ApiData<PaymentsSchemaAttributes>) => {
      const dateIssued = moment(col.attributes.date, 'MM/DD/YYYY').format(DATE_FORMAT_LOCALE_AWARE_LONG);
      const start = moment(col.attributes.batch_range_start, 'MM/DD/YYYY h:mma')
        .format(DATE_TIME_FORMAT_LOCALE_AWARE_LONG_DETAIL);
      const end = moment(col.attributes.batch_range_end, 'MM/DD/YYYY h:mma')
        .format(DATE_TIME_FORMAT_LOCALE_AWARE_LONG_DETAIL);

      return {
        payoutId: col.id,
        dateIssued,
        salesDates: `${start} - ${end}`,
        amount: getFormattedCurrency(col.attributes.amount, 'narrowSymbol'),
        type: col.attributes.payment_type,
      } as ReportPaymentsTableRowType;
    });
  }, [])
);

export default useParsePaymentsReport;
