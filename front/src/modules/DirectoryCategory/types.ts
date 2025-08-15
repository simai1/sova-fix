import { Option } from "../../types/uiTypes";

export interface GetDirectoryCategoryResponse {
    id: string;
    color: string;
    name: string;
    number: number;
    builder: BuilderInterface;
    customers: string[];
}

export interface ExtContractorI {
    id: string;
    spec: string;
    name: string;
    legalForm: string;
    number: string;
}

export interface ContractorI extends Pick<ExtContractorI, "id" | "name"> {}

export type BuilderInterface = ContractorI | ExtContractorI;

export interface CreateDirectoryCategoryPayload
    extends Pick<GetDirectoryCategoryResponse, "name" | "color"> {
    builderId?: string;
    customersId?: string[];
}

export interface UpdateDirectoryCategoryBodyPayload
    extends Pick<
        CreateDirectoryCategoryPayload,
        "name" | "color" | "builderId" | "customersId"
    > {}

export interface UpdateDirectoryCategoryPayload {
    body: UpdateDirectoryCategoryBodyPayload;
    params: {
        directoryCategoryId: string;
    };
}

export interface DeleteDirectoryCategoryPayload {
    directoryCategoryId: string;
}

export interface ModalState {
    open: boolean;
    type: "add" | "edit";
}

export interface DirectoryCategoryModalProps {
    state: ModalState;
    selectedRow: string;
    onClose: () => void;
}

export interface DirectoryCategoryModalFormI {
    builder: string
    name: string
    color: string
    customersIds: string[]
}

export type GetAllBuildersResponse = Option[]

export type GetAllCutomersResponse = GetAllBuildersResponse