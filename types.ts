import Id from 'types/api/data/Id';

export type ReportBuyerType = {
  name: string,
  email: string | undefined,
  id: Id
};

export type ReportEventType = {
  id: Id;
  name: string
};
