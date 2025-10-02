export class ContractorManagerDto {
    id: string;
    name: string;
    isManager: boolean;
  
    constructor(user: any, isManager: boolean) {
      this.id = user.id;
      this.name = user.name;
      this.isManager = isManager;
    }
  }
  