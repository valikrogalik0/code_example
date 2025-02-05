import {
  useMemo,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { sortBy } from 'lodash';

import useApiReports, { PaymentsResponse } from 'NDA/useApiReports';
import useParsePaymentsReport from 'NDA/useParsePaymentsReport';

import { ReportPaymentsTableRowType } from 'NDA/types';

const usePayments = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [cols, setCols] = useState<ReportPaymentsTableRowType[]>([]);

  const { getPayouts } = useApiReports();
  const parse = useParsePaymentsReport();

  const getPayoutsHandler = useCallback(async () => {
    setLoading(true);

    getPayouts('page[size]=1000').then((response: PaymentsResponse | []) => {
      setLoading(false);
      setCols(sortBy(parse(response), 'payoutId').reverse());
    });
  }, []);

  useEffect(() => {
    getPayoutsHandler();
  }, []);

  return useMemo(() => ({
    cols,
    loading,
  }), [
    cols,
    loading,
  ]);
};

export default usePayments;
