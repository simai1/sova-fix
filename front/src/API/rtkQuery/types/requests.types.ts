export interface IGetAllObjectsPayload {
  userId: string;
}

export interface IGetOneRequestPayload {
  requestId: string;
}

export interface IUpdateRequestPayload {
  requestId: string;
  objectId?: string;
  problemDescription?: string;
  urgency?: string;
  repairPrice?: number;
  comment?: string;
  itineraryOrder?: number;
  contractorId?: string;
  status?: number;
  builder?: string;
  planCompleteDate?: string | null;
  urgencyId?: string | null;
  managerTgId?: string;
}
