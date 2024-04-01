export class MoneyCollectionDto {
  private Valor: number;
  private Descripcion: string;
  private eMail: string;

  constructor(Valor: number, Descripcion: string, eMail: string) {
    this.Valor = Valor;
    this.Descripcion = Descripcion;
    this.eMail = eMail;
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

  getEmail(): string {
    return this.eMail;
  }

  setEmail(newEmail: string) {
    this.eMail = newEmail;
  }
}
