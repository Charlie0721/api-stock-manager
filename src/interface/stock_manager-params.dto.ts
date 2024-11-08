export class StockManagerParamsDto {
  private Id_Vendedor: number;
  private Id_Cliente: number;
  private Id_Almacen: number;
  private Edita_Precio: boolean;
  private Edita_Descuento: boolean;
  constructor(
    Id_Vendedor: number,
    Id_Cliente: number,
    Id_Almacen: number,
    Edita_Precio: boolean,
    Edita_Descuento: boolean
  ) {
    this.Id_Vendedor = Id_Vendedor;
    this.Id_Cliente = Id_Cliente;
    this.Id_Almacen = Id_Almacen;
    this.Edita_Precio = Edita_Precio;
    this.Edita_Descuento = Edita_Descuento;
  }

  getIdVendedor(): number {
    return this.Id_Vendedor;
  }
  setIdVendedor(idVendedor: number) {
    this.Id_Vendedor = idVendedor;
  }

  getIdCliente(): number {
    return this.Id_Cliente;
  }
  setIdCliente(idCliente: number) {
    this.Id_Cliente = idCliente;
  }

  getIdAlmacen(): number {
    return this.Id_Almacen;
  }
  setIdAlmacen(idAlmacen: number) {
    this.Id_Almacen = idAlmacen;
  }

  getEditaPrecio(): boolean {
    return this.Edita_Precio;
  }
  setEditaPrecio(Edita_Precio: boolean) {
    this.Edita_Precio = Edita_Precio;
  }
  getEditaDescuento(): boolean {
    return this.Edita_Descuento;
  }
  setEditaDescuento(Edita_Descuento: boolean) {
    this.Edita_Descuento = Edita_Descuento;
  }
}
