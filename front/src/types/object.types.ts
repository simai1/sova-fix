export type TObject = {
  budgetPlan: number;
  city: string;
  id: string;
  name: string;
  number: number;
  legalEntity: TLegalEntity;
  unit: TUnit;
};

export type TLegalEntity = {
  count: number;
  id: string;
  legalForm: string;
  name: string;
  number: number;
  startCoop: string;
  startCoopRaw: string;
};

export type TUnit = {
  count: number;
  description: string;
  id: string;
  name: string;
  number: string;
};
