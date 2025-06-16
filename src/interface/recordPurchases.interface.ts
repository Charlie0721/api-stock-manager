export interface IHeaderPurchases {
  idresolucion: number;
  idtercero: number;
  docprovee: number;
  prefijo?: string;
  fechadocprov: string;
  fecha: string;
  detalle: string;
  idalmacen: number;
  idpago: number;
  aprobada: number;
  detcompras: IPurchasesDetails[];
}

export interface IPurchasesDetails {
  idcompra: string;
  idmovorden?: number;
  idproducto: number;
  porciva?: number;
  codiva: string;
  valor?: number;
  cantidad: number;
  precioventa?: number;
}
