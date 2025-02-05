import React, {
  useState,
  useMemo,
  useEffect,
  memo,
  useCallback,
} from 'react';
import { uniq } from 'lodash';
import useSearchQuery from 'NDA/hooks/useSearchQuery';
import LocaleText from 'NDA/localization/LocaleText';
import { ReportQuerySearchParams } from 'NDA//types';
import { SalesReportHeadersType } from 'NDA/types';
import { useAppContext } from 'NDA/contexts';
import { SALES_REPORT_TYPE } from 'NDA/useApiReports';
import { Report } from 'NDA/report-parser';
import { useAppTranslation } from 'NDA/hooks';
import moment from 'moment/moment';
import Id from 'NDA/Id';
import Header from 'NDA/Header';
import HeaderActionsWrapper from 'NDA/HeaderActionsWrapper';
import HeaderTitle from 'NDA/HeaderTitle';
import TableSelections from 'NDA/TableSelections';
import {
  buildEventsArgument,
  buildSellerArgument,
  OPERATOR_ANY,
  OPERATOR_EQUAL,
} from 'NDA/helpers/arguments';
import TableSelectionPickersContainer from 'NDA/TableSelectionPickersContainer';
import {
  TransactionItemType,
  CreditCardFee,
  SellerChargeType,
} from 'NDA/helpers/types';
import RunReportButton from 'NDA/components/RunReportButton/RunReportButton';
import useMarking from 'NDA/hooks/useMarking';
import useReport from 'NDA/hooks/useReport';
import {
  ReportSalesTable,
  DateRangePicker,
} from 'NDA/components';
import EventsPickerContextProvider from 'NDA/context';
import {
  SALES_REPORT_HEADERS_BASE,
  SALES_REPORT_EXPANDING_COLUMNS,
} from 'NDA/data';
import useParseSalesReport, { SalesReportRowItemType } from 'NDA/useParseSalesReport';
import DownloadSalesReport from 'NDA/DownloadSalesReport';
import ActionsGroup from 'NDA/ActionsGroup';
import Content from 'NDA/Content';
import PageWrapper from 'NDA/PageWrapper';
import SalesReportEventsPicker from 'NDA/SalesReportEventsPicker';
import { OnConfirmSelectHandler } from 'NDA/useEventsPickerHandlers';
import ResetFiltersButton from 'NDA/ResetFiltersButton';

const ARGUMENT_SELECTED_EVENTS_KEY = 'events';

const ReportsSalesPage: React.FC = memo(() => {
  const { t } = useAppTranslation();
  const { event: eventId } = useSearchQuery<ReportQuerySearchParams>();
  const [selectedEvents, setSelectedEvents] = useState<Id[]>(eventId ? [eventId] : []);
  const [firstLoad, setFirstLoad] = useState(false);
  const [isCustomDateRange, enableCustomDateRange, disableCustomDateRange] = useMarking(false);
  const { config } = useAppContext();
  const {
    service,
    parse: parseReport,
    markInit,
    loading,
    init,
    setParser,
    report,
    cols,
    setAdditionalParserArguments,
    setDateRangeReset,
    dateRangeReset,
    setEventsPickerReset,
    eventsPickerReset,
    resetReport,
  } = useReport<SalesReportHeadersType, SalesReportRowItemType>({
    arguments: {
      ...(!eventId ? {} : {
        [ARGUMENT_SELECTED_EVENTS_KEY]: buildEventsArgument({
          title: t('NDA_events__events_label') as string,
          name: 'event_id',
          operator: OPERATOR_ANY,
          value: [eventId],
        }),
      }),
    },
    callbacks: {
      onFirstRun: [
        () => setFirstLoad(true),
      ],
    },
  });
  const parser = useParseSalesReport();

  const setDefaultConfig = () => {
    service.setReport(SALES_REPORT_TYPE);
    service.setColumns(SALES_REPORT_HEADERS_BASE);
    service.addExpandingColumn('ticket_fees_ti', {
      credit_card_fee_collected: CreditCardFee,
    });
    service.addExpandingColumn('transaction_details_fees_collected', {
      seller_tax_collected: TransactionItemType.CUSTOM_SELLER_FEE,
    });
    service.addExpandingColumn('transaction_details_financials_collected', {
      ticket_face_value_collected: TransactionItemType.TICKET,
      ticket_service_fees_collected: TransactionItemType.BUYER_FEE,
      ticket_discounts_collected: TransactionItemType.COUPON_DISCOUNT,
    });
    service.addExpandingColumn('transaction_details_fees_owed', {
      credit_card_processing_fee_owed: SellerChargeType.CC_PROCESSING_FEE,
    });
    service.addExpandingColumn('transaction_details_financials_owed', {
      service_fee_owed: SellerChargeType.SERVICE_FEE,
    });
    service.addGroupBy('event_id');
    service.addGroupBy('price_level_id');
    service.addGroupBy('transaction_type');
    service.setParseExpandingColumns(SALES_REPORT_EXPANDING_COLUMNS);
    service.setOptions({
      include_ti_items: true,
      include_sc_items: true,
    });
  };

  const setEventsArgument = (selected: Id[]) => {
    if (selected.length === 0) {
      service.removeArgument(ARGUMENT_SELECTED_EVENTS_KEY);

      return;
    }

    service.addArgument(ARGUMENT_SELECTED_EVENTS_KEY, buildEventsArgument({
      title: t('NDA_events__events_label') as string,
      name: 'event_id',
      operator: OPERATOR_ANY,
      value: selected,
    }));
  };

  useEffect(() => {
    setDefaultConfig();
    setParser(parser);
    setFirstLoad(false);
  }, []);

  useEffect(() => {
    service.setUserId(config.user!.user_id);
    service.setTimezone(config.user!.timezone);

    service.addArgument('seller', buildSellerArgument({
      title: 'seller_id',
      name: 'seller_id',
      operator: OPERATOR_EQUAL,
      value: config.user!.seller_id,
    }));
  }, [config.user]);

  useEffect(() => {
    setEventsArgument(uniq(selectedEvents));
  }, [selectedEvents]);

  const dateRangeConfig = useMemo(() => ({
    from: {
      default: moment().subtract(1, 'year').endOf('day').toDate(),
      title: 'sale_time',
      name: 'sale_time',
    },
    to: {
      default: moment().endOf('day').toDate(),
      title: 'sale_time',
      name: 'sale_time',
    },
  }), []);

  useEffect(() => {
    parseReport();
  }, [service.loadedReportData]);

  useEffect(() => {
    if (!eventId) {
      markInit();

      return;
    }

    if (init || !service.ready || loading) {
      return;
    }

    service.loadReport();

    markInit();
  }, [init, eventId, service.loadReport, loading, service.ready]);

  const eventsPickerConfirmHandler: OnConfirmSelectHandler = useCallback((ids) => {
    setSelectedEvents(ids);
  }, []);

  const resetFilters = useCallback(() => {
    resetReport();

    setSelectedEvents([]);
    setFirstLoad(false);

    dateRangeReset();
    eventsPickerReset?.();
  }, [dateRangeReset, eventsPickerReset]);

  return (
    <PageWrapper>
      <Header>
        <HeaderTitle>
          <LocaleText slug="NDA_reports__sales" />
        </HeaderTitle>
        <HeaderActionsWrapper>
          <DownloadSalesReport report={report} cols={cols} mobile />
        </HeaderActionsWrapper>
      </Header>
      <Content>
        <TableSelections>
          <TableSelectionPickersContainer>
            <DateRangePicker
              service={service}
              config={dateRangeConfig}
              locale={config!.user!.locale}
              onSelect={(range, isDefaultDateRange) => !isDefaultDateRange && enableCustomDateRange()}
              onResetDateRange={disableCustomDateRange}
              setReset={setDateRangeReset}
            />
            <EventsPickerContextProvider preSelected={selectedEvents} setReset={setEventsPickerReset}>
              <SalesReportEventsPicker onConfirmSelect={eventsPickerConfirmHandler} loading={loading} />
            </EventsPickerContextProvider>
            <ResetFiltersButton onClick={resetFilters} />
          </TableSelectionPickersContainer>
          <ActionsGroup>
            <RunReportButton onClick={service.loadReport} disabled={loading} />
            <DownloadSalesReport report={report} cols={cols} />
          </ActionsGroup>
        </TableSelections>
        <ReportSalesTable
          loading={loading}
          loaded={firstLoad}
          report={report as Report<SalesReportHeadersType>}
          cols={cols}
          isCustomDateRange={isCustomDateRange}
        />
      </Content>
    </PageWrapper>
  );
});

export default ReportsSalesPage;
