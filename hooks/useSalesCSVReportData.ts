import useArrayTranslations from 'NDA/useArrayTranslations';
import { useMemo } from 'react';
import { flatten } from 'lodash';
import Amount from 'NDA/amount';
import { CSV_SALES_REPORT_HEADERS } from 'NDA/report-csv-headers';
import { SalesReportPriceLevel, SalesReportTitle, SalesRowGroupType } from 'NDA/useParseSalesReport';

const useSalesCSVReportData = (options: {
  cols: SalesReportTitle[],
}) => {
  const { cols } = options;
  const headers = useArrayTranslations(CSV_SALES_REPORT_HEADERS) as string[];

  return useMemo(() => ({
    reportData: (
      flatten(
        cols.map((col) => (
          col.subRows.filter((row): row is SalesReportPriceLevel => row.type === SalesRowGroupType.PRICE_LEVEL)
            .map((priceLevelData: SalesReportPriceLevel) => [
              col.data.name,
              col.data.start,
              priceLevelData.data.name,
              priceLevelData.totalSold.toLocaleString(),
              new Amount(
                priceLevelData.data.faceValue.currency,
                priceLevelData.data.faceValue.value / priceLevelData.totalSold,
              ).toLocaleString(),
              priceLevelData.discounts.toLocaleString(),
              priceLevelData.data.NDAFeesCollected.toLocaleString(),
              priceLevelData.data.countRefunded.toLocaleString(),
              priceLevelData.amountRefunded.toLocaleString(),
              priceLevelData.data.NDAFeesOwed.toLocaleString(),
              priceLevelData.netProceeds.toLocaleString(),
            ])
        )),
      )
    ),
    headers,
  }), [cols]);
};

export default useSalesCSVReportData;
