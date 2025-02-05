import * as React from 'react';
import { act } from 'react-dom/test-utils';
import fetch from 'jest-fetch-mock';
import _ from 'lodash';

import { mockUserDataResponse } from '__mocks__/fetchMocks';
import {
  render, screen, setTestsCookie, cleanup, fireEvent, RenderResult, waitFor,
} from 'test-utils';

import {
  REPORTS_PAYMENTS_DATA,
} from 'helpers/values';

import ReportsPaymentsPage from '../ReportsPaymentsPage';

setTestsCookie();

const mockReportsPayments = REPORTS_PAYMENTS_DATA;

global.fetch = fetch as typeof global.fetch;

const MockPaymentsPage = () => (
  <ReportsPaymentsPage />
);

beforeAll(() => {
  mockUserDataResponse(fetch);
});

afterEach(() => {
  cleanup();
  fetch.mockClear();
});

afterAll(() => {
  cleanup();
  fetch.mockClear();
});

describe('Order Payments page', () => {
  let paymentsPage: RenderResult;

  beforeEach(async () => {
    fetch.mockIf(/payouts/, JSON.stringify(mockReportsPayments));

    await waitFor(async () => {
      paymentsPage = render(<MockPaymentsPage />);
    });
  });

  test('Render page', async () => {
    expect(screen.getByText('NDA_reports__payments')).toBeInTheDocument();
    expect(screen.getByText('NDA_reports__payout_id_table_label')).toBeInTheDocument();
    expect(screen.getByText('NDA_reports__date_issued_table_label')).toBeInTheDocument();
    expect(screen.getByText('NDA_reports__sales_dates_table_label')).toBeInTheDocument();
    expect(screen.getByText('NDA_reports__amount_table_label')).toBeInTheDocument();
    expect(screen.getByText('NDA_reports__type_table_label')).toBeInTheDocument();
    expect(screen.getByText('NDA_reports__view_details_table_label')).toBeInTheDocument();
    expect(screen.getAllByText('NDA_general__view_label')).toHaveLength(10);
  });

  test('Payments no data', async () => {
    fetch.mockIf(/payouts/, JSON.stringify([]));
    
    await waitFor(async () => {
      paymentsPage = render(<MockPaymentsPage />);
    });

    expect(screen.getByText('NDA_reports__no_payments_have_been_issued_yet')).toBeInTheDocument();
  });
});
