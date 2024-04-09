export class MoneyCollectionDto {
  private IdVendedor: number;
  private IdCliente: number;
  private Valor: number;
  private Descripcion: string;
  private eMail?: string | undefined;

  constructor(
    IdVendedor: number,
    IdCliente: number,
    Valor: number,
    Descripcion: string,
    eMail: string | undefined
  ) {
    this.Valor = Valor;
    this.Descripcion = Descripcion;
    this.eMail = eMail;
    this.IdVendedor = IdVendedor;
    this.IdCliente = IdCliente;
  }

  getIdVendedor(): number {
    return this.IdVendedor;
  }
  setIdVendedor(idVendedor: number) {
    this.IdVendedor = idVendedor;
  }

  getIdCliente(): number {
    return this.IdCliente;
  }
  setIdCliente(idCliente: number) {
    this.IdCliente = idCliente;
  }

  getValor(): number {
    return this.Valor;
  }

  setValor(nuevoValor: number) {
    this.Valor = nuevoValor;
  }

  getDescripcion(): string {
    return this.Descripcion;
  }

  setDescripcion(nuevaDescripcion: string) {
    this.Descripcion = nuevaDescripcion;
  }

  getEmail(): string | undefined {
    return this.eMail;
  }

  setEmail(newEmail: string | undefined) {
    this.eMail = newEmail;
  }
}
