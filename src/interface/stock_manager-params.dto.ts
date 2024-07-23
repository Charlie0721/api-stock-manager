export class StockManagerParamsDto {
  private Id_Vendedor: number;
  private Id_Cliente: number;
  private Id_Almacen: number;

  constructor(
    Id_Vendedor: number,
    Id_Cliente: number,
    Id_Almacen: number,
  
  ) {
    this.Id_Vendedor = Id_Vendedor;
    this.Id_Cliente = Id_Cliente;
    this.Id_Almacen = Id_Almacen;
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
 
}
