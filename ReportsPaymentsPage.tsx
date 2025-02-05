import React, { memo } from 'react';
import LocaleText from 'NDA/LocaleText';
import useDocumentBreakpoint, { BreakpointType } from '@NDA/useDocumentBreakpoint';

import HeaderActionsWrapper from 'NDA/HeaderActionsWrapper';
import HeaderTitleWrapper from 'NDA/HeaderTitleWrapper';
import Header from 'NDA/Header';
import HeaderTitle from 'NDA/HeaderTitle';

import { ReportPaymentsTable } from 'NDA/components';
import DownloadPaymentsReport from 'NDA/Download/DownloadPaymentsReport';
import Content from 'NDA/Content';
import PageWrapper from 'NDA/PageWrapper';
import usePayments from 'NDA/usePayments';

const ReportsPaymentsPage: React.FC = memo(() => {
  const { breakpoint } = useDocumentBreakpoint();
  const { loading, cols } = usePayments();
  const isMobile = breakpoint === BreakpointType.mobile || breakpoint === BreakpointType.tablet;

  return (
    <PageWrapper>
      <Header>
        <HeaderTitleWrapper>
          <HeaderTitle>
            <LocaleText slug="NDA/_reports__payments" />
          </HeaderTitle>
        </HeaderTitleWrapper>
        <HeaderActionsWrapper>
          <DownloadPaymentsReport cols={cols} mobile={isMobile} />
        </HeaderActionsWrapper>
      </Header>
      <Content>
        <ReportPaymentsTable
          loading={loading}
          cols={cols}
        />
      </Content>
    </PageWrapper>
  );
});

export default ReportsPaymentsPage;
