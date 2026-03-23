export type TAddRequestModalProps = {
  handleClose: () => void;
};

export type TCreateRequestForm = {
  objectId: string;
  unitId: string;
  urgency: string;
  directoryCategoryId?: string;
  problemDescription: string;
};
