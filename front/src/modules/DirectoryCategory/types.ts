import { Option } from "../../types/uiTypes";

export interface GetDirectoryCategoryResponse {
    id: string;
    color: string;
    name: string;
    number: number;
    builder?: BuilderInterface;
    customers?: CustromerI[];
    isExternal?: boolean;
    isManager?: boolean;
    manager: ManagerI;
    builderExternal?: ExtContractorI,
}

export interface ManagerI {
    id: string;
    login: string;
    name: string;
    isActivated: boolean;
    role: string;
}

export interface CustromerI {
    id: string;
    name: string;
    role: string;
    tgId: string;
    linkId: string;
    isConfirmed: boolean;
    contractor: any;
    manager: any;
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
    builderId?: string | null;
    customersIds?: string[] | null[] | null;
    builderExternalId?: string | null;
    managerId?: string | null;
    isExternal?: boolean;
    isManager?: boolean;
}

export interface UpdateDirectoryCategoryBodyPayload
    extends Pick<
        CreateDirectoryCategoryPayload,
        | "name"
        | "color"
        | "builderId"
        | "customersIds"
        | "isExternal"
        | "builderExternalId"
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
    selectedRow: GetDirectoryCategoryResponse | null;
    onClose: () => void;
}

export interface DirectoryCategoryModalFormI {
    builder: string;
    name: string;
    color: string;
    customersIds: string[] | null[];
}

export interface GetAllBuildersResponse
    extends Pick<Option, "value" | "label"> {
    isExternal: boolean;
    isManager: boolean;
}

export type GetAllCutomersResponse = GetAllBuildersResponse;

export interface NormalizedDataI
    extends Pick<
        GetDirectoryCategoryResponse,
        "name" | "number" | "color" 
    > {
        customers: string | null
        builder: string | null
        id: string
    }
